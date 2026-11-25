import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Standardized Empty State component (LN-UI-01 / LN-REUSE-01).
 * Preserves Luno Note's clean minimal aesthetic across all views and panels.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center select-none luno-section-enter",
        isCompact ? "py-6 px-3 gap-1.5" : "py-12 px-6 gap-2.5",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center text-muted-foreground/50",
            isCompact ? "[&_svg]:h-6 [&_svg]:w-6" : "h-12 w-12 rounded-2xl bg-muted/50 [&_svg]:h-6 [&_svg]:w-6",
          )}
        >
          {icon}
        </div>
      )}
      <p
        className={cn(
          "font-semibold text-foreground/80",
          isCompact ? "text-xs" : "text-sm",
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm leading-relaxed",
            isCompact ? "text-[11px]" : "text-xs",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className={isCompact ? "mt-1" : "mt-2"}>{action}</div>}
    </div>
  );
}

export default EmptyState;
