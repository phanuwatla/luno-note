import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Check,
  Plus,
  Minimize2,
  Maximize2,
  BookOpen,
  MessageCircle,
  Languages,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { WandSparklesIcon } from "@/components/icons/WandSparklesIcon";
import { SpellCheckIcon } from "@/components/icons/SpellCheckIcon";
import { BriefcaseBusinessIcon } from "@/components/icons/BriefcaseBusinessIcon";
import { PenLineIcon } from "@/components/icons/PenLineIcon";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AiActionType } from "@/components/Editor";
import { useAppSettings } from "@/hooks/useAppSettings";
import { renderLunoAiMarkdown } from "@/lib/lunoAiMarkdown";
import { formatModelName } from "@/lib/geminiApi";
import { copyToClipboard } from "@/lib/clipboardUtils";

export interface AiDiffState {
  from: number;
  to: number;
  originalText: string;
  proposedText: string;
  action: AiActionType;
  modelUsed?: string;
}

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diffState: AiDiffState | null;
  onAccept: () => void;
  onReject: () => void;
  onInsertBelow: () => void;
}

const ACTION_LABELS: Record<AiActionType, string> = {
  improve: "aiImprove",
  fix_grammar: "aiFixGrammar",
  make_shorter: "aiMakeShorter",
  make_longer: "aiMakeLonger",
  simplify: "aiSimplify",
  formalize: "aiFormalize",
  make_casual: "aiMakeCasual",
  translate: "aiTranslate",
  continue_writing: "aiContinueWriting",
  rewrite: "aiRewrite",
};

const ACTION_ICONS: Record<AiActionType, React.ComponentType<{ className?: string }>> = {
  improve: WandSparklesIcon,
  fix_grammar: SpellCheckIcon,
  make_shorter: Minimize2,
  make_longer: Maximize2,
  simplify: BookOpen,
  formalize: BriefcaseBusinessIcon,
  make_casual: MessageCircle,
  translate: Languages,
  continue_writing: ArrowRight,
  rewrite: PenLineIcon,
};

