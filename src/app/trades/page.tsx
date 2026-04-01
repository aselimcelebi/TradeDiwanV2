import { prisma } from "@/lib/prisma";
import TradesPageClient from "@/components/trades-page-client";

export const metadata = {
  title: "Trades - TradeDiwan",
  description: "View and manage all your trades with advanced filtering and analytics",
};

async function getTrades() {
  try {
    const trades = await prisma.trade.findMany({
      where: {
        userId: "demo",
      },
      orderBy: {
        date: "desc",
      },
    });
    return trades;
  } catch (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
}

async function getStrategies() {
  try {
    const strategies = await prisma.strategy.findMany({
      where: {
        userId: "demo",
      },
      orderBy: {
        name: "asc",
      },
    });
    return strategies;
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return [];
  }
}

export default async function TradesPage() {
  const [trades, strategies] = await Promise.all([
    getTrades(),
    getStrategies(),
  ]);

  return <TradesPageClient trades={trades} strategies={strategies} />;
}
