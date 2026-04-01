import { BasePlatformConnector, PlatformTrade, PlatformAccount } from './base-connector';

export class CTraderConnector extends BasePlatformConnector {
  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl: string = 'https://api.ctrader.com';
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    super('cTrader');
  }

  async connect(): Promise<boolean> {
    try {
      // cTrader uses REST API instead of WebSocket
      // Check if credentials are available
      const storedKey = localStorage.getItem('ctrader_api_key');
      const storedSecret = localStorage.getItem('ctrader_api_secret');
      
      if (!storedKey || !storedSecret) {
        console.log('cTrader Connector: API credentials not found');
        return false;
      }

      this.apiKey = storedKey;
      this.apiSecret = storedSecret;

      // Test connection by fetching account info
      const accountInfo = await this.fetchAccountInfo();
      if (accountInfo) {
        this.isConnected = true;
        this.notifyAccountUpdate(accountInfo);
        this.notifyStatusChange(this.getStatus());
        
        // Start polling for new trades
        this.startPolling();
        console.log('cTrader Connector: Connected successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('cTrader Connector: Failed to connect:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    this.notifyStatusChange(this.getStatus());
  }

  async requestTradeHistory(fromDate: Date, toDate: Date): Promise<PlatformTrade[]> {
    if (!this.isConnected) return [];

    try {
      const response = await this.makeApiRequest('/v3/accounts/me/positions/history', {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });

      if (response.data) {
        return response.data.map((position: any) => this.parseTradeData(position));
      }
      
      return [];
    } catch (error) {
      console.error('cTrader Connector: Error fetching trade history:', error);
      return [];
    }
  }

  getAccountInfo(): PlatformAccount | null {
    return this.accountInfo;
  }

  private async fetchAccountInfo(): Promise<PlatformAccount | null> {
    try {
      const response = await this.makeApiRequest('/v3/accounts/me');
      
      if (response.data) {
        return {
          id: response.data.id.toString(),
          name: response.data.name,
          server: response.data.server || 'cTrader',
          currency: response.data.currency,
          balance: response.data.balance,
          equity: response.data.equity,
          platform: this.platform,
        };
      }
      
      return null;
    } catch (error) {
      console.error('cTrader Connector: Error fetching account info:', error);
      return null;
    }
  }

  private startPolling() {
    // Poll for new trades every 30 seconds
    this.pollInterval = setInterval(async () => {
      try {
        const lastHour = new Date();
        lastHour.setHours(lastHour.getHours() - 1);
        
        const trades = await this.requestTradeHistory(lastHour, new Date());
        trades.forEach(trade => this.notifyTrade(trade));
      } catch (error) {
        console.error('cTrader Connector: Error during polling:', error);
      }
    }, 30000);
  }

  private async makeApiRequest(endpoint: string, params: any = {}) {
    const url = new URL(this.baseUrl + endpoint);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`cTrader API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private parseTradeData(data: any): PlatformTrade {
    return {
      id: data.id.toString(),
      symbol: data.symbol,
      side: data.side === 'BUY' ? 'LONG' : 'SHORT',
      quantity: data.volume / 100000, // cTrader uses volume in units
      entryPrice: data.entryPrice,
      exitPrice: data.closePrice,
      entryTime: new Date(data.createTime),
      exitTime: new Date(data.closeTime),
      profit: data.grossProfit,
      commission: data.commission + data.swap,
      comment: data.comment,
      platform: this.platform,
    };
  }

  // Method to set API credentials
  public setCredentials(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    
    // Store in localStorage for persistence
    localStorage.setItem('ctrader_api_key', apiKey);
    localStorage.setItem('ctrader_api_secret', apiSecret);
  }
}
