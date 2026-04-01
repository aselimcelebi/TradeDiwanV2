import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, style, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg px-3 py-2 text-sm transition-all duration-150 outline-none resize-none",
        "placeholder:opacity-40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-default)",
        color: "var(--text-primary)",
        ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "var(--brand)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-dim)";
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    />
  );
}

