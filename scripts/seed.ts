import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed data helpers
const symbols = ["BTCUSDT", "ETHUSDT", "XAUUSD", "EURUSD", "GBPUSD", "ADAUSDT", "SOLUSDT", "DOTUSDT"];
const strategies = ["Breakout", "Scalping", "Swing", "Momentum", "Mean Reversion", "Trend Following", "Support/Resistance"];
const tags = ["morning", "afternoon", "evening", "news", "volatility", "range", "trending", "reversal", "gap", "earnings"];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomPrice(basePrice: number, volatility: number = 0.1): number {
  const change = (Math.random() - 0.5) * 2 * volatility;
  return basePrice * (1 + change);
}

function generateTradeData(date: Date, symbol: string) {
  const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const strategy = getRandomElement(strategies);
  const basePrices: Record<string, number> = {
    BTCUSDT: 45000,
    ETHUSDT: 2800,
    XAUUSD: 2000,
    EURUSD: 1.1,
    GBPUSD: 1.25,
    ADAUSDT: 0.45,
    SOLUSDT: 95,
    DOTUSDT: 7.5,
  };
  
  const basePrice = basePrices[symbol] || 100;
  const entryPrice = generateRandomPrice(basePrice, 0.05);
  
  // Generate exit price with some probability of win/loss
  const isWinningTrade = Math.random() > 0.4; // 60% win rate
  const exitChangePercent = isWinningTrade 
    ? Math.random() * 0.08 + 0.01 // 1-9% gain
    : -(Math.random() * 0.06 + 0.01); // 1-7% loss
    
  const exitPrice = side === 'LONG' 
    ? entryPrice * (1 + exitChangePercent)
    : entryPrice * (1 - exitChangePercent);

  const qty = symbol.includes('USD') && !symbol.includes('XAU')
    ? Math.random() * 5000 + 1000 // Forex lots
    : Math.random() * 2 + 0.1; // Crypto amounts

  const fees = qty * entryPrice * 0.001; // 0.1% fee
  const risk = Math.random() * 200 + 50; // $50-250 risk per trade

  return {
    date,
    symbol,
    side: side as 'LONG' | 'SHORT',
    qty: Number(qty.toFixed(symbol.includes('BTC') ? 4 : 2)),
    entryPrice: Number(entryPrice.toFixed(symbol.includes('USD') && !symbol.includes('XAU') ? 5 : 2)),
    exitPrice: Number(exitPrice.toFixed(symbol.includes('USD') && !symbol.includes('XAU') ? 5 : 2)),
    fees: Number(fees.toFixed(2)),
    risk: Number(risk.toFixed(2)),
    strategy,
    tags: getRandomElements(tags, Math.floor(Math.random() * 3) + 1).join(','),
    notes: generateRandomNote(strategy, isWinningTrade),
  };
}

function generateRandomNote(strategy: string, isWin: boolean): string {
  const winNotes = [
    "Perfect entry at support level",
    "Strong momentum carried the trade",
    "News catalyst worked in our favor",
    "Technical setup played out exactly as planned",
    "Good patience waiting for the right entry",
    "Market structure was very clear",
    "Volume confirmed the breakout",
    "Trend continuation worked perfectly",
  ];
  
  const lossNotes = [
    "Stopped out by false breakout",
    "Market reversed unexpectedly",
    "Should have waited for better confirmation",
    "Entry was too early",
    "News went against our position",
    "Got stopped by volatility spike",
    "Market structure changed",
    "Risk management saved us from bigger loss",
  ];
  
  const notes = isWin ? winNotes : lossNotes;
  return getRandomElement(notes);
}

