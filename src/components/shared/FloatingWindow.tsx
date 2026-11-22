import React, { useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { GripHorizontal, Maximize2, Minus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface FloatingWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  zIndex?: number;
  onFocusWindow?: () => void;
  title: React.ReactNode;
  headerIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  minimizedContent: React.ReactNode;
  minimizedExtra?: React.ReactNode;
  children: React.ReactNode;
  /** Default positioning (e.g. { top: "14%", right: "12%" }) */
  defaultPosition?: React.CSSProperties;
  /** Expanded card width class (default: "w-[320px]") */
  widthClassName?: string;
  className?: string;
  minimizeTooltip?: string;
  expandTooltip?: string;
  closeTooltip?: string;
}

/**
 * Standardized draggable Floating Tool Window & Minimized Pill shell (LN-MDL-01 / LN-REUSE-01).
 * - Uses dragControls scoped strictly to the header/grip bar so inputs/buttons remain interactive.
 * - Keeps z-index strictly within the floating layer (40..49), ALWAYS underneath Modals (z-50).
 * - Preserves drag offset when toggling between minimized pill and expanded card.
 */
export function FloatingWindow({
  isOpen,
  isMinimized,
  onToggleMinimize,
  onClose,
  zIndex = 40,
  onFocusWindow,
  title,
  headerIcon,
  headerExtra,
  minimizedContent,
  minimizedExtra,
  children,
  defaultPosition = { top: "14%", right: "12%" },
  widthClassName = "w-[320px]",
  className,
  minimizeTooltip,
  expandTooltip,
  closeTooltip,
}: FloatingWindowProps) {
  const { t } = useTranslation();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Clamp zIndex within floating layer (40..49) so floating tools never cover Dialog/AlertDialog (z-50)
  const clampedZIndex = Math.min(49, Math.max(40, zIndex));

  const minLabel = minimizeTooltip || t("editor.minimize");
  const expLabel = expandTooltip || t("editor.expand");
  const clsLabel = closeTooltip || t("common.close");

  return (
    <motion.div
      ref={containerRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      onPointerDown={() => onFocusWindow?.()}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 12 }}
      transition={{ type: "spring", damping: 26, stiffness: 360 }}
      data-floating-window={!isMinimized ? "true" : undefined}
      data-floating-pill={isMinimized ? "true" : undefined}
      style={{ ...defaultPosition, zIndex: clampedZIndex, fontFamily: "var(--app-font-family, inherit)" }}
      className={cn(
        "fixed select-none backdrop-blur-md bg-card/95 border border-border/70 text-card-foreground",
        isMinimized
          ? "rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2"
          : cn("rounded-2xl p-3.5 shadow-xl", widthClassName),
        className,
      )}
    >
      {isMinimized ? (
        <>
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/70 hover:text-foreground transition-colors flex items-center"
          >
            <GripHorizontal className="h-3.5 w-3.5" />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleMinimize}
                className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {minimizedContent}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{expLabel}</TooltipContent>
          </Tooltip>

          <div className="h-3.5 w-px bg-border/60" />

          <div className="flex items-center gap-0.5">
            {minimizedExtra}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleMinimize}
                  aria-label={expLabel}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{expLabel}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={clsLabel}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{clsLabel}</TooltipContent>
            </Tooltip>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          {/* Draggable Header Bar */}
          <div
            onPointerDown={(e) => {
              if ((e.target as HTMLElement)?.closest("button, input, select, a")) return;
              dragControls.start(e);
            }}
            className="flex items-center justify-between gap-2 pb-2 border-b border-border/40 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-muted-foreground">
              <GripHorizontal className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {headerIcon}
              <span className="truncate">{title}</span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {headerExtra}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onToggleMinimize}
                    aria-label={minLabel}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{minLabel}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={clsLabel}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{clsLabel}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {children}
        </div>
      )}
    </motion.div>
  );
}

export default FloatingWindow;
