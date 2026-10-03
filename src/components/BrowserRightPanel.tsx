import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Search,
  Trash2,
  Globe,
  Clock,
  Star,
  Copy,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Cookie,
  Database,
  RefreshCw,
  FilePlus2,
  Lock,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getToolbarIcon } from "@/lib/iconPacks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { toast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboardUtils";
import { formatTime } from "@/lib/dateTimeFormatter";
import { getFaviconCandidates } from "@/lib/faviconUtils";
import {
  BrowserHistoryItem,
  BrowserBookmarkItem,
  getBrowserHistory,
  removeBrowserHistoryItem,
  clearBrowserHistory,
  getBrowserBookmarks,
  toggleBrowserBookmark,
  removeBrowserBookmark,
  isBookmarked,
} from "@/lib/browserStorage";

interface BrowserRightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  pageTitle?: string;
  favicon?: string;
  onNavigate: (url: string) => void;
  onReload?: () => void;
  onHardReload?: () => void;
  zoomFactor?: number;
  onZoomChange?: (zoom: number) => void;
  webviewRef?: React.RefObject<any>;
  onOpenExternal?: () => void;
  onInsertToNote?: () => void;
  hasActiveNotes?: boolean;
}

function getHostName(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:") || url.includes("luno-preview")) {
    return "Local Preview";
  }
  try {
    const formatted = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(formatted);
    return parsed.hostname || url;
  } catch {
    return url;
  }
}

