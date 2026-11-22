import React from "react";
import { Globe } from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import { useAppSettingsSafe } from "@/hooks/useAppSettings";
import { getToolbarIcon, renderCustomIcon, type IconPackId } from "@/lib/iconPacks";
import { getNoteDefaultIconKey } from "@/lib/fileIconUtils";
import lunoLogo from "@/assets/luno-logo.png";

export interface NoteIconProps {
  note: Pick<Note, "id" | "fileName" | "folderPath" | "fileType" | "contentFormat" | "icon" | "iconColor" | "isLocked"> & {
    title?: string;
    url?: string;
  };
  className?: string;
  active?: boolean;
  /** Override color class when not using customColor. */
  colorClassName?: string;
  /** Override settings.showFileIcons check (default: false — respects user setting). */
  alwaysShow?: boolean;
  /** Optional explicit icon pack override. */
  iconPack?: IconPackId;
  /** Optional override for web-viewer tab icon (e.g. favicon in TabBar). */
  webIcon?: React.ReactNode;
}

const SYSTEM_ICON_KEYS: Record<string, string> = {
  home: "home",
  trash: "trash",
  settings: "settings",
  help: "helpCircle",
  "luno-ai": "sparkles",
  templates: "templates",
  relations: "relations",
  favorites: "star",
  tags: "tag",
};

function getSystemTabKind(note: Pick<Note, "id" | "fileType">): string | null {
  if (note.fileType && (note.fileType === "whats-new" || note.fileType in SYSTEM_ICON_KEYS)) {
    return note.fileType;
  }
  if (note.id === "whats-new" || note.id.startsWith("whats-new:")) return "whats-new";
  for (const key of Object.keys(SYSTEM_ICON_KEYS)) {
    if (note.id === key || note.id.startsWith(`${key}:`)) return key;
  }
  return null;
}

/**
 * Standardized Note file icon component (LN-REUSE-01).
 * Resolves system tab icons, custom note/settings icons, lock state, active icon pack, and showFileIcons preference consistently.
 */
export function NoteIcon({
  note,
  className = "h-4 w-4",
  active = false,
  colorClassName,
  alwaysShow = false,
  iconPack,
  webIcon,
}: NoteIconProps) {
  const appSettings = useAppSettingsSafe();
  const settings = appSettings?.settings;
  const pack: IconPackId = iconPack || settings?.iconPack || "lucide";
  const resolvedColorCls = colorClassName ?? (active ? "text-primary" : "text-muted-foreground");
  const cls = `${className} shrink-0 ${resolvedColorCls}`;

  const systemKind = getSystemTabKind(note);
  if (systemKind === "whats-new") {
    return (
      <img
        src={lunoLogo}
        alt="Luno"
        className={`${className} object-contain select-none shrink-0 luno-app-logo`}
      />
    );
  }
  if (systemKind === "favorites") {
    const StarIcon = getToolbarIcon("star", pack);
    return (
      <StarIcon
        className={`${className} shrink-0 ${active ? "text-amber-500 fill-amber-500" : "text-amber-500/70"}`}
      />
    );
  }
  if (systemKind && systemKind in SYSTEM_ICON_KEYS) {
    const SysIcon = getToolbarIcon(SYSTEM_ICON_KEYS[systemKind], pack);
    return <SysIcon className={cls} />;
  }

  if (note.fileType === "web-viewer" || note.id.startsWith("web:")) {
    return webIcon ? <>{webIcon}</> : <Globe className={cls} />;
  }

  if (!alwaysShow && settings?.showFileIcons === false) {
    return null;
  }

  const noteName = note.fileName || note.title || "";
  const relPath = noteName
    ? note.folderPath
      ? `${note.folderPath}/${noteName}`
      : noteName
    : "";
  const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
  const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);

  if (customIcon) {
    const custom = renderCustomIcon(customIcon, cls, customColor ? { color: customColor } : undefined);
    if (custom) {
      return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
    }
  }

  const fallbackCls = `${className} shrink-0 ${customColor ? "" : resolvedColorCls}`;
  const fallbackStyle = customColor ? { color: customColor } : undefined;

  if (note.isLocked) {
    const LockIcon = getToolbarIcon("lock", pack);
    return <LockIcon className={fallbackCls} style={fallbackStyle} />;
  }

  const defaultKey = getNoteDefaultIconKey(note);
  const IconComp = getToolbarIcon(defaultKey, pack);
  return <IconComp className={fallbackCls} style={fallbackStyle} />;
}

export default NoteIcon;