export default function AiAssistantPanel({
  isOpen,
  onClose,
  diffState,
  onAccept,
  onReject,
  onInsertBelow,
}: AiAssistantPanelProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();

  const [markdownTooltip, setMarkdownTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    side: "top" | "bottom";
  } | null>(null);

  const handleContentMouseOver = (e: React.MouseEvent<HTMLElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-tooltip]");
    if (target) {
      const text = target.getAttribute("data-tooltip");
      if (text) {
        const rect = target.getBoundingClientRect();
        const placeAbove = rect.top > 36;
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
  };

  const handleContentMouseOut = (e: React.MouseEvent<HTMLElement>) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !related.closest("[data-tooltip]")) {
      setMarkdownTooltip(null);
    }
  };

  const handleContentClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const copyBtn = (e.target as HTMLElement).closest<HTMLElement>("[data-copy-code]");
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const encoded = copyBtn.getAttribute("data-code");
      if (encoded) {
        const codeText = decodeURIComponent(encoded);
        await copyToClipboard(codeText);
        const originalTooltip = copyBtn.getAttribute("data-tooltip") || "";
        const originalSvg = copyBtn.querySelector("svg")?.outerHTML || "";
        const copiedText = t("lunoAi.copied") || "Copied!";

        copyBtn.setAttribute("data-tooltip", copiedText);
        copyBtn.setAttribute("aria-label", copiedText);
        setMarkdownTooltip((prev) => (prev ? { ...prev, text: copiedText } : null));

        const svg = copyBtn.querySelector("svg");
        if (svg) {
          svg.outerHTML = `<svg class="h-3.5 w-3.5 text-primary shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        }

        setTimeout(() => {
          copyBtn.setAttribute("data-tooltip", originalTooltip || t("lunoAi.copyCode") || "Copy");
          copyBtn.setAttribute("aria-label", originalTooltip || t("lunoAi.copyCode") || "Copy");
          setMarkdownTooltip((prev) => (prev ? { ...prev, text: originalTooltip || t("lunoAi.copyCode") || "Copy" } : null));
          const currentSvg = copyBtn.querySelector("svg");
          if (currentSvg && originalSvg) {
            currentSvg.outerHTML = originalSvg;
          }
        }, 2000);
      }
    }
  };

  if (!isOpen || !diffState) return null;

  const actionKey = ACTION_LABELS[diffState.action];
  const actionLabel = actionKey ? t(`settings.${actionKey}` as any) : diffState.action;
  const ActionIcon = ACTION_ICONS[diffState.action] || WandSparklesIcon;

  return (
    <motion.aside
      data-ai-panel="true"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="h-full w-[280px] shrink-0 border-l border-border bg-background flex flex-col select-none overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex h-11 items-center justify-between border-b border-border/50 px-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <span>{t("settings.aiAssistant")}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("rightPanel.closePanel") || "Close panel"}</TooltipContent>
        </Tooltip>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs">
        {/* Action Title & Model Badge */}
        <div className="flex items-center justify-between font-medium text-foreground gap-2">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            <ActionIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-xs text-foreground whitespace-nowrap">{actionLabel}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="text-[10px] font-mono text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 select-none truncate max-w-[125px] whitespace-nowrap shrink cursor-default"
                aria-label={formatModelName(diffState.modelUsed)}
              >
                {formatModelName(diffState.modelUsed)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              {formatModelName(diffState.modelUsed)}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Original Text Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">
            {t("common.originalText")}
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5 text-muted-foreground border border-border/80 leading-relaxed max-h-48 overflow-y-auto">
            <div
              className="editor-markdown-content text-xs leading-relaxed text-muted-foreground line-through break-words"
              onClick={handleContentClick}
              onMouseOver={handleContentMouseOver}
              onMouseOut={handleContentMouseOut}
              dangerouslySetInnerHTML={{
                __html: renderLunoAiMarkdown(diffState.originalText, {
                  showCodeLineNumbers: settings.showCodeLineNumbers,
                  accentHeadings: false,
                  copyButtonText: t("lunoAi.copyCode") || "Copy",
                }),
              }}
            />
          </div>
        </div>

        {/* AI Suggestion Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-primary">
            {t("common.aiSuggestion")}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-foreground border border-primary/20 leading-relaxed max-h-60 overflow-y-auto">
            <div
              className="editor-markdown-content text-xs leading-relaxed text-foreground break-words"
              data-accent-headings={settings.accentHeadings ? "true" : undefined}
              onClick={handleContentClick}
              onMouseOver={handleContentMouseOver}
              onMouseOut={handleContentMouseOut}
              dangerouslySetInnerHTML={{
                __html: renderLunoAiMarkdown(diffState.proposedText, {
                  showCodeLineNumbers: settings.showCodeLineNumbers,
                  accentHeadings: settings.accentHeadings,
                  copyButtonText: t("lunoAi.copyCode") || "Copy",
                }),
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="border-t border-border/50 p-3 space-y-1.5 bg-background shrink-0">
        <Button
          type="button"
          onClick={onAccept}
          className="w-full h-8 gap-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{t("settings.aiAccept")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReject}
          className="w-full h-8 gap-1.5 rounded-lg font-medium text-xs border border-border/80 bg-background hover:bg-muted hover:text-foreground active:scale-[0.98] transition-all"
        >
          <X className="h-3.5 w-3.5" />
          <span>{t("settings.aiReject")}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onInsertBelow}
          className="w-full h-8 gap-1.5 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground font-medium text-[11px] active:scale-[0.98] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t("settings.aiInsertBelow")}</span>
        </Button>
      </div>

      {/* Floating Markdown Tooltip matching Radix Tooltip UI 1:1 */}
      {markdownTooltip && (
        <div
          role="tooltip"
          className="fixed z-[9999] pointer-events-none select-none rounded-md border border-border bg-popover px-2.5 py-1 text-[11px] font-medium text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${markdownTooltip.x}px`,
            top: `${markdownTooltip.y}px`,
            transform: markdownTooltip.side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          }}
        >
          {markdownTooltip.text}
        </div>
      )}
    </motion.aside>
  );
}
