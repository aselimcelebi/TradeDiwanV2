"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType>({ value: "", onValueChange: () => {} });

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, defaultValue, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue || "");
  const current = value ?? internal;
  const setCurrent = onValueChange ?? setInternal;
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: setCurrent }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-lg p-1", className)}
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ className, value, children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: current, onValueChange } = React.useContext(TabsContext);
  const isActive = current === value;
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn("inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-all", className)}
      style={{
        background: isActive ? "var(--bg-hover)" : "transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-muted)",
        border: isActive ? "1px solid var(--border-default)" : "1px solid transparent",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ className, value, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: current } = React.useContext(TabsContext);
  if (current !== value) return null;
  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
}

