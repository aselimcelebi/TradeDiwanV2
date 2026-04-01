"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import BrokerManagementContent from "@/components/broker-management-content";

interface BrokerWithCounts {
  id: string;
  name: string;
  platform: string;
  accountId: string;
  status: string;
  server?: string;
  currency?: string;
  leverage?: number;
  company?: string;
  lastSync?: Date;
  createdAt: Date;
  _count: {
    trades: number;
  };
}

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<BrokerWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const response = await fetch('/api/brokers');
        if (response.ok) {
          const brokersData = await response.json();
          setBrokers(brokersData);
        }
      } catch (error) {
        console.error('Error fetching brokers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrokers();
  }, []);

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
      <BrokerManagementContent brokers={brokers} />
    </DashboardLayout>
  );
}
