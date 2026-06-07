import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        variant === "primary" && "bg-primary text-primary-foreground shadow-lg shadow-teal-500/15 hover:bg-primary/90",
        variant === "outline" && "border border-border bg-background/80 text-foreground hover:border-primary/60 hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "success" && "bg-green-600 text-white shadow-lg shadow-green-500/15 hover:bg-green-700",
        variant === "danger" && "bg-red-600 text-white shadow-lg shadow-red-500/15 hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
