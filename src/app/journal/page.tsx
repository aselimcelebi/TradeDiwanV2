import { prisma } from "@/lib/prisma";
import DailyJournalClient from "@/components/daily-journal-client";

export const metadata = {
  title: "Daily Journal - TradeDiwan",
  description: "Record and review your daily trading performance and insights",
};

async function getJournalData() {
  try {
    const [journalEntries, trades] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          userId: "demo",
        },
        orderBy: {
          date: "desc",
        },
      }),
      prisma.trade.findMany({
        where: {
          userId: "demo",
        },
        orderBy: {
          date: "desc",
        },
      }),
    ]);

    return { journalEntries, trades };
  } catch (error) {
    console.error("Error fetching journal data:", error);
    return { journalEntries: [], trades: [] };
  }
}

export default async function DailyJournalPage() {
  const { journalEntries, trades } = await getJournalData();

  return <DailyJournalClient journalEntries={journalEntries} trades={trades} />;
}