export default function BrowserRightPanel({
  isOpen,
  onClose,
  currentUrl,
  pageTitle,
  favicon,
  onNavigate,
  onReload,
  onHardReload,
  zoomFactor = 0.9,
  onZoomChange,
  webviewRef,
  onOpenExternal,
  onInsertToNote,
  hasActiveNotes = false,
}: BrowserRightPanelProps) {
  const { t, language } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = language === "th";
  const pack = settings?.iconPack || "lucide";

  const [activeTab, setActiveTab] = useState<"history" | "bookmarks" | "privacy">("history");
  const [historyItems, setHistoryItems] = useState<BrowserHistoryItem[]>(() => getBrowserHistory());
  const [bookmarks, setBookmarks] = useState<BrowserBookmarkItem[]>(() => getBrowserBookmarks());
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [clearAllDataDialogOpen, setClearAllDataDialogOpen] = useState(false);

  // Sync history and bookmarks when storage events occur
  useEffect(() => {
    const syncHistory = () => setHistoryItems(getBrowserHistory());
    const syncBookmarks = () => setBookmarks(getBrowserBookmarks());

    window.addEventListener("luno:browser-history-updated", syncHistory);
    window.addEventListener("luno:browser-bookmarks-updated", syncBookmarks);
    return () => {
      window.removeEventListener("luno:browser-history-updated", syncHistory);
      window.removeEventListener("luno:browser-bookmarks-updated", syncBookmarks);
    };
  }, []);

  // Check if current page is bookmarked
  const isCurrentBookmarked = useMemo(() => {
    return isBookmarked(currentUrl);
  }, [currentUrl, bookmarks]);

  const handleToggleCurrentBookmark = () => {
    if (!currentUrl || currentUrl === "about:blank") return;
    const res = toggleBrowserBookmark({
      url: currentUrl,
      title: pageTitle || getHostName(currentUrl),
      favicon,
    });
    setBookmarks(res.bookmarks);
    toast({
      title: res.bookmarked
        ? t("webViewer.bookmarkAdded") || "Bookmark added"
        : t("webViewer.bookmarkRemoved") || "Bookmark removed",
      description: currentUrl,
    });
  };

  const handleDeleteBookmark = (url: string) => {
    const updated = removeBrowserBookmark(url);
    setBookmarks(updated);
    toast({
      title: t("webViewer.bookmarkRemoved") || "Bookmark removed",
      description: url,
    });
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeBrowserHistoryItem(id);
    setHistoryItems(updated);
  };

  const handleConfirmClearHistory = () => {
    clearBrowserHistory();
    setHistoryItems([]);
    setClearHistoryDialogOpen(false);
    toast({
      title: t("webViewer.clearHistory") || "Clear History",
      description: t("webViewer.historyCleared") || "Browsing history cleared",
    });
  };

  const handleClearCookies = async () => {
    setIsClearing(true);
    try {
      const electronAPI = (window as unknown as { electronAPI?: { clearBrowserData?: (o: any) => Promise<{ success: boolean }> } })?.electronAPI;
      if (electronAPI?.clearBrowserData) {
        await electronAPI.clearBrowserData({ cookies: true });
      }
      toast({
        title: t("webViewer.clearCookies") || "Clear Cookies & Site Data",
        description: t("webViewer.cookiesCleared") || "Cookies cleared successfully",
      });
    } catch (err) {
      console.warn("Failed clearing cookies:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const electronAPI = (window as unknown as { electronAPI?: { clearBrowserData?: (o: any) => Promise<{ success: boolean }> } })?.electronAPI;
      if (electronAPI?.clearBrowserData) {
        await electronAPI.clearBrowserData({ cache: true });
      }
      toast({
        title: t("webViewer.clearCache") || "Clear Cache",
        description: t("webViewer.cacheCleared") || "Cache cleared successfully",
      });
    } catch (err) {
      console.warn("Failed clearing cache:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleConfirmClearAllData = async () => {
    setIsClearing(true);
    setClearAllDataDialogOpen(false);
    try {
      clearBrowserHistory();
      setHistoryItems([]);

      const electronAPI = (window as unknown as { electronAPI?: { clearBrowserData?: (o: any) => Promise<{ success: boolean }> } })?.electronAPI;
      if (electronAPI?.clearBrowserData) {
        await electronAPI.clearBrowserData({ cookies: true, cache: true, storage: true, auth: true });
      }
      if (webviewRef?.current?.clearHistory) {
        try {
          webviewRef.current.clearHistory();
        } catch {}
      }
      toast({
        title: t("webViewer.clearAllData") || "Clear All Browsing Data",
        description: t("webViewer.allDataCleared") || "All browsing data cleared successfully",
      });
    } catch (err) {
      console.warn("Failed clearing all data:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCopy = async (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await copyToClipboard(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast({
        title: t("webViewer.copyUrl") || "Copy URL",
        description: t("webViewer.urlCopied") || "URL copied to clipboard",
      });
    } catch {
      /* ignore */
    }
  };

  const handleCopyMarkdown = async () => {
    const md = `[${pageTitle || getHostName(currentUrl)}](${currentUrl})`;
    try {
      await copyToClipboard(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
      toast({
        title: t("webViewer.copyMarkdownLink") || "Copy as Markdown Link",
        description: t("webViewer.markdownLinkCopied") || "Markdown link copied to clipboard",
      });
    } catch {
      /* ignore */
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyItems;
    const q = searchQuery.toLowerCase();
    return historyItems.filter(
      (h) => h.title?.toLowerCase().includes(q) || h.url?.toLowerCase().includes(q)
    );
  }, [historyItems, searchQuery]);

  const groupedHistory = useMemo(() => {
    const today: BrowserHistoryItem[] = [];
    const yesterday: BrowserHistoryItem[] = [];
    const earlier: BrowserHistoryItem[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yestDate = new Date(now);
    yestDate.setDate(now.getDate() - 1);
    const yestStr = yestDate.toDateString();

    for (const item of filteredHistory) {
      const d = new Date(item.timestamp);
      const dStr = d.toDateString();
      if (dStr === todayStr) {
        today.push(item);
      } else if (dStr === yestStr) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    }

    return { today, yesterday, earlier };
  }, [filteredHistory]);

  const renderToolbarIcon = (key: string, cls = "h-4 w-4") => {
    const IconComp = getToolbarIcon(key, pack);
    return <IconComp className={cls} />;
  };

  const isHttps = currentUrl.startsWith("https://");
  const isLocal = currentUrl.startsWith("data:") || currentUrl.startsWith("blob:") || currentUrl.startsWith("file:") || currentUrl.includes("luno-preview");

  if (!isOpen) return null;

  return (
    <motion.aside
      data-browser-right-panel="true"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full w-[280px] shrink-0 border-l border-border bg-background flex flex-col select-none overflow-hidden z-10"
    >
      {/* Header Tabs: History / Bookmarks / Privacy & Settings */}
      <div
        data-browser-panel-header="true"
        className="flex h-11 items-center justify-between border-b border-border/50 px-4 pt-2 shrink-0"
      >
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`relative pb-2.5 transition-colors ${
              activeTab === "history"
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("webViewer.history") || (isTh ? "ประวัติ" : "History")}
            {activeTab === "history" && (
              <motion.div
                layoutId="browserRightPanelTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            className={`relative pb-2.5 transition-colors ${
              activeTab === "bookmarks"
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("webViewer.bookmarks") || (isTh ? "บุ๊กมาร์ก" : "Bookmarks")}
            {activeTab === "bookmarks" && (
              <motion.div
                layoutId="browserRightPanelTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`relative pb-2.5 transition-colors ${
              activeTab === "privacy"
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("webViewer.privacy") || (isTh ? "ความเป็นส่วนตัว" : "Privacy")}
            {activeTab === "privacy" && (
              <motion.div
                layoutId="browserRightPanelTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("rightPanel.closePanel") || "Close panel"}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {renderToolbarIcon("x", "h-3.5 w-3.5")}
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("rightPanel.closePanel") || "Close panel"}</TooltipContent>
        </Tooltip>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs no-scrollbar">
        {/* TAB 1: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Search History Filter & Action Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 border border-border/50 focus-within:border-primary focus-within:ring-0 shadow-none transition-all">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("webViewer.searchHistory") || (isTh ? "ค้นหาประวัติการเข้าชม..." : "Search history...")}
                  className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchQuery && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/80 cursor-pointer"
                        aria-label={t("webViewer.clear") || "Clear"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("webViewer.clear") || "Clear"}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {historyItems.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 px-0.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    {t("webViewer.history") || (isTh ? "ประวัติ" : "History")} ({filteredHistory.length})
                  </span>
                </div>
              )}
            </div>

            {/* History List or Empty State */}
            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Clock className="h-7 w-7 opacity-40 text-muted-foreground" />
                <span>
                  {searchQuery
                    ? t("webViewer.noMatchingHistory") || (isTh ? "ไม่พบประวัติการเข้าชมที่ค้นหา" : "No matching history found")
                    : t("webViewer.noHistory") || (isTh ? "ไม่มีประวัติการเข้าชม" : "No browsing history yet")}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group: Today */}
                {groupedHistory.today.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                      {t("webViewer.today") || (isTh ? "วันนี้" : "Today")}
                    </h5>
                    <div className="space-y-1">
                      {groupedHistory.today.map((item) => (
                        <HistoryRow
                          key={item.id}
                          item={item}
                          copiedUrl={copiedUrl}
                          onNavigate={onNavigate}
                          onCopy={handleCopy}
                          onDelete={handleDeleteHistoryItem}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Group: Yesterday */}
                {groupedHistory.yesterday.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                      {t("webViewer.yesterday") || (isTh ? "เมื่อวาน" : "Yesterday")}
                    </h5>
                    <div className="space-y-1">
                      {groupedHistory.yesterday.map((item) => (
                        <HistoryRow
                          key={item.id}
                          item={item}
                          copiedUrl={copiedUrl}
                          onNavigate={onNavigate}
                          onCopy={handleCopy}
                          onDelete={handleDeleteHistoryItem}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Group: Earlier */}
                {groupedHistory.earlier.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                      {t("webViewer.earlier") || (isTh ? "ก่อนหน้านี้" : "Earlier")}
                    </h5>
                    <div className="space-y-1">
                      {groupedHistory.earlier.map((item) => (
                        <HistoryRow
                          key={item.id}
                          item={item}
                          copiedUrl={copiedUrl}
                          onNavigate={onNavigate}
                          onCopy={handleCopy}
                          onDelete={handleDeleteHistoryItem}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKMARKS */}
        {activeTab === "bookmarks" && (
          <div className="space-y-4">
            {/* Quick Bookmark Current Page Button */}
            <button
              type="button"
              onClick={handleToggleCurrentBookmark}
              className={`flex w-full items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                isCurrentBookmarked
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-border/70 hover:bg-muted/60 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Star
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isCurrentBookmarked ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                  }`}
                />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-xs truncate">
                    {isCurrentBookmarked
                      ? t("webViewer.removeBookmark") || (isTh ? "ลบบุ๊กมาร์กหน้านี้" : "Remove Bookmark")
                      : t("webViewer.addBookmark") || (isTh ? "บุ๊กมาร์กหน้านี้" : "Bookmark This Page")}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                    {getHostName(currentUrl)}
                  </div>
                </div>
              </div>
            </button>

            {/* Bookmarks List or Empty State */}
            {bookmarks.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Star className="h-7 w-7 opacity-40 text-muted-foreground" />
                <span className="font-medium text-foreground/80">
                  {t("webViewer.noBookmarks") || (isTh ? "ยังไม่มีบุ๊กมาร์ก" : "No bookmarks yet")}
                </span>
                <p className="text-[11px] leading-relaxed max-w-[200px] opacity-70">
                  {t("webViewer.noBookmarksDesc") ||
                    (isTh
                      ? "คลิก 'บุ๊กมาร์กหน้านี้' เพื่อบันทึกหน้าเว็บโปรดสำหรับเปิดอย่างรวดเร็ว"
                      : "Click 'Bookmark This Page' to save your favorite pages for quick access.")}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                  {t("webViewer.bookmarks") || (isTh ? "บุ๊กมาร์ก" : "Bookmarks")} ({bookmarks.length})
                </h5>
                <div className="space-y-1">
                  {bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      onClick={() => onNavigate(bm.url)}
                      className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 border border-transparent hover:border-border/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <BrowserItemFavicon url={bm.url} favicon={bm.favicon} />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {bm.title || getHostName(bm.url)}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {getHostName(bm.url)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(bm.url, e)}
                              className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              aria-label={t("webViewer.copyUrl") || "Copy URL"}
                            >
                              {copiedUrl === bm.url ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("webViewer.copyUrl") || "Copy URL"}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBookmark(bm.url);
                              }}
                              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              aria-label={t("webViewer.removeBookmark") || (isTh ? "ลบบุ๊กมาร์ก" : "Remove")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("webViewer.removeBookmark") || (isTh ? "ลบบุ๊กมาร์ก" : "Remove")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRIVACY & DATA */}
        {activeTab === "privacy" && (
          <div className="space-y-5">
            {/* SECTION 1: CLEAR BROWSING DATA */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("webViewer.privacy") || (isTh ? "การล้างข้อมูลและการท่องเว็บ" : "Browsing Data & Privacy")}
              </h4>

              <div className="space-y-2">
                {/* Clear Cookies */}
                <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Cookie className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">
                        {t("webViewer.clearCookies") || (isTh ? "ล้างคุกกี้และข้อมูลไซต์" : "Clear Cookies")}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        {t("webViewer.clearCookiesDesc") ||
                          (isTh
                            ? "ลบคุกกี้และเซสชันที่เว็บไซต์บันทึกไว้ในเบราว์เซอร์"
                            : "Removes cookies stored by visited sites.")}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={handleClearCookies}
                    className="w-full py-1.5 px-3 text-xs font-medium rounded-xl border border-border/70 hover:bg-muted text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {t("webViewer.clearCookies") || (isTh ? "ล้างคุกกี้" : "Clear Cookies")}
                  </button>
                </div>

                {/* Clear Cache */}
                <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Database className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">
                        {t("webViewer.clearCache") || (isTh ? "ล้างแคชเว็บ" : "Clear Cache")}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        {t("webViewer.clearCacheDesc") ||
                          (isTh
                            ? "ลบไฟล์รูปภาพและข้อมูลชั่วคราวเพื่อประหยัดพื้นที่"
                            : "Frees up temporary cached files and images.")}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={handleClearCache}
                    className="w-full py-1.5 px-3 text-xs font-medium rounded-xl border border-border/70 hover:bg-muted text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {t("webViewer.clearCache") || (isTh ? "ล้างแคช" : "Clear Cache")}
                  </button>
                </div>

                {/* Clear All Browsing Data */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={() => setClearAllDataDialogOpen(true)}
                    className="flex w-full items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-xl border border-border/70 bg-muted/30 text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t("webViewer.clearAllData") || (isTh ? "ล้างข้อมูลทั้งหมด" : "Clear All Browsing Data")}</span>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* SECTION 2: ZOOM & DISPLAY */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("webViewer.zoom") || (isTh ? "การซูมและการแสดงผล" : "Display & Zoom")}
              </h4>

              <div className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20">
                <span className="text-muted-foreground font-medium pl-1">
                  {Math.round((zoomFactor / 0.9) * 100)}%
                </span>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          const currentScale = Math.round((zoomFactor / 0.9) * 10) / 10;
                          const newScale = Math.max(0.5, Math.round((currentScale - 0.1) * 10) / 10);
                          onZoomChange?.(Math.round(newScale * 0.9 * 100) / 100);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={t("webViewer.zoomOut") || "Zoom Out"}
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("webViewer.zoomOut") || "Zoom Out"}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onZoomChange?.(0.9)}
                        className="px-2 py-1 text-[11px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
                        aria-label={t("webViewer.zoomReset") || "Reset Zoom (100%)"}
                      >
                        100%
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("webViewer.zoomReset") || "Reset Zoom (100%)"}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          const currentScale = Math.round((zoomFactor / 0.9) * 10) / 10;
                          const newScale = Math.min(2.0, Math.round((currentScale + 0.1) * 10) / 10);
                          onZoomChange?.(Math.round(newScale * 0.9 * 100) / 100);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={t("webViewer.zoomIn") || "Zoom In"}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("webViewer.zoomIn") || "Zoom In"}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {onHardReload && (
                <button
                  type="button"
                  onClick={onHardReload}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{t("webViewer.hardReload") || (isTh ? "โหลดใหม่แบบล้างแคช" : "Hard Reload")}</span>
                </button>
              )}
            </div>

            <hr className="border-border/60" />

            {/* SECTION 3: PAGE INFO & SECURITY */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("webViewer.pageInfo") || (isTh ? "ข้อมูลความปลอดภัย" : "Page Security")}
              </h4>

              <div className="space-y-2 text-xs">
                {/* Security status */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-muted-foreground">{isTh ? "สถานะการเชื่อมต่อ" : "Security"}</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    {isLocal ? (
                      <span className="flex items-center gap-1 text-blue-500">
                        <FileCode className="h-3.5 w-3.5" />
                        <span>{t("webViewer.localPreview") || "Local"}</span>
                      </span>
                    ) : isHttps ? (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>{t("webViewer.secure") || "HTTPS"}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>{t("webViewer.notSecure") || "HTTP"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Host */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-muted-foreground">{isTh ? "โฮสต์" : "Host"}</span>
                  <span className="font-medium text-foreground truncate max-w-[170px]">
                    {getHostName(currentUrl)}
                  </span>
                </div>

                {/* URL with quick copy */}
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-muted-foreground">{isTh ? "ที่อยู่เว็บ" : "Full Address"}</span>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-foreground break-all">
                    <span className="truncate flex-1 select-all">{currentUrl}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentUrl)}
                          className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                          aria-label={t("webViewer.copyUrl") || "Copy URL"}
                        >
                          {copiedUrl === currentUrl ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("webViewer.copyUrl") || "Copy URL"}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* SECTION 4: ACTIONS */}
            <div className="space-y-1 pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("rightPanel.actionsSection") || "Actions"}
              </h4>

              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {copiedMd ? (
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span>{t("webViewer.copyMarkdownLink") || (isTh ? "คัดลอกเป็นลิงก์ Markdown" : "Copy as Markdown Link")}</span>
              </button>

              {onInsertToNote && hasActiveNotes && (
                <button
                  type="button"
                  onClick={onInsertToNote}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <FilePlus2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{t("webViewer.insertToNote") || "Insert link into note"}</span>
                </button>
              )}

              {onOpenExternal && (
                <button
                  type="button"
                  onClick={onOpenExternal}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{t("webViewer.openExternal") || "Open in External Browser"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Footer: Clear Browser History */}
      {activeTab === "history" && historyItems.length > 0 && (
        <div className="p-3 border-t border-border/50 bg-sidebar/95 backdrop-blur shrink-0">
          <button
            type="button"
            disabled={isClearing}
            onClick={() => setClearHistoryDialogOpen(true)}
            className="flex w-full items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-xl border border-border/70 bg-muted/30 text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t("webViewer.clearHistory") || (isTh ? "ล้างประวัติการเข้าชม" : "Clear Browsing History")}</span>
          </button>
        </div>
      )}

      {/* Confirmation Dialog: Clear History */}
      <AlertDialog open={clearHistoryDialogOpen} onOpenChange={setClearHistoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("webViewer.clearHistory") || (isTh ? "ล้างประวัติการเข้าชมหรือไม่?" : "Clear Browsing History?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("webViewer.clearHistoryConfirm") || (isTh ? "คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการเข้าชมทั้งหมด?" : "Are you sure you want to clear your entire browsing history?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || (isTh ? "ยกเลิก" : "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={handleConfirmClearHistory}
            >
              {t("webViewer.clearHistory") || (isTh ? "ล้างประวัติ" : "Clear History")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog: Clear All Data */}
      <AlertDialog open={clearAllDataDialogOpen} onOpenChange={setClearAllDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("webViewer.clearAllData") || (isTh ? "ล้างข้อมูลการท่องเว็บทั้งหมดหรือไม่?" : "Clear All Browsing Data?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("webViewer.clearAllDataConfirm") || (isTh ? "คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลการท่องเว็บทั้งหมด (ประวัติ, คุกกี้, และแคช)?" : "Are you sure you want to clear all browsing data (history, cookies, and cache)?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || (isTh ? "ยกเลิก" : "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={handleConfirmClearAllData}
            >
              {t("webViewer.clearAllData") || (isTh ? "ล้างข้อมูลทั้งหมด" : "Clear All Data")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.aside>
  );
}

interface HistoryRowProps {
  item: BrowserHistoryItem;
  copiedUrl: string | null;
  onNavigate: (url: string) => void;
  onCopy: (url: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function BrowserItemFavicon({ url, favicon }: { url: string; favicon?: string }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const isLocal = url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("file:");
  const candidates = useMemo(() => getFaviconCandidates(url, favicon), [url, favicon]);

  useEffect(() => {
    setCandidateIndex(0);
  }, [url, favicon]);

  if (isLocal) {
    return <FileCode className="h-4 w-4 text-blue-500 shrink-0" />;
  }

  const currentSrc = candidates[candidateIndex];
  if (currentSrc) {
    return (
      <img
        key={`${url}-${currentSrc}`}
        src={currentSrc}
        alt=""
        onError={() => setCandidateIndex((prev) => prev + 1)}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (currentSrc.includes("google.com/s2/favicons") && img.naturalWidth === 16 && img.naturalHeight === 16) {
            setCandidateIndex((prev) => prev + 1);
          }
        }}
        className="h-4 w-4 rounded shrink-0 object-contain"
      />
    );
  }

  return <Globe className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function HistoryRow({ item, copiedUrl, onNavigate, onCopy, onDelete }: HistoryRowProps) {
  const { t, language } = useTranslation();

  return (
    <div
      onClick={() => onNavigate(item.url)}
      className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 border border-transparent hover:border-border/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        <BrowserItemFavicon url={item.url} favicon={item.favicon} />
        <div className="min-w-0 flex-1 text-left">
          <div className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {item.title || getHostName(item.url)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="truncate">{getHostName(item.url)}</span>
            <span className="shrink-0 opacity-70">
              {formatTime(item.timestamp, "24h", "en")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => onCopy(item.url, e)}
              className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={t("webViewer.copyUrl") || "Copy URL"}
            >
              {copiedUrl === item.url ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("webViewer.copyUrl") || "Copy URL"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => onDelete(item.id, e)}
              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              aria-label={t("webViewer.deleteHistoryItem") || (language === "th" ? "ลบออกจากประวัติ" : "Remove")}
            >
              <X className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("webViewer.deleteHistoryItem") || (language === "th" ? "ลบออกจากประวัติ" : "Remove")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
