import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

function AiDiffComponent({ node, getPos, editor }: NodeViewProps) {
  const { t } = useTranslation();
  const { originalText, proposedText } = node.attrs;

  const handleAccept = () => {
    if (typeof getPos === "function" && editor) {
      const pos = getPos();
      const nodeSize = node.nodeSize;
      editor.chain().focus().insertContentAt({ from: pos, to: pos + nodeSize }, proposedText).run();
    }
  };

  const handleReject = () => {
    if (typeof getPos === "function" && editor) {
      const pos = getPos();
      const nodeSize = node.nodeSize;
      editor.chain().focus().insertContentAt({ from: pos, to: pos + nodeSize }, originalText).run();
    }
  };

  const handleInsertBelow = () => {
    if (typeof getPos === "function" && editor) {
      const pos = getPos();
      const nodeSize = node.nodeSize;
      const combined = `${originalText}\n\n${proposedText}`;
      editor.chain().focus().insertContentAt({ from: pos, to: pos + nodeSize }, combined).run();
    }
  };

  return (
    <NodeViewWrapper className="ai-diff-node-wrapper my-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm select-none text-xs">
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <SparklesIcon className="h-4 w-4 text-[hsl(var(--accent))]" />
            <span className="font-semibold text-sm">{t("settings.aiAssistant")}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={handleAccept}
              className="h-8 gap-1 rounded-lg bg-[hsl(var(--accent))] px-3 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Check className="h-3.5 w-3.5" />
              {t("settings.aiAccept")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleReject}
              className="h-8 gap-1 rounded-lg px-3 text-xs font-medium"
            >
              <X className="h-3.5 w-3.5" />
              {t("settings.aiReject")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleInsertBelow}
              className="h-8 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("settings.aiInsertBelow")}
            </Button>
          </div>
        </div>

        {/* Diff content */}
        <div className="space-y-2 text-sm leading-relaxed">
          {/* Red line for Original */}
          <div className="flex items-start rounded-lg bg-destructive/10 p-2.5 text-destructive border border-destructive/20 line-through">
            <span className="mr-2 select-none font-bold text-destructive">-</span>
            <span className="whitespace-pre-wrap">{originalText}</span>
          </div>

          {/* Green line for Proposed */}
          <div className="flex items-start rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span className="mr-2 select-none font-bold text-emerald-600 dark:text-emerald-400">+</span>
            <span className="whitespace-pre-wrap">{proposedText}</span>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const AiDiffExtension = Node.create({
  name: "aiDiffNode",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      originalText: { default: "" },
      proposedText: { default: "" },
      action: { default: "improve" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-diff-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "ai-diff-node" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiDiffComponent);
  },
});
