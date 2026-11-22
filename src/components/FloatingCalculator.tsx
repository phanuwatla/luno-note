import React, { useState, useEffect, useCallback } from "react";
import { FloatingWindow } from "@/components/shared/FloatingWindow";
import { X, GripHorizontal, Copy, Check, Minus, Maximize2, Calculator } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertResult?: (result: string) => void;
  zIndex?: number;
  onFocusWindow?: () => void;
}

export default function FloatingCalculator({
  isOpen,
  onClose,
  onInsertResult,
  zIndex,
  onFocusWindow,
}: FloatingCalculatorProps) {
  const { t, language } = useTranslation();
  const isTh = language === "th";
  const [display, setDisplay] = useState<string>("0");
  const [history, setHistory] = useState<string>("");
  const [prevOperand, setPrevOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewOperand, setWaitingForNewOperand] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "×":
      case "*":
        return first * second;
      case "÷":
      case "/":
        return second === 0 ? 0 : first / second;
      default:
        return second;
    }
  };

  const handleDigit = useCallback((digit: string) => {
    if (waitingForNewOperand) {
      setDisplay(digit);
      setWaitingForNewOperand(false);
    } else {
      setDisplay((prev) => (prev === "0" ? digit : prev + digit));
    }
  }, [waitingForNewOperand]);

  const handleDot = useCallback(() => {
    if (waitingForNewOperand) {
      setDisplay("0.");
      setWaitingForNewOperand(false);
    } else if (!display.includes(".")) {
      setDisplay((prev) => prev + ".");
    }
  }, [display, waitingForNewOperand]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setHistory("");
    setPrevOperand(null);
    setOperator(null);
    setWaitingForNewOperand(false);
  }, []);

  const handleToggleSign = useCallback(() => {
    const val = parseFloat(display);
    if (!isNaN(val) && val !== 0) {
      setDisplay(String(-val));
    }
  }, [display]);

  const handlePercentage = useCallback(() => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(val / 100));
    }
  }, [display]);

  const handleOperator = useCallback((nextOp: string) => {
    const inputValue = parseFloat(display);

    if (prevOperand === null) {
      setPrevOperand(inputValue);
      setHistory(`${inputValue} ${nextOp}`);
    } else if (operator && !waitingForNewOperand) {
      const result = calculate(prevOperand, inputValue, operator);
      setPrevOperand(result);
      setDisplay(String(result));
      setHistory(`${result} ${nextOp}`);
    } else {
      setHistory(`${prevOperand} ${nextOp}`);
    }

    setOperator(nextOp);
    setWaitingForNewOperand(true);
  }, [display, operator, prevOperand, waitingForNewOperand]);

  const handleEquals = useCallback(() => {
    const inputValue = parseFloat(display);

    if (operator && prevOperand !== null) {
      const result = calculate(prevOperand, inputValue, operator);
      setDisplay(String(result));
      setHistory(`${prevOperand} ${operator} ${inputValue} =`);
      setPrevOperand(null);
      setOperator(null);
      setWaitingForNewOperand(true);
    }
  }, [display, operator, prevOperand]);

  const handleBackspace = useCallback(() => {
    if (waitingForNewOperand) return;
    setDisplay((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-"))) {
        return "0";
      }
      return prev.slice(0, -1);
    });
  }, [waitingForNewOperand]);

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Keyboard navigation listener
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [data-radix-popper-content-wrapper]')) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable || target?.closest?.('[contenteditable="true"], .ProseMirror, .cm-editor'));
      if (isEditable) return;

      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === ".") {
        handleDot();
      } else if (e.key === "+") {
        handleOperator("+");
      } else if (e.key === "-") {
        handleOperator("-");
      } else if (e.key === "*") {
        handleOperator("×");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMinimized, handleDigit, handleDot, handleOperator, handleEquals, handleBackspace, onClose]);

  return (
    <FloatingWindow
      isOpen={isOpen}
      isMinimized={isMinimized}
      onToggleMinimize={() => setIsMinimized((prev) => !prev)}
      onClose={onClose}
      zIndex={zIndex}
      onFocusWindow={onFocusWindow}
      title={t("editor.calculator")}
      defaultPosition={{ top: "12%", right: "6%" }}
      widthClassName="w-[240px]"
      minimizeTooltip={t("editor.minimize")}
      expandTooltip={t("editor.expand")}
      closeTooltip={t("editor.close")}
      minimizedContent={
        <>
          <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="tabular-nums font-semibold">{display || "0"}</span>
        </>
      }
      minimizedExtra={
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {copied ? (t("lunoAi.copied")) : (t("calculator.copyResult"))}
          </TooltipContent>
        </Tooltip>
      }
      headerExtra={
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {copied ? (t("lunoAi.copied")) : (t("calculator.copyResult"))}
          </TooltipContent>
        </Tooltip>
      }
    >
        {/* Screen Display */}
        <div className="py-3 px-2 flex flex-col justify-end text-right min-h-[72px]">
          <div className="text-xs text-primary/80 tracking-tight overflow-x-auto no-scrollbar min-h-[1.25rem]">
            {history || "\u00A0"}
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground overflow-x-auto no-scrollbar">
            {display}
          </div>
        </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-4 gap-1.5 pt-1 text-sm font-medium">
        {/* Row 1 */}
        <button
          type="button"
          onClick={handleClear}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground transition-all font-semibold cursor-pointer active:scale-95"
        >
          C
        </button>
        <button
          type="button"
          onClick={handleToggleSign}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground transition-all font-semibold cursor-pointer active:scale-95"
        >
          +/-
        </button>
        <button
          type="button"
          onClick={handlePercentage}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground transition-all font-semibold cursor-pointer active:scale-95"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => handleOperator("÷")}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-primary/15 text-primary font-semibold text-base transition-all cursor-pointer active:scale-95"
        >
          ÷
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => handleDigit("7")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleDigit("8")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleDigit("9")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleOperator("×")}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-primary/15 text-primary font-semibold text-base transition-all cursor-pointer active:scale-95"
        >
          ×
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => handleDigit("4")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleDigit("5")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleDigit("6")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleOperator("-")}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-primary/15 text-primary font-semibold text-base transition-all cursor-pointer active:scale-95"
        >
          -
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => handleDigit("1")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleDigit("2")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleDigit("3")}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => handleOperator("+")}
          className="h-10 rounded-xl bg-foreground/[0.05] hover:bg-primary/15 text-primary font-semibold text-base transition-all cursor-pointer active:scale-95"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="col-span-2 h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-medium transition-all cursor-pointer active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDot}
          className="h-10 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground font-semibold transition-all cursor-pointer active:scale-95"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base shadow-sm transition-all cursor-pointer active:scale-95"
        >
          =
        </button>
      </div>
    </FloatingWindow>
  );
}
