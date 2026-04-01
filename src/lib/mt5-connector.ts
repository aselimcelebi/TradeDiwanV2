// MetaTrader 5 API Connector
// Bu modül MT5 terminal ile iletişim kurmak için kullanılır

export interface MT5Trade {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: Date;
  closeTime: Date;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
}

export interface MT5Account {
  login: number;
  server: string;
  name: string;
  company: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
}

export class MT5Connector {
  private isConnected: boolean = false;
  private accountInfo: MT5Account | null = null;
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // Event listeners
  private onTradeCallback?: (trade: MT5Trade) => void;
  private onAccountUpdateCallback?: (account: MT5Account) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;

  constructor() {
    this.connect();
  }

  // Connect to MT5 WebSocket server (will be provided by MT5 Expert Advisor)
  private async connect() {
    try {
      // MT5 EA'dan gelen WebSocket bağlantısı (localhost:8080 varsayılan)
      this.websocket = new WebSocket('ws://localhost:8080');
      
      this.websocket.onopen = () => {
        console.log('MT5 Connector: Connected to MetaTrader 5');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChangeCallback?.(true);
        this.requestAccountInfo();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('MT5 Connector: Error parsing message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('MT5 Connector: Connection closed');
        this.isConnected = false;
        this.onConnectionChangeCallback?.(false);
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('MT5 Connector: WebSocket error:', error);
      };

    } catch (error) {
      console.error('MT5 Connector: Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`MT5 Connector: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('MT5 Connector: Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'account_info':
        this.accountInfo = data.payload;
        this.onAccountUpdateCallback?.(this.accountInfo!);
        break;

      case 'trade_closed':
        const trade = this.parseTradeData(data.payload);
        this.onTradeCallback?.(trade);
        break;

      case 'trade_opened':
        // Handle live trade opening if needed
        console.log('MT5 Connector: Trade opened:', data.payload);
        break;

      case 'account_update':
        this.accountInfo = { ...this.accountInfo, ...data.payload };
        this.onAccountUpdateCallback?.(this.accountInfo!);
        break;

      default:
        console.log('MT5 Connector: Unknown message type:', data.type);
    }
  }

  private parseTradeData(data: any): MT5Trade {
    return {
      ticket: data.ticket,
      symbol: data.symbol,
      type: data.type === 0 ? 'BUY' : 'SELL', // MT5: 0=BUY, 1=SELL
      volume: data.volume,
      openPrice: data.price_open,
      closePrice: data.price_close,
      openTime: new Date(data.time_open * 1000), // MT5 uses Unix timestamp
      closeTime: new Date(data.time_close * 1000),
      profit: data.profit,
      commission: data.commission,
      swap: data.swap,
      comment: data.comment,
    };
  }

  // Request account information
  private requestAccountInfo() {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'get_account_info'
      }));
    }
  }

  // Request trade history
  public requestTradeHistory(fromDate: Date, toDate: Date) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'get_trade_history',
        from: Math.floor(fromDate.getTime() / 1000),
        to: Math.floor(toDate.getTime() / 1000)
      }));
    }
  }

  // Event handlers
  public onTrade(callback: (trade: MT5Trade) => void) {
    this.onTradeCallback = callback;
  }

  public onAccountUpdate(callback: (account: MT5Account) => void) {
    this.onAccountUpdateCallback = callback;
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  // Getters
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getAccountInfo(): MT5Account | null {
    return this.accountInfo;
  }

  // Convert MT5 trade to our trade format
  public convertToAppTrade(mt5Trade: MT5Trade) {
    return {
      date: mt5Trade.closeTime.toISOString(),
      symbol: mt5Trade.symbol,
      side: mt5Trade.type === 'BUY' ? 'LONG' : 'SHORT',
      qty: mt5Trade.volume,
      entryPrice: mt5Trade.openPrice,
      exitPrice: mt5Trade.closePrice,
      fees: Math.abs(mt5Trade.commission), // Commission is usually negative
      notes: `MT5 Ticket: ${mt5Trade.ticket}${mt5Trade.comment ? ` - ${mt5Trade.comment}` : ''}`,
      strategy: 'MT5 Auto Import',
    };
  }

  // Disconnect
  public disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }
}

// Singleton instance
export const mt5Connector = new MT5Connector();
