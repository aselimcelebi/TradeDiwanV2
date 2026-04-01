import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getRemainingAttempts, getTimeUntilReset } from "@/lib/rate-limiter";

// TradeZella tarzı broker sync endpoint
const BrokerSyncSchema = z.object({
  platform: z.enum(['mt4', 'mt5', 'ctrader', 'ninjatrader']),
  server: z.string().min(1),
  login: z.string().min(1),
  password: z.string().min(1),
  startDate: z.string().optional(),
  userId: z.string().default('demo'),
});

interface MetaTraderCredentials {
  server: string;
  login: string;
  password: string;
}

// Validate and connect to MetaTrader
async function connectToMetaTrader(credentials: MetaTraderCredentials, platform: string) {
  // Input validation
  if (!credentials.server || !credentials.login || !credentials.password) {
    throw new Error('Tüm alanlar doldurulmalıdır');
  }

  // Validate login format (typically 6-10 digits)
  if (!/^\d{6,10}$/.test(credentials.login)) {
    throw new Error('Login numarası 6-10 haneli sayı olmalıdır');
  }

  // Validate server format
  if (!/^[a-zA-Z0-9\-\.]+$/.test(credentials.server)) {
    throw new Error('Geçersiz server formatı');
  }

  // Password should be at least 6 characters
  if (credentials.password.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalıdır');
  }

  // Simulate real connection attempt
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Validate against common MetaTrader servers
  const validServers = [
    'MetaQuotes-Demo', 'MetaQuotes-Demo2', 'MetaQuotes-Demo3',
    'MT5-Demo', 'MT5-Real', 'MT4-Demo', 'MT4-Real',
    'ICMarkets-Demo', 'ICMarkets-Live01', 'ICMarkets-Live02',
    'FXPRO-Demo', 'FXPRO-Real', 'FXPRO-Real2',
    'XM-Demo', 'XM-Real', 'XM-Real2',
    'Pepperstone-Demo', 'Pepperstone-Live',
    'Admiral-Demo', 'Admiral-Real'
  ];

  // For demo purposes, validate demo accounts
  if (credentials.server.toLowerCase().includes('demo') || 
      validServers.some(server => server.toLowerCase() === credentials.server.toLowerCase())) {
    
    // Simulate successful demo connection
    if (credentials.login.startsWith('123') || credentials.login.startsWith('50')) {
      return {
        accountId: credentials.login,
        accountName: `${platform.toUpperCase()} Demo - ${credentials.login}`,
        server: credentials.server,
        currency: 'USD',
        balance: 10000.00,
        equity: 10125.50,
        connected: true,
      };
    }
  }

  // For real accounts, we would need actual MT4/MT5 Manager API or WebSocket connection
  // This would involve:
  // 1. Connecting to the MT4/MT5 server
  // 2. Authenticating with login/password
  // 3. Checking account permissions
  // 4. Verifying investor password if provided

  // For now, simulate various error conditions
  const random = Math.random();
  
  if (random < 0.3) {
    throw new Error('Geçersiz login bilgileri. Lütfen bilgilerinizi kontrol edin.');
  } else if (random < 0.5) {
    throw new Error('Sunucuya bağlanılamadı. Server adını kontrol edin.');
  } else if (random < 0.7) {
    throw new Error('Yatırımcı şifresi geçersiz. MT5\'te yatırımcı şifrenizi kontrol edin.');
  } else {
    throw new Error('Bağlantı zaman aşımı. Lütfen tekrar deneyin.');
  }
}

// Get trade history from platform
async function getTradeHistory(credentials: MetaTraderCredentials, platform: string, fromDate?: string) {
  // Mock trade data - in real implementation this would fetch from MT4/MT5
  const mockTrades = [
    {
      ticket: '12345678',
      symbol: 'EURUSD',
      type: 0, // 0 = BUY, 1 = SELL
      lots: 0.1,
      openPrice: 1.0850,
      closePrice: 1.0875,
      openTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      closeTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      profit: 25.00,
      commission: -0.50,
      swap: 0.00,
      comment: 'Auto trade',
    },
    {
      ticket: '12345679',
      symbol: 'GBPUSD',
      type: 1, // SELL
      lots: 0.05,
      openPrice: 1.2650,
      closePrice: 1.2630,
      openTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      closeTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      profit: 10.00,
      commission: -0.25,
      swap: 0.00,
      comment: 'Manual trade',
    }
  ];

  return mockTrades;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = BrokerSyncSchema.parse(body);

    // Rate limiting - 5 attempts per 15 minutes per IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitKey = `broker_sync_${clientIP}`;
    
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      const remainingTime = Math.ceil(getTimeUntilReset(rateLimitKey) / 1000 / 60);
      return NextResponse.json(
        { 
          success: false, 
          error: `Çok fazla deneme yapıldı. ${remainingTime} dakika sonra tekrar deneyin.`,
          remainingAttempts: 0,
          timeUntilReset: remainingTime
        },
        { status: 429 }
      );
    }

    // Connect to the trading platform
    const accountInfo = await connectToMetaTrader(
      {
        server: data.server,
        login: data.login,
        password: data.password,
      },
      data.platform
    );

    // Get trade history
    const trades = await getTradeHistory(
      {
        server: data.server,
        login: data.login,
        password: data.password,
      },
      data.platform,
      data.startDate
    );

    // Convert and save trades to database
    const savedTrades = [];
    for (const trade of trades) {
      const appTrade = {
        userId: data.userId,
        date: trade.closeTime,
        symbol: trade.symbol,
        side: trade.type === 0 ? 'LONG' : 'SHORT',
        qty: trade.lots,
        entryPrice: trade.openPrice,
        exitPrice: trade.closePrice,
        fees: Math.abs(trade.commission),
        notes: `${data.platform.toUpperCase()} Ticket: ${trade.ticket}${trade.comment ? ` - ${trade.comment}` : ''}`,
        strategy: `${data.platform.toUpperCase()} Auto Import`,
        tags: [`${data.platform.toLowerCase()}`, 'auto-import'].join(','),
      };

      // Check if trade already exists (by platform ticket number)
      const existingTrade = await prisma.trade.findFirst({
        where: {
          userId: data.userId,
          notes: {
            contains: `Ticket: ${trade.ticket}`,
          },
        },
      });

      if (!existingTrade) {
        const savedTrade = await prisma.trade.create({
          data: appTrade,
        });
        savedTrades.push(savedTrade);
      }
    }

    return NextResponse.json({
      success: true,
      accountInfo,
      tradesImported: savedTrades.length,
      totalTrades: trades.length,
      message: `${savedTrades.length} yeni işlem içe aktarıldı`,
    });

  } catch (error) {
    console.error('Broker sync error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Broker bağlantısı başarısız' 
      },
      { status: 500 }
    );
  }
}

// Get connected brokers for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';

    // In a real app, you'd store broker connections in database
    // For now, return mock data
    const connections = [
      {
        id: '1',
        platform: 'mt5',
        accountName: 'Demo Account - 12345',
        server: 'MetaQuotes-Demo',
        status: 'connected',
        lastSync: new Date().toISOString(),
      }
    ];

    return NextResponse.json({ success: true, connections });

  } catch (error) {
    console.error('Get broker connections error:', error);
    return NextResponse.json(
      { success: false, error: 'Broker bağlantıları alınamadı' },
      { status: 500 }
    );
  }
}
