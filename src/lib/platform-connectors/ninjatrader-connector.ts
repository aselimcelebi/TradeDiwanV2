import { BasePlatformConnector, PlatformTrade, PlatformAccount } from './base-connector';

export class NinjaTraderConnector extends BasePlatformConnector {
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    super('NinjaTrader');
  }

  async connect(): Promise<boolean> {
    try {
      // NinjaTrader typically uses WebSocket on port 3012
      this.websocket = new WebSocket('ws://localhost:3012');
      
      this.websocket.onopen = () => {
        console.log('NinjaTrader Connector: Connected');
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
          console.error('NinjaTrader Connector: Error parsing message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('NinjaTrader Connector: Connection closed');
        this.isConnected = false;
        this.notifyStatusChange(this.getStatus());
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('NinjaTrader Connector: WebSocket error:', error);
      };

      return true;
    } catch (error) {
      console.error('NinjaTrader Connector: Failed to connect:', error);
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
        command: 'GETEXECUTIONS',
        parameters: {
          account: 'Sim101',
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString()
        }
      }));
    }
    return [];
  }

  getAccountInfo(): PlatformAccount | null {
    return this.accountInfo;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`NinjaTrader Connector: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 5000 * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    switch (data.command) {
      case 'ACCOUNTUPDATE':
        const accountInfo: PlatformAccount = {
          id: data.account,
          name: data.account,
          server: 'NinjaTrader',
          currency: data.currency || 'USD',
          balance: data.cashValue || 0,
          equity: data.realizedPnL || 0,
          platform: this.platform,
        };
        this.notifyAccountUpdate(accountInfo);
        break;

      case 'EXECUTION':
        if (data.orderState === 'Filled') {
          const trade = this.parseTradeData(data);
          this.notifyTrade(trade);
        }
        break;

      case 'EXECUTIONS':
        if (data.executions && Array.isArray(data.executions)) {
          data.executions.forEach((execution: any) => {
            const trade = this.parseTradeData(execution);
            this.notifyTrade(trade);
          });
        }
        break;

      default:
        console.log('NinjaTrader Connector: Unknown message:', data.command);
    }
  }

  private parseTradeData(data: any): PlatformTrade {
    return {
      id: data.orderId || data.executionId,
      symbol: data.instrument,
      side: data.orderAction === 'BUY' ? 'LONG' : 'SHORT',
      quantity: data.quantity,
      entryPrice: data.price,
      exitPrice: data.price, // For NinjaTrader, we need to track entry/exit separately
      entryTime: new Date(data.time),
      exitTime: new Date(data.time),
      profit: data.commission || 0, // NinjaTrader calculates P&L differently
      commission: data.commission || 0,
      comment: data.name || '',
      platform: this.platform,
    };
  }

  private requestAccountInfo() {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        command: 'ACCOUNTDATA',
        parameters: {
          account: 'Sim101' // Default simulation account
        }
      }));
    }
  }

  // NinjaTrader specific methods
  public subscribeToAccount(accountName: string) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        command: 'SUBSCRIBEACCOUNTDATA',
        parameters: {
          account: accountName
        }
      }));
    }
  }

  public subscribeToExecutions(accountName: string) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        command: 'SUBSCRIBEEXECUTIONS',
        parameters: {
          account: accountName
        }
      }));
    }
  }
}
