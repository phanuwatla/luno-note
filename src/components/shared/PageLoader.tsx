import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export interface PageLoaderProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Standardized Page/View Loader component (LN-UI-01 / LN-REUSE-01).
 * Matches the application startup loading design across all views, tabs, and lazy-loaded screens.
 */
export function PageLoader({
  title,
  description,
  className,
  compact = false,
}: PageLoaderProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("common.loading");
  const displayDescription = description ?? t("common.loadingPageDesc");

  return (
    <div
      className={cn(
        "flex flex-1 min-h-0 w-full flex-col items-center justify-center bg-background text-foreground select-none",
        compact ? "p-4" : "p-6",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center px-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative flex items-center justify-center py-2">
          <Loader2
            className={cn(
              "text-primary animate-spin",
              compact ? "h-7 w-7" : "h-9 w-9",
            )}
          />
        </div>
        <div className="space-y-1">
          <h2
            className={cn(
              "font-semibold text-foreground tracking-tight",
              compact ? "text-sm" : "text-base",
            )}
          >
            {displayTitle}
          </h2>
          {displayDescription && (
            <p className="text-xs text-muted-foreground max-w-[320px]">
              {displayDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageLoader;
