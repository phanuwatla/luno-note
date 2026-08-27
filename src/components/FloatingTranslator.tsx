import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  GripHorizontal,
  Copy,
  Check,
  Languages,
  ArrowLeftRight,
  CornerDownLeft,
  Volume2,
  Loader2,
  Minus,
  Maximize2,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingTranslatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onInsertTranslation?: (text: string) => void;
  zIndex?: number;
  onFocusWindow?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: "auto", nameEn: "Auto Detect", nameTh: "ตรวจจับอัตโนมัติ" },
  { code: "th", nameEn: "Thai", nameTh: "ไทย" },
  { code: "en", nameEn: "English", nameTh: "อังกฤษ" },
  { code: "zh-CN", nameEn: "Chinese", nameTh: "จีน" },
  { code: "ja", nameEn: "Japanese", nameTh: "ญี่ปุ่น" },
  { code: "ko", nameEn: "Korean", nameTh: "เกาหลี" },
  { code: "fr", nameEn: "French", nameTh: "ฝรั่งเศส" },
  { code: "de", nameEn: "German", nameTh: "เยอรมัน" },
  { code: "es", nameEn: "Spanish", nameTh: "สเปน" },
  { code: "vi", nameEn: "Vietnamese", nameTh: "เวียดนาม" },
  { code: "ru", nameEn: "Russian", nameTh: "รัสเซีย" },
  { code: "it", nameEn: "Italian", nameTh: "อิตาลี" },
  { code: "id", nameEn: "Indonesian", nameTh: "อินโดนีเซีย" },
  { code: "ar", nameEn: "Arabic", nameTh: "อาหรับ" },
];

