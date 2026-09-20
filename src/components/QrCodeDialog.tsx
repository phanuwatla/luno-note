import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  QrCode,
  Download,
  Copy,
  Check,
  ClipboardPaste,
  Palette,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import {
  generateQrCodeSvg,
  generateQrCodeDataUrl,
  downloadQrCodeImage,
  type QrErrorCorrectionLevel,
} from "@/lib/qrCode";
import { ICON_COLOR_PALETTE } from "@/lib/iconPacks";
import { useAppSettings } from "@/hooks/useAppSettings";

export interface QrCodeData {
  text: string;
  color: string;
  bgType: "white" | "transparent" | "dark";
  level: QrErrorCorrectionLevel;
}

export interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  onInsertQrCode?: (dataUrl: string, data?: QrCodeData) => void;
  onSaveQrCode?: (dataUrl: string, data?: QrCodeData) => void;
  initialText?: string;
  initialColor?: string;
  initialBgType?: "white" | "transparent" | "dark";
  initialLevel?: QrErrorCorrectionLevel;
}

function dataUrlToPngBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const base64 = parts[1] || parts[0];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: "image/png" });
}

export function QrCodeDialog({
  open,
  onOpenChange,
  mode = "create",
  onInsertQrCode,
  onSaveQrCode,
  initialText = "",
  initialColor = "#000000",
  initialBgType = "white",
  initialLevel = "M",
}: QrCodeDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings } = useAppSettings();

  const [text, setText] = useState(initialText);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<QrErrorCorrectionLevel>(initialLevel);
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [bgType, setBgType] = useState<"white" | "transparent" | "dark">(initialBgType);
  const [copied, setCopied] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

  // Focus textarea when opened
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Color Pagination items (20 items: 19 from ICON_COLOR_PALETTE + 1 Custom Palette button)
  const allColorItems = useMemo(() => {
    const items: Array<
      | { type: "preset"; id: string; label: string; color: string }
      | { type: "custom" }
    > = ICON_COLOR_PALETTE.map((pal) => ({
      type: "preset",
      id: pal.id,
      label: pal.label,
      color: pal.color || "#000000",
    }));
    items.push({ type: "custom" });
    return items;
  }, []);

  const COLOR_ITEMS_PER_PAGE = 10;
  const totalColorPages = Math.ceil(allColorItems.length / COLOR_ITEMS_PER_PAGE);
  const [colorPage, setColorPage] = useState(0);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setText(initialText || "");
      const initColor = initialColor || "#000000";
      setSelectedColor(initColor);
      setBgType(initialBgType || "white");
      setErrorCorrectionLevel(initialLevel || "M");
      setCopied(false);
      setIsInserting(false);

      const foundIdx = allColorItems.findIndex((item) => {
        if (item.type === "preset") {
          return item.color.toLowerCase() === initColor.toLowerCase();
        }
        return Boolean(
          initColor &&
            !ICON_COLOR_PALETTE.some(
              (p) => (p.color || "#000000").toLowerCase() === initColor.toLowerCase()
            )
        );
      });
      if (foundIdx >= 0) {
        setColorPage(Math.floor(foundIdx / COLOR_ITEMS_PER_PAGE));
      } else {
        setColorPage(0);
      }

      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 50);
    }
    prevOpenRef.current = open;
  }, [open, initialText, initialColor, initialBgType, initialLevel, allColorItems]);

  const currentColors = useMemo(() => {
    const start = colorPage * COLOR_ITEMS_PER_PAGE;
    return allColorItems.slice(start, start + COLOR_ITEMS_PER_PAGE);
  }, [allColorItems, colorPage]);

  const resolvedBgColor = useMemo(() => {
    if (bgType === "white") return "#ffffff";
    if (bgType === "transparent") return "transparent";
    return "#18181b";
  }, [bgType]);

  // Generate SVG preview string
  const qrSvg = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      return generateQrCodeSvg(trimmed, {
        errorCorrectionLevel,
        foregroundColor: selectedColor || "#000000",
        backgroundColor: resolvedBgColor,
        margin: 3,
        size: 260,
      });
    } catch {
      return null;
    }
  }, [text, errorCorrectionLevel, selectedColor, resolvedBgColor]);

  // Handle paste from clipboard (supports Electron native, Web Clipboard API, and DOM fallback)
  const handlePasteClipboard = async () => {
    try {
      let clipText = "";

      // 1. Electron Native API
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.readClipboardText) {
        try {
          const raw = await electronAPI.readClipboardText();
          if (raw && typeof raw === "string" && raw.trim()) {
            clipText = raw.trim();
          }
        } catch (e) {
          console.warn("electronAPI.readClipboardText error:", e);
        }
      }

      // 2. Web Clipboard API readText()
      if (!clipText && typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        try {
          const raw = await navigator.clipboard.readText();
          if (raw && raw.trim()) {
            clipText = raw.trim();
          }
        } catch (e) {
          console.warn("navigator.clipboard.readText failed:", e);
        }
      }

      // 3. Web Clipboard API read() items
      if (!clipText && typeof navigator !== "undefined" && navigator.clipboard?.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            if (item.types.includes("text/plain")) {
              const blob = await item.getType("text/plain");
              const txt = await blob.text();
              if (txt && txt.trim()) {
                clipText = txt.trim();
                break;
              }
            }
          }
        } catch (e) {
          console.warn("navigator.clipboard.read failed:", e);
        }
      }

      // 4. Fallback: focus textarea and document.execCommand
      if (!clipText && textareaRef.current) {
        textareaRef.current.focus();
        try {
          document.execCommand("paste");
          if (textareaRef.current.value && textareaRef.current.value.trim()) {
            clipText = textareaRef.current.value.trim();
          }
        } catch {}
      }

      if (clipText) {
        setText(clipText);
        toast({
          title: t("editor.qrPasteSuccess") || "Pasted from Clipboard",
          description: t("editor.qrPasteDesc") || `"${clipText.slice(0, 40)}${clipText.length > 40 ? "..." : ""}"`,
        });
        setTimeout(() => textareaRef.current?.focus(), 50);
      } else {
        textareaRef.current?.focus();
        toast({
          title: t("editor.qrContent") || "QR Content",
          description: t("editor.qrPasteEmptyDesc") || "Clipboard is empty or text could not be read. Press Ctrl+V inside the text box.",
        });
      }
    } catch (err) {
      console.warn("handlePasteClipboard error:", err);
      textareaRef.current?.focus();
      toast({
        title: t("common.error") || "Error",
        description: t("editor.qrPasteErrorDesc") || "Failed to read clipboard. Press Ctrl+V inside the text box.",
        variant: "destructive",
      });
    }
  };

  // Handle Copy QR Code image to clipboard (supports Electron native and Web ClipboardItem)
  const handleCopyImage = async () => {
    if (!text.trim()) return;
    try {
      const dataUrl = await generateQrCodeDataUrl(text.trim(), {
        errorCorrectionLevel,
        foregroundColor: selectedColor || "#000000",
        backgroundColor: bgType === "transparent" ? "transparent" : resolvedBgColor,
        size: 800,
        margin: 3,
      });

      let imageCopied = false;

      // 1. Electron Native Clipboard Image
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.writeClipboardImage) {
        try {
          const success = await electronAPI.writeClipboardImage(dataUrl);
          if (success !== false) {
            imageCopied = true;
          }
        } catch (e) {
          console.warn("electronAPI.writeClipboardImage failed:", e);
        }
      }

      // 2. Web Clipboard API (Blob -> ClipboardItem)
      if (!imageCopied && typeof navigator !== "undefined" && navigator.clipboard?.write) {
        try {
          const pngBlob = dataUrlToPngBlob(dataUrl);
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": pngBlob,
            }),
          ]);
          imageCopied = true;
        } catch (webErr) {
          console.warn("navigator.clipboard.write image failed:", webErr);
        }
      }

      if (imageCopied) {
        setCopied(true);
        toast({
          title: t("editor.qrCopiedToast") || "QR Code Copied",
          description: t("editor.qrCopyImageDesc") || "QR Code image is ready to paste anywhere.",
        });
        setTimeout(() => setCopied(false), 2500);
        return;
      }

      // 3. Fallback: Copy content text if image format unsupported
      if (electronAPI?.writeClipboardText) {
        await electronAPI.writeClipboardText(text.trim());
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text.trim());
      }
      setCopied(true);
      toast({
        title: t("editor.qrCopiedToast") || "QR Code Copied",
        description: t("editor.qrCopyTextDesc") || "QR Code content text copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("handleCopyImage error:", err);
      toast({
        title: t("common.error") || "Error",
        description: t("editor.qrCopyErrorDesc") || "Failed to copy QR Code image to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Handle Download PNG
  const handleDownload = async () => {
    if (!text.trim()) return;
    try {
      await downloadQrCodeImage(text.trim(), {
        filename: `qrcode-${Date.now()}.png`,
        errorCorrectionLevel,
        foregroundColor: selectedColor || "#000000",
        backgroundColor: bgType === "transparent" ? "transparent" : resolvedBgColor,
        size: 1024,
        margin: 3,
      });
      toast({
        title: t("editor.qrDownloadSuccess") || "QR Code Downloaded",
        description: t("editor.qrDownloadDesc") || "Saved QR Code as PNG image file.",
      });
    } catch {
      toast({
        title: t("common.error") || "Error",
        description: t("editor.qrDownloadErrorDesc") || "Failed to download QR Code image.",
        variant: "destructive",
      });
    }
  };

  // Handle Insert into Editor
  const handleInsert = async () => {
    if (!text.trim()) return;
    try {
      setIsInserting(true);
      const dataUrl = await generateQrCodeDataUrl(text.trim(), {
        errorCorrectionLevel,
        foregroundColor: selectedColor || "#000000",
        backgroundColor: bgType === "transparent" ? "transparent" : resolvedBgColor,
        size: 600,
        margin: 3,
      });

      const qrData: QrCodeData = {
        text: text.trim(),
        color: selectedColor || "#000000",
        bgType,
        level: errorCorrectionLevel,
      };

      if (mode === "edit" && onSaveQrCode) {
        onSaveQrCode(dataUrl, qrData);
      } else if (onInsertQrCode) {
        onInsertQrCode(dataUrl, qrData);
      } else if (onSaveQrCode) {
        onSaveQrCode(dataUrl, qrData);
      }

      onOpenChange(false);
      toast({
        title: mode === "edit"
          ? (t("editor.qrSaveSuccess") || "บันทึกคิวอาร์โค้ดแล้ว")
          : (t("editor.qrInsertSuccess") || "QR Code Inserted"),
        description: mode === "edit"
          ? (t("editor.qrSaveDesc") || "อัปเดตคิวอาร์โค้ดในโน้ตเรียบร้อยแล้ว")
          : (t("editor.qrInsertDesc") || "Inserted QR Code directly into your note."),
      });
    } catch {
      toast({
        title: t("common.error") || "Error",
        description: mode === "edit"
          ? (t("editor.qrSaveErrorDesc") || "เกิดข้อผิดพลาดในการบันทึกคิวอาร์โค้ด")
          : (t("editor.qrInsertErrorDesc") || "Failed to insert QR Code into note."),
        variant: "destructive",
      });
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[650px] rounded-2xl p-5 sm:p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? (t("editor.qrEditTitle") || "แก้ไขคิวอาร์โค้ด (QR Code)")
              : (t("editor.qrCodeGenerator") || "สร้างคิวอาร์โค้ด (QR Code)")}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? (t("editor.qrEditDesc") || "ปรับแต่งและแก้ไขคิวอาร์โค้ดในโน้ตของคุณ")
              : (t("editor.qrCodeDialogDesc") || "สร้างและปรับแต่งคิวอาร์โค้ดเพื่อแทรกลงในโน้ต")}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 py-1 min-w-0">
            {/* Left Column (Inputs & Controls) */}
            <div className="sm:col-span-7 space-y-3.5 min-w-0">
              {/* Text / URL Input */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <Label htmlFor="qr-content" className="text-xs font-semibold text-foreground">
                    {t("editor.qrContent") || "QR Content / URL"}
                  </Label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    <span>Paste</span>
                  </button>
                </div>
                <Textarea
                  ref={textareaRef}
                  id="qr-content"
                  placeholder={t("editor.qrContentPlaceholder") || "Enter URL or text (e.g. https://example.com)..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[85px] text-xs resize-none rounded-xl border-border bg-background focus:border-primary transition-colors"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                  <span>{t("editor.qrCharCount", { count: text.length }) || `${text.length} chars`}</span>
                  {text.length > 500 && (
                    <span className="text-amber-500 font-medium">Large payload</span>
                  )}
                </div>
              </div>

              {/* Color Swatches (Clean, Full-width without card container) */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("editor.qrFgColor") || "Foreground Color"}</span>
                  </Label>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground uppercase"
                    style={{ color: selectedColor }}
                  >
                    {selectedColor || "#000000"}
                  </span>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
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

                    {/* Color Swatches left-aligned with balanced spacing */}
                    <div className="flex items-center justify-start gap-2 flex-1 min-w-0 px-0.5">
                      {currentColors.map((item) => {
                        if (item.type === "preset") {
                          const isSelected =
                            selectedColor.toLowerCase() === item.color.toLowerCase();
                          const themeKey = `settings.theme${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`;
                          const translated = t(themeKey as any);
                          const label =
                            translated && translated !== themeKey ? translated : item.label;

                          return (
                            <Tooltip key={item.id}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setSelectedColor(item.color)}
                                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer shrink-0 flex items-center justify-center relative ${
                                    isSelected
                                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 opacity-100"
                                      : "opacity-80 hover:opacity-100 hover:scale-105 hover:border-primary"
                                  }`}
                                  style={{
                                    backgroundColor: item.color || "#000000",
                                    borderColor: item.color ? "transparent" : "var(--border)",
                                  }}
                                >
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-white drop-shadow-xs" />
                                  )}
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
                              (pal) =>
                                (pal.color || "#000000").toLowerCase() ===
                                selectedColor.toLowerCase()
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
                                      backgroundColor: isCustomSelected
                                        ? selectedColor
                                        : undefined,
                                      backgroundImage: !isCustomSelected
                                        ? "conic-gradient(from 0deg, #f43f5e, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #c084fc, #f43f5e)"
                                        : undefined,
                                    }}
                                    className={`w-5 h-5 rounded-full border border-transparent transition-all cursor-pointer shrink-0 flex items-center justify-center relative shadow-2xs ${
                                      isCustomSelected
                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 opacity-100"
                                        : "opacity-80 hover:opacity-100 hover:scale-105"
                                    }`}
                                  >
                                    <Palette className="w-2.5 h-2.5 text-white drop-shadow-md" />
                                  </button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {t("settings.themeCustom") || "Custom Color"}
                              </TooltipContent>
                            </Tooltip>
                            <PopoverContent
                              align="start"
                              className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md z-50"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-primary" />
                                    {t("settings.customAccentColor") || "Custom Color"}
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
                                        selectedColor &&
                                        /^#[0-9A-Fa-f]{6}$/.test(selectedColor)
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
                                    {t("settings.quickPresets") || "Quick Presets"}
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      "#000000",
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
                                    ].map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                        className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                                          selectedColor.toLowerCase() === color.toLowerCase()
                                            ? "ring-2 ring-primary ring-offset-1 scale-110"
                                            : "hover:scale-115 opacity-85 hover:opacity-100"
                                        }`}
                                      />
                                    ))}
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
                      onClick={() =>
                        setColorPage((p) => Math.min(totalColorPages - 1, p + 1))
                      }
                      disabled={colorPage === totalColorPages - 1}
                      className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
                      aria-label="Next color page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pagination Indicators (pill for active, round dots for inactive) */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
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
              </div>

              {/* Background & ECC Selectors */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5 min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-semibold text-foreground">
                    {t("editor.qrBgColor") || "Background"}
                  </Label>
                  <Select
                    value={bgType}
                    onValueChange={(val: "white" | "transparent" | "dark") => setBgType(val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs rounded-xl border-border bg-background px-3 text-left [&>span]:text-left [&>span]:truncate [&>span]:flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="white" className="text-xs">
                        {t("editor.qrBgWhite") || "White"}
                      </SelectItem>
                      <SelectItem value="transparent" className="text-xs">
                        {t("editor.qrBgTransparent") || "Transparent"}
                      </SelectItem>
                      <SelectItem value="dark" className="text-xs">
                        {t("editor.qrBgDark") || "Dark"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-semibold text-foreground">
                    {t("editor.qrErrorCorrection") || "ECC Level"}
                  </Label>
                  <Select
                    value={errorCorrectionLevel}
                    onValueChange={(val: QrErrorCorrectionLevel) => setErrorCorrectionLevel(val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs rounded-xl border-border bg-background px-3 text-left [&>span]:text-left [&>span]:truncate [&>span]:flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="L" className="text-xs">
                        {t("editor.qrEccLow") || "Low (7%)"}
                      </SelectItem>
                      <SelectItem value="M" className="text-xs">
                        {t("editor.qrEccMedium") || "Medium (15%)"}
                      </SelectItem>
                      <SelectItem value="Q" className="text-xs">
                        {t("editor.qrEccQuartile") || "Quartile (25%)"}
                      </SelectItem>
                      <SelectItem value="H" className="text-xs">
                        {t("editor.qrEccHigh") || "High (30%)"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column (Live Preview Card) */}
            <div className="sm:col-span-5 flex flex-col items-center justify-between bg-muted/40 border border-border/60 rounded-2xl p-4 min-w-0 gap-3">
              {/* Preview Header: Title on Left, Breadcrumb-style Action Icon Buttons on Right */}
              <div className="w-full flex items-center justify-between min-w-0">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </span>

                {/* Header Action Buttons (Copy Image & Download PNG with clear spacing) */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={!qrSvg}
                        onClick={handleCopyImage}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border/60 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                        aria-label="Copy QR Code Image"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={4} className="text-xs">
                      {copied ? (t("common.copied") || "Copied") : (t("editor.qrCopyImage") || "Copy Image")}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={!qrSvg}
                        onClick={handleDownload}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border/60 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                        aria-label="Download QR Code PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={4} className="text-xs">
                      {t("editor.qrDownloadPng") || "Download PNG"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* QR Preview Box - Square fitted and proportionate */}
              <div className="w-full flex-1 flex items-center justify-center py-1 min-h-[170px]">
                {qrSvg ? (
                  <div
                    className={`aspect-square w-full max-w-[200px] p-3 rounded-2xl border border-border/40 shadow-xs flex items-center justify-center transition-all ${
                      bgType === "transparent"
                        ? "border-dashed bg-muted/20"
                        : bgType === "dark"
                        ? "bg-zinc-950 text-white"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full max-w-[200px] rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center text-center p-4 text-muted-foreground/60 space-y-2 bg-background/50">
                    <QrCode className="h-10 w-10 stroke-[1.2] opacity-40" />
                    <span className="text-[11px] leading-tight px-1">
                      {t("editor.qrContentPlaceholder") || "Enter text or URL to preview"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:justify-between pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            {t("common.cancel") || "Cancel"}
          </Button>

          <Button
            type="button"
            disabled={!text.trim() || isInserting}
            onClick={handleInsert}
            className="rounded-xl font-medium"
          >
            {mode === "edit"
              ? (t("common.save") || "บันทึก")
              : (t("editor.qrInsertIntoNote") || "Insert into Note")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QrCodeDialog;
