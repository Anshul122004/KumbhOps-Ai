import { cn } from "../../lib/utils";

export function Alert({ className, variant = "info", ...props }) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm shadow-lg shadow-black/10",
        variant === "error" && "border-red-200 bg-red-50 text-red-700",
        variant === "info" && "border-border bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
