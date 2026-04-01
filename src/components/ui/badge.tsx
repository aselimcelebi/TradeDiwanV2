import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", style, ...props }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--brand-dim)",
      color: "var(--brand-light)",
      border: "1px solid rgba(99,102,241,0.3)",
    },
    secondary: {
      background: "var(--bg-elevated)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-default)",
    },
    destructive: {
      background: "var(--red-dim)",
      color: "var(--red)",
      border: "1px solid rgba(239,68,68,0.3)",
    },
    outline: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-default)",
    },
    success: {
      background: "var(--green-dim)",
      color: "var(--green)",
      border: "1px solid rgba(34,197,94,0.3)",
    },
    warning: {
      background: "var(--amber-dim)",
      color: "var(--amber)",
      border: "1px solid rgba(245,158,11,0.3)",
    },
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}