function generateJournalEntry(date: Date) {
  const moods = [3, 4, 4, 4, 5, 5]; // Slightly positive bias
  const whatWentWellOptions = [
    "Followed my trading plan consistently",
    "Risk management was on point",
    "Patience paid off with quality setups",
    "Good emotional control during drawdown",
    "Market analysis was accurate",
    "Entry timing was excellent",
    "Profit taking was well-executed",
  ];
  
  const toImproveOptions = [
    "Need to be more patient with entries",
    "Should stick to position sizing rules",
    "Avoid overtrading in slow markets",
    "Better pre-market preparation needed",
    "Stop loss placement could be improved",
    "Need to cut losses faster",
    "More focus on high-probability setups",
  ];

  return {
    date,
    whatWentWell: Math.random() > 0.3 ? getRandomElement(whatWentWellOptions) : null,
    toImprove: Math.random() > 0.4 ? getRandomElement(toImproveOptions) : null,
    mood: getRandomElement(moods),
    notes: Math.random() > 0.6 ? "Overall good trading day. Market conditions were favorable." : null,
    tags: Math.random() > 0.5 ? getRandomElements(["focused", "patient", "disciplined", "emotional", "rushed"], 2).join(',') : null,
  };
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: "demo" },
    create: { 
      id: "demo", 
      name: "Demo Trader",
      email: "demo@tradezella.com"
    },
    update: {}
  });

  console.log("👤 Demo user created:", user.name);

  // Create strategies
  console.log("📚 Creating strategies...");
  const strategyData = [
    {
      name: "Breakout",
      description: "Trading price breakouts above/below key levels",
      rules: "Wait for volume confirmation, enter on retest, stop below/above breakout level",
    },
    {
      name: "Scalping", 
      description: "Quick trades on small price movements",
      rules: "5-15 minute holds, tight stops, high win rate focus",
    },
    {
      name: "Swing",
      description: "Multi-day position trades",
      rules: "Daily chart analysis, wider stops, trend following",
    },
    {
      name: "Momentum",
      description: "Trading with strong directional moves",
      rules: "Enter on pullbacks in trending markets, follow volume",
    },
  ];

  for (const strategy of strategyData) {
    await prisma.strategy.upsert({
      where: { name: strategy.name },
      create: strategy,
      update: strategy,
    });
  }

  // Generate trades for the last 60 days
  console.log("📊 Generating trades...");
  const trades = [];
  const journalEntries = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 60);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    
    // Skip weekends for some symbols (forex)
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    // Generate 0-4 trades per day (more likely 1-2)
    const tradesPerDay = Math.random() < 0.1 ? 0 : // 10% chance of no trades
                        Math.random() < 0.3 ? 1 : // 30% chance of 1 trade  
                        Math.random() < 0.7 ? 2 : // 40% chance of 2 trades
                        Math.random() < 0.9 ? 3 : 4; // 20% chance of 3, 10% chance of 4

    for (let i = 0; i < tradesPerDay; i++) {
      const tradeTime = new Date(currentDate);
      tradeTime.setHours(9 + Math.floor(Math.random() * 8)); // Between 9 AM and 5 PM
      tradeTime.setMinutes(Math.floor(Math.random() * 60));
      
      const symbol = isWeekend && getRandomElement(symbols).includes('USD') && !getRandomElement(symbols).includes('XAU')
        ? getRandomElement(symbols.filter(s => !s.includes('USD') || s.includes('XAU'))) // Crypto/Gold on weekends
        : getRandomElement(symbols);
        
      trades.push(generateTradeData(tradeTime, symbol));
    }

    // Generate journal entry (70% chance)
    if (Math.random() > 0.3) {
      journalEntries.push(generateJournalEntry(currentDate));
    }
  }

  // Insert trades
  console.log(`📈 Inserting ${trades.length} trades...`);
  for (const trade of trades) {
    await prisma.trade.create({
      data: {
        ...trade,
        userId: "demo",
      }
    });
  }

  // Insert journal entries
  console.log(`📔 Inserting ${journalEntries.length} journal entries...`);
  for (const entry of journalEntries) {
    await prisma.journalEntry.create({
      data: {
        ...entry,
        userId: "demo",
      }
    });
  }

  // Calculate and display stats
  const totalTrades = await prisma.trade.count({ where: { userId: "demo" } });
  const allTrades = await prisma.trade.findMany({ where: { userId: "demo" } });
  
  const totalPnL = allTrades.reduce((sum, trade) => {
    const gross = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1);
    return sum + (gross - trade.fees);
  }, 0);

  const winningTrades = allTrades.filter(trade => {
    const gross = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1);
    const pnl = gross - trade.fees;
    return pnl > 0;
  }).length;

  const winRate = (winningTrades / totalTrades) * 100;

  console.log("\n📈 Seed Statistics:");
  console.log(`   Total trades: ${totalTrades}`);
  console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
  console.log(`   Win rate: ${winRate.toFixed(1)}%`);
  console.log(`   Winning trades: ${winningTrades}`);
  console.log(`   Losing trades: ${totalTrades - winningTrades}`);
  console.log(`   Journal entries: ${journalEntries.length}`);
  
  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
