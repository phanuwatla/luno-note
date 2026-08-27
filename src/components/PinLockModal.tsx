import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Key, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Note } from "@/hooks/useNotes";

export type PinLockModalMode = "set" | "remove" | "change";

interface PinLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  mode: PinLockModalMode;
  onConfirmSetPin: (noteId: string, pin: string) => Promise<void>;
  onConfirmRemovePin: (noteId: string, pin: string) => Promise<void>;
  onConfirmChangePin: (noteId: string, currentPin: string, newPin: string) => Promise<void>;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  open,
  onOpenChange,
  note,
  mode,
  onConfirmSetPin,
  onConfirmRemovePin,
  onConfirmChangePin,
}) => {
  const { t } = useTranslation();

  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentPin("");
      setPin("");
      setConfirmPin("");
      setError(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, mode]);

  if (!note) return null;

  const handleDigitsOnly = (val: string, maxLen = 6) => {
    return val.replace(/\D/g, "").slice(0, maxLen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "set") {
      if (pin.length !== 6) {
        setError(t("pinLock.pinLengthError") || "PIN must be exactly 6 digits.");
        return;
      }
      if (pin !== confirmPin) {
        setError(t("pinLock.pinMismatch") || "PIN confirmation does not match.");
        return;
      }

      setLoading(true);
      try {
        await onConfirmSetPin(note.id, pin);
        onOpenChange(false);
      } catch (err: any) {
        setError(err.message || "Failed to set PIN");
      } finally {
        setLoading(false);
      }
    } else if (mode === "remove") {
      if (currentPin.length !== 6) {
        setError(t("pinLock.pinLengthError") || "PIN must be exactly 6 digits.");
        return;
      }

      setLoading(true);
      try {
        await onConfirmRemovePin(note.id, currentPin);
        onOpenChange(false);
      } catch (err: any) {
        if (err.message === "INCORRECT_PIN") {
          setError(t("pinLock.incorrectPin") || "Incorrect PIN. Please try again.");
        } else {
          setError(err.message || "Failed to remove PIN");
        }
      } finally {
        setLoading(false);
      }
    } else if (mode === "change") {
      if (currentPin.length !== 6) {
        setError(t("pinLock.pinLengthError") || "Current PIN must be 6 digits.");
        return;
      }
      if (pin.length !== 6) {
        setError(t("pinLock.pinLengthError") || "New PIN must be 6 digits.");
        return;
      }
      if (pin !== confirmPin) {
        setError(t("pinLock.pinMismatch") || "New PIN confirmation does not match.");
        return;
      }

      setLoading(true);
      try {
        await onConfirmChangePin(note.id, currentPin, pin);
        onOpenChange(false);
      } catch (err: any) {
        if (err.message === "INCORRECT_PIN") {
          setError(t("pinLock.incorrectPin") || "Incorrect current PIN. Please try again.");
        } else {
          setError(err.message || "Failed to change PIN");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "set"
              ? t("pinLock.lockTitle") || "Lock Note with PIN"
              : mode === "remove"
              ? t("pinLock.removeLockTitle") || "Remove PIN"
              : t("pinLock.changePinTitle") || "Change PIN"}
          </DialogTitle>
          <DialogDescription>
            {mode === "set"
              ? t("pinLock.lockDesc") || "Set a 6-digit PIN to encrypt this note with AES-256."
              : mode === "remove"
              ? t("pinLock.removeLockDesc") || "Enter your current 6-digit PIN to remove protection from this note."
              : t("pinLock.changePinDesc") || "Enter your current PIN and choose a new 6-digit PIN."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {mode === "change" || mode === "remove" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t("pinLock.currentPin") || "Current 6-Digit PIN"}
              </label>
              <input
                ref={mode !== "set" ? inputRef : undefined}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(handleDigitsOnly(e.target.value))}
                placeholder="••••••"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground tracking-widest outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                autoComplete="off"
              />
            </div>
          ) : null}

          {mode === "set" || mode === "change" ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {mode === "change" ? (t("pinLock.newPin") || "New 6-Digit PIN") : (t("pinLock.enterPin") || "6-Digit PIN")}
                </label>
                <input
                  ref={mode === "set" ? inputRef : undefined}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(handleDigitsOnly(e.target.value))}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground tracking-widest outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {mode === "change" ? (t("pinLock.confirmNewPin") || "Confirm New PIN") : (t("pinLock.confirmPin") || "Confirm PIN")}
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(handleDigitsOnly(e.target.value))}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground tracking-widest outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                  autoComplete="off"
                />
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer select-none transition-colors"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? (t("pinLock.hidePin") || "Hide PIN") : (t("pinLock.showPin") || "Show PIN")}</span>
            </button>
            <span className="text-[11px] text-muted-foreground/70">AES-GCM 256-bit</span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span>...</span>
              ) : mode === "set" ? (
                t("pinLock.setPinBtn") || "Lock Note"
              ) : mode === "remove" ? (
                t("pinLock.removeLockBtn") || "Remove PIN"
              ) : (
                t("pinLock.changePinBtn") || "Update PIN"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
