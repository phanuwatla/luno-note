import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, GripHorizontal, Copy, Check } from "lucide-react";
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
  const { t } = useTranslation();
  const [display, setDisplay] = useState<string>("0");
  const [history, setHistory] = useState<string>("");
  const [prevOperand, setPrevOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewOperand, setWaitingForNewOperand] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

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
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [isOpen, handleDigit, handleDot, handleOperator, handleEquals, handleBackspace, onClose]);

  if (!isOpen) return null;

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
        className="fixed w-[240px] rounded-2xl border border-border/60 bg-card/95 p-3.5 shadow-md backdrop-blur-md select-none text-foreground"
        style={{ top: "15%", right: "12%", zIndex: zIndex ?? 50, fontFamily: "var(--app-font-family, inherit)" }}
      >
        {/* Window Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <GripHorizontal className="h-4 w-4 opacity-60" />
            <span>{t("editor.calculator") || "Calculator"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied!" : "Copy result"}</TooltipContent>
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
              <TooltipContent>{t("editor.close") || "Close"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

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
          className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base shadow-xs transition-all cursor-pointer active:scale-95"
        >
          =
        </button>
      </div>
    </motion.div>
  </TooltipProvider>
  );
}
