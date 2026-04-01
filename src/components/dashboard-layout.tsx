"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useBroker } from "@/contexts/broker-context";
import Sidebar from "./sidebar";
import Header from "./header";
import AddTradeModal from "./add-trade-modal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const { t } = useLanguage();
  const { selectedBrokerId, setSelectedBrokerId } = useBroker();

  const handleAddTrade = async (tradeData: any) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
        throw new Error('Failed to add trade');
      }

      // Refresh the page to show new trade
      window.location.reload();
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  };

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar 
        onAddTrade={() => setIsAddTradeOpen(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={t.dashboard}
          subtitle={t.goodMorning}
          showFilters={false}
          selectedBrokerId={selectedBrokerId || undefined}
          onBrokerChange={setSelectedBrokerId}
        />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <AddTradeModal
        isOpen={isAddTradeOpen}
        onClose={() => setIsAddTradeOpen(false)}
        onSubmit={handleAddTrade}
      />
    </div>
  );
}
