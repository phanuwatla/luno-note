import React, { useState, useCallback } from "react";
import { copyToClipboard } from "@/lib/clipboardUtils";

export interface MarkdownTooltipState {
  text: string;
  x: number;
  y: number;
  side: "top" | "bottom";
}

const CHECK_ICON_SVG =
  '<svg class="h-3.5 w-3.5 text-primary shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

/**
 * Shared hook for floating tooltips, external link clicks, and [data-copy-code] actions inside rendered AI Markdown blocks.
 * Eliminates duplication between AiAssistantPanel and LunoAiView (LN-REUSE-01).
 */
export function useMarkdownCodeCopyTooltip(options?: {
  copiedLabel?: string;
  copyLabel?: string;
  onInsertCode?: (code: string) => void;
  onCopied?: (code: string) => void;
  onOpenExternalLink?: (href: string) => void;
}) {
  const [markdownTooltip, setMarkdownTooltip] = useState<MarkdownTooltipState | null>(null);

  const handleContentMouseOver = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-tooltip]");
    if (target) {
      const text = target.getAttribute("data-tooltip");
      if (text) {
        const rect = target.getBoundingClientRect();
        const explicitSide = target.getAttribute("data-tooltip-side");
        const placeAbove = explicitSide ? explicitSide !== "bottom" : rect.top > 36;
        setMarkdownTooltip({
          text,
          x: rect.left + rect.width / 2,
          y: placeAbove ? rect.top - 6 : rect.bottom + 6,
          side: placeAbove ? "top" : "bottom",
        });
        return;
      }
    }
    setMarkdownTooltip(null);
  }, []);

  const handleContentMouseOut = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !related.closest("[data-tooltip]")) {
      setMarkdownTooltip(null);
    }
  }, []);

  const handleContentClick = useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      const targetEl = e.target as HTMLElement | null;

      if (options?.onOpenExternalLink) {
        const anchor = targetEl?.closest("a");
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
            e.preventDefault();
            options.onOpenExternalLink(href);
            return;
          }
        }
      }

      const copyBtn = targetEl?.closest<HTMLElement>("[data-copy-code]");
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const encoded = copyBtn.getAttribute("data-code");
        if (encoded) {
          const code = decodeURIComponent(encoded);
          await copyToClipboard(code);

          const originalTooltip = copyBtn.getAttribute("data-tooltip") || "";
          const originalSvg = copyBtn.querySelector("svg")?.outerHTML || "";
          const copiedText = options?.copiedLabel || "Copied!";
          const fallbackCopyText = originalTooltip || options?.copyLabel || "Copy";

          copyBtn.setAttribute("data-tooltip", copiedText);
          copyBtn.setAttribute("aria-label", copiedText);
          setMarkdownTooltip((prev) => (prev ? { ...prev, text: copiedText } : null));

          const svg = copyBtn.querySelector("svg");
          if (svg) {
            svg.outerHTML = CHECK_ICON_SVG;
          }

          options?.onCopied?.(code);

          window.setTimeout(() => {
            copyBtn.setAttribute("data-tooltip", fallbackCopyText);
            copyBtn.setAttribute("aria-label", fallbackCopyText);
            setMarkdownTooltip((prev) => (prev ? { ...prev, text: fallbackCopyText } : null));
            const currentSvg = copyBtn.querySelector("svg");
            if (currentSvg && originalSvg) {
              currentSvg.outerHTML = originalSvg;
            }
          }, 2000);
        }
        return;
      }

      if (options?.onInsertCode) {
        const insertBtn = targetEl?.closest<HTMLElement>("[data-insert-code]");
        if (insertBtn) {
          e.preventDefault();
          e.stopPropagation();
          const encoded = insertBtn.getAttribute("data-code") || "";
          options.onInsertCode(decodeURIComponent(encoded));
        }
      }
    },
    [options?.copiedLabel, options?.copyLabel, options?.onInsertCode, options?.onCopied, options?.onOpenExternalLink],
  );

  return {
    markdownTooltip,
    clearMarkdownTooltip: useCallback(() => setMarkdownTooltip(null), []),
    handleContentMouseOver,
    handleContentMouseOut,
    handleContentClick,
  };
}

export function MarkdownFloatingTooltip({ tooltip }: { tooltip: MarkdownTooltipState | null }) {
  if (!tooltip) return null;
  return (
    <div
      role="tooltip"
      className="fixed z-[70] pointer-events-none select-none rounded-md border border-border bg-popover px-2.5 py-1 text-[11px] font-medium text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: tooltip.side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      {tooltip.text}
    </div>
  );
}
