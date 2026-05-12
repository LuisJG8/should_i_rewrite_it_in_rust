import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: number }
>(({ className, value, ...props }, ref) => {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200",
        className,
      )}
      {...props}
    >
      <span
        className="block h-full w-full flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-all duration-300"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
});
Progress.displayName = "Progress";

export { Progress };
