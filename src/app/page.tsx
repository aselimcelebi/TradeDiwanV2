"use client";

import { useEffect, useState } from "react";
import { useBroker } from "@/contexts/broker-context";
import DashboardLayout from "@/components/dashboard-layout";
import DashboardContent from "@/components/dashboard-content";
import { Trade, JournalEntry } from "@prisma/client";

export default function HomePage() {
  const { selectedBrokerId } = useBroker();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch trades with optional broker filter
        const tradesParams = new URLSearchParams();
        if (selectedBrokerId) {
          tradesParams.append('brokerId', selectedBrokerId);
        }
        
        const [tradesRes, journalRes] = await Promise.all([
          fetch(`/api/trades?${tradesParams.toString()}`),
          fetch('/api/journal')
        ]);

        if (tradesRes.ok && journalRes.ok) {
          const [tradesData, journalData] = await Promise.all([
            tradesRes.json(),
            journalRes.json()
          ]);
          
          setTrades(tradesData);
          setJournalEntries(journalData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBrokerId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardContent trades={trades} journalEntries={journalEntries} />
    </DashboardLayout>
  );
}
