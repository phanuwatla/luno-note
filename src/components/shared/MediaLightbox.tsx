import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

export interface MediaLightboxProps {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  closeTooltip?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  topControls?: React.ReactNode;
}

/**
 * Standardized accessible full-screen media lightbox (LN-MDL-01 / LN-A11Y-03).
 * Shared by ImageNodeView and VideoNodeView with consistent backdrop, Esc handling, and z-index layer (z-50).
 */
export function MediaLightbox({
  open,
  onClose,
  ariaLabel,
  closeTooltip,
  children,
  footer,
  topControls,
}: MediaLightboxProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const closeLabel = closeTooltip || `${t("common.close")} (Esc)`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || t("common.close")}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in-0 duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="fixed top-4 right-4 z-10 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {topControls}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="p-2 rounded-xl bg-background/20 hover:bg-background/40 text-white border border-white/20 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <X className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{closeLabel}</TooltipContent>
        </Tooltip>
      </div>

      <div
        className="relative flex max-w-[92vw] max-h-[88vh] items-center justify-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {footer && (
        <div
          className="mt-3 max-w-[90vw] text-center text-xs text-white/80"
          onClick={(e) => e.stopPropagation()}
        >
          {footer}
        </div>
      )}
    </div>,
    document.body,
  );
}

export default MediaLightbox;
