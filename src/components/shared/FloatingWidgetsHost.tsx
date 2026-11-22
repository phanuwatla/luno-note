import React, { useState, useEffect, useCallback, useRef } from "react";
import FloatingCalculator from "@/components/FloatingCalculator";
import FloatingClock from "@/components/FloatingClock";
import FloatingTranslator from "@/components/FloatingTranslator";
import FloatingAudioRecorder from "@/components/FloatingAudioRecorder";

export interface FloatingWidgetsHostProps {
  rootDirHandle?: FileSystemDirectoryHandle | null;
}

type FloatingWidgetKey = "calculator" | "clock" | "translator" | "audio";

/**
 * Single root-level host for all 4 floating utility widgets (LN-ARCH-02 / H-07).
 * Mounted once inside Index.tsx so Split View never duplicates floating widgets
 * and tab switching preserves active timers, calculations, translations, and recordings.
 */
export function FloatingWidgetsHost({ rootDirHandle }: FloatingWidgetsHostProps) {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const [audioRecorderOpen, setAudioRecorderOpen] = useState(false);

  const [translatorInitialText, setTranslatorInitialText] = useState("");
  const targetPaneIdRef = useRef<string | undefined>(undefined);

  // Maintain stacking order strictly inside floating z-index layer (40..49)
  const [stackOrder, setStackOrder] = useState<FloatingWidgetKey[]>([
    "calculator",
    "clock",
    "translator",
    "audio",
  ]);

  const bringToFront = useCallback((key: FloatingWidgetKey) => {
    setStackOrder((prev) => [...prev.filter((k) => k !== key), key]);
  }, []);

  const zIndexFor = useCallback(
    (key: FloatingWidgetKey) => {
      const idx = stackOrder.indexOf(key);
      return 41 + (idx >= 0 ? idx : 0);
    },
    [stackOrder],
  );

  useEffect(() => {
    const handleToggleCalc = () => {
      setCalculatorOpen((prev) => {
        const next = !prev;
        if (next) bringToFront("calculator");
        return next;
      });
    };

    const handleToggleClock = () => {
      setClockOpen((prev) => {
        const next = !prev;
        if (next) bringToFront("clock");
        return next;
      });
    };

    const handleToggleTranslator = (e: Event) => {
      const detail = (e as CustomEvent<{ initialText?: string; forceOpen?: boolean; paneId?: string }>).detail;
      if (detail?.paneId) {
        targetPaneIdRef.current = detail.paneId;
      }
      if (detail?.forceOpen) {
        if (typeof detail.initialText === "string") {
          setTranslatorInitialText(detail.initialText);
        }
        bringToFront("translator");
        setTranslatorOpen(true);
        return;
      }
      setTranslatorOpen((prev) => {
        const next = !prev;
        if (next) {
          if (typeof detail?.initialText === "string") {
            setTranslatorInitialText(detail.initialText);
          } else {
            setTranslatorInitialText("");
          }
          bringToFront("translator");
        }
        return next;
      });
    };

    const handleToggleAudioRecorder = (e: Event) => {
      const detail = (e as CustomEvent<{ paneId?: string }>).detail;
      if (detail?.paneId) {
        targetPaneIdRef.current = detail.paneId;
      }
      setAudioRecorderOpen((prev) => {
        const next = !prev;
        if (next) bringToFront("audio");
        return next;
      });
    };

    window.addEventListener("app:toggle-calculator", handleToggleCalc);
    window.addEventListener("app:toggle-clock", handleToggleClock);
    window.addEventListener("app:toggle-translator", handleToggleTranslator);
    window.addEventListener("app:toggle-audio-recorder", handleToggleAudioRecorder);

    return () => {
      window.removeEventListener("app:toggle-calculator", handleToggleCalc);
      window.removeEventListener("app:toggle-clock", handleToggleClock);
      window.removeEventListener("app:toggle-translator", handleToggleTranslator);
      window.removeEventListener("app:toggle-audio-recorder", handleToggleAudioRecorder);
    };
  }, [bringToFront]);

  const handleInsertTranslation = useCallback((text: string) => {
    if (!text) return;
    window.dispatchEvent(
      new CustomEvent("luno:insert-translation", {
        detail: { text, paneId: targetPaneIdRef.current },
      }),
    );
  }, []);

  const handleInsertAudio = useCallback(
    (audioData: { src: string; title: string; relativeSrc?: string; blob?: Blob }) => {
      window.dispatchEvent(
        new CustomEvent("luno:insert-audio", {
          detail: { ...audioData, paneId: targetPaneIdRef.current },
        }),
      );
    },
    [],
  );

  return (
    <>
      <FloatingCalculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        zIndex={zIndexFor("calculator")}
        onFocusWindow={() => bringToFront("calculator")}
      />

      <FloatingClock
        isOpen={clockOpen}
        onClose={() => setClockOpen(false)}
        zIndex={zIndexFor("clock")}
        onFocusWindow={() => bringToFront("clock")}
      />

      <FloatingTranslator
        isOpen={translatorOpen}
        onClose={() => setTranslatorOpen(false)}
        initialText={translatorInitialText}
        onInsertTranslation={handleInsertTranslation}
        zIndex={zIndexFor("translator")}
        onFocusWindow={() => bringToFront("translator")}
      />

      <FloatingAudioRecorder
        isOpen={audioRecorderOpen}
        onClose={() => setAudioRecorderOpen(false)}
        zIndex={zIndexFor("audio")}
        onFocusWindow={() => bringToFront("audio")}
        rootDirHandle={rootDirHandle}
        onInsertAudio={handleInsertAudio}
      />
    </>
  );
}

export default FloatingWidgetsHost;
