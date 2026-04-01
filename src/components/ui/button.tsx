import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// class-variance-authority yoksa basit versiyon:
const buttonVariants = (variant: string, size: string) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    default:     "text-white",
    secondary:   "",
    destructive: "",
    outline:     "",
    ghost:       "",
    link:        "underline-offset-4 hover:underline",
  };

  const sizes: Record<string, string> = {
    default: "h-9 px-4 py-2",
    sm:      "h-8 px-3 text-xs",
    lg:      "h-10 px-6",
    icon:    "h-9 w-9",
  };

  return cn(base, variants[variant] || variants.default, sizes[size] || sizes.default);
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  style,
  ...props
}: ButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--brand)",
      color: "#fff",
    },
    secondary: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      color: "var(--text-secondary)",
    },
    destructive: {
      background: "var(--red-dim)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "var(--red)",
    },
    outline: {
      background: "transparent",
      border: "1px solid var(--border-default)",
      color: "var(--text-secondary)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
    },
    link: {
      background: "transparent",
      color: "var(--brand-light)",
    },
  };

  return (
    <button
      className={cn(buttonVariants(variant, size), className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}

