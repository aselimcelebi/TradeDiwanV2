import { prisma } from "@/lib/prisma";
import ReportsPageClient from "@/components/reports-page-client";

export const metadata = {
  title: "Reports - TradeDiwan",
  description: "Comprehensive trading analytics and performance reports",
};

async function getReportsData() {
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
    console.error("Error fetching reports data:", error);
    return { trades: [] };
  }
}

export default async function ReportsPage() {
  const { trades } = await getReportsData();

  return <ReportsPageClient trades={trades} />;
}
