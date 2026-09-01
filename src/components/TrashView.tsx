import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Trash2,
  Search,
  RotateCcw,
  Files,
  Clock,
  PieChart,
  Filter,
  MoreHorizontal,
  Folder,
  FileText,
  FileCode,
  FileImage,
  Check,
  X,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { TrashedNote, formatByteSize } from "@/hooks/useTrash";
import { renderCustomIcon } from "@/lib/iconPacks";
import { formatDate } from "@/lib/dateTimeFormatter";
import { getTagColorClass } from "@/lib/tagColors";

interface TrashViewProps {
  trashedNotes: TrashedNote[];
  onRestore: (ids: string[]) => void;
  onDeletePermanently: (ids: string[]) => void;
  onEmptyTrash: () => void;
  onOpenSettings?: () => void;
}

// Custom Editor Checkbox - Matches Editor TaskList Checkbox exactly (14px, 1.5px border, rounded-[3px], checkmark/minus)
function EditorCheckbox({
  checked,
  onChange,
  className = "",
}: {
  checked: boolean | "indeterminate";
  onChange?: () => void;
  className?: string;
}) {
  const isChecked = checked === true;
  const isIndeterminate = checked === "indeterminate";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      className={`relative inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] transition-colors cursor-pointer select-none outline-none ${
        isChecked || isIndeterminate
          ? "bg-primary border border-primary text-primary-foreground"
          : "bg-transparent border-[1.5px] border-muted-foreground/50 hover:border-primary"
      } ${className}`}
    >
      {isChecked && (
        <svg
          className="w-2.5 h-2.5 text-white"
          viewBox="0 0 16 16"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      )}
      {isIndeterminate && (
        <svg
          className="w-2.5 h-2.5 text-white"
          viewBox="0 0 16 16"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="3.5" y1="8" x2="12.5" y2="8" />
        </svg>
      )}
    </button>
  );
}

