import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  X,
  RotateCcw,
  Copy,
  Check,
  Clock,
  Columns2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/hooks/useNotes";
import { computeLineDiff, summarizeDiff } from "@/lib/diffUtils";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { marked } from "marked";
import { preprocessMarkdownForEditor } from "@/components/Editor";

interface VersionHistorySplitDiffViewProps {
  note: Note;
  version: NoteVersionSnapshot;
  editorFontSize?: number;
  assetBlobUrlMap?: React.MutableRefObject<Map<string, string>>;
  resolveAssetDataUrl?: (assetPath: string) => Promise<string | null>;
  onRestore: (version: NoteVersionSnapshot) => void;
  onClose: () => void;
}

const EDITOR_CLASSES =
  "w-full max-w-full break-words [overflow-wrap:anywhere] outline-none text-foreground" +
  " [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)]" +
  " [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1:first-child]:text-2xl [&>h1:first-child]:font-semibold [&>h1:first-child]:leading-tight [&>h1:first-child]:md:text-3xl" +
  " [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4" +
  " [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4" +
  " [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_h1]:my-2" +
  " [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:my-2" +
  " [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-1.5" +
  " [&_h4]:text-base [&_h4]:font-semibold [&_h4]:my-1" +
  " [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:my-1" +
  " [&_h6]:text-xs [&_h6]:font-semibold [&_h6]:text-muted-foreground [&_h6]:my-1" +
  " [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:shadow-xs [&_img]:border [&_img]:border-border/30" +
  " [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6" +
  " [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6" +
  " [&_p]:my-0 [&_p]:min-h-[1.5em] [&_p]:leading-relaxed" +
  " [&_details]:my-0 [&_details]:py-0 [&_details_summary]:my-0 [&_details_summary]:py-0" +
  " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-0 [&_ul[data-type='taskList']_li_label]:w-6 [&_ul[data-type='taskList']_li_label]:h-7 [&_ul[data-type='taskList']_li_label]:shrink-0 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:justify-center [&_ul[data-type='taskList']_li_label_input]:h-[14px] [&_ul[data-type='taskList']_li_label_input]:w-[14px] [&_ul[data-type='taskList']_li_label_input]:bg-transparent [&_ul[data-type='taskList']_li_label_input]:rounded-[3px] [&_ul[data-type='taskList']_li_label_input]:border [&_ul[data-type='taskList']_li_label_input]:border-muted-foreground/50 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0 [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:text-muted-foreground/90" +
  " [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:my-4 [&_table]:my-0 [&_table]:w-[70%] max-md:[&_table]:w-full [&_td]:border [&_td]:border-border/60 [&_td]:py-2 [&_td]:px-3 [&_td]:relative [&_th]:border [&_th]:border-border/60 [&_th]:py-2 [&_th]:px-3 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left [&_td_p]:my-0 [&_td_p]:leading-normal [&_th_p]:my-0 [&_th_p]:leading-normal" +
  " [&_.footnote-ref]:text-primary [&_.footnote-ref]:no-underline hover:[&_.footnote-ref]:underline [&_.footnote-ref]:font-medium [&_.footnote-ref]:cursor-pointer [&_sup]:text-[0.75em] [&_sup]:leading-none [&_sup]:align-super [&_sub]:text-[0.75em] [&_sub]:leading-none [&_sub]:align-sub [&_.footnote-def]:text-sm [&_.footnote-def]:text-muted-foreground [&_.footnote-def]:my-1 [&_.footnote-backref]:text-primary [&_.footnote-backref]:no-underline hover:[&_.footnote-backref]:underline [&_.footnote-backref]:font-medium [&_.footnote-backref]:cursor-pointer";

