import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  EMOJI_CATEGORIES,
  ICON_COLOR_PALETTE,
  LUCIDE_ICON_CATEGORIES,
  TABLER_ICON_CATEGORIES,
  PHOSPHOR_ICON_CATEGORIES,
  renderCustomIcon,
} from "@/lib/iconPacks";
import { Search, X, Check, Trash2, Smile, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  initialIcon?: string;
  initialColor?: string;
  onSelectIcon: (icon: string, color?: string) => void;
  onRemoveIcon?: () => void;
}

type TabKey = "emoji" | "lucide" | "tabler" | "phosphor";

export default function IconPickerDialog({
  open,
  onOpenChange,
  title,
  initialIcon = "",
  initialColor = "",
  onSelectIcon,
  onRemoveIcon,
}: IconPickerDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("emoji");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>(initialIcon);
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);

  // Color Pagination items (20 items: 19 from ICON_COLOR_PALETTE + 1 Custom Palette button)
  const allColorItems = useMemo(() => {
    const items: Array<
      | { type: "preset"; id: string; label: string; color: string }
      | { type: "custom" }
    > = ICON_COLOR_PALETTE.map((pal) => ({
      type: "preset",
      id: pal.id,
      label: pal.label,
      color: pal.color,
    }));
    items.push({ type: "custom" });
    return items;
  }, []);

  const COLOR_ITEMS_PER_PAGE = 10;
  const totalColorPages = Math.ceil(allColorItems.length / COLOR_ITEMS_PER_PAGE);
  const [colorPage, setColorPage] = useState(0);

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedIcon(initialIcon || "");
      setSelectedColor(initialColor || "");
      setSearchQuery("");

      const foundIdx = allColorItems.findIndex((item) => {
        if (item.type === "preset") {
          return item.color.toLowerCase() === (initialColor || "").toLowerCase();
        }
        return Boolean(
          initialColor &&
            !ICON_COLOR_PALETTE.some(
              (p) => p.color.toLowerCase() === (initialColor || "").toLowerCase()
            )
        );
      });
      if (foundIdx >= 0) {
        setColorPage(Math.floor(foundIdx / COLOR_ITEMS_PER_PAGE));
      } else {
        setColorPage(0);
      }
    }
  }, [open, initialIcon, initialColor, allColorItems]);

  const currentColors = useMemo(() => {
    const start = colorPage * COLOR_ITEMS_PER_PAGE;
    return allColorItems.slice(start, start + COLOR_ITEMS_PER_PAGE);
  }, [allColorItems, colorPage]);

  // Filtered Emojis
  const filteredEmojiCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return EMOJI_CATEGORIES;

    return EMOJI_CATEGORIES.map((cat) => {
      const isCatMatch = cat.nameEn.toLowerCase().includes(q) || t(cat.nameKey).toLowerCase().includes(q);
      if (isCatMatch) return cat;
      return {
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(q)),
      };
    }).filter((cat) => cat.emojis.length > 0);
  }, [searchQuery, t]);

  // Filtered Lucide Categories
  const filteredLucideCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return LUCIDE_ICON_CATEGORIES;

    return LUCIDE_ICON_CATEGORIES.map((cat) => {
      const isCatMatch = cat.nameEn.toLowerCase().includes(q) || t(cat.nameKey).toLowerCase().includes(q);
      return {
        ...cat,
        items: cat.items.filter(
          (item) =>
            isCatMatch ||
            item.name.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.toLowerCase().includes(q))
        ),
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery, t]);

  // Filtered Tabler Categories
  const filteredTablerCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return TABLER_ICON_CATEGORIES;

    return TABLER_ICON_CATEGORIES.map((cat) => {
      const isCatMatch = cat.nameEn.toLowerCase().includes(q) || t(cat.nameKey).toLowerCase().includes(q);
      return {
        ...cat,
        items: cat.items.filter(
          (item) =>
            isCatMatch ||
            item.name.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.toLowerCase().includes(q))
        ),
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery, t]);

  // Filtered Phosphor Categories
  const filteredPhosphorCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PHOSPHOR_ICON_CATEGORIES;

    return PHOSPHOR_ICON_CATEGORIES.map((cat) => {
      const isCatMatch = cat.nameEn.toLowerCase().includes(q) || t(cat.nameKey).toLowerCase().includes(q);
      return {
        ...cat,
        items: cat.items.filter(
          (item) =>
            isCatMatch ||
            item.name.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.toLowerCase().includes(q))
        ),
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery, t]);

  const handleApply = () => {
    if (selectedIcon) {
      onSelectIcon(selectedIcon, selectedColor);
    } else {
      onRemoveIcon?.();
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    setSelectedIcon("");
    setSelectedColor("");
    onRemoveIcon?.();
    onOpenChange(false);
  };

  const isEmojiMode = selectedIcon ? selectedIcon.startsWith("emoji:") : activeTab === "emoji";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-4 gap-3 rounded-2xl bg-card border-border/80 shadow-2xl">
        <TooltipProvider delayDuration={200}>
          <DialogHeader className="p-0 pb-1">
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
              {title || t("iconPicker.title") || "Change Icon"}
            </DialogTitle>
          </DialogHeader>

          {/* Selected Preview Banner & Color Palette */}
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-border/60 bg-background flex items-center justify-center shadow-2xs text-lg transition-all shrink-0"
                style={{ color: isEmojiMode ? undefined : (selectedColor || undefined) }}
              >
                {selectedIcon ? (
                  renderCustomIcon(selectedIcon, "w-5 h-5", { color: isEmojiMode ? undefined : (selectedColor || undefined) })
                ) : (
                  <Smile className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {selectedIcon ? selectedIcon.replace(/^(emoji|lucide|tabler|ph):/, "") : t("iconPicker.noIconSelected") || "No Icon Selected"}
                </p>
                <p className="text-[10.5px] text-muted-foreground">
                  {isEmojiMode
                    ? (selectedIcon ? t("iconPicker.emojiSelected") || "Emoji icon selected" : t("iconPicker.pickEmojiBelow") || "Choose an emoji below")
                    : (selectedIcon ? t("iconPicker.clickColorToTint") || "Select color tint below" : t("iconPicker.pickIconBelow") || "Choose an icon below")}
                </p>
              </div>
            </div>

            {/* Color swatches single-row carousel under preview (hidden for emojis) */}
            {!isEmojiMode && (
              <div className="border-t border-border/40 pt-2.5 space-y-2">
                <div className="flex items-center justify-between gap-1 px-0.5">
                  {/* Left Arrow Button */}
                  <button
                    type="button"
                    onClick={() => setColorPage((p) => Math.max(0, p - 1))}
                    disabled={colorPage === 0}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
                    aria-label="Previous color page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* 11 Color Swatches filling full row width */}
                  <div className="flex items-center justify-between gap-1 flex-1 min-w-0 px-1">
                    {currentColors.map((item) => {
                      if (item.type === "preset") {
                        const isSelected = selectedColor === item.color;
                        const themeKey = `settings.theme${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`;
                        const translated = t(themeKey as any);
                        const label = translated && translated !== themeKey ? translated : item.label;
                        return (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedColor(item.color)}
                                className={`w-5 h-5 rounded-full border transition-all cursor-pointer shrink-0 flex items-center justify-center relative ${
                                  isSelected
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                                    : "opacity-80 hover:opacity-100 hover:scale-105 hover:border-primary"
                                }`}
                                style={{
                                  backgroundColor: item.color || "var(--foreground)",
                                  borderColor: item.color ? "transparent" : "var(--border)",
                                }}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white drop-shadow-xs" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      // Custom Color Picker Button Popover
                      const isCustomSelected = Boolean(
                        selectedColor &&
                          !ICON_COLOR_PALETTE.some(
                            (pal) => pal.color.toLowerCase() === selectedColor.toLowerCase()
                          )
                      );

                      return (
                        <Popover key="custom-picker">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  style={{
                                    backgroundColor: isCustomSelected ? selectedColor : undefined,
                                    backgroundImage: !isCustomSelected
                                      ? "conic-gradient(from 0deg, #f43f5e, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #c084fc, #f43f5e)"
                                      : undefined,
                                  }}
                                  className={`w-5 h-5 rounded-full border border-transparent transition-all cursor-pointer shrink-0 flex items-center justify-center relative shadow-2xs ${
                                    isCustomSelected
                                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                                      : "opacity-80 hover:opacity-100 hover:scale-105"
                                  }`}
                                >
                                  <Palette className="w-2.5 h-2.5 text-white drop-shadow-md" />
                                </button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {t("settings.themeCustom")}
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent
                            align="start"
                            className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <Palette className="w-3.5 h-3.5 text-primary" />
                                  {t("settings.customAccentColor")}
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                  {selectedColor || "#26A295"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-xs flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                                  <input
                                    type="color"
                                    value={
                                      selectedColor && /^#[0-9A-Fa-f]{6}$/.test(selectedColor)
                                        ? selectedColor
                                        : "#26A295"
                                    }
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                                  />
                                </div>
                                <Input
                                  value={selectedColor || "#26A295"}
                                  onChange={(e) => setSelectedColor(e.target.value)}
                                  placeholder="#26A295"
                                  className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-xs focus-visible:ring-1 focus-visible:ring-primary"
                                  maxLength={7}
                                />
                              </div>

                              <div>
                                <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                                  {t("settings.quickPresets")}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    "#26A295",
                                    "#0ea5e9",
                                    "#3b82f6",
                                    "#6366f1",
                                    "#8b5cf6",
                                    "#d946ef",
                                    "#ec4899",
                                    "#f43f5e",
                                    "#f97316",
                                    "#eab308",
                                    "#84cc16",
                                    "#10b981",
                                    "#14b8a6",
                                    "#64748b",
                                  ].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      style={{ backgroundColor: color }}
                                      onClick={() => setSelectedColor(color)}
                                      className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                                        selectedColor?.toLowerCase() === color.toLowerCase()
                                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                                          : "hover:scale-115 opacity-85 hover:opacity-100"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-border/40">
                                <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                                  {t("settings.previewExample")}
                                </span>
                                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
                                  <span
                                    className="font-medium text-xs flex items-center gap-1.5"
                                    style={{ color: selectedColor || "inherit" }}
                                  >
                                    {selectedIcon ? (
                                      renderCustomIcon(selectedIcon, "w-4 h-4", {
                                        color: selectedColor || undefined,
                                      })
                                    ) : (
                                      <Smile className="w-4 h-4" />
                                    )}
                                    <span>{t("settings.previewAccentText")}</span>
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-white shadow-xs transition-colors"
                                    style={{ backgroundColor: selectedColor || "#26A295" }}
                                  >
                                    {t("settings.previewActive")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>

                  {/* Right Arrow Button */}
                  <button
                    type="button"
                    onClick={() => setColorPage((p) => Math.min(totalColorPages - 1, p + 1))}
                    disabled={colorPage === totalColorPages - 1}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
                    aria-label="Next color page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Pagination Indicators (Image 2 style: pill capsule for active, round dots for inactive) */}
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  {Array.from({ length: totalColorPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setColorPage(idx)}
                      className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                        colorPage === idx
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                      aria-label={`Color page ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApply();
                }
              }}
              placeholder={t("iconPicker.searchPlaceholder") || "Search icons or emojis..."}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Pill Toggle Switcher */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold select-none border border-border/40 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab("emoji")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "emoji"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              😊 <span className="truncate">{t("iconPicker.tabEmoji") || "Emojis"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lucide")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "lucide"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">Lucide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tabler")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "tabler"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">Tabler</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("phosphor")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "phosphor"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">Phosphor</span>
            </button>
          </div>

          {/* Scrollable Icon Grid Container */}
          <div className="max-h-[260px] min-h-[160px] overflow-y-auto rounded-xl border border-border bg-muted/10 p-2.5 min-w-0">
            {activeTab === "emoji" && (
              <div className="space-y-4">
                {filteredEmojiCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t(cat.nameKey) || cat.nameEn}
                    </span>
                    <div className="grid grid-cols-8 gap-1.5">
                      {cat.emojis.map((emoji) => {
                        const iconId = `emoji:${emoji}`;
                        const isSelected = selectedIcon === iconId || selectedIcon === emoji;
                        return (
                          <Tooltip key={emoji}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIcon(iconId);
                                  setSelectedColor("");
                                }}
                                className={`h-9 w-9 rounded-xl border flex items-center justify-center text-lg transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/20 border-primary shadow-xs scale-105"
                                    : "border-border/40 hover:border-primary hover:bg-primary/10 hover:scale-105"
                                }`}
                              >
                                {emoji}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {emoji}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredEmojiCategories.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    {t("iconPicker.noMatchingIcons") || "No matching icons found"}
                  </div>
                )}
              </div>
            )}

            {activeTab === "lucide" && (
              <div className="space-y-4">
                {filteredLucideCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t(cat.nameKey) || cat.nameEn}
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {cat.items.map((item) => {
                        const iconId = `lucide:${item.name}`;
                        const IconComp = item.icon;
                        const isSelected = selectedIcon === iconId;
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedIcon(iconId)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer min-h-[58px] ${
                                  isSelected
                                    ? "bg-primary/20 border-primary text-primary font-semibold shadow-xs"
                                    : "border-border/60 bg-card hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <IconComp
                                  className="w-5 h-5 mb-1 shrink-0"
                                  style={{ color: isSelected && selectedColor ? selectedColor : undefined }}
                                />
                                <span className="text-[10px] truncate max-w-full leading-tight">{item.name}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredLucideCategories.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    {t("iconPicker.noMatchingIcons") || "No matching icons found"}
                  </div>
                )}
              </div>
            )}

            {activeTab === "tabler" && (
              <div className="space-y-4">
                {filteredTablerCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t(cat.nameKey) || cat.nameEn}
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {cat.items.map((item) => {
                        const iconId = `tabler:${item.name}`;
                        const IconComp = item.icon;
                        const isSelected = selectedIcon === iconId;
                        const displayName = item.name.replace(/^Icon/, "");
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedIcon(iconId)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer min-h-[58px] ${
                                  isSelected
                                    ? "bg-primary/20 border-primary text-primary font-semibold shadow-xs"
                                    : "border-border/60 bg-card hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <IconComp
                                  className="w-5 h-5 mb-1 shrink-0"
                                  style={{ color: isSelected && selectedColor ? selectedColor : undefined }}
                                />
                                <span className="text-[10px] truncate max-w-full leading-tight">{displayName}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {displayName}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredTablerCategories.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    {t("iconPicker.noMatchingIcons") || "No matching icons found"}
                  </div>
                )}
              </div>
            )}

            {activeTab === "phosphor" && (
              <div className="space-y-4">
                {filteredPhosphorCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t(cat.nameKey) || cat.nameEn}
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {cat.items.map((item) => {
                        const iconId = `ph:${item.name}`;
                        const IconComp = item.icon;
                        const isSelected = selectedIcon === iconId;
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedIcon(iconId)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer min-h-[58px] ${
                                  isSelected
                                    ? "bg-primary/20 border-primary text-primary font-semibold shadow-xs"
                                    : "border-border/60 bg-card hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <IconComp
                                  className="w-5 h-5 mb-1 shrink-0"
                                  style={{ color: isSelected && selectedColor ? selectedColor : undefined }}
                                />
                                <span className="text-[10px] truncate max-w-full leading-tight">{item.name}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredPhosphorCategories.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    {t("iconPicker.noMatchingIcons") || "No matching icons found"}
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipProvider>

        {/* Standard Modal Footer */}
        <DialogFooter className="gap-2 sm:justify-between pt-1">
          {initialIcon ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="rounded-xl border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground h-9 px-3.5 text-xs gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("iconPicker.removeIcon") || "Remove"}</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 px-4 text-xs cursor-pointer"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="rounded-xl h-9 px-4 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("common.save") || "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
