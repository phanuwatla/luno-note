import React, { useState, useEffect, useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  History,
  X,
  Plus,
  RotateCcw,
  Copy,
  Trash2,
  Columns2,
  Clock,
  Check,
  Sparkles,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/hooks/useNotes";
import {
  getNoteVersionHistory,
  saveVersionSnapshot,
  deleteVersionSnapshot,
  type NoteVersionSnapshot,
} from "@/lib/versionHistoryStorage";
import { countWords } from "@/lib/wordCount";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  currentWordCount?: number;
  currentCharCount?: number;
  onManualSnapshot?: () => NoteVersionSnapshot | null;
  onRestoreVersion: (version: NoteVersionSnapshot) => void;
  onCompareVersion: (version: NoteVersionSnapshot) => void;
}

function VersionHistoryPanelComponent({
  isOpen,
  onClose,
  note,
  currentWordCount,
  currentCharCount,
  onManualSnapshot,
  onRestoreVersion,
  onCompareVersion,
}: VersionHistoryPanelProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const { toast } = useToast();

  const [history, setHistory] = useState<NoteVersionSnapshot[]>([]);
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<NoteVersionSnapshot | null>(null);
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState<NoteVersionSnapshot | null>(null);
  const [copiedVersionId, setCopiedVersionId] = useState<string | null>(null);

  const isTh = settings.language === "th";
  const locale = isTh ? "th-TH" : "en-US";

  // Reload version history whenever note changes or panel opens
  useEffect(() => {
    if (isOpen && note?.id) {
      setHistory(getNoteVersionHistory(note.id));
    }
  }, [isOpen, note?.id, note?.updatedAt]);

  const handleManualSnapshot = () => {
    if (!note) return;
    const snap = onManualSnapshot
      ? onManualSnapshot()
      : saveVersionSnapshot(note, "manual", undefined, true, currentWordCount, currentCharCount);

    if (snap) {
      setHistory(getNoteVersionHistory(note.id));
      toast({
        title: t("versionHistoryPanel.snapshotSaved"),
      });
    } else {
      toast({
        title: t("versionHistoryPanel.snapshotSaved"),
        description: t("saveStatus.saved") || "Current state is already recorded.",
      });
    }
  };

  const handleConfirmRestore = () => {
    if (!confirmRestoreVersion || !note) return;
    // Auto-save backup before restore
    saveVersionSnapshot(note, "pre-restore");
    onRestoreVersion(confirmRestoreVersion);
    setConfirmRestoreVersion(null);
    setHistory(getNoteVersionHistory(note.id));
    toast({
      title: t("versionHistoryPanel.restoreSuccess"),
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteVersion || !note) return;
    const target = confirmDeleteVersion;
    deleteVersionSnapshot(note.id, target.id);
    setHistory(getNoteVersionHistory(note.id));
    setConfirmDeleteVersion(null);

    const timeLabel = formatSnapshotTime(target.timestamp);
    const triggerLabel =
      target.label ||
      (target.trigger === "manual"
        ? t("versionHistoryPanel.manualSnapshot") || (isTh ? "บันทึกแบบแมนนวล" : "Manual save")
        : target.trigger === "pre-restore"
        ? t("versionHistoryPanel.preRestoreBackup") || (isTh ? "สำรองก่อนกู้คืน" : "Pre-restore backup")
        : t("versionHistoryPanel.autoSnapshot") || (isTh ? "บันทึกอัตโนมัติ" : "Auto-save"));

    toast({
      title: t("versionHistoryPanel.deleteSuccess"),
      description: `${triggerLabel} • ${timeLabel}`,
    });
  };

  const handleCopy = async (ver: NoteVersionSnapshot, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ver.content || "");
      setCopiedVersionId(ver.id);
      toast({
        title: t("versionHistoryPanel.contentCopied"),
      });
      setTimeout(() => setCopiedVersionId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const formatSnapshotTime = (ts: number) => {
    return formatRelativeDateTime(ts, settings.dateFormat, settings.timeFormat, settings.language);
  };

  if (!note || !isOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="h-full w-[280px] shrink-0 border-l border-border bg-background flex flex-col select-none overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex h-11 items-center justify-between border-b border-border/50 px-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <History className="h-4 w-4 text-primary" />
          <span>{t("versionHistoryPanel.title")}</span>
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleManualSnapshot}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label={t("versionHistoryPanel.saveSnapshot")}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("versionHistoryPanel.saveSnapshot")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label={t("common.close") || "Close"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("common.close") || "Close"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Snapshot List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Current State Card */}
        <div className="rounded-xl border-[1.5px] border-primary/40 bg-primary/5 p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {t("versionHistoryPanel.currentVersion")}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {currentWordCount !== undefined ? currentWordCount : countWords(note.content || "")} {isTh ? "คำ" : "words"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {formatSnapshotTime(note.updatedAt || Date.now())}
          </p>
        </div>

        {/* History Items */}
        {history.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <div className="px-1 text-[11px] font-semibold text-muted-foreground">
              {isTh ? "เวอร์ชันที่บันทึกไว้" : "Saved Versions"} ({history.length})
            </div>

            {history.map((ver) => {
              const isCopied = copiedVersionId === ver.id;
              const triggerLabel =
                ver.trigger === "manual"
                  ? t("versionHistoryPanel.manualSnapshot")
                  : ver.trigger === "pre-restore"
                  ? t("versionHistoryPanel.preRestoreBackup")
                  : t("versionHistoryPanel.autoSnapshot");

              return (
                <div
                  key={ver.id}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onCompareVersion(ver);
                    }
                  }}
                  onClick={() => onCompareVersion(ver)}
                  className="group relative rounded-xl border-[1.5px] border-border/40 hover:border-primary/60 focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 hover:bg-muted/50 p-2.5 transition-all cursor-pointer hover:shadow-2xs outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {formatSnapshotTime(ver.timestamp)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {ver.wordCount || 0} {isTh ? "คำ" : "words"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                      {triggerLabel}
                    </span>

                    {/* Action buttons on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompareVersion(ver);
                            }}
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors [&_svg]:size-3.5 cursor-pointer"
                          >
                            <Columns2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("versionHistoryPanel.compare")}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleCopy(ver, e)}
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("versionHistoryPanel.copyContent")}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmRestoreVersion(ver);
                            }}
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors [&_svg]:size-3.5 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("versionHistoryPanel.restore")}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteVersion(ver);
                            }}
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors [&_svg]:size-3.5 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("versionHistoryPanel.deleteVersion")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center px-4 space-y-2">
            <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-foreground">
              {t("versionHistoryPanel.noVersions")}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("versionHistoryPanel.noVersionsDesc")}
            </p>
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={Boolean(confirmRestoreVersion)} onOpenChange={(open) => !open && setConfirmRestoreVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("versionHistoryPanel.confirmRestoreTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("versionHistoryPanel.confirmRestoreDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore} className="bg-primary text-primary-foreground">
              {t("versionHistoryPanel.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={Boolean(confirmDeleteVersion)} onOpenChange={(open) => !open && setConfirmDeleteVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("versionHistoryPanel.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.deleteConfirm") || "Are you sure you want to delete this version snapshot?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-600 text-white hover:bg-rose-700">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.aside>
  );
}

export default memo(VersionHistoryPanelComponent);
