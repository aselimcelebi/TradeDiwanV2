import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BinanceClient } from "@/lib/binance-client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const broker = await prisma.broker.findFirst({
      where: { id: params.id, userId }
    });

    if (!broker) {
      return NextResponse.json({ error: "Broker bulunamadı" }, { status: 404 });
    }

    if (broker.platform !== "Binance") {
      return NextResponse.json(
        { error: "Bu fonksiyon sadece Binance için desteklenir" },
        { status: 400 }
      );
    }

    if (!broker.apiKey || !broker.apiSecret) {
      return NextResponse.json({ error: "Binance API bilgileri eksik" }, { status: 400 });
    }

    await prisma.broker.update({
      where: { id: params.id },
      data: { status: "connecting" }
    });

    try {
      const binanceClient = new BinanceClient(broker.apiKey, broker.apiSecret);

      const connectionTest = await binanceClient.testConnection();
      if (!connectionTest) throw new Error("Binance bağlantı testi başarısız");

      const accountInfo = await binanceClient.getAccountInfo();
      console.log("Binance account verified:", accountInfo.accountType);

      const popularSymbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "DOTUSDT",
        "XRPUSDT", "LTCUSDT", "LINKUSDT", "BCHUSDT", "XLMUSDT",
        "UNIUSDT", "DOGEUSDT", "SOLUSDT", "MATICUSDT", "AVAXUSDT"
      ];

      let allTrades: any[] = [];

      for (const symbol of popularSymbols) {
        try {
          const symbolTrades = await binanceClient.getMyTrades(symbol, 50);
          if (symbolTrades && symbolTrades.length > 0) {
            allTrades.push(...symbolTrades);
          }
        } catch (symbolError: any) {
          if (!symbolError.message?.includes("400")) {
            console.error(`Error getting trades for ${symbol}:`, symbolError);
          }
        }
      }

      let importedCount = 0;
      let skippedCount = 0;

      for (const binanceTrade of allTrades) {
        try {
          const tradeId = binanceTrade.id || binanceTrade.orderId;
          const existingTrade = await prisma.trade.findFirst({
            where: {
              userId,
              brokerId: broker.id,
              notes: { contains: `Binance Trade ID: ${tradeId}` }
            }
          });

          if (existingTrade) { skippedCount++; continue; }

          const tradeData = BinanceClient.convertToTradeFormat(binanceTrade, broker.id);
          await prisma.trade.create({ data: { userId, ...tradeData } });
          importedCount++;
        } catch (tradeError) {
          console.error("Error importing individual trade:", tradeError);
        }
      }

      await prisma.broker.update({
        where: { id: params.id },
        data: { status: "connected", lastSync: new Date() }
      });

      return NextResponse.json({
        success: true,
        message: `${importedCount} yeni trade eklendi, ${skippedCount} trade zaten mevcut`,
        importedCount,
        skippedCount,
        totalTrades: allTrades.length
      });

    } catch (apiError) {
      console.error("Binance API Error:", apiError);
      await prisma.broker.update({
        where: { id: params.id },
        data: { status: "error" }
      });
      return NextResponse.json(
        { error: "Binance API hatası", details: apiError instanceof Error ? apiError.message : "Bilinmeyen hata" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Senkronizasyon hatası" }, { status: 500 });
  }
}
