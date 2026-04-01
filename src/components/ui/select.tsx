"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({
  open: false,
  setOpen: () => {},
});

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { className?: string }) {
  const { open, setOpen, value } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn("flex h-9 w-full items-center justify-between rounded-lg px-3 py-2 text-sm outline-none transition-all", className)}
      style={{
        background: "var(--bg-base)",
        border: `1px solid ${open ? "var(--brand)" : "var(--border-default)"}`,
        color: "var(--text-primary)",
        boxShadow: open ? "0 0 0 3px var(--brand-dim)" : "none",
      }}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return (
    <span style={{ color: value ? "var(--text-primary)" : "var(--text-muted)" }}>
      {value || placeholder}
    </span>
  );
}

export function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={cn("absolute z-50 mt-1 w-full rounded-xl overflow-hidden", className)}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </div>
    </>
  );
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { onValueChange, value: selectedValue, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;
  return (
    <div
      onClick={() => { onValueChange?.(value); setOpen(false); }}
      className={cn("px-3 py-2 text-sm cursor-pointer transition-colors", className)}
      style={{
        background: isSelected ? "var(--brand-dim)" : "transparent",
        color: isSelected ? "var(--brand-light)" : "var(--text-secondary)",
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </div>
  );
}

export function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-3 py-1.5 text-xs font-medium", className)} style={{ color: "var(--text-muted)" }}>
      {children}
    </div>
  );
}

export function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px", className)} style={{ background: "var(--border-subtle)" }} />;
}