export default function TrashView({
  trashedNotes,
  onRestore,
  onDeletePermanently,
  onEmptyTrash,
  onOpenSettings,
}: TrashViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "md" | "txt" | "html" | "other">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] = useState(false);
  const [deletePermanentDialogOpen, setDeletePermanentDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global Ctrl+F / Ctrl+K handler to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "k" || e.code === "KeyF" || e.code === "KeyK" || e.key === "า" || e.key === "ด")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const retentionDays = settings.trashRetentionDays ?? 30;

  // Compute expiration days remaining for a given trashed item
  const getExpirationInfo = (deletedAt: number) => {
    if (retentionDays <= 0) {
      return { days: -1, text: isTh ? "ไม่ลบอัตโนมัติ" : "Never", colorClass: "text-muted-foreground" };
    }
    const msPassed = Date.now() - (deletedAt || Date.now());
    const totalMs = retentionDays * 24 * 60 * 60 * 1000;
    const msRemaining = totalMs - msPassed;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    if (daysRemaining === 0) {
      return { days: 0, text: isTh ? "หมดอายุแล้ว" : "Expired", colorClass: "text-rose-600 dark:text-rose-400 font-medium" };
    }
    if (daysRemaining <= 5) {
      return { days: daysRemaining, text: isTh ? `${daysRemaining} วัน` : `${daysRemaining} days`, colorClass: "text-rose-600 dark:text-rose-400 font-medium" };
    }
    if (daysRemaining <= 10) {
      return { days: daysRemaining, text: isTh ? `${daysRemaining} วัน` : `${daysRemaining} days`, colorClass: "text-amber-600 dark:text-amber-400 font-medium" };
    }
    return { days: daysRemaining, text: isTh ? `${daysRemaining} วัน` : `${daysRemaining} days`, colorClass: "text-emerald-600 dark:text-emerald-400 font-medium" };
  };

  // Format relative deleted timestamp (e.g. Today 10:24, Yesterday 16:40, 2 days ago)
  const formatDeletedTime = (timestamp: number) => {
    if (!timestamp) return "-";
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    if (isToday) {
      return isTh ? `วันนี้ ${timeStr}` : `Today ${timeStr}`;
    }
    if (isYesterday) {
      return isTh ? `เมื่อวาน ${timeStr}` : `Yesterday ${timeStr}`;
    }

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > 0 && diffDays < 30) {
      return isTh ? `${diffDays} วันที่แล้ว` : `${diffDays} days ago`;
    }

    return `${formatDate(date, settings.dateFormat)} ${timeStr}`;
  };

  // Filter and search notes/files
  const filteredNotes = useMemo(() => {
    return trashedNotes.filter((note) => {
      // Type filter
      if (filterType !== "all") {
        const name = (note.fileName || "").toLowerCase();
        if (filterType === "md" && !name.endsWith(".md") && !name.endsWith(".markdown")) return false;
        if (filterType === "txt" && !name.endsWith(".txt")) return false;
        if (filterType === "html" && !name.endsWith(".html") && !name.endsWith(".htm")) return false;
        if (filterType === "other") {
          const isDoc = name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt") || name.endsWith(".html") || name.endsWith(".htm");
          if (isDoc) return false;
        }
      }

      // Query search
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const titleMatch = (note.title || "").toLowerCase().includes(q);
      const fileMatch = (note.fileName || "").toLowerCase().includes(q);
      const folderMatch = (note.folderPath || "").toLowerCase().includes(q);
      const tagMatch = (note.tags || []).some((t) => t.toLowerCase().includes(q));
      const contentMatch = (note.content || "").toLowerCase().includes(q);

      return titleMatch || fileMatch || folderMatch || tagMatch || contentMatch;
    });
  }, [trashedNotes, filterType, query]);

  // Total storage metrics
  const totalStorageBytes = useMemo(() => {
    return trashedNotes.reduce((acc, n) => acc + (n.size || 0), 0);
  }, [trashedNotes]);

  // Select all / Deselect all
  const allFilteredSelected = filteredNotes.length > 0 && filteredNotes.every((n) => selectedIds.includes(n.id));
  const someFilteredSelected = filteredNotes.some((n) => selectedIds.includes(n.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredNotes.map((n) => n.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIdSet = new Set(filteredNotes.map((n) => n.id));
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIdSet])));
    }
  };

  const handleToggleSelectRow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Restore actions
  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    onRestore(selectedIds);
    setSelectedIds([]);
  };

  const handleRestoreAll = () => {
    if (trashedNotes.length === 0) return;
    onRestore(trashedNotes.map((n) => n.id));
    setSelectedIds([]);
  };

  // Permanent delete actions
  const handlePromptDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setPendingDeleteIds(selectedIds);
    setDeletePermanentDialogOpen(true);
  };

  const handleConfirmPermanentDelete = () => {
    if (pendingDeleteIds.length > 0) {
      onDeletePermanently(pendingDeleteIds);
      setSelectedIds((prev) => prev.filter((id) => !pendingDeleteIds.includes(id)));
      setPendingDeleteIds([]);
    }
    setDeletePermanentDialogOpen(false);
  };

  const renderNoteIcon = (note: TrashedNote, cls = "h-4 w-4 shrink-0") => {
    if (note.icon) {
      const custom = renderCustomIcon(note.icon, cls, { color: note.iconColor });
      if (custom) return custom;
    }
    const name = (note.fileName || "").toLowerCase();
    if (name.endsWith(".md") || name.endsWith(".markdown")) {
      return <FileText className={`${cls} text-muted-foreground/80`} />;
    }
    if (name.endsWith(".txt")) {
      return <FileText className={`${cls} text-muted-foreground/80`} />;
    }
    if (name.endsWith(".html") || name.endsWith(".htm")) {
      return <FileCode className={`${cls} text-muted-foreground/80`} />;
    }
    if (note.fileType === "image" || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)) {
      return <FileImage className={`${cls} text-muted-foreground/80`} />;
    }
    return <FileText className={`${cls} text-muted-foreground/80`} />;
  };

  const getNoteSnippet = (content?: string) => {
    if (!content) return "";
    const clean = content
      .replace(/^---[\s\S]*?---/, "")
      .replace(/[#*`_~>[\]()!-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean.slice(0, 90);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full overflow-hidden bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5 h-full min-h-0 overflow-hidden">
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-primary shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
                  {t("trash.title") || (isTh ? "ถังขยะ" : "Trash")}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {retentionDays > 0
                  ? (isTh
                      ? `ไฟล์ในถังขยะจะถูกลบถาวรโดยอัตโนมัติหลังจาก ${retentionDays} วัน`
                      : `Files in trash are permanently deleted after ${retentionDays} days.`)
                  : (isTh
                      ? "ไฟล์ในถังขยะจะถูกเก็บไว้จนกว่าคุณจะลบด้วยตัวเอง"
                      : "Files in trash will be kept until manually deleted.")}
              </p>
            </div>

            {/* Functional Search Input Box & Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full sm:w-56 md:w-64 transition-all shadow-none group">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  ref={searchInputRef}
                  data-trash-search="true"
                  type="text"
                  placeholder={t("trash.searchPlaceholder") || (isTh ? "ค้นหาในถังขยะ..." : "Search in trash...")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Action Buttons Group (matching sidebar sort/open/+ style) */}
              <div className="flex items-center gap-1">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-md shrink-0 transition-colors bg-transparent focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent ${
                            filterType !== "all"
                              ? "text-primary hover:text-primary hover:bg-sidebar-accent/50"
                              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                          }`}
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t("trash.filterTooltip") || (isTh ? "กรองตามประเภท" : "Filter files")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-md text-xs">
                    <DropdownMenuItem
                      onClick={() => setFilterType("all")}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                        filterType === "all" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        {filterType === "all" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterAll") || (isTh ? "ไฟล์ทั้งหมด" : "All items")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("md")}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                        filterType === "md" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        {filterType === "md" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterMd") || "Markdown (.md)"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("txt")}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                        filterType === "txt" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        {filterType === "txt" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterTxt") || (isTh ? "ข้อความ (.txt)" : "Text (.txt)")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("html")}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                        filterType === "html" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        {filterType === "html" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterHtml") || "HTML (.html)"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("other")}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                        filterType === "other" ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        {filterType === "other" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterOther") || (isTh ? "ไฟล์อื่นๆ" : "Other files")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* More Action Menu */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent bg-transparent focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent shrink-0 transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t("trash.moreOptions") || (isTh ? "ตัวเลือกเพิ่มเติม" : "More options")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md text-xs">
                    <DropdownMenuItem
                      disabled={trashedNotes.length === 0}
                      onClick={handleRestoreAll}
                      className="gap-2 py-1.5 px-2 rounded-lg cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{isTh ? "กู้คืนไฟล์ทั้งหมด" : "Restore all files"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={trashedNotes.length === 0}
                      onClick={() => setEmptyTrashDialogOpen(true)}
                      className="gap-2 py-1.5 px-2 rounded-lg text-rose-600 dark:text-rose-400 focus:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t("trash.emptyTrash") || (isTh ? "ล้างถังขยะ" : "Empty trash")}</span>
                    </DropdownMenuItem>
                    {onOpenSettings && (
                      <>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          onClick={onOpenSettings}
                          className="gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-foreground hover:text-foreground"
                        >
                          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{isTh ? "ตั้งค่าถังขยะ" : "Settings"}</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* 2. Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* Card 1: Files in Trash */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs hover:border-primary/60 hover:bg-muted/50 transition-all">
              <Files className="h-5 w-5 text-foreground/80 shrink-0 stroke-[1.8]" />
              <div className="min-w-0 truncate">
                <div className="text-sm font-bold text-foreground leading-tight truncate">{trashedNotes.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{isTh ? "ไฟล์ในถังขยะ" : "Files in trash"}</div>
              </div>
            </div>

            {/* Card 2: Auto Delete Duration */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs hover:border-primary/60 hover:bg-muted/50 transition-all">
              <Clock className="h-5 w-5 text-foreground/80 shrink-0 stroke-[1.8]" />
              <div className="min-w-0 truncate">
                <div className="text-sm font-bold text-foreground leading-tight truncate">
                  {retentionDays > 0 ? (isTh ? `${retentionDays} วัน` : `${retentionDays} days`) : (isTh ? "ไม่ลบอัตโนมัติ" : "Never")}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{isTh ? "ลบอัตโนมัติ" : "Auto delete"}</div>
              </div>
            </div>

            {/* Card 3: Storage Used */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs hover:border-primary/60 hover:bg-muted/50 transition-all">
              <PieChart className="h-5 w-5 text-foreground/80 shrink-0 stroke-[1.8]" />
              <div className="min-w-0 truncate">
                <div className="text-sm font-bold text-foreground leading-tight truncate">{formatByteSize(totalStorageBytes)}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{isTh ? "พื้นที่ที่ใช้" : "Storage used"}</div>
              </div>
            </div>
          </div>

          {/* 3. Table Container (Full Width) */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden w-full">
            <div className="flex flex-1 flex-col rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden min-w-0">
              {/* Table Header with Grayish Background (like Editor table) */}
              <div className="flex items-center px-4 py-2.5 bg-muted/60 dark:bg-muted/40 border-b border-border/50 text-xs font-semibold text-foreground shrink-0 select-none min-w-0">
                <div className="w-6 flex items-center justify-center shrink-0">
                  <EditorCheckbox
                    checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                    onChange={handleToggleSelectAll}
                  />
                </div>
                <div className="flex-1 min-w-[140px] px-2 truncate">{isTh ? "ไฟล์" : "File"}</div>
                <div className="w-44 lg:w-56 hidden md:block px-2 shrink-0 truncate">{isTh ? "ตำแหน่งเดิม" : "Original Location"}</div>
                <div className="w-28 hidden sm:block px-2 shrink-0 truncate">{isTh ? "วันที่ลบ" : "Deleted"}</div>
                <div className="w-24 hidden lg:block px-2 shrink-0 truncate">{isTh ? "ขนาด" : "Size"}</div>
                <div className="w-24 px-2 text-right sm:text-left shrink-0">{isTh ? "หมดอายุใน" : "Expires in"}</div>
              </div>

              {/* Table Body (Scrollable rows) */}
              <div className="no-scrollbar flex-1 overflow-y-auto divide-y divide-border/20 min-w-0">
                {filteredNotes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <Trash2 className="h-8 w-8 text-muted-foreground/40 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-foreground">
                      {trashedNotes.length === 0 ? (isTh ? "ถังขยะว่างเปล่า" : "Trash is empty") : (isTh ? "ไม่พบไฟล์ที่ค้นหา" : "No files found")}
                    </p>
                    <p className="text-[11px] text-muted-foreground/75 mt-0.5 max-w-xs">
                      {trashedNotes.length === 0
                        ? (isTh ? "ไฟล์ที่ถูกลบจะปรากฏที่นี่ก่อนถูกลบถาวร" : "Deleted files will appear here before being permanently removed.")
                        : (isTh ? "ลองค้นหาด้วยคำค้นหาอื่นหรือรีเซ็ตตัวกรอง" : "Try searching with a different keyword or clearing filters.")}
                    </p>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const isSelected = selectedIds.includes(note.id);
                    const exp = getExpirationInfo(note.deletedAt);
                    const snippet = getNoteSnippet(note.content);
                    const originalLoc = note.originalFolderPath || note.folderPath || (isTh ? "หน้าหลัก" : "Root");

                    return (
                      <div
                        key={note.id}
                        onClick={() => handleToggleSelectRow(note.id)}
                        className={`group flex items-center px-4 py-2.5 text-xs transition-colors cursor-pointer min-w-0 ${
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20 text-foreground"
                            : "hover:bg-muted/30 text-foreground/90"
                        }`}
                      >
                        {/* Checkbox styled identical to Editor */}
                        <div className="w-6 flex items-center justify-center shrink-0">
                          <EditorCheckbox
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(note.id)}
                          />
                        </div>

                        {/* Note Info: Icon + Title + Tag Pill + Snippet */}
                        <div className="flex-1 min-w-[140px] px-2 flex items-center gap-2.5 overflow-hidden">
                          <div className="shrink-0">
                            {renderNoteIcon(note, "h-4 w-4")}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {note.title || note.fileName || (isTh ? "ไม่มีชื่อ" : "Untitled")}
                              </span>
                              {note.tags && note.tags.length > 0 && (
                                note.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={tag}
                                    className={`shrink-0 text-[9.5px] px-1.5 py-0.2 rounded font-medium border ${getTagColorClass(
                                      tag,
                                      settings.theme,
                                      idx,
                                      settings.tagColorStyle
                                    )}`}
                                  >
                                    {tag}
                                  </span>
                                ))
                              )}
                            </div>
                            {snippet && (
                              <p className="text-[11px] text-muted-foreground/75 truncate mt-0.5 font-normal leading-tight">
                                {snippet}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Original Location (without >) */}
                        <div className="w-44 lg:w-56 hidden md:flex items-center gap-1.5 px-2 text-muted-foreground overflow-hidden shrink-0">
                          <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate text-xs font-normal" title={originalLoc}>
                            {originalLoc}
                          </span>
                        </div>

                        {/* Deleted Timestamp */}
                        <div className="w-28 hidden sm:block px-2 text-muted-foreground text-xs truncate font-normal shrink-0">
                          {formatDeletedTime(note.deletedAt)}
                        </div>

                        {/* Size */}
                        <div className="w-24 hidden lg:block px-2 text-muted-foreground text-xs font-normal shrink-0">
                          {formatByteSize(note.size || 0)}
                        </div>

                        {/* Expires In */}
                        <div className="w-24 px-2 text-right sm:text-left shrink-0">
                          <span className={`text-xs ${exp.colorClass}`}>
                            {exp.text}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Table Bottom Action Bar (Fixed height to prevent layout shift) */}
              <div className="flex items-center justify-between px-4 min-h-[52px] border-t border-border/50 text-xs text-muted-foreground shrink-0 min-w-0 bg-card">
                <div className="flex items-center gap-3 min-w-0 truncate">
                  <span className="font-medium text-foreground shrink-0">
                    {isTh ? `เลือก ${selectedIds.length} รายการ` : `${selectedIds.length} selected`}
                  </span>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleRestoreSelected}
                        className="px-4 py-2.5 rounded-xl border border-border/80 bg-background hover:bg-accent hover:text-white text-foreground text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>{isTh ? "กู้คืน" : "Restore"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePromptDeleteSelected}
                        className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{isTh ? "ลบถาวร" : "Delete permanently"}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground shrink-0">
                  {isTh ? `ทั้งหมด ${filteredNotes.length} รายการ` : `${filteredNotes.length} items`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog: Delete Permanently */}
        <AlertDialog open={deletePermanentDialogOpen} onOpenChange={setDeletePermanentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("trash.deletePermanentTitle") || (isTh ? "ลบไฟล์อย่างถาวรหรือไม่?" : "Delete file permanently?")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteIds.length === 1
                  ? (t("trash.deletePermanentDesc") || (isTh ? "ไฟล์นี้จะถูกลบออกจากเครื่องอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้" : "This file will be permanently deleted and cannot be recovered."))
                  : (t("trash.deletePermanentBatchDesc", { count: pendingDeleteIds.length }) || (isTh ? `ไฟล์ที่เลือกจำนวน ${pendingDeleteIds.length} รายการจะถูกลบอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้` : `These ${pendingDeleteIds.length} files will be permanently deleted and cannot be recovered.`))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel") || (isTh ? "ยกเลิก" : "Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                onClick={handleConfirmPermanentDelete}
              >
                {t("common.delete") || (isTh ? "ลบ" : "Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmation Dialog: Empty Trash */}
        <AlertDialog open={emptyTrashDialogOpen} onOpenChange={setEmptyTrashDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("trash.emptyTrashTitle") || (isTh ? "ล้างถังขยะทั้งหมดหรือไม่?" : "Empty all trash?")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("trash.emptyTrashDesc", { count: trashedNotes.length }) || (isTh ? `ไฟล์ทั้งหมดที่อยู่ในถังขยะจะถูกลบอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้` : `All files in the trash will be permanently deleted. This action cannot be undone.`)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel") || (isTh ? "ยกเลิก" : "Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                onClick={() => {
                  onEmptyTrash();
                  setSelectedIds([]);
                  setEmptyTrashDialogOpen(false);
                }}
              >
                {t("common.delete") || (isTh ? "ลบ" : "Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
