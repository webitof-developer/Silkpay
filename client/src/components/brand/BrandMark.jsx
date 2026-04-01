"use client";

import { cn } from "@/lib/utils";

export function BrandMark({ className = "h-10 w-10", glow = true }) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[1.1rem] bg-primary text-primary-foreground shadow-lg",
        glow && "shadow-primary/40",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <rect x="0" y="0" width="64" height="64" rx="18" fill="#6C5DD3" />
        <circle cx="20" cy="18" r="12" fill="#FFFFFF" fillOpacity="0.08" />
        <text
          x="50%"
          y="54%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="34"
          fontWeight="800"
        >
          S
        </text>
      </svg>
    </div>
  );
}

export function BrandWordmark({
  className = "",
  iconClassName = "h-10 w-10",
  textClassName = "text-2xl",
  glow = true,
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark className={iconClassName} glow={glow} />
      <span className={cn("font-bold tracking-wide text-white", textClassName)}>SilkPay</span>
    </div>
  );
}
