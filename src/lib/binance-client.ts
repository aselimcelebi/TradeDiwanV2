import crypto from 'crypto';

export interface BinanceTradeData {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

export class BinanceClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = testnet 
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
  }

  private generateSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, any> = {},
    signed: boolean = false
  ): Promise<any> {
    const timestamp = Date.now();
    
    if (signed) {
      params.timestamp = timestamp;
    }

    const queryString = new URLSearchParams(params).toString();
    let url = `${this.baseUrl}${endpoint}`;
    
    if (queryString) {
      url += `?${queryString}`;
    }

    const headers: HeadersInit = {
      'X-MBX-APIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };

    if (signed) {
      const signature = this.generateSignature(queryString);
      url += `&signature=${signature}`;
    }

    console.log(`Binance API Request: ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance API Error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance API Error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/v3/ping');
      return true;
    } catch (error) {
      console.error('Binance connection test failed:', error);
      return false;
    }
  }

  async getAccountInfo(): Promise<BinanceAccountInfo> {
    return this.makeRequest('/v3/account', 'GET', {}, true);
  }

  async getAllOrders(symbol?: string, limit: number = 500): Promise<BinanceTradeData[]> {
    const params: Record<string, any> = { limit };
    
    if (symbol) {
      params.symbol = symbol;
    }

    return this.makeRequest('/v3/allOrders', 'GET', params, true);
  }

  async getMyTrades(symbol: string, limit: number = 500): Promise<any[]> {
    const params: Record<string, any> = { 
      symbol,
      limit 
    };

    return this.makeRequest('/v3/myTrades', 'GET', params, true);
  }

  async getAllTradingSymbols(): Promise<string[]> {
    try {
      const exchangeInfo = await this.makeRequest('/v3/exchangeInfo');
      return exchangeInfo.symbols
        .filter((s: any) => s.status === 'TRADING')
        .map((s: any) => s.symbol);
    } catch (error) {
      console.error('Error getting trading symbols:', error);
      return [];
    }
  }

  // Convert Binance trade to our format
  static convertToTradeFormat(binanceTrade: any, brokerId: string): any {
    const isBuy = binanceTrade.side === 'BUY';
    const qty = parseFloat(binanceTrade.qty || binanceTrade.executedQty || '0');
    const price = parseFloat(binanceTrade.price);
    const commission = parseFloat(binanceTrade.commission || '0');

    return {
      brokerId,
      date: new Date(binanceTrade.time),
      symbol: binanceTrade.symbol,
      side: isBuy ? 'LONG' : 'SHORT',
      qty,
      entryPrice: price,
      exitPrice: price, // For spot trades, entry and exit are same
      fees: commission,
      strategy: 'Binance Import',
      notes: `Binance Trade ID: ${binanceTrade.id || binanceTrade.orderId}`,
      tags: 'binance,auto-import'
    };
  }
}
