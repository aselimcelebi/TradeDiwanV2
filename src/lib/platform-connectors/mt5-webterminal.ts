import { BasePlatformConnector, PlatformTrade, PlatformAccount } from './base-connector';

// MT5 WebTerminal API Integration
// This connects to MT5 WebTerminal running on localhost or remote server

export class MT5WebTerminalConnector extends BasePlatformConnector {
  private apiUrl: string;
  private sessionId: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastTradeTime: number = 0;

  constructor(apiUrl: string = 'http://localhost:8080') {
    super('MetaTrader 5 WebTerminal');
    this.apiUrl = apiUrl;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('MT5 WebTerminal: Attempting to connect...');
      
      // Test if WebTerminal is accessible
      const pingResponse = await fetch(`${this.apiUrl}/api/ping`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!pingResponse.ok) {
        throw new Error('MT5 WebTerminal sunucusuna erişilemiyor');
      }

      this.isConnected = true;
      this.notifyStatusChange(this.getStatus());
      
      // Start monitoring for new trades
      this.startTradeMonitoring();
      
      console.log('MT5 WebTerminal: Connected successfully');
      return true;

    } catch (error) {
      console.error('MT5 WebTerminal connection error:', error);
      this.isConnected = false;
      this.notifyStatusChange({
        ...this.getStatus(),
        error: error instanceof Error ? error.message : 'Bağlantı hatası'
      });
      return false;
    }
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    this.sessionId = null;
    this.notifyStatusChange(this.getStatus());
  }

  async authenticate(login: string, password: string, server: string): Promise<boolean> {
    try {
      const authResponse = await fetch(`${this.apiUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: parseInt(login),
          password: password,
          server: server
        })
      });

      const authResult = await authResponse.json();

      if (!authResponse.ok || !authResult.success) {
        throw new Error(authResult.message || 'Kimlik doğrulama başarısız');
      }

      this.sessionId = authResult.sessionId;
      
      // Get account info after successful auth
      const accountInfo = await this.fetchAccountInfo();
      if (accountInfo) {
        this.notifyAccountUpdate(accountInfo);
      }

      return true;

    } catch (error) {
      console.error('MT5 WebTerminal auth error:', error);
      throw error;
    }
  }

  async requestTradeHistory(fromDate: Date, toDate: Date): Promise<PlatformTrade[]> {
    if (!this.isConnected || !this.sessionId) {
      throw new Error('MT5 WebTerminal bağlantısı yok');
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/history`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Session-Id': this.sessionId
        },
        body: JSON.stringify({
          from: Math.floor(fromDate.getTime() / 1000),
          to: Math.floor(toDate.getTime() / 1000)
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'İşlem geçmişi alınamadı');
      }

      return result.trades.map((trade: any) => this.parseWebTerminalTrade(trade));

    } catch (error) {
      console.error('MT5 WebTerminal history error:', error);
      throw error;
    }
  }

  getAccountInfo(): PlatformAccount | null {
    return this.accountInfo;
  }

  private async fetchAccountInfo(): Promise<PlatformAccount | null> {
    if (!this.sessionId) return null;

    try {
      const response = await fetch(`${this.apiUrl}/api/account`, {
        headers: { 'Session-Id': this.sessionId }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          id: result.account.login.toString(),
          name: result.account.name,
          server: result.account.server,
          currency: result.account.currency,
          balance: result.account.balance,
          equity: result.account.equity,
          platform: this.platform,
        };
      }

      return null;
    } catch (error) {
      console.error('MT5 WebTerminal account info error:', error);
      return null;
    }
  }

  private startTradeMonitoring() {
    // Poll for new trades every 5 seconds
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkForNewTrades();
      } catch (error) {
        console.error('MT5 WebTerminal monitoring error:', error);
      }
    }, 5000);
  }

  private async checkForNewTrades() {
    if (!this.sessionId) return;

    try {
      const now = Date.now();
      const fromTime = this.lastTradeTime || (now - 60000); // Last minute if no previous trades

      const response = await fetch(`${this.apiUrl}/api/trades/new`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Session-Id': this.sessionId
        },
        body: JSON.stringify({
          from: Math.floor(fromTime / 1000)
        })
      });

      const result = await response.json();

      if (response.ok && result.success && result.trades?.length > 0) {
        result.trades.forEach((trade: any) => {
          const platformTrade = this.parseWebTerminalTrade(trade);
          this.notifyTrade(platformTrade);
          this.lastTradeTime = Math.max(this.lastTradeTime, platformTrade.exitTime.getTime());
        });
      }

    } catch (error) {
      console.error('MT5 WebTerminal new trades check error:', error);
    }
  }

  private parseWebTerminalTrade(trade: any): PlatformTrade {
    return {
      id: trade.ticket?.toString() || trade.position?.toString(),
      symbol: trade.symbol,
      side: trade.type === 0 || trade.type === 'DEAL_TYPE_BUY' ? 'LONG' : 'SHORT',
      quantity: trade.volume / 100, // WebTerminal usually returns volume in mini lots
      entryPrice: trade.price_open || trade.price,
      exitPrice: trade.price_close || trade.price,
      entryTime: new Date(trade.time_open * 1000),
      exitTime: new Date((trade.time_close || trade.time) * 1000),
      profit: trade.profit || 0,
      commission: (trade.commission || 0) + (trade.swap || 0) + (trade.fee || 0),
      comment: trade.comment || '',
      platform: this.platform,
    };
  }

  // Get open positions
  async getOpenPositions(): Promise<PlatformTrade[]> {
    if (!this.sessionId) return [];

    try {
      const response = await fetch(`${this.apiUrl}/api/positions`, {
        headers: { 'Session-Id': this.sessionId }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return result.positions.map((pos: any) => this.parseWebTerminalTrade(pos));
      }

      return [];
    } catch (error) {
      console.error('MT5 WebTerminal positions error:', error);
      return [];
    }
  }

  // Get pending orders
  async getPendingOrders(): Promise<any[]> {
    if (!this.sessionId) return [];

    try {
      const response = await fetch(`${this.apiUrl}/api/orders`, {
        headers: { 'Session-Id': this.sessionId }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return result.orders;
      }

      return [];
    } catch (error) {
      console.error('MT5 WebTerminal orders error:', error);
      return [];
    }
  }
}