export default function VersionHistorySplitDiffView({
  note,
  version,
  editorFontSize = 15,
  assetBlobUrlMap,
  resolveAssetDataUrl,
  onRestore,
  onClose,
}: VersionHistorySplitDiffViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"split-diff" | "preview">("split-diff");
  const [resolvedImagesHtml, setResolvedImagesHtml] = useState<string>("");
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const isTh = settings.language === "th";
  const locale = isTh ? "th-TH" : "en-US";

  const formattedVersionTime = useMemo(() => {
    return formatRelativeDateTime(version.timestamp, settings.dateFormat, settings.timeFormat, settings.language);
  }, [version.timestamp, settings.dateFormat, settings.timeFormat, settings.language]);

  const diffLines = useMemo(() => {
    return computeLineDiff(version.content, note.content || "");
  }, [version.content, note.content]);

  const summary = useMemo(() => {
    return summarizeDiff(version.content, note.content || "");
  }, [version.content, note.content]);

  const noteTitle = useMemo(() => {
    return version.title || note.title || note.fileName || "";
  }, [version.title, note.title, note.fileName]);

  const hasH1AtStart = useMemo(() => {
    const trimmed = (version.content || "").trim();
    return trimmed.startsWith("# ") || /^<h1[\s>]/i.test(trimmed);
  }, [version.content]);

  // Compute parsed HTML using the exact same preprocessor as Note Editor
  const baseParsedHtml = useMemo(() => {
    const rawContent = version.content || "";
    const format = version.contentFormat || note.contentFormat || "markdown";

    if (format === "html") {
      return rawContent;
    }
    if (format === "plain") {
      const lines = rawContent.split("\n");
      return lines.map((l) => `<p>${l ? l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "<br>"}</p>`).join("");
    }

    try {
      const textWithTableAttr = rawContent.replace(/<table([\s>])/gi, '<table data-original-html-table="true"$1');
      const preprocessed = preprocessMarkdownForEditor(textWithTableAttr, true);
      const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true });
      const html = typeof parsed === "string" ? parsed : rawContent;

      // Ensure empty paragraphs have <br> so empty lines preserve full line height
      return html.replace(/<p>\s*<\/p>/g, "<p><br></p>");
    } catch {
      return rawContent;
    }
  }, [version.content, version.contentFormat, note.contentFormat]);

  // Resolve relative image URLs (e.g. ../../attachments/part1_1.jpg) to blob URLs
  useEffect(() => {
    let isCancelled = false;

    const resolveImages = async () => {
      if (typeof document === "undefined") {
        setResolvedImagesHtml(baseParsedHtml);
        return;
      }

      const temp = document.createElement("div");
      temp.innerHTML = baseParsedHtml;

      const imgs = Array.from(temp.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.getAttribute("src") || "";
        if (src && !/^(https?:\/\/|data:|blob:)/i.test(src)) {
          let encodedRel = src;
          try {
            encodedRel = encodeURI(decodeURI(src));
          } catch {
            encodedRel = src.replace(/ /g, "%20");
          }
          let decodedRel = src;
          try {
            decodedRel = decodeURIComponent(src);
          } catch {}

          let blobUrl =
            assetBlobUrlMap?.current?.get(encodedRel) ||
            assetBlobUrlMap?.current?.get(decodedRel) ||
            assetBlobUrlMap?.current?.get(src);

          if (!blobUrl && resolveAssetDataUrl) {
            try {
              const resolved = await resolveAssetDataUrl(src);
              if (resolved) {
                blobUrl = resolved;
                assetBlobUrlMap?.current?.set(encodedRel, blobUrl);
                assetBlobUrlMap?.current?.set(decodedRel, blobUrl);
                assetBlobUrlMap?.current?.set(blobUrl, encodedRel);
              }
            } catch (err) {
              console.warn("Failed to resolve asset in version preview:", src, err);
            }
          }

          if (blobUrl) {
            img.setAttribute("src", blobUrl);
          }
        }
      }

      if (!isCancelled) {
        setResolvedImagesHtml(temp.innerHTML);
      }
    };

    void resolveImages();

    return () => {
      isCancelled = true;
    };
  }, [baseParsedHtml, assetBlobUrlMap, resolveAssetDataUrl]);

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
                  {summary.wordCountDiff > 0 ? `+${summary.wordCountDiff}` : summary.wordCountDiff} {isTh ? "คำ" : "words"}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-xs border border-border/40 mr-1">
              <button
                type="button"
                onClick={() => setViewMode("split-diff")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  viewMode === "split-diff"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Columns2 className="h-3 w-3" />
                <span className="hidden md:inline">Diff</span>
              </button>
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
                <span className="hidden md:inline">{isTh ? "ตัวอย่าง" : "Preview"}</span>
              </button>
            </div>

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
        {viewMode === "preview" ? (
          <div ref={previewContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden w-full select-text bg-background">
            <div
              className={`editor-content-area flex w-full min-w-0 flex-col ${
                settings.editorWidth === "compact"
                  ? "max-w-2xl"
                  : settings.editorWidth === "full"
                  ? "max-w-none"
                  : "max-w-4xl"
              } px-4 pt-6 pb-12 sm:px-6 sm:pt-8 md:px-8 md:pt-10 lg:px-12 lg:pt-12 mx-auto min-h-full ${
                settings.showCodeLineNumbers ? "show-code-line-numbers" : ""
              }`}
              style={{
                fontFamily: "var(--editor-font-family, var(--app-font-family))",
                fontSize: `${editorFontSize}px`,
                lineHeight: settings.lineHeight === "1.4" ? 1.4 : settings.lineHeight === "1.8" ? 1.8 : 1.6,
              }}
            >
              {/* Note Title if not in Markdown body */}
              {!hasH1AtStart && noteTitle && (
                <div className="mb-4 pb-2 border-b border-border/30">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {noteTitle.replace(/\.(md|txt|html)$/i, "")}
                  </h1>
                </div>
              )}

              {/* Tags if present */}
              {note.tags && note.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rendered Note Content matching the live Note */}
              <div
                className={`luno-reading-view luno-editor-content ${EDITOR_CLASSES} ${
                  settings.accentHeadings ? "accent-headings" : ""
                }`}
                style={{
                  fontFamily: "var(--editor-font-family, var(--app-font-family))",
                }}
                dangerouslySetInnerHTML={{ __html: resolvedImagesHtml || baseParsedHtml }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 divide-x divide-border/60 overflow-hidden font-mono text-xs">
            {/* Left Pane: Historical Snapshot */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-card/20">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[11px] font-sans font-semibold text-muted-foreground">
                <span>{t("versionHistoryPanel.historicalVersion")} ({formattedVersionTime})</span>
                <span>{version.wordCount || 0} {isTh ? "คำ" : "words"}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5 select-text">
                {(version.content || "").split("\n").map((line, idx) => (
                  <div key={`hist-${idx}`} className="flex items-start gap-2 hover:bg-muted/30 py-0.5 px-1 rounded-sm leading-relaxed">
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
                <span>{diffLines.length} {isTh ? "บรรทัด" : "lines"}</span>
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
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {line.text || " "}
                      </span>
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
