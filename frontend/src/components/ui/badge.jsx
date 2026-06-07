import { cn } from "../../lib/utils";

const variants = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function Badge({ className, variant = "neutral", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize",
        "shadow-sm backdrop-blur-sm",
        variants[variant] ?? variants.neutral,
        className,
      )}
      {...props}
    />
  );
}
