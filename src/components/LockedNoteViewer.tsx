import React, { useState, useRef, useEffect } from "react";
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getToolbarIcon } from "@/lib/iconPacks";
import { Note } from "@/hooks/useNotes";

interface LockedNoteViewerProps {
  note: Note;
  onUnlock: (pin: string) => Promise<boolean>;
}

export const LockedNoteViewer: React.FC<LockedNoteViewerProps> = ({ note, onUnlock }) => {
  const { t } = useTranslation();
  const { settings } = useAppSettings();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount or note change
  useEffect(() => {
    setDigits(["", "", "", "", "", ""]);
    setError(null);
    setLoading(false);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, [note.id]);

  const handleDigitChange = (index: number, val: string) => {
    setError(null);
    const clean = val.replace(/\D/g, "");

    // Handling paste of 6 digits
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split("");
      const nextDigits = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) nextDigits[i] = d;
      });
      setDigits(nextDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();

      if (nextDigits.every((d) => d !== "")) {
        attemptUnlock(nextDigits.join(""));
      }
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = clean;
    setDigits(nextDigits);

    // Auto-advance to next input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto submit
    if (clean && index === 5 && nextDigits.every((d) => d !== "")) {
      attemptUnlock(nextDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        setDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length === 6) {
        attemptUnlock(pin);
      }
    }
  };

  const attemptUnlock = async (pin: string) => {
    if (pin.length !== 6) {
      setError(t("pinLock.pinLengthError") || "PIN must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onUnlock(pin);
      if (!success) {
        triggerError();
      }
    } catch {
      triggerError();
    } finally {
      setLoading(false);
    }
  };

  const triggerError = () => {
    setError(t("pinLock.incorrectPin") || "Incorrect PIN. Please try again.");
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attemptUnlock(digits.join(""));
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background select-none animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col items-center text-center transition-transform duration-200 ${
          shake ? "ring-2 ring-destructive" : ""
        }`}
        style={{
          animation: shake ? "shake 0.4s cubic-bezier(.36,.07,.19,.97) both" : undefined,
        }}
      >
        {/* Lock Icon */}
        <div className="text-primary flex items-center justify-center mb-3">
          {(() => {
            const pack = settings?.iconPack || "lucide";
            const LockIcon = getToolbarIcon("lock", pack);
            return <LockIcon className="w-7 h-7" />;
          })()}
        </div>

        {/* Note Name & Heading */}
        <h2 className="text-base font-semibold text-foreground line-clamp-1 mb-1">
          {note.title || note.fileName || t("pinLock.unlockTitle") || "Protected Note"}
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs mb-5">
          {t("pinLock.unlockDesc") || "Enter your 6-digit PIN to decrypt and read this note."}
        </p>

        {/* 6 Digit Input Boxes */}
        <form onSubmit={handleFormSubmit} className="w-full flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-9 h-11 sm:w-10 sm:h-12 text-center text-lg font-mono font-medium rounded-xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-text disabled:opacity-50"
                autoComplete="off"
              />
            ))}
          </div>

          <div className="w-full flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? (t("pinLock.hidePin") || "Hide PIN") : (t("pinLock.showPin") || "Show PIN")}</span>
            </button>

            <span className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
              <span>AES-256</span>
            </span>
          </div>

          {error && (
            <div className="w-full p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || digits.some((d) => d === "")}
            className="w-full rounded-xl mt-1"
          >
            {loading ? <span>...</span> : (t("pinLock.unlockBtn") || "Unlock Note")}
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};
