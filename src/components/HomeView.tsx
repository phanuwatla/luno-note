import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Calendar,
  ListTodo,
  Users,
  Briefcase,
  Lightbulb,
  FileText,
  FileCode,
  FileImage,
  File,
  Star,
  Sparkles,
  X,
  ArrowRight,
  Clock,
  LayoutTemplate,
  RotateCcw,
  Sun,
  Moon,
  CloudSun,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { parseFrontmatterAndTags, isMarkdownNote } from "@/lib/frontmatter";
import { getTagColorClass } from "@/lib/tagColors";
import { TIPS, getRandomTipIndex, getNextTipIndex } from "@/lib/tips";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Note } from "@/hooks/useNotes";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { NoteIcon as SharedNoteIcon } from "@/components/shared/NoteIcon";
import { NOTE_TEMPLATE_METADATA, getTemplateIcon, type NoteTemplateType } from "@/lib/templates";
import { isVirtualTab } from "@/lib/systemTabs";

interface HomeViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onCreateWithTemplate?: (
    templateType: NoteTemplateType,
    format?: "markdown" | "html" | "plain",
    templateIcon?: string,
    templateColor?: string
  ) => void;
  onCreateBlankNote?: () => void;
  onToggleFavorite?: (noteId: string) => void;
  onOpenSearch?: () => void;
  onViewAllNotes?: () => void;
  onViewAllFavorites?: () => void;
  onViewAllTemplates?: () => void;
}