export default function FloatingTranslator({
  isOpen,
  onClose,
  initialText = "",
  onInsertTranslation,
  zIndex = 50,
  onFocusWindow,
}: FloatingTranslatorProps) {
  const { t, language } = useTranslation();
  const isTh = language === "th";

  const [sourceLang, setSourceLang] = useState<string>("auto");
  const [targetLang, setTargetLang] = useState<string>(isTh ? "en" : "th");
  const [inputText, setInputText] = useState<string>(initialText);
  const [translatedText, setTranslatedText] = useState<string>("");
  const [detectedLang, setDetectedLang] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [speakingTarget, setSpeakingTarget] = useState<"source" | "target" | null>(null);
  const currentSpeakingTextRef = useRef<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initialText when opened
  useEffect(() => {
    if (isOpen && initialText) {
      setInputText(initialText);
      handleTranslate(initialText, sourceLang, targetLang);
    }
  }, [isOpen, initialText]);

  // Translate function using fast free Google GTX & MyMemory fallback
  const performTranslation = async (text: string, from: string, to: string): Promise<{ result: string; detected?: string }> => {
    if (!text.trim()) return { result: "" };

    const sl = from === "auto" ? "auto" : from;
    const tl = to;

    // 1. Google Translate GTX endpoint (fast, accurate, multi-sentence support)
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: abortControllerRef.current.signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const combined = data[0].map((item: unknown[]) => item[0]).filter(Boolean).join("");
          const detected = data[2] || (data[1] && typeof data[1] === "string" ? data[1] : undefined);
          return { result: combined, detected };
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") throw err;
      // fallback to next service
    }

    // 2. MyMemory fallback endpoint
    try {
      const pair = `${from === "auto" ? "autodetect" : from}|${to}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${encodeURIComponent(pair)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.responseData?.translatedText) {
          return { result: data.responseData.translatedText };
        }
      }
    } catch {
      // ignore
    }

    return { result: text };
  };

  const handleTranslate = useCallback(
    async (text: string, from: string, to: string) => {
      const clean = text.trim();
      if (!clean) {
        setTranslatedText("");
        setDetectedLang("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { result, detected } = await performTranslation(clean, from, to);
        setTranslatedText(result);
        if (detected) {
          const match = SUPPORTED_LANGUAGES.find((l) => l.code === detected);
          setDetectedLang(match ? (isTh ? match.nameTh : match.nameEn) : detected);
        } else {
          setDetectedLang("");
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Translation failed:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isTh],
  );

  // Trigger translation when typing with debouncing
  const handleInputChange = (val: string) => {
    setInputText(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!val.trim()) {
      setTranslatedText("");
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      handleTranslate(val, sourceLang, targetLang);
    }, 350);
  };

  // Swap Languages
  const handleSwap = () => {
    const nextSource = targetLang;
    const nextTarget = sourceLang === "auto" ? "en" : sourceLang;
    setSourceLang(nextSource);
    setTargetLang(nextTarget);

    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
      handleTranslate(translatedText, nextSource, nextTarget);
    } else if (inputText) {
      handleTranslate(inputText, nextSource, nextTarget);
    }
  };

  // Copy Translated Text
  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // Insert into Note
  const handleInsert = () => {
    if (!translatedText || !onInsertTranslation) return;
    onInsertTranslation(translatedText);
    setInserted(true);
    setTimeout(() => setInserted(false), 1500);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load voices for SpeechSynthesis (Chromium async voices initialization)
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        stopSpeaking();
      };
    }
    return () => {
      stopSpeaking();
    };
  }, []);

  const getBcp47Lang = (code: string, text: string): string => {
    let resolved = code;
    if (resolved === "auto") {
      if (/[\u0E00-\u0E7F]/.test(text)) resolved = "th";
      else if (/[\u4E00-\u9FFF]/.test(text)) resolved = "zh-CN";
      else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) resolved = "ja";
      else if (/[\uAC00-\uD7AF]/.test(text)) resolved = "ko";
      else if (/[\u0600-\u06FF]/.test(text)) resolved = "ar";
      else if (/[\u0400-\u04FF]/.test(text)) resolved = "ru";
      else resolved = "en";
    }

    const mapping: Record<string, string> = {
      th: "th-TH",
      en: "en-US",
      "zh-CN": "zh-CN",
      ja: "ja-JP",
      ko: "ko-KR",
      fr: "fr-FR",
      de: "de-DE",
      es: "es-ES",
      vi: "vi-VN",
      ru: "ru-RU",
      it: "it-IT",
      id: "id-ID",
      ar: "ar-SA",
    };
    return mapping[resolved] || resolved;
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    activeUtteranceRef.current = null;
    currentSpeakingTextRef.current = null;
    setSpeakingTarget(null);
  };

  // Text-to-Speech (Dual-Engine: High-Quality Online Google TTS with Native Web Speech fallback)
  const handleSpeak = (text: string, langCode: string, target: "source" | "target") => {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Toggle stop only if clicking the exact same speaker that is currently playing
    if (speakingTarget === target && currentSpeakingTextRef.current === cleanText) {
      stopSpeaking();
      return;
    }

    // Stop any existing speech and switch immediately to new target
    stopSpeaking();
    currentSpeakingTextRef.current = cleanText;
    setSpeakingTarget(target);

    const bcp47 = getBcp47Lang(langCode, cleanText);
    const shortLang = bcp47.split("-")[0];

    const playWithAudioFallback = () => {
      // Chunk text into <= 180 character pieces by sentence boundary
      const chunks: string[] = [];
      const rawSentences = cleanText.split(/([\n\r.!?。！？\u0E2F]+)/);
      let currentChunk = "";

      for (const piece of rawSentences) {
        if (!piece) continue;
        if ((currentChunk + piece).length <= 180) {
          currentChunk += piece;
        } else {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          if (piece.length <= 180) {
            currentChunk = piece;
          } else {
            for (let i = 0; i < piece.length; i += 180) {
              chunks.push(piece.slice(i, i + 180));
            }
            currentChunk = "";
          }
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      if (chunks.length === 0) chunks.push(cleanText.slice(0, 180));

      let currentIdx = 0;

      const electronAPI = (window as unknown as { electronAPI?: { fetchTtsAudio?: (data: { text: string; lang: string }) => Promise<string | null> } }).electronAPI;

      const playNextChunk = async () => {
        // Guard: check if speaking was cancelled or switched to another target mid-flight
        if (currentSpeakingTextRef.current !== cleanText) {
          return;
        }

        if (currentIdx >= chunks.length) {
          setSpeakingTarget(null);
          currentSpeakingTextRef.current = null;
          audioRef.current = null;
          return;
        }

        const chunk = chunks[currentIdx];
        let audioSrc: string | null = null;

        if (electronAPI?.fetchTtsAudio) {
          try {
            audioSrc = await electronAPI.fetchTtsAudio({ text: chunk, lang: shortLang });
          } catch (err) {
            console.warn("fetchTtsAudio in electron failed:", err);
          }
        }

        if (currentSpeakingTextRef.current !== cleanText) return;

        if (!audioSrc) {
          audioSrc = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${encodeURIComponent(shortLang)}&q=${encodeURIComponent(chunk)}`;
        }

        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onended = () => {
          if (currentSpeakingTextRef.current === cleanText) {
            currentIdx++;
            void playNextChunk();
          }
        };

        audio.onerror = () => {
          console.warn("Audio playback error for chunk:", currentIdx);
          if (currentSpeakingTextRef.current === cleanText) {
            currentIdx++;
            void playNextChunk();
          }
        };

        audio.play().catch((err) => {
          console.warn("Audio play blocked or failed:", err);
          if (currentSpeakingTextRef.current === cleanText) {
            setSpeakingTarget(null);
            currentSpeakingTextRef.current = null;
            audioRef.current = null;
          }
        });
      };

      void playNextChunk();
    };

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find((v) => {
          const vLang = v.lang.replace(/_/g, "-").toLowerCase();
          const targetVoice = bcp47.toLowerCase();
          const short = shortLang.toLowerCase();
          return (
            vLang === targetVoice ||
            vLang.startsWith(short + "-") ||
            vLang === short ||
            (short === "th" && (v.name.toLowerCase().includes("thai") || v.name.includes("ไทย")))
          );
        });

        // Only invoke Web Speech Synthesis if an actual voice for this language is installed
        if (matchedVoice) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = bcp47;
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.voice = matchedVoice;

          utterance.onstart = () => {
            if (currentSpeakingTextRef.current === cleanText) {
              setSpeakingTarget(target);
            }
          };

          utterance.onend = () => {
            if (currentSpeakingTextRef.current === cleanText) {
              setSpeakingTarget(null);
              currentSpeakingTextRef.current = null;
              activeUtteranceRef.current = null;
            }
          };

          utterance.onerror = (e) => {
            console.warn("SpeechSynthesis error, switching to audio fallback:", e);
            if (currentSpeakingTextRef.current === cleanText) {
              activeUtteranceRef.current = null;
              playWithAudioFallback();
            }
          };

          activeUtteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          return;
        }
      } catch (err) {
        console.warn("SpeechSynthesis check error:", err);
      }
    }

    // Fallback directly to Google TTS when no local OS voice is installed (e.g. Thai on Windows)
    playWithAudioFallback();
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // MINIMIZED FLOATING PILL
  // ----------------------------------------------------
  if (isMinimized) {
    return (
      <TooltipProvider delayDuration={150}>
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          onPointerDown={onFocusWindow}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed rounded-full border border-border/60 bg-card/95 px-3 py-1.5 shadow-md backdrop-blur-md select-none text-foreground flex items-center gap-2"
          data-floating-pill="true"
          style={{ top: "15%", right: "20%", zIndex: zIndex ?? 50, fontFamily: "var(--app-font-family, inherit)" }}
        >
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground opacity-60 cursor-grab active:cursor-grabbing shrink-0" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer max-w-[130px] truncate"
              >
                <Languages className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{inputText || t("editor.translator") || (isTh ? "แปลภาษา" : "Translator")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.expand") || (isTh ? "ขยาย" : "Expand")}</TooltipContent>
          </Tooltip>

          <div className="h-3 w-px bg-border/60 mx-0.5" />

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsMinimized(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.expand") || (isTh ? "ขยาย" : "Expand")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.close") || (isTh ? "ปิด" : "Close")}</TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

  // ----------------------------------------------------
  // FULL EXPANDED FLOATING WINDOW (Matches Calculator & Clock)
  // ----------------------------------------------------
  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onPointerDown={onFocusWindow}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed w-[320px] rounded-2xl border border-border/60 bg-card/95 p-3.5 shadow-md backdrop-blur-md select-none text-foreground"
        data-floating-window="true"
        style={{ top: "15%", right: "20%", zIndex: zIndex ?? 50, fontFamily: "var(--app-font-family, inherit)" }}
      >
        {/* Window Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <GripHorizontal className="h-4 w-4 opacity-60" />
            <span>{t("editor.translator") || (isTh ? "แปลภาษา" : "Translator")}</span>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{isTh ? "ย่อหน้าต่าง" : "Minimize"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.close") || (isTh ? "ปิด" : "Close")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-3 pt-3 text-xs">
          {/* Language Selection Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={sourceLang}
                onValueChange={(val) => {
                  setSourceLang(val);
                  if (inputText) handleTranslate(inputText, val, targetLang);
                }}
              >
                <SelectTrigger className="h-8 text-xs font-medium bg-foreground/[0.04] hover:bg-foreground/[0.08] border-border/50 rounded-xl px-2.5 shadow-2xs transition-colors">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs cursor-pointer">
                      {isTh ? lang.nameTh : lang.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={sourceLang === "auto"}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{isTh ? "สลับภาษา" : "Swap"}</TooltipContent>
            </Tooltip>

            <div className="flex-1">
              <Select
                value={targetLang}
                onValueChange={(val) => {
                  setTargetLang(val);
                  if (inputText) handleTranslate(inputText, sourceLang, val);
                }}
              >
                <SelectTrigger className="h-8 text-xs font-medium bg-foreground/[0.04] hover:bg-foreground/[0.08] border-border/50 rounded-xl px-2.5 shadow-2xs transition-colors">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs cursor-pointer">
                      {isTh ? lang.nameTh : lang.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Source Text Input */}
          <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-2.5 transition-all focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={isTh ? "พิมพ์หรือวางข้อความที่ต้องการแปล..." : "Type or paste text to translate..."}
              rows={2}
              className="w-full resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed min-h-[50px]"
            />
            <div className="flex items-center justify-between pt-1.5 border-t border-border/30 text-[11px] text-muted-foreground">
              <span>
                {detectedLang && sourceLang === "auto"
                  ? `${detectedLang}`
                  : `${inputText.length} ${isTh ? "ตัวอักษร" : "chars"}`}
              </span>
              <div className="flex items-center gap-1">
                {inputText && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(inputText, sourceLang, "source")}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      speakingTarget === "source"
                        ? "text-primary bg-primary/15 animate-pulse"
                        : "hover:text-foreground hover:bg-foreground/10"
                    }`}
                    title={speakingTarget === "source" ? (isTh ? "หยุดอ่าน" : "Stop") : (isTh ? "ฟังเสียง" : "Listen")}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setInputText("");
                      setTranslatedText("");
                    }}
                    className="p-1 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                    title={isTh ? "ล้างข้อความ" : "Clear"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Translation Result Output (Only shown when translating or result available) */}
          {(isLoading || translatedText) && (
            <div className="rounded-xl border border-border/50 bg-foreground/[0.04] p-2.5 min-h-[64px] flex flex-col justify-between shadow-2xs">
              {isLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground gap-2 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{isTh ? "กำลังแปลภาษา..." : "Translating..."}</span>
                </div>
              ) : (
                <>
                  <div className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap select-text font-normal">
                    {translatedText}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => handleSpeak(translatedText, targetLang, "target")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                        speakingTarget === "target"
                          ? "text-primary bg-primary/15 font-medium animate-pulse"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08]"
                      }`}
                      title={speakingTarget === "target" ? (isTh ? "หยุดอ่าน" : "Stop") : (isTh ? "ฟังเสียง" : "Listen")}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>{speakingTarget === "target" ? (isTh ? "กำลังอ่าน..." : "Playing...") : (isTh ? "ฟังเสียง" : "Listen")}</span>
                    </button>

                    <div className="flex items-center gap-0.5">
                      {onInsertTranslation && (
                        <button
                          type="button"
                          onClick={handleInsert}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-colors cursor-pointer"
                        >
                          {inserted ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <CornerDownLeft className="h-3.5 w-3.5" />}
                          <span>{inserted ? (isTh ? "แทรกแล้ว" : "Inserted") : (isTh ? "แทรกลงโน้ต" : "Insert")}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? (isTh ? "คัดลอกแล้ว" : "Copied") : (isTh ? "คัดลอก" : "Copy")}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
