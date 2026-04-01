"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onOpenChange?.(false)}
    >
      {children}
    </div>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl", className)}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 p-6 pt-4 border-t", className)}
      style={{ borderColor: "var(--border-subtle)" }}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold leading-none tracking-tight", className)}
      style={{ color: "var(--text-primary)" }}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm", className)}
      style={{ color: "var(--text-muted)" }}
      {...props}
    />
  );
}

export function DialogTrigger({ children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div onClick={onClick} style={{ cursor: "pointer", display: "inline-flex" }} {...props}>
      {children}
    </div>
  );
}

export function DialogClose({ children, onClick, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors"
      style={{ color: "var(--text-muted)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
    </button>
  );
}

