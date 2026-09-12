import React, { useMemo, useState, useRef } from "react";
import {
  X,
  RotateCcw,
  Copy,
  Check,
  Clock,
  Columns2,
  Eye,
  Code,
  Link2,
  Link2Off,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/hooks/useNotes";
import type { NoteVersionSnapshot } from "@/lib/versionHistoryStorage";
import { computeLineDiff, summarizeDiff } from "@/lib/diffUtils";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { countWords } from "@/lib/wordCount";
import NoteEditorPreview from "@/components/NoteEditorPreview";

interface VersionHistorySplitDiffViewProps {
  note: Note;
  version: NoteVersionSnapshot;
  editorFontSize?: number;
  assetBlobUrlMap?: React.MutableRefObject<Map<string, string>>;
  resolveAssetDataUrl?: (assetPath: string) => Promise<string | null>;
  onRestore: (version: NoteVersionSnapshot) => void;
  onClose: () => void;
}

type ViewMode = "split-editor" | "preview" | "code-diff";

export default function VersionHistorySplitDiffView({
  note,
  version,
  editorFontSize = 15,
  assetBlobUrlMap,
  onRestore,
  onClose,
}: VersionHistorySplitDiffViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split-editor");
  const [syncScroll, setSyncScroll] = useState(true);

  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef(false);

  const isTh = settings.language === "th";

  const formattedVersionTime = useMemo(() => {
    return formatRelativeDateTime(
      version.timestamp,
      settings.dateFormat,
      settings.timeFormat,
      settings.language
    );
  }, [version.timestamp, settings.dateFormat, settings.timeFormat, settings.language]);

  const diffLines = useMemo(() => {
    return computeLineDiff(version.content, note.content || "");
  }, [version.content, note.content]);

  const summary = useMemo(() => {
    return summarizeDiff(version.content, note.content || "");
  }, [version.content, note.content]);

  const noteTitle = useMemo(() => {
    const raw = version.title || note.title || note.fileName || "";
    return raw.replace(/\.[^/.]+$/, "");
  }, [version.title, note.title, note.fileName]);

  // Synchronized scroll handlers for side-by-side view
  const handleLeftScroll = () => {
    if (!syncScroll || isSyncingScrollRef.current) return;
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (!left || !right) return;
    isSyncingScrollRef.current = true;
    const maxLeft = left.scrollHeight - left.clientHeight;
    const maxRight = right.scrollHeight - right.clientHeight;
    if (maxLeft > 0 && maxRight > 0) {
      const percentage = left.scrollTop / maxLeft;
      right.scrollTop = percentage * maxRight;
    }
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const handleRightScroll = () => {
    if (!syncScroll || isSyncingScrollRef.current) return;
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (!left || !right) return;
    isSyncingScrollRef.current = true;
    const maxLeft = left.scrollHeight - left.clientHeight;
    const maxRight = right.scrollHeight - right.clientHeight;
    if (maxLeft > 0 && maxRight > 0) {
      const percentage = right.scrollTop / maxRight;
      left.scrollTop = percentage * maxLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(version.content || "");
      setCopied(true);
      toast({
        title: t("versionHistoryPanel.contentCopied"),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy:", err);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full w-full flex-col min-w-0 bg-background text-foreground select-none overflow-hidden">
        {/* Comparison Top Bar */}
        <div className="flex h-12 items-center justify-between border-b border-border/70 bg-card/60 px-4 shrink-0 backdrop-blur-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">
                {t("versionHistoryPanel.comparingWith", { time: formattedVersionTime }) ||
                  `Comparing with: ${formattedVersionTime}`}
              </span>
            </div>

            {/* Diff Stats Badges */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold">
              {summary.addedLines > 0 && (
                <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  +{summary.addedLines} {isTh ? "เพิ่ม" : "added"}
                </span>
              )}
              {summary.removedLines > 0 && (
                <span className="rounded-lg bg-rose-500/10 px-2 py-0.5 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  -{summary.removedLines} {isTh ? "ลบ" : "removed"}
                </span>
              )}
              {summary.wordCountDiff !== 0 && (
                <span className="rounded-lg bg-muted px-2 py-0.5 text-muted-foreground border border-border/40">
                  {summary.wordCountDiff > 0 ? `+${summary.wordCountDiff}` : summary.wordCountDiff}{" "}
                  {isTh ? "คำ" : "words"}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons & View Modes */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle Group */}
            <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-xs border border-border/40 mr-1">
              {/* 1. Side-by-Side Editor Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setViewMode("split-editor")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "split-editor"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Columns2 className="h-3 w-3" />
                    <span className="hidden lg:inline">
                      {t("versionHistoryPanel.splitEditor") || (isTh ? "สองฝั่ง" : "Side-by-Side")}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("versionHistoryPanel.splitEditor") || "Side-by-Side Editor Comparison (100% Editor WYSIWYG)"}
                </TooltipContent>
              </Tooltip>

              {/* 2. Full Preview Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "preview"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span className="hidden lg:inline">
                      {t("versionHistoryPanel.preview") || (isTh ? "พรีวิว" : "Preview")}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("versionHistoryPanel.preview") || "Full Historical Preview (100% Editor WYSIWYG)"}
                </TooltipContent>
              </Tooltip>

              {/* 4. Code Diff Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setViewMode("code-diff")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "code-diff"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    <span className="hidden lg:inline">
                      {t("versionHistoryPanel.codeDiff") || "Code Diff"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("versionHistoryPanel.codeDiff") || "Raw Line-by-Line Code Diff"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sync Scroll Toggle (for Side-by-Side mode) */}
            {viewMode === "split-editor" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSyncScroll(!syncScroll)}
                    className={`h-8 w-8 rounded-lg cursor-pointer transition-colors ${
                      syncScroll
                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    aria-label={t("versionHistoryPanel.syncScroll") || "Sync Scroll"}
                  >
                    {syncScroll ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {(t("versionHistoryPanel.syncScroll") || "Sync Scroll") + ": " + (syncScroll ? (isTh ? "เปิด" : "On") : (isTh ? "ปิด" : "Off"))}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 text-xs gap-1.5 px-3.5 rounded-xl border border-border/70 hover:bg-muted/90 shadow-2xs cursor-pointer font-semibold"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline">{t("versionHistoryPanel.copyContent")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("versionHistoryPanel.copyContent")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => onRestore(version)}
                  className="h-8 text-xs gap-1.5 px-4 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t("versionHistoryPanel.restore")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("versionHistoryPanel.confirmRestoreTitle")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("versionHistoryPanel.exitComparison")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Comparison Content Body */}
        {viewMode === "split-editor" ? (
          // 1. Side-by-Side Editor Comparison (100% Editor WYSIWYG)
          <div className="flex-1 flex min-h-0 divide-x divide-border/60 overflow-hidden">
            {/* Left Column: Historical Snapshot in 100% Editor Styling */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/5">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/40 text-xs font-semibold text-muted-foreground shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-foreground font-bold truncate">
                    {t("versionHistoryPanel.historicalVersion")}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                    ({formattedVersionTime})
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {version.wordCount || countWords(version.content || "")} {isTh ? "คำ" : "words"}
                </span>
              </div>
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <NoteEditorPreview
                  content={version.content || ""}
                  title={version.title || noteTitle}
                  tags={note.tags}
                  format={version.contentFormat || note.contentFormat || "markdown"}
                  assetBlobUrlMap={assetBlobUrlMap?.current}
                  scrollRef={leftScrollRef}
                  onScroll={handleLeftScroll}
                  fontSize={editorFontSize}
                  className="h-full select-text"
                />
              </div>
            </div>

            {/* Right Column: Live Current Version in 100% Editor Styling */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/40 text-xs font-semibold text-muted-foreground shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-foreground font-bold">
                    {t("versionHistoryPanel.liveCurrentVersion")}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {countWords(note.content || "")} {isTh ? "คำ" : "words"}
                </span>
              </div>
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <NoteEditorPreview
                  content={note.content || ""}
                  title={note.title || noteTitle}
                  tags={note.tags}
                  format={note.contentFormat || "markdown"}
                  assetBlobUrlMap={assetBlobUrlMap?.current}
                  scrollRef={rightScrollRef}
                  onScroll={handleRightScroll}
                  fontSize={editorFontSize}
                  className="h-full select-text"
                />
              </div>
            </div>
          </div>
        ) : viewMode === "preview" ? (
          // 2. Full Historical Preview (100% Editor WYSIWYG)
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <NoteEditorPreview
              content={version.content || ""}
              title={version.title || noteTitle}
              tags={note.tags}
              format={version.contentFormat || note.contentFormat || "markdown"}
              assetBlobUrlMap={assetBlobUrlMap?.current}
              fontSize={editorFontSize}
              className="h-full select-text"
            />
          </div>
        ) : (
          // 4. Raw Code Diff (Monospace Line Diff)
          <div className="flex-1 flex min-h-0 divide-x divide-border/60 overflow-hidden font-mono text-xs">
            {/* Left Pane: Historical Snapshot */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-card/20">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[11px] font-sans font-semibold text-muted-foreground">
                <span>
                  {t("versionHistoryPanel.historicalVersion")} ({formattedVersionTime})
                </span>
                <span>
                  {version.wordCount || 0} {isTh ? "คำ" : "words"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5 select-text">
                {(version.content || "").split("\n").map((line, idx) => (
                  <div
                    key={`hist-${idx}`}
                    className="flex items-start gap-2 hover:bg-muted/30 py-0.5 px-1 rounded-sm leading-relaxed"
                  >
                    <span className="w-8 shrink-0 text-right text-muted-foreground/50 select-none text-[10.5px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all text-foreground/90">
                      {line || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane: Live Current Version with Diff Highlights */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[11px] font-sans font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t("versionHistoryPanel.liveCurrentVersion")}
                </span>
                <span>
                  {diffLines.length} {isTh ? "บรรทัด" : "lines"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5 select-text">
                {diffLines.map((line, idx) => {
                  const isAdded = line.type === "added";
                  const isRemoved = line.type === "removed";

                  return (
                    <div
                      key={`diff-${idx}`}
                      className={`flex items-start gap-2 py-0.5 px-1 rounded-sm leading-relaxed ${
                        isAdded
                          ? "bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border-l-2 border-emerald-500 font-medium"
                          : isRemoved
                          ? "bg-rose-500/15 text-rose-950 dark:text-rose-200 border-l-2 border-rose-500 opacity-70 line-through"
                          : "text-foreground/90 hover:bg-muted/30"
                      }`}
                    >
                      <span className="w-8 shrink-0 text-right text-muted-foreground/50 select-none text-[10.5px]">
                        {line.newLineNumber || line.oldLineNumber || ""}
                      </span>
                      <span className="w-4 shrink-0 select-none font-bold text-center">
                        {isAdded ? "+" : isRemoved ? "-" : " "}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{line.text || " "}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
