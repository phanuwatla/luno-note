import React from "react";
import { motion } from "framer-motion";
import { marked } from "marked";
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

const renderMarkdownHtml = (markdownText: string): string => {
  if (!markdownText) return "";
  try {
    const rawHtml = marked.parse(markdownText, { gfm: true, breaks: true });
    return typeof rawHtml === "string" ? rawHtml : markdownText;
  } catch (_) {
    return markdownText;
  }
};

import { formatModelName } from "@/lib/geminiApi";

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
      transition={{ duration: 0.2, ease: "easeInOut" }}
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
          <span
            className="text-[10px] font-mono text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 select-none truncate max-w-[125px] whitespace-nowrap shrink"
            title={formatModelName(diffState.modelUsed)}
          >
            {formatModelName(diffState.modelUsed)}
          </span>
        </div>

        {/* Original Text Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">
            {t("common.originalText")}
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5 text-muted-foreground border border-border/80 leading-relaxed max-h-48 overflow-y-auto">
            <div
              className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground line-through break-words text-xs [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(diffState.originalText) }}
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
              className="prose prose-xs dark:prose-invert max-w-none text-foreground break-words text-xs [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>strong]:font-semibold [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded"
              dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(diffState.proposedText) }}
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
    </motion.aside>
  );
}
