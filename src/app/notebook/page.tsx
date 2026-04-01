import { prisma } from "@/lib/prisma";
import NotebookPageClient from "@/components/notebook-page-client";

export const metadata = {
  title: "Notebook - TradeDiwan",
  description: "Manage your trading strategies and playbooks",
};

async function getNotebookData() {
  try {
    const strategies = await prisma.strategy.findMany({
      where: {
        userId: "demo",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { strategies };
  } catch (error) {
    console.error("Error fetching notebook data:", error);
    return { strategies: [] };
  }
}

export default async function NotebookPage() {
  const { strategies } = await getNotebookData();

  return <NotebookPageClient strategies={strategies} />;
}
