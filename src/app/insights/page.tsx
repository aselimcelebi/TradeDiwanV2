import { prisma } from "@/lib/prisma";
import InsightsPageClient from "@/components/insights-page-client";

export const metadata = {
  title: "Insights - TradeDiwan",
  description: "AI-powered trading insights and personalized recommendations",
};

async function getInsightsData() {
  try {
    const trades = await prisma.trade.findMany({
      where: {
        userId: "demo",
      },
      orderBy: {
        date: "asc",
      },
    });

    return { trades };
  } catch (error) {
    console.error("Error fetching insights data:", error);
    return { trades: [] };
  }
}

export default async function InsightsPage() {
  const { trades } = await getInsightsData();

  return <InsightsPageClient trades={trades} />;
}