export default function HomeView({
  notes,
  onOpenNote,
  onCreateWithTemplate,
  onCreateBlankNote,
  onToggleFavorite,
  onOpenSearch,
  onViewAllNotes,
  onViewAllFavorites,
  onViewAllTemplates,
}: HomeViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";

  const [isTipDismissed, setIsTipDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => getRandomTipIndex());
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const pack = settings?.iconPack || "lucide";
  const renderIcon = (key: string, cls = "h-4 w-4") => {
    const IconComp = getToolbarIcon(key, pack);
    return <IconComp className={cls} />;
  };

  const [osUsername, setOsUsername] = useState<string>("");

  useEffect(() => {
    const electronAPI = (window as unknown as { electronAPI?: { getOsUserInfo?: () => Promise<{ username?: string }> } }).electronAPI;
    if (electronAPI?.getOsUserInfo) {
      electronAPI
        .getOsUserInfo()
        .then((info) => {
          if (info?.username) {
            setOsUsername(info.username);
          }
        })
        .catch((err) => {
          console.warn("Failed to get OS user info:", err);
        });
    }
  }, []);

  // Time-based greeting with solid colored icons and customized/OS user name
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const effectiveUsername = settings.userName?.trim() || osUsername;
    const nameSuffix = effectiveUsername ? `, ${effectiveUsername}` : "";
    if (hour >= 5 && hour < 12) {
      return {
        text: t("home.goodMorning", { nameSuffix }),
        icon: renderIcon("sun", "h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0"),
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        text: t("home.goodAfternoon", { nameSuffix }),
        icon: renderIcon("sun", "h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0"),
      };
    }
    return {
      text: t("home.goodEvening", { nameSuffix }),
      icon: renderIcon("moon", "h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0"),
    };
  }, [isTh, pack, osUsername, settings.userName]);

  // Helper to get note tags
  const getNoteTags = (note: Note): string[] => {
    if (!isMarkdownNote(note) || note.fileType === "image" || note.fileType === "binary") {
      return [];
    }
    const tagsSet = new Set<string>(note.tags || []);
    if (note.content && typeof note.content === "string") {
      try {
        const parsed = parseFrontmatterAndTags(note.content);
        (parsed.allTags || []).forEach((t) => tagsSet.add(t));
      } catch { /* ignore */ }
    }
    return Array.from(tagsSet);
  };

  const normalizedQuery = query.toLowerCase().trim();

  // Recent notes (sorted by updatedAt descending)
  const recentNotes = useMemo(() => {
    const all = [...notes].filter((n) => !isVirtualTab(n));

    if (!normalizedQuery) {
      return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
    }

    return all
      .filter((n) => {
        const titleMatch = (n.title || "").toLowerCase().includes(normalizedQuery);
        const fileMatch = (n.fileName || "").toLowerCase().includes(normalizedQuery);
        const contentMatch = (n.content || "").toLowerCase().includes(normalizedQuery);
        const tags = getNoteTags(n);
        const tagMatch = tags.some((t) => t.toLowerCase().includes(normalizedQuery));
        return titleMatch || fileMatch || contentMatch || tagMatch;
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notes, normalizedQuery]);

  // Favorite notes
  const favoriteNotes = useMemo(() => {
    const allFav = [...notes].filter((n) => {
      if (isVirtualTab(n)) return false;
      if (n.isFavorite) return true;
      if (isMarkdownNote(n) && n.content) {
        const parsed = parseFrontmatterAndTags(n.content);
        if (parsed.frontmatterData?.favorite !== undefined) {
          return Boolean(parsed.frontmatterData.favorite);
        }
      }
      return false;
    });

    if (!normalizedQuery) {
      return allFav.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
    }

    return allFav
      .filter((n) => {
        const titleMatch = (n.title || "").toLowerCase().includes(normalizedQuery);
        const fileMatch = (n.fileName || "").toLowerCase().includes(normalizedQuery);
        const contentMatch = (n.content || "").toLowerCase().includes(normalizedQuery);
        const tags = getNoteTags(n);
        const tagMatch = tags.some((t) => t.toLowerCase().includes(normalizedQuery));
        return titleMatch || fileMatch || contentMatch || tagMatch;
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notes, normalizedQuery]);

  const getNoteIcon = (note: Note) => <SharedNoteIcon note={note} className="h-4 w-4" iconPack={pack} />;

  // Global Ctrl+F / Ctrl+K handler to focus search input when not typing in an editor or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "k" || e.code === "KeyF" || e.code === "KeyK" || e.key === "า" || e.key === "ด")
      ) {
        const target = e.target as HTMLElement | null;
        if (
          target !== searchInputRef.current &&
          (target?.isContentEditable ||
            target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.closest?.('[role="dialog"], [role="alertdialog"], .ProseMirror, .cm-editor'))
        ) {
          return;
        }
        if (searchInputRef.current && searchInputRef.current.offsetParent !== null) {
          e.preventDefault();
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full overflow-hidden bg-background text-foreground select-none flex flex-col">
      <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col justify-between gap-5 h-full min-h-0">
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span>{greeting.text}</span>
              {greeting.icon}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("home.welcomeToLuno")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("home.yourThoughtsPerfectlyOrganized")}
            </p>
          </div>

          {/* Functional Search Input Box */}
          <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full md:w-64 transition-all shadow-none group">
            {renderIcon("search", "h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors")}
            <input
              ref={searchInputRef}
              data-home-search="true"
              type="text"
              placeholder={t("sidebar.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const topMatch = recentNotes[0] || favoriteNotes[0];
                  if (topMatch) {
                    onOpenNote(topMatch.id);
                  }
                } else if (e.key === "Escape") {
                  setQuery("");
                  searchInputRef.current?.blur();
                }
              }}
              className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                aria-label={t("home.clearSearch")}
              >
                {renderIcon("x", "h-3 w-3")}
              </button>
            )}
          </div>
        </div>

        {/* 2. Start with a Template Section */}
        <div className="space-y-3 shrink-0 pt-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-foreground">
              {t("home.startWithATemplate")}
            </h2>
            {onViewAllTemplates && (
              <button
                type="button"
                onClick={onViewAllTemplates}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                {t("home.viewAll")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(() => {
              const ext = settings?.defaultExtension || "md";
              interface HomeTemplateItem {
                type: NoteTemplateType;
                title: string;
                description: string;
                icon: string;
                color?: string;
                isBlank?: boolean;
              }

              const htmlTemplates: HomeTemplateItem[] = [
                {
                  type: "basic-website",
                  title: "Basic Website",
                  description: t("home.generalWebsiteWithHeaderMain"),
                  icon: "lucide:Globe",
                  color: "#3b82f6",
                },
                {
                  type: "landing-page",
                  title: "Landing Page",
                  description: t("home.promoteProductsAppsOrServices"),
                  icon: "lucide:Rocket",
                  color: "#f43f5e",
                },
                {
                  type: "portfolio",
                  title: "Portfolio",
                  description: t("home.personalPortfolioAndShowcase"),
                  icon: "lucide:User",
                  color: "#10b981",
                },
                {
                  type: "blog",
                  title: "Blog",
                  description: t("home.articleAndBlogPostLayout"),
                  icon: "lucide:BookOpen",
                  color: "#8b5cf6",
                },
                {
                  type: "dashboard",
                  title: "Dashboard",
                  description: t("home.adminPanelAndDataManagement"),
                  icon: "lucide:LayoutDashboard",
                  color: "#06b6d4",
                },
                {
                  type: "blank",
                  title: t("home.newHtml"),
                  description: t("home.startFromBlank"),
                  icon: "lucide:Plus",
                  isBlank: true,
                },
              ];

              const txtTemplates: HomeTemplateItem[] = [
                {
                  type: "notes",
                  title: "Notes",
                  description: t("home.quickShortNotes"),
                  icon: "lucide:FileText",
                  color: "#64748b",
                },
                {
                  type: "todo",
                  title: isTh ? "To-Do List" : "To-Do List",
                  description: t("home.tasksChecklist"),
                  icon: "lucide:CheckSquare",
                  color: "#3b82f6",
                },
                {
                  type: "meeting",
                  title: isTh ? "Meeting Notes" : "Meeting Notes",
                  description: t("home.meetingMinutesAndAgenda"),
                  icon: "lucide:Users",
                  color: "#8b5cf6",
                },
                {
                  type: "journal",
                  title: "Journal",
                  description: t("home.dailyJournalAndThoughts"),
                  icon: "lucide:Calendar",
                  color: "#10b981",
                },
                {
                  type: "readme",
                  title: "README",
                  description: t("home.projectOverviewSetupUsage"),
                  icon: "lucide:BookOpen",
                  color: "#6366f1",
                },
                {
                  type: "blank",
                  title: t("home.newText"),
                  description: t("home.startFromBlank"),
                  icon: "lucide:Plus",
                  isBlank: true,
                },
              ];

              const mdTemplates: HomeTemplateItem[] = [
                {
                  type: "daily",
                  title: t("settings.optDailyNote"),
                  description: t("home.captureYourThoughtsAndReflect"),
                  icon: "lucide:Calendar",
                  color: "#10b981",
                },
                {
                  type: "todo",
                  title: t("settings.optTodoList"),
                  description: t("home.stayOrganizedAndGetThings"),
                  icon: "lucide:CheckSquare",
                  color: "#3b82f6",
                },
                {
                  type: "meeting",
                  title: t("settings.optMeetingNotes"),
                  description: t("home.structureYourMeetingsAndTake"),
                  icon: "lucide:Users",
                  color: "#8b5cf6",
                },
                {
                  type: "project",
                  title: t("settings.optProjectPlan"),
                  description: t("home.planProjectsAndTrackProgress"),
                  icon: "lucide:Briefcase",
                  color: "#f59e0b",
                },
                {
                  type: "study",
                  title: t("settings.optIdeaBrainstorm"),
                  description: t("home.captureAndDevelopYourIdeas"),
                  icon: "lucide:Lightbulb",
                  color: "#f43f5e",
                },
                {
                  type: "blank",
                  title: t("editor.newNote"),
                  description: t("home.startFromBlank"),
                  icon: "lucide:Plus",
                  isBlank: true,
                },
              ];

              const currentTemplates = ext === "html" ? htmlTemplates : ext === "txt" ? txtTemplates : mdTemplates;

              return currentTemplates.map((tmpl) => {
                const isBlank = tmpl.isBlank;
                const meta = NOTE_TEMPLATE_METADATA[tmpl.type];
                const iconStr = isBlank
                  ? (getTemplateIcon("blank", pack) || "lucide:Plus")
                  : (getTemplateIcon(tmpl.type, pack) || meta?.icon || tmpl.icon);
                const colorStr = isBlank ? undefined : (meta?.iconColor || tmpl.color);

                const handleClick = () => {
                  if (isBlank && onCreateBlankNote) {
                    onCreateBlankNote();
                  } else if (onCreateWithTemplate) {
                    onCreateWithTemplate(tmpl.type, (tmpl as any).format, iconStr, colorStr);
                  }
                };

                return (
                  <motion.div
                    key={`${tmpl.type}-${isBlank ? "blank" : "tmpl"}`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClick}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick();
                      }
                    }}
                    className={`flex flex-col text-left p-3.5 rounded-xl bg-card border-[1.5px] ${
                      isBlank
                        ? "border-dashed border-border/80 hover:border-primary/60 hover:bg-muted/50 items-center justify-center text-center"
                        : "border-border/70 hover:border-primary/60 hover:bg-muted/50"
                    } transition-all group shadow-sm cursor-pointer focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 outline-none`}
                  >
                    {renderCustomIcon(
                      iconStr,
                      `h-5 w-5 mb-2 group-hover:scale-110 transition-transform shrink-0 ${
                        isBlank ? "text-muted-foreground group-hover:text-primary mb-1.5" : ""
                      }`,
                      { color: colorStr }
                    )}
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tmpl.title}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                      {tmpl.description}
                    </span>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>

        {/* 3. Two-Column Section (Recent Notes & Favorite Notes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Recent Notes Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-border/30 shrink-0">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                {query ? (
                  renderIcon("search", "h-3.5 w-3.5 text-muted-foreground")
                ) : (
                  renderIcon("clock", "h-3.5 w-3.5 text-muted-foreground")
                )}
                {query ? (t("home.searchResults")) : (t("home.recentFiles"))}
              </h3>
            </div>

            {recentNotes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-4 text-center text-xs text-muted-foreground space-y-1.5 select-none">
                {query ? (
                  renderIcon("search", "h-6 w-6 mx-auto opacity-40 text-muted-foreground")
                ) : (
                  renderIcon("fileText", "h-6 w-6 mx-auto opacity-40 text-muted-foreground")
                )}
                <p>
                  {query
                    ? t("home.noFilesFoundMatching", { query })
                    : t("home.noRecentFilesYet")}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 overflow-y-auto pr-1 pt-1 flex-1 min-h-0">
                {recentNotes.map((note) => {
                  const tags = getNoteTags(note).slice(0, 2);
                  const formattedDate = formatRelativeDateTime(
                    note.updatedAt || Date.now(),
                    settings.dateFormat,
                    settings.timeFormat,
                    settings.language
                  );

                  return (
                    <div
                      key={note.id}
                      tabIndex={0}
                      onClick={() => onOpenNote(note.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenNote(note.id);
                        }
                      }}
                      className="group flex items-center justify-between gap-3 p-2 rounded-xl border-[1.5px] border-transparent hover:border-border/60 hover:bg-muted/50 active:scale-[0.99] focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all duration-150 cursor-pointer outline-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getNoteIcon(note)}
                        <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {note.title?.trim() || note.fileName || (t("editor.untitled"))}
                        </span>
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium border ${getTagColorClass(
                              tag,
                              settings.theme,
                              undefined,
                              settings.tagColorStyle
                            )}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Favorite Notes Card (User requested change from Pinned to Favorite) */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-border/30 shrink-0">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                {renderIcon("star", "h-3.5 w-3.5 text-amber-500 shrink-0")}
                {t("home.favoriteFiles")}
              </h3>
              <button
                type="button"
                onClick={onViewAllFavorites}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                {t("home.viewAll")}
              </button>
            </div>

            {favoriteNotes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-4 text-center text-xs text-muted-foreground space-y-1.5 select-none">
                {query ? (
                  renderIcon("search", "h-6 w-6 mx-auto opacity-40 text-muted-foreground")
                ) : (
                  renderIcon("star", "h-6 w-6 mx-auto opacity-40 text-muted-foreground")
                )}
                <p>
                  {query
                    ? t("home.noFavoriteFilesFoundMatching", { query })
                    : t("home.noFavoriteFilesYet")}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 overflow-y-auto pr-1 pt-1 flex-1 min-h-0">
                {favoriteNotes.map((note) => {
                  const tags = getNoteTags(note).slice(0, 2);

                  return (
                    <div
                      key={note.id}
                      tabIndex={0}
                      onClick={() => onOpenNote(note.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenNote(note.id);
                        }
                      }}
                      className="group flex items-center justify-between gap-3 p-2 rounded-xl border-[1.5px] border-transparent hover:border-border/60 hover:bg-muted/50 active:scale-[0.99] focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all duration-150 cursor-pointer outline-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getNoteIcon(note)}
                        <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {note.title?.trim() || note.fileName || (t("editor.untitled"))}
                        </span>
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium border ${getTagColorClass(
                              tag,
                              settings.theme,
                              undefined,
                              settings.tagColorStyle
                            )}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(note.id);
                        }}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                        aria-label={t("home.unstarNote")}
                      >
                        {renderIcon("star", "h-3.5 w-3.5 fill-amber-500 text-amber-500")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Footer Banner: Tip of the day */}
        <AnimatePresence>
          {!isTipDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 text-foreground shrink-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {renderIcon("lightbulb", "h-4 w-4 text-primary shrink-0")}
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-[11.5px] font-bold text-foreground">
                    {t("home.tipOfTheDay")}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed truncate sm:whitespace-normal">
                    {isTh ? (TIPS[tipIndex] || TIPS[0]).th : (TIPS[tipIndex] || TIPS[0]).en}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setTipIndex((prev) => getNextTipIndex(prev))}
                      className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                      aria-label={t("home.nextTip")}
                    >
                      {renderIcon("arrowRight", "h-3.5 w-3.5")}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {t("home.nextTip")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsTipDismissed(true)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
                      aria-label={t("home.dismiss")}
                    >
                      {renderIcon("x", "h-3.5 w-3.5")}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {t("home.dismiss")}
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </TooltipProvider>
  );
}
