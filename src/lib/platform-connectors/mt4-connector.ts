import { BasePlatformConnector, PlatformTrade, PlatformAccount } from './base-connector';

export class MT4Connector extends BasePlatformConnector {
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    super('MetaTrader 4');
  }

  async connect(): Promise<boolean> {
    try {
      this.websocket = new WebSocket('ws://localhost:8081'); // Different port from MT5
      
      this.websocket.onopen = () => {
        console.log('MT4 Connector: Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyStatusChange(this.getStatus());
        this.requestAccountInfo();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('MT4 Connector: Error parsing message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('MT4 Connector: Connection closed');
        this.isConnected = false;
        this.notifyStatusChange(this.getStatus());
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('MT4 Connector: WebSocket error:', error);
      };

      return true;
    } catch (error) {
      console.error('MT4 Connector: Failed to connect:', error);
      this.attemptReconnect();
      return false;
    }
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }

  async requestTradeHistory(fromDate: Date, toDate: Date): Promise<PlatformTrade[]> {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'get_trade_history',
        from: Math.floor(fromDate.getTime() / 1000),
        to: Math.floor(toDate.getTime() / 1000)
      }));
    }
    return []; // Will be handled via callback
  }

  getAccountInfo(): PlatformAccount | null {
    return this.accountInfo;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`MT4 Connector: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 5000 * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'account_info':
        const accountInfo: PlatformAccount = {
          id: data.payload.login.toString(),
          name: data.payload.name,
          server: data.payload.server,
          currency: data.payload.currency,
          balance: data.payload.balance,
          equity: data.payload.equity,
          platform: this.platform,
        };
        this.notifyAccountUpdate(accountInfo);
        break;

      case 'trade_closed':
        const trade = this.parseTradeData(data.payload);
        this.notifyTrade(trade);
        break;

      default:
        console.log('MT4 Connector: Unknown message type:', data.type);
    }
  }

  private parseTradeData(data: any): PlatformTrade {
    return {
      id: data.ticket.toString(),
      symbol: data.symbol,
      side: data.cmd === 0 ? 'LONG' : 'SHORT', // MT4: 0=BUY, 1=SELL
      quantity: data.lots,
      entryPrice: data.open_price,
      exitPrice: data.close_price,
      entryTime: new Date(data.open_time * 1000),
      exitTime: new Date(data.close_time * 1000),
      profit: data.profit,
      commission: data.commission + data.swap,
      comment: data.comment,
      platform: this.platform,
    };
  }

  private requestAccountInfo() {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'get_account_info'
      }));
    }
  }
}
