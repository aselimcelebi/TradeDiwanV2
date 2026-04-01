// Base connector interface for all trading platforms

export interface PlatformTrade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  profit: number;
  commission: number;
  comment?: string;
  platform: string;
}

export interface PlatformAccount {
  id: string;
  name: string;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  platform: string;
}

export interface PlatformStatus {
  connected: boolean;
  platform: string;
  lastUpdate: Date;
  error?: string;
}

export abstract class BasePlatformConnector {
  protected isConnected: boolean = false;
  protected platform: string;
  protected accountInfo: PlatformAccount | null = null;

  // Event callbacks
  protected onTradeCallback?: (trade: PlatformTrade) => void;
  protected onAccountUpdateCallback?: (account: PlatformAccount) => void;
  protected onStatusChangeCallback?: (status: PlatformStatus) => void;

  constructor(platform: string) {
    this.platform = platform;
  }

  // Abstract methods to be implemented by each platform
  abstract connect(): Promise<boolean>;
  abstract disconnect(): void;
  abstract requestTradeHistory(fromDate: Date, toDate: Date): Promise<PlatformTrade[]>;
  abstract getAccountInfo(): PlatformAccount | null;

  // Common methods
  public getStatus(): PlatformStatus {
    return {
      connected: this.isConnected,
      platform: this.platform,
      lastUpdate: new Date(),
    };
  }

  public onTrade(callback: (trade: PlatformTrade) => void) {
    this.onTradeCallback = callback;
  }

  public onAccountUpdate(callback: (account: PlatformAccount) => void) {
    this.onAccountUpdateCallback = callback;
  }

  public onStatusChange(callback: (status: PlatformStatus) => void) {
    this.onStatusChangeCallback = callback;
  }

  // Convert platform trade to app format
  public convertToAppTrade(platformTrade: PlatformTrade) {
    return {
      date: platformTrade.exitTime.toISOString(),
      symbol: platformTrade.symbol,
      side: platformTrade.side,
      qty: platformTrade.quantity,
      entryPrice: platformTrade.entryPrice,
      exitPrice: platformTrade.exitPrice,
      fees: Math.abs(platformTrade.commission),
      notes: `${this.platform} ID: ${platformTrade.id}${platformTrade.comment ? ` - ${platformTrade.comment}` : ''}`,
      strategy: `${this.platform} Auto Import`,
      tags: `${this.platform.toLowerCase()},auto-import`,
    };
  }

  protected notifyTrade(trade: PlatformTrade) {
    this.onTradeCallback?.(trade);
  }

  protected notifyAccountUpdate(account: PlatformAccount) {
    this.accountInfo = account;
    this.onAccountUpdateCallback?.(account);
  }

  protected notifyStatusChange(status: PlatformStatus) {
    this.onStatusChangeCallback?.(status);
  }
}
