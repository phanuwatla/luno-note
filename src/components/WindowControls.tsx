import { useEffect, useRef, useState } from "react";
import { Minus, Square, Copy, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      minimize: () => void;
      maximize: () => void;
      snapWindow?: (boundsRatio: { xRatio: number; yRatio: number; wRatio: number; hRatio: number }) => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
    };
  }
}

export default function WindowControls() {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDesktopEnv, setIsDesktopEnv] = useState(false);
  const [showSnapLayouts, setShowSnapLayouts] = useState(false);

  const snapTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.electronAPI?.isElectron) {
        setIsDesktopEnv(true);
        window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {});
      } else if (import.meta.env.DEV) {
        // Also allow testing in dev server
        setIsDesktopEnv(true);
      }
    }
  }, []);

  const clearTimers = () => {
    if (snapTimerRef.current) {
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMaximizeMouseEnter = () => {
    clearTimers();
    snapTimerRef.current = window.setTimeout(() => {
      setShowSnapLayouts(true);
    }, 150);
  };

  const handleMaximizeMouseLeave = () => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setShowSnapLayouts(false);
    }, 250);
  };

  const handleSnapContainerMouseEnter = () => {
    clearTimers();
  };

  const handleSnapContainerMouseLeave = () => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setShowSnapLayouts(false);
    }, 200);
  };

  if (!isDesktopEnv) return null;

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSnapLayouts(false);
    window.electronAPI?.minimize();
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSnapLayouts(false);
    if (window.electronAPI) {
      window.electronAPI.maximize();
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);
    } else {
      setIsMaximized((prev) => !prev);
    }
  };

  const handleSnap = (xRatio: number, yRatio: number, wRatio: number, hRatio: number) => {
    setShowSnapLayouts(false);
    if (window.electronAPI?.snapWindow) {
      window.electronAPI.snapWindow({ xRatio, yRatio, wRatio, hRatio });
      setIsMaximized(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSnapLayouts(false);
    window.electronAPI?.close();
  };

  const getCleanLabel = (key: string, fallback: string) => {
    const val = t(key);
    if (!val || val === key || val.includes(".")) return fallback;
    return val;
  };

  const minimizeLabel = getCleanLabel("window.minimize", "Minimize");
  const maximizeLabel = isMaximized
    ? getCleanLabel("window.restore", "Restore")
    : getCleanLabel("window.maximize", "Maximize");
  const closeLabel = getCleanLabel("window.close", "Close");

  const noDragStyle: React.CSSProperties = {
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
  } as React.CSSProperties;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="relative flex items-center gap-1 shrink-0 select-none border-l border-border/40 px-1.5 z-50"
        style={noDragStyle}
      >
        {/* Minimize Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleMinimize}
              style={noDragStyle}
              aria-label={minimizeLabel}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5 pointer-events-none" />
              <span className="sr-only">{minimizeLabel}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{minimizeLabel}</TooltipContent>
        </Tooltip>

        {/* Maximize / Restore Button with Snap Layouts Popover */}
        <Popover open={showSnapLayouts} onOpenChange={setShowSnapLayouts}>
          <div
            className="relative"
            onMouseEnter={handleMaximizeMouseEnter}
            onMouseLeave={handleMaximizeMouseLeave}
          >
            <PopoverTrigger asChild>
              <div>
                <Tooltip open={showSnapLayouts ? false : undefined}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleMaximize}
                      style={noDragStyle}
                      aria-label={maximizeLabel}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      {isMaximized ? (
                        <Copy className="h-3 w-3 rotate-180 pointer-events-none" />
                      ) : (
                        <Square className="h-3 w-3 pointer-events-none" />
                      )}
                      <span className="sr-only">{maximizeLabel}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{maximizeLabel}</TooltipContent>
                </Tooltip>
              </div>
            </PopoverTrigger>
          </div>

          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={6}
            onMouseEnter={handleSnapContainerMouseEnter}
            onMouseLeave={handleSnapContainerMouseLeave}
            style={noDragStyle}
            className="z-[99999] !w-auto !p-2 rounded-xl bg-popover/95 backdrop-blur-2xl border border-border/80 shadow-2xl select-none animate-in fade-in zoom-in-95 duration-150 outline-none"
          >
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Equal 50 / 50 */}
              <div className="w-[96px] h-[66px] rounded-lg border border-border/70 bg-muted/40 p-1 flex gap-1 hover:border-border transition-colors">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapLeft") || "Snap Left"}
                      onClick={() => handleSnap(0, 0, 0.5, 1)}
                      className="flex-1 h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapLeft") || "Snap Left"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapRight") || "Snap Right"}
                      onClick={() => handleSnap(0.5, 0, 0.5, 1)}
                      className="flex-1 h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapRight") || "Snap Right"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* 2. 67 / 33 Split */}
              <div className="w-[96px] h-[66px] rounded-lg border border-border/70 bg-muted/40 p-1 flex gap-1 hover:border-border transition-colors">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapLeftWide") || "Snap Left (2/3)"}
                      onClick={() => handleSnap(0, 0, 0.67, 1)}
                      className="w-[62%] h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapLeftWide") || "Snap Left (2/3)"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapRightNarrow") || "Snap Right (1/3)"}
                      onClick={() => handleSnap(0.67, 0, 0.33, 1)}
                      className="w-[38%] h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapRightNarrow") || "Snap Right (1/3)"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* 3. 3 Panes (Left 50%, Right Top/Bottom) */}
              <div className="w-[96px] h-[66px] rounded-lg border border-border/70 bg-muted/40 p-1 flex gap-1 hover:border-border transition-colors">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapLeft") || "Snap Left"}
                      onClick={() => handleSnap(0, 0, 0.5, 1)}
                      className="flex-1 h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapLeft") || "Snap Left"}
                  </TooltipContent>
                </Tooltip>

                <div className="flex-1 flex flex-col gap-1 h-full">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("window.snapTopRight") || "Snap Top Right"}
                        onClick={() => handleSnap(0.5, 0, 0.5, 0.5)}
                        className="w-full flex-1 rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                      {t("window.snapTopRight") || "Snap Top Right"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("window.snapBottomRight") || "Snap Bottom Right"}
                        onClick={() => handleSnap(0.5, 0.5, 0.5, 0.5)}
                        className="w-full flex-1 rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                      {t("window.snapBottomRight") || "Snap Bottom Right"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* 4. 4 Quarters (2x2 Grid) */}
              <div className="w-[96px] h-[66px] rounded-lg border border-border/70 bg-muted/40 p-1 grid grid-cols-2 gap-1 hover:border-border transition-colors">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapTopLeft") || "Snap Top Left"}
                      onClick={() => handleSnap(0, 0, 0.5, 0.5)}
                      className="w-full h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapTopLeft") || "Snap Top Left"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapTopRight") || "Snap Top Right"}
                      onClick={() => handleSnap(0.5, 0, 0.5, 0.5)}
                      className="w-full h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapTopRight") || "Snap Top Right"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapBottomLeft") || "Snap Bottom Left"}
                      onClick={() => handleSnap(0, 0.5, 0.5, 0.5)}
                      className="w-full h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapBottomLeft") || "Snap Bottom Left"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("window.snapBottomRight") || "Snap Bottom Right"}
                      onClick={() => handleSnap(0.5, 0.5, 0.5, 0.5)}
                      className="w-full h-full rounded-[4px] border border-muted-foreground/30 bg-muted-foreground/15 hover:bg-primary hover:border-primary transition-all duration-150 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] px-2 py-0.5 z-[100000]">
                    {t("window.snapBottomRight") || "Snap Bottom Right"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Close Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleClose}
              style={noDragStyle}
              aria-label={closeLabel}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500 hover:text-white dark:hover:bg-red-600 transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5 pointer-events-none" />
              <span className="sr-only">{closeLabel}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{closeLabel}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
