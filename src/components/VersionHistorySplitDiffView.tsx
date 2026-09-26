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
import { resolveNoteContentFormat, type NoteVersionSnapshot } from "@/lib/versionHistoryStorage";
import { computeLineDiff, summarizeDiff } from "@/lib/diffUtils";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { countWords } from "@/lib/wordCount";
import { parseFrontmatterAndTags } from "@/lib/frontmatter";
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

  const resolveFormat = (snapshotFormat?: string, targetNote?: Note | null): "markdown" | "html" | "plain" | "css" => {
    const fn = (targetNote?.fileName || version.title || "").toLowerCase();
    if (fn.endsWith(".css") || targetNote?.contentFormat === "css" || snapshotFormat === "css") return "css";
    if (fn.endsWith(".html") || fn.endsWith(".htm") || targetNote?.contentFormat === "html" || snapshotFormat === "html") return "html";
    if (fn.endsWith(".txt") || targetNote?.contentFormat === "plain" || snapshotFormat === "plain") return "plain";
    if (snapshotFormat === "markdown" || targetNote?.contentFormat === "markdown") return "markdown";
    return resolveNoteContentFormat(targetNote);
  };

  const historicalFormat = useMemo(
    () => resolveFormat(version.contentFormat, note),
    [version.contentFormat, note, version.title]
  );
  const liveFormat = useMemo(
    () => resolveFormat(note.contentFormat, note),
    [note]
  );

  const historicalTags = useMemo(() => {
    if (historicalFormat !== "markdown") return [];
    if (version.tags && version.tags.length > 0) return version.tags;
    if (version.content) {
      try {
        const parsed = parseFrontmatterAndTags(version.content);
        return parsed.allTags;
      } catch {
        /* ignore */
      }
    }
    return [];
  }, [historicalFormat, version.tags, version.content]);

  const liveTags = useMemo(() => {
    if (liveFormat !== "markdown") return [];
    if (note.tags && note.tags.length > 0) return note.tags;
    if (note.content) {
      try {
        const parsed = parseFrontmatterAndTags(note.content);
        return parsed.allTags;
      } catch {
        /* ignore */
      }
    }
    return [];
  }, [liveFormat, note.tags, note.content]);

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
      const timeLabel = formatSnapshotTime(version.timestamp);
      const triggerLabel =
        version.label ||
        (version.trigger === "manual"
          ? t("versionHistoryPanel.manualSnapshot") || (isTh ? "บันทึกด้วยตนเอง" : "Manual save")
          : version.trigger === "pre-restore"
          ? t("versionHistoryPanel.preRestoreBackup") || (isTh ? "สำรองก่อนกู้คืน" : "Pre-restore backup")
          : t("versionHistoryPanel.autoSnapshot") || (isTh ? "บันทึกอัตโนมัติ" : "Auto-save"));
      toast({
        title: t("versionHistoryPanel.contentCopied"),
        description: `${triggerLabel} • ${timeLabel}`,
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
        <div className="sticky top-0 z-30 flex h-10 items-center justify-between border-b border-border/40 bg-background px-3.5 shrink-0 select-none text-[12px] leading-tight text-muted-foreground min-w-0 w-full gap-2">
          {/* Diff Stats */}
          <div className="flex items-center gap-2.5 min-w-0 text-[11.5px] font-semibold">
            {summary.addedLines > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                +{summary.addedLines} {isTh ? "เพิ่ม" : "added"}
              </span>
            )}
            {summary.removedLines > 0 && (
              <span className="text-rose-600 dark:text-rose-400">
                -{summary.removedLines} {isTh ? "ลบ" : "removed"}
              </span>
            )}
            {summary.wordCountDiff !== 0 && (
              <span className="text-muted-foreground">
                {summary.wordCountDiff > 0 ? `+${summary.wordCountDiff}` : summary.wordCountDiff}{" "}
                {isTh ? "คำ" : "words"}
              </span>
            )}
            {summary.addedLines === 0 && summary.removedLines === 0 && summary.wordCountDiff === 0 && (
              <span className="text-muted-foreground text-[11px]">
                {isTh ? "ไม่มีการเปลี่ยนแปลง" : "No changes"}
              </span>
            )}
          </div>

          {/* Action Buttons & View Modes (Matching Breadcrumb / Template Preview Style) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-[11.5px] pl-1">
            {/* View Mode Toggle Group */}
            <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none">
              {/* 1. Side-by-Side Editor Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setViewMode("split-editor")}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 select-none ${
                      viewMode === "split-editor"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Columns2 className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {t("versionHistoryPanel.splitEditor") || (isTh ? "สองฝั่ง" : "Side-by-Side")}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  {t("versionHistoryPanel.splitEditor") || "Side-by-Side Editor Comparison (100% Editor WYSIWYG)"}
                </TooltipContent>
              </Tooltip>

              {/* 2. Full Preview Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 select-none ${
                      viewMode === "preview"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {t("versionHistoryPanel.preview") || (isTh ? "พรีวิว" : "Preview")}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  {t("versionHistoryPanel.preview") || "Full Historical Preview (100% Editor WYSIWYG)"}
                </TooltipContent>
              </Tooltip>

              {/* 4. Code Diff Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setViewMode("code-diff")}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 select-none ${
                      viewMode === "code-diff"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {t("versionHistoryPanel.codeDiff") || "Code Diff"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  {t("versionHistoryPanel.codeDiff") || "Raw Line-by-Line Code Diff"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sync Scroll Toggle (for Side-by-Side mode) - Matches Breadcrumb Read/Edit Toggle */}
            {viewMode === "split-editor" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSyncScroll(!syncScroll)}
                    className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                    aria-label={
                      syncScroll
                        ? isTh ? "ปิดการเลื่อนพร้อมกัน" : "Disable sync scroll"
                        : isTh ? "เปิดการเลื่อนพร้อมกัน" : "Enable sync scroll"
                    }
                  >
                    {syncScroll ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                    <span className="sr-only">
                      {syncScroll
                        ? isTh ? "ปิดการเลื่อนพร้อมกัน" : "Disable sync scroll"
                        : isTh ? "เปิดการเลื่อนพร้อมกัน" : "Enable sync scroll"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  {syncScroll
                    ? isTh ? "ปิดการเลื่อนพร้อมกัน" : "Disable sync scroll"
                    : isTh ? "เปิดการเลื่อนพร้อมกัน" : "Enable sync scroll"}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                  aria-label={t("versionHistoryPanel.copyContent")}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>{t("versionHistoryPanel.copyContent")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={() => onRestore(version)}
                  className="h-7 px-3 rounded-[10px] text-xs font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer shrink-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t("versionHistoryPanel.restore")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>{t("versionHistoryPanel.confirmRestoreTitle")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                  aria-label={t("common.close") || "Close"}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>{t("versionHistoryPanel.exitComparison")}</TooltipContent>
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
                  tags={historicalTags}
                  format={historicalFormat}
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
                  tags={liveTags}
                  format={liveFormat}
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
              tags={historicalTags}
              format={historicalFormat}
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
              <div
                ref={leftScrollRef}
                onScroll={handleLeftScroll}
                className="flex-1 overflow-y-auto p-3 space-y-0.5 select-text"
              >
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
              <div
                ref={rightScrollRef}
                onScroll={handleRightScroll}
                className="flex-1 overflow-y-auto p-3 space-y-0.5 select-text"
              >
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
