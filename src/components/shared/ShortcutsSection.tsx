import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ShortcutItem {
  labelKey: string;
  keys: string;
}

interface ShortcutGroup {
  titleKey: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: "settings.kbGroupGeneral",
    items: [
      { labelKey: "settings.kbNewNote", keys: "Ctrl + N" },
      { labelKey: "settings.kbOpenFolder", keys: "Ctrl + O" },
      { labelKey: "settings.kbSave", keys: "Ctrl + S" },
      { labelKey: "settings.kbCloseTab", keys: "Ctrl + W" },
      { labelKey: "settings.kbCycleTabs", keys: "Ctrl + Tab / Ctrl + Shift + Tab" },
      { labelKey: "settings.kbToggleSidebar", keys: "Ctrl + \\" },
      { labelKey: "settings.kbOpenSettings", keys: "Ctrl + ," },
      { labelKey: "settings.kbSearch", keys: "Ctrl + K / Ctrl + F" },
    ],
  },
  {
    titleKey: "settings.kbGroupFormatting",
    items: [
      { labelKey: "settings.kbBold", keys: "Ctrl + B" },
      { labelKey: "settings.kbItalic", keys: "Ctrl + I" },
      { labelKey: "settings.kbUnderline", keys: "Ctrl + U" },
      { labelKey: "settings.kbStrike", keys: "Ctrl + Shift + X" },
      { labelKey: "settings.kbHighlight", keys: "Ctrl + Shift + H" },
      { labelKey: "settings.kbSuperscript", keys: "Ctrl + ." },
      { labelKey: "settings.kbSubscript", keys: "Ctrl + Shift + ," },
      { labelKey: "settings.kbInlineCode", keys: "Ctrl + Shift + E / Ctrl + `" },
      { labelKey: "settings.kbInsertLink", keys: "Ctrl + K" },
      { labelKey: "settings.kbClearFormatting", keys: "Ctrl + Shift + N" },
    ],
  },
  {
    titleKey: "settings.kbGroupListsAndBlocks",
    items: [
      { labelKey: "settings.kbBulletList", keys: "Ctrl + Shift + 8" },
      { labelKey: "settings.kbOrderedList", keys: "Ctrl + Shift + 7" },
      { labelKey: "settings.kbTaskList", keys: "Ctrl + Shift + 9" },
      { labelKey: "settings.kbBlockquote", keys: "Ctrl + Shift + Q" },
      { labelKey: "settings.kbCodeBlock", keys: "Ctrl + Alt + C" },
      { labelKey: "settings.kbIndent", keys: "Tab / Shift + Tab" },
    ],
  },
  {
    titleKey: "settings.kbGroupTools",
    items: [
      { labelKey: "settings.kbFixLang", keys: "Ctrl + Shift + L" },
      { labelKey: "settings.kbOpenAi", keys: "Ctrl + Shift + A" },
      { labelKey: "settings.kbToggleCalc", keys: "Ctrl + Shift + C" },
      { labelKey: "settings.kbToggleClock", keys: "Ctrl + Shift + T" },
      { labelKey: "settings.kbSlashCommands", keys: "/" },
    ],
  },
];

/**
 * Standardized Keyboard Shortcuts reference cards (LN-REUSE-01).
 * Shared by SettingsTabView and HelpTabView as a single source of truth.
 */
export function ShortcutsSection() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {SHORTCUT_GROUPS.map((group) => (
        <div
          key={group.titleKey}
          className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-sm"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            {t(group.titleKey)}
          </h3>
          <div className="divide-y divide-border/30 text-xs">
            {group.items.map((item) => (
              <div key={item.labelKey} className="flex justify-between py-2">
                <span className="text-muted-foreground">{t(item.labelKey)}</span>
                <kbd className="px-2 py-0.5 rounded-md bg-muted font-mono text-[11px] font-semibold">
                  {item.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShortcutsSection;
