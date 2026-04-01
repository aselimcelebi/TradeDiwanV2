"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BrokerContextType {
  selectedBrokerId: string | null;
  setSelectedBrokerId: (brokerId: string | null) => void;
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined);

export function BrokerProvider({ children }: { children: ReactNode }) {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);

  return (
    <BrokerContext.Provider value={{ selectedBrokerId, setSelectedBrokerId }}>
      {children}
    </BrokerContext.Provider>
  );
}

export function useBroker() {
  const context = useContext(BrokerContext);
  if (context === undefined) {
    throw new Error("useBroker must be used within a BrokerProvider");
  }
  return context;
}
