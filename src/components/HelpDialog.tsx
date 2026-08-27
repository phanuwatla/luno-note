import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Keyboard,
  BookOpen,
  Sparkles,
  Info,
  Search,
  CodeXml,
  SquareCode,
  Table,
  CheckSquare,
  Columns,
  Cloud,
  Tag,
  Settings as SettingsIcon,
  ExternalLink,
  ChevronRight,
  Command,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({
  open,
  onOpenChange,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("shortcuts");
  const [shortcutQuery, setShortcutQuery] = useState("");

  const isMac = useMemo(() => {
    return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  const modKey = isMac ? "Cmd" : "Ctrl";

  const shortcutGroups = useMemo(
    () => [
      {
        title: t("helpModal.sectionGeneral") || "General & Navigation",
        items: [
          { label: t("editor.newNote") || "New Note", keys: [modKey, "N"] },
          { label: t("editor.saveFile") || "Save Note", keys: [modKey, "S"] },
          { label: t("sidebar.openFolderAction") || "Open Workspace Folder", keys: [modKey, "O"] },
          { label: t("editor.searchNotes") || "Quick Note Search", keys: [modKey, "P"] },
          { label: t("common.settings") || "Open Settings", keys: [modKey, ","] },
          { label: t("sidebar.help") || "Help & Documentation", keys: ["F1"] },
        ],
      },
      {
        title: t("helpModal.sectionFormatting") || "Text Formatting",
        items: [
          { label: t("editor.bold") || "Bold", keys: [modKey, "B"] },
          { label: t("editor.italic") || "Italic", keys: [modKey, "I"] },
          { label: t("editor.underline") || "Underline", keys: [modKey, "U"] },
          { label: t("editor.strikethrough") || "Strikethrough", keys: [modKey, "Shift", "X"] },
          { label: t("editor.inlineCode") || "Inline Code", keys: [modKey, "E"] },
          { label: t("editor.highlight") || "Highlight", keys: [modKey, "Shift", "H"] },
          { label: t("editor.link") || "Insert Link", keys: [modKey, "K"] },
        ],
      },
      {
        title: t("helpModal.sectionBlocks") || "Blocks & Headings",
        items: [
          { label: t("editor.heading1") || "Heading 1", keys: [modKey, "Alt", "1"] },
          { label: t("editor.heading2") || "Heading 2", keys: [modKey, "Alt", "2"] },
          { label: t("editor.heading3") || "Heading 3", keys: [modKey, "Alt", "3"] },
          { label: t("editor.codeBlock") || "Code Block", keys: [modKey, "Alt", "C"] },
          { label: t("editor.bulletList") || "Bullet List", keys: [modKey, "Shift", "8"] },
          { label: t("editor.orderedList") || "Ordered List", keys: [modKey, "Shift", "7"] },
          { label: t("editor.checkbox") || "Task List", keys: [modKey, "Shift", "9"] },
          { label: t("editor.blockquote") || "Blockquote", keys: [modKey, "Shift", "."] },
        ],
      },
      {
        title: t("helpModal.sectionEditor") || "Editor Controls",
        items: [
          { label: t("helpModal.featureSlashTitle") || "Slash Commands Menu", keys: ["/"] },
          { label: t("editor.shortcutTabDesc") || "Indent / Tab", keys: ["Tab"] },
          { label: t("editor.shortcutShiftTabDesc") || "Outdent", keys: ["Shift", "Tab"] },
          { label: t("editor.undo") || "Undo", keys: [modKey, "Z"] },
          { label: t("editor.redo") || "Redo", keys: [modKey, "Y"] },
        ],
      },
    ],
    [t, modKey]
  );

  const filteredShortcutGroups = useMemo(() => {
    if (!shortcutQuery.trim()) return shortcutGroups;
    const q = shortcutQuery.toLowerCase().trim();
    return shortcutGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.keys.some((k) => k.toLowerCase().includes(q))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [shortcutGroups, shortcutQuery]);

  const markdownCheatSheet = useMemo(
    () => [
      { syntax: "# Heading 1\n## Heading 2\n### Heading 3", preview: "Large, medium, and small section headers" },
      { syntax: "**bold** or __bold__", preview: "Bold emphasis text" },
      { syntax: "*italic* or _italic_", preview: "Italicized text" },
      { syntax: "~~strikethrough~~", preview: "Crossed out text" },
      { syntax: "==highlight==", preview: "Highlighted accent background" },
      { syntax: "`inline code`", preview: "Inline monospace code snippet" },
      { syntax: "```javascript\nconsole.log('Hello');\n```", preview: "Fenced code block with language highlight" },
      { syntax: "- [ ] Todo task\n- [x] Completed task", preview: "Interactive checkbox task items" },
      { syntax: "- Bullet list\n  - Nested bullet", preview: "Unordered bulleted lists" },
      { syntax: "1. First item\n2. Second item", preview: "Numbered ordered lists" },
      { syntax: "> Blockquote quote", preview: "Indented quotation block" },
      { syntax: "| Title | Description |\n| :--- | :--- |\n| Data 1 | Data 2 |", preview: "Formatted table with headers and rows" },
      { syntax: "[Luno](https://luno.app)", preview: "Clickable hyperlink" },
      { syntax: "![Alt text](image.png)", preview: "Embedded image" },
      { syntax: "$E = mc^2$", preview: "Inline KaTeX math formula" },
      { syntax: "---\n***", preview: "Horizontal divider line" },
    ],
    []
  );

  const featureCards = useMemo(
    () => [
      {
        icon: <Command className="h-5 w-5 text-primary" />,
        title: t("helpModal.featureSlashTitle") || "Slash Commands (/)",
        desc: t("helpModal.featureSlashDesc") || "Type '/' at the start of any empty line to quickly insert headers, tables, code blocks, task lists, and formatting blocks.",
      },
      {
        icon: <Columns className="h-5 w-5 text-primary" />,
        title: t("helpModal.featureSplitTitle") || "Split Screen (Dual Pane)",
        desc: t("helpModal.featureSplitDesc") || "Open two notes side by side to compare, cross-reference, and edit simultaneously with a resizable divider.",
      },
      {
        icon: <Sparkles className="h-5 w-5 text-primary" />,
        title: t("helpModal.featureAiTitle") || "Luno AI Assistant",
        desc: t("helpModal.featureAiDesc") || "Brainstorm, summarize notes, fix grammar, rewrite text, and generate code with integrated Gemini AI.",
      },
      {
        icon: <Cloud className="h-5 w-5 text-primary" />,
        title: t("helpModal.featureSyncTitle") || "Google Drive Sync",
        desc: t("helpModal.featureSyncDesc") || "Keep your workspace backed up and synchronized automatically with your personal Google Drive account.",
      },
      {
        icon: <Tag className="h-5 w-5 text-primary" />,
        title: t("helpModal.featureTagsTitle") || "Tags & Categorization",
        desc: t("helpModal.featureTagsDesc") || "Add #tags anywhere in your markdown notes. Easily filter, search, and manage tags across your entire workspace.",
      },
      {
        icon: <SettingsIcon className="h-5 w-5 text-primary" />,
        title: t("settings.title") || "Settings & Themes",
        desc: t("settings.appThemeDesc") || "Customize color schemes (Dark/Light/System), accent palettes, typography, font size, and toolbar button order.",
      },
    ],
    [t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/40 bg-muted/20">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {t("helpModal.title") || "Help & Documentation"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {t("helpModal.description") || "Guides, keyboard shortcuts, and quick reference for Luno Notes."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs Body */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col min-h-0">
          <div className="px-5 pt-3 border-b border-border/30 bg-background/50">
            <TabsList className="grid grid-cols-4 w-full h-9 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="shortcuts" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                <Keyboard className="h-3.5 w-3.5" />
                <span>{t("helpModal.tabShortcuts") || "Shortcuts"}</span>
              </TabsTrigger>
              <TabsTrigger value="markdown" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{t("helpModal.tabMarkdown") || "Markdown"}</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("helpModal.tabFeatures") || "Features"}</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="text-xs font-semibold rounded-lg flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                <Info className="h-3.5 w-3.5" />
                <span>{t("helpModal.tabAbout") || "About"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[60vh] min-h-[360px] overflow-y-auto p-5 text-sm space-y-4">
            {/* 1. Shortcuts Tab */}
            <TabsContent value="shortcuts" className="mt-0 space-y-4 outline-none">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={shortcutQuery}
                  onChange={(e) => setShortcutQuery(e.target.value)}
                  placeholder={t("sidebar.searchShortPlaceholder") || "Search shortcuts..."}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border/70 bg-background text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              {filteredShortcutGroups.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {t("sidebar.noResults") || "No matching shortcuts found."}
                </div>
              ) : (
                filteredShortcutGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                      {group.title}
                    </h4>
                    <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 overflow-hidden">
                      {group.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between px-3.5 py-2 hover:bg-muted/40 transition-colors">
                          <span className="text-xs font-medium text-foreground">{item.label}</span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((k, idx) => (
                              <React.Fragment key={idx}>
                                <kbd className="px-2 py-0.5 rounded-md bg-background border border-border/80 text-[10.5px] font-mono font-semibold text-foreground shadow-2xs">
                                  {k}
                                </kbd>
                                {idx < item.keys.length - 1 && <span className="text-muted-foreground text-[10px]">+</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* 2. Markdown Guide Tab */}
            <TabsContent value="markdown" className="mt-0 space-y-3 outline-none">
              <p className="text-xs text-muted-foreground">
                {t("helpModal.markdownDescription") || "Quick cheat sheet for formatting markdown documents in Luno Notes."}
              </p>
              <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 overflow-hidden">
                <div className="grid grid-cols-2 px-3.5 py-2 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{t("helpModal.markdownSyntax") || "Markdown Syntax"}</span>
                  <span>{t("helpModal.markdownOutput") || "Rendered Output"}</span>
                </div>
                {markdownCheatSheet.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3 px-3.5 py-2.5 items-center hover:bg-muted/30 transition-colors">
                    <pre className="text-xs font-mono bg-background/80 px-2 py-1 rounded-md border border-border/50 text-foreground overflow-x-auto whitespace-pre-wrap">
                      {item.syntax}
                    </pre>
                    <span className="text-xs text-muted-foreground">{item.preview}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 3. Features Tab */}
            <TabsContent value="features" className="mt-0 space-y-3 outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureCards.map((card, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        {card.icon}
                      </div>
                      <h4 className="text-xs font-bold text-foreground">{card.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 4. About Tab */}
            <TabsContent value="about" className="mt-0 space-y-4 outline-none">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shadow-xs">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Luno Notes</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Version 1.0.0
                </span>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed pt-1">
                  {t("helpModal.aboutDesc") || "A fast, local-first markdown note-taking app designed for speed, privacy, and seamless organization."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {onOpenSettings && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl text-xs gap-2"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenSettings();
                    }}
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                    <span>{t("helpModal.openSettings") || "Open Settings"}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  className="flex-1 rounded-xl text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  {t("helpModal.close") || "Close"}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
