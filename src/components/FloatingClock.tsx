import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  GripHorizontal,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Plus,
  Trash2,
  Bell,
  Clock as ClockIcon,
  Timer as TimerIcon,
  Hourglass,
  Target,
  Volume2,
  VolumeX,
  Minus,
  Maximize2
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
import { Button } from "@/components/ui/button";

interface FloatingClockProps {
  isOpen: boolean;
  onClose: () => void;
  zIndex?: number;
  onFocusWindow?: () => void;
}

type Mode = "stopwatch" | "timer" | "alarm" | "pomodoro";

interface AlarmItem {
  id: string;
  time: string; // HH:mm
  label: string;
  enabled: boolean;
}

export default function FloatingClock({ isOpen, onClose, zIndex, onFocusWindow }: FloatingClockProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Mode>("stopwatch");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("notes_plus_clock_sound");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem("notes_plus_clock_sound", JSON.stringify(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Web Audio Chime Generator
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.15, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      });
    } catch {
      // Silent fallback
    }
  }, [soundEnabled]);

  // ----------------------------------------------------
  // 1. STOPWATCH STATE
  // ----------------------------------------------------
  const [swTime, setSwTime] = useState(0); // milliseconds
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (swRunning) {
      const startTime = Date.now() - swTime;
      swRef.current = setInterval(() => {
        setSwTime(Date.now() - startTime);
      }, 10);
    } else if (swRef.current) {
      clearInterval(swRef.current);
    }
    return () => {
      if (swRef.current) clearInterval(swRef.current);
    };
  }, [swRunning]);

  const handleSwReset = () => {
    setSwRunning(false);
    setSwTime(0);
    setSwLaps([]);
  };

  const handleSwLap = () => {
    if (swRunning) {
      setSwLaps((prev) => [swTime, ...prev]);
    }
  };

  const formatSwTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
  };

  // ----------------------------------------------------
  // 2. COUNTDOWN TIMER STATE
  // ----------------------------------------------------
  const [timerInitial, setTimerInitial] = useState(300); // default 5 mins (300s)
  const [timerLeft, setTimerLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, playChime]);

  const setPresetTimer = (secs: number) => {
    setTimerRunning(false);
    setTimerInitial(secs);
    setTimerLeft(secs);
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ----------------------------------------------------
  // 3. ALARM STATE
  // ----------------------------------------------------
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const saved = localStorage.getItem("notes_plus_clock_alarms");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [{ id: "1", time: "07:00", label: "Morning", enabled: false }];
  });

  useEffect(() => {
    try {
      localStorage.setItem("notes_plus_clock_alarms", JSON.stringify(alarms));
    } catch {
      // ignore
    }
  }, [alarms]);

  const [alarmHour, setAlarmHour] = useState("07");
  const [alarmMinute, setAlarmMinute] = useState("00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      const nowHm = `${h}:${m}`;
      setCurrentTimeStr(`${h}:${m}:${s}`);

      if (s === "00") {
        alarms.forEach((a) => {
          if (a.enabled && a.time === nowHm) {
            playChime();
          }
        });
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alarms, playChime]);

  const handleAddAlarm = () => {
    const timeStr = `${alarmHour}:${alarmMinute}`;
    setAlarms((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        time: timeStr,
        label: newAlarmLabel || (t("editor.alarm") || "Alarm"),
        enabled: true,
      },
    ]);
    setNewAlarmLabel("");
    setShowAddAlarm(false);
  };

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // ----------------------------------------------------
  // 4. POMODORO STATE
  // ----------------------------------------------------
  type PomoMode = "work" | "shortBreak" | "longBreak";
  const [pomoMode, setPomoMode] = useState<PomoMode>("work");
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSessions, setPomoSessions] = useState(0);
  const pomoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPomoDuration = (mode: PomoMode) => {
    switch (mode) {
      case "work":
        return 25 * 60;
      case "shortBreak":
        return 5 * 60;
      case "longBreak":
        return 15 * 60;
    }
  };

  const switchPomoMode = (mode: PomoMode) => {
    setPomoRunning(false);
    setPomoMode(mode);
    setPomoTimeLeft(getPomoDuration(mode));
  };

  useEffect(() => {
    if (pomoRunning) {
      pomoRef.current = setInterval(() => {
        setPomoTimeLeft((prev) => {
          if (prev <= 1) {
            setPomoRunning(false);
            playChime();
            if (pomoMode === "work") {
              const nextSessions = pomoSessions + 1;
              setPomoSessions(nextSessions);
              if (nextSessions % 4 === 0) {
                setPomoMode("longBreak");
                return 15 * 60;
              } else {
                setPomoMode("shortBreak");
                return 5 * 60;
              }
            } else {
              setPomoMode("work");
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (pomoRef.current) {
      clearInterval(pomoRef.current);
    }
    return () => {
      if (pomoRef.current) clearInterval(pomoRef.current);
    };
  }, [pomoRunning, pomoMode, pomoSessions, playChime]);

  if (!isOpen) return null;

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
          
          {/* Clickable time display to expand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {activeTab === "stopwatch" && <TimerIcon className="h-3.5 w-3.5 text-primary shrink-0" />}
                {activeTab === "timer" && <Hourglass className="h-3.5 w-3.5 text-primary shrink-0" />}
                {activeTab === "alarm" && <Bell className="h-3.5 w-3.5 text-primary shrink-0" />}
                {activeTab === "pomodoro" && <Target className="h-3.5 w-3.5 text-primary shrink-0" />}
                
                <span className="tabular-nums">
                  {activeTab === "stopwatch" && formatSwTime(swTime)}
                  {activeTab === "timer" && formatTimer(timerLeft)}
                  {activeTab === "alarm" && (currentTimeStr || "00:00:00")}
                  {activeTab === "pomodoro" && formatTimer(pomoTimeLeft)}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.expand") || "Expand"}</TooltipContent>
          </Tooltip>

          <div className="h-3 w-px bg-border/60 mx-0.5" />

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3 opacity-40" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{soundEnabled ? (t("editor.muteSound") || "Mute sound") : (t("editor.enableSound") || "Enable sound")}</TooltipContent>
            </Tooltip>

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
              <TooltipContent>{t("editor.expand") || "Expand"}</TooltipContent>
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
              <TooltipContent>{t("editor.close") || "Close"}</TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onPointerDown={onFocusWindow}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
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
            <span>{t("editor.clock") || "Clock & Timers"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 opacity-40" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{soundEnabled ? (t("editor.muteSound") || "Mute sound") : (t("editor.enableSound") || "Enable sound")}</TooltipContent>
            </Tooltip>

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
              <TooltipContent>{t("editor.minimize") || "Minimize"}</TooltipContent>
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

        {/* Tabs Navigation (Underline Style matching Image 2) */}
        <div className="flex items-center justify-between border-b border-border/40 mt-2 mb-3 px-0.5 pb-1.5 text-xs font-medium relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab("stopwatch")}
                className={`py-1 px-0.5 flex items-center gap-1 transition-colors relative cursor-pointer ${
                  activeTab === "stopwatch"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TimerIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t("editor.stopwatch") || "Stopwatch"}</span>
                {activeTab === "stopwatch" && (
                  <motion.div
                    layoutId="clockTabUnderline"
                    className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-primary rounded-full"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.stopwatch") || "Stopwatch"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab("timer")}
                className={`py-1 px-0.5 flex items-center gap-1 transition-colors relative cursor-pointer ${
                  activeTab === "timer"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Hourglass className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t("editor.timer") || "Timer"}</span>
                {activeTab === "timer" && (
                  <motion.div
                    layoutId="clockTabUnderline"
                    className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-primary rounded-full"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.timer") || "Timer"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab("alarm")}
                className={`py-1 px-0.5 flex items-center gap-1 transition-colors relative cursor-pointer ${
                  activeTab === "alarm"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bell className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t("editor.alarm") || "Alarm"}</span>
                {activeTab === "alarm" && (
                  <motion.div
                    layoutId="clockTabUnderline"
                    className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-primary rounded-full"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.alarm") || "Alarm"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab("pomodoro")}
                className={`py-1 px-0.5 flex items-center gap-1 transition-colors relative cursor-pointer ${
                  activeTab === "pomodoro"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Target className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t("editor.pomodoro") || "Pomodoro"}</span>
                {activeTab === "pomodoro" && (
                  <motion.div
                    layoutId="clockTabUnderline"
                    className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-primary rounded-full"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.pomodoro") || "Pomodoro"}</TooltipContent>
          </Tooltip>
        </div>

      {/* Mode Content */}
      <div className="pt-1 pb-0.5">
        {/* 1. STOPWATCH */}
        {activeTab === "stopwatch" && (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="text-3xl font-bold tracking-tight text-foreground my-1">
              {formatSwTime(swTime)}
            </div>

            <div className="flex items-center gap-2 my-0.5">
              <Button
                type="button"
                variant={swRunning ? "secondary" : "default"}
                size="sm"
                onClick={() => setSwRunning(!swRunning)}
                className={`h-8 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-xs ${
                  swRunning
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-0"
                    : ""
                }`}
              >
                {swRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                <span>{swRunning ? (t("editor.pause") || "Pause") : (t("editor.start") || "Start")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwLap}
                disabled={!swRunning}
                className="h-8 px-3 rounded-xl border-border/70 text-foreground disabled:opacity-40 flex items-center gap-1 text-xs font-medium cursor-pointer active:scale-95"
              >
                <Flag className="h-3 w-3" />
                <span>{t("editor.lap") || "Lap"}</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSwReset}
                    className="h-8 w-8 rounded-xl border-border/70 text-foreground flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.reset") || "Reset"}</TooltipContent>
              </Tooltip>
            </div>

            {/* Lap list */}
            {swLaps.length > 0 && (
              <div className="w-full max-h-24 overflow-y-auto no-scrollbar border-t border-border/40 pt-2 mt-0.5 flex flex-col gap-1 text-[11px]">
                {swLaps.map((lap, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2 py-0.5 rounded-md bg-foreground/[0.02]">
                    <span className="text-muted-foreground">{t("editor.lap") || "Lap"} {swLaps.length - idx}</span>
                    <span className="font-semibold">{formatSwTime(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. TIMER */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="text-3xl font-bold tracking-tight text-foreground my-1">
              {formatTimer(timerLeft)}
            </div>

            {/* Presets */}
            <div className="grid grid-cols-5 gap-0.5 p-0.5 bg-foreground/[0.04] rounded-xl text-[11px] font-medium w-full my-1">
              {[60, 300, 600, 900, 1800].map((secs) => (
                <button
                  key={secs}
                  type="button"
                  onClick={() => setPresetTimer(secs)}
                  className={`py-1 px-1 rounded-lg text-center flex items-center justify-center transition-all cursor-pointer ${
                    timerInitial === secs
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {secs / 60}m
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 my-0.5">
              <Button
                type="button"
                variant={timerRunning ? "secondary" : "default"}
                size="sm"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`h-8 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-xs ${
                  timerRunning
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-0"
                    : ""
                }`}
              >
                {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                <span>{timerRunning ? (t("editor.pause") || "Pause") : (t("editor.start") || "Start")}</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerLeft(timerInitial);
                    }}
                    className="h-8 w-8 rounded-xl border-border/70 text-foreground flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.reset") || "Reset"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* 3. ALARM */}
        {activeTab === "alarm" && (
          <div className="flex flex-col gap-2.5 py-1">
            <div className="flex justify-between items-center text-xs pb-0.5">
              <span className="text-muted-foreground flex items-center gap-1 font-semibold text-xs">
                <ClockIcon className="h-3.5 w-3.5" /> {currentTimeStr || "00:00:00"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddAlarm(!showAddAlarm)}
                className="h-7 px-2.5 rounded-xl border-border/70 text-foreground flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> {t("editor.add") || "Add"}
              </Button>
            </div>

            {showAddAlarm && (
              <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm text-xs my-0.5 animate-in fade-in-50 zoom-in-95 duration-150">
                {/* System Select Dropdowns (Hours & Minutes matching system font dropdown) */}
                <div className="flex items-center justify-center gap-3 py-1">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground font-semibold">{t("editor.hour") || "Hour"}</span>
                    <Select value={alarmHour} onValueChange={setAlarmHour}>
                      <SelectTrigger className="w-[84px] h-9 font-bold text-base bg-foreground/[0.04] hover:bg-foreground/[0.08] border-border/50 rounded-xl justify-between px-3">
                        <SelectValue placeholder="07" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 min-w-[84px]">
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                          <SelectItem key={h} value={h} showCheck={false} className="font-bold text-sm">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="font-bold text-xl text-muted-foreground/70 mt-4">:</span>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground font-semibold">{t("editor.minute") || "Minute"}</span>
                    <Select value={alarmMinute} onValueChange={setAlarmMinute}>
                      <SelectTrigger className="w-[84px] h-9 font-bold text-base bg-foreground/[0.04] hover:bg-foreground/[0.08] border-border/50 rounded-xl justify-between px-3">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 min-w-[84px]">
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                          <SelectItem key={m} value={m} showCheck={false} className="font-bold text-sm">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder={t("editor.alarmLabelPlaceholder") || "Alarm label (optional)"}
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  className="bg-foreground/[0.04] border border-border/50 rounded-xl px-3 py-2 outline-none text-foreground text-xs hover:border-primary/50 focus:border-primary focus:ring-0 shadow-none transition-all placeholder:text-muted-foreground/50"
                />

                <div className="flex gap-2 pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAlarm(false)}
                    className="h-9 flex-1 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t("editor.cancel") || "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddAlarm}
                    className="h-9 flex-1 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t("editor.saveAlarm") || "Save Alarm"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scrollbar pt-0.5">
              {alarms.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground/60">
                  {t("editor.noAlarms") || "No alarms set"}
                </div>
              ) : (
                alarms.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors border border-border/30 text-xs">
                    <div>
                      <div className="font-bold text-lg leading-tight text-foreground">{a.time}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAlarm(a.id)}
                        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                          a.enabled ? "bg-primary" : "bg-foreground/20"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            a.enabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => deleteAlarm(a.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.deleteAlarm") || "Delete alarm"}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. POMODORO */}
        {activeTab === "pomodoro" && (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-foreground/[0.04] rounded-xl text-[11px] font-medium w-full my-1">
              <button
                type="button"
                onClick={() => switchPomoMode("work")}
                className={`py-1 px-1.5 rounded-lg text-center flex items-center justify-center transition-all cursor-pointer ${
                  pomoMode === "work" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("editor.focus25m") || "Focus 25m"}
              </button>
              <button
                type="button"
                onClick={() => switchPomoMode("shortBreak")}
                className={`py-1 px-1.5 rounded-lg text-center flex items-center justify-center transition-all cursor-pointer ${
                  pomoMode === "shortBreak" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("editor.break5m") || "Break 5m"}
              </button>
              <button
                type="button"
                onClick={() => switchPomoMode("longBreak")}
                className={`py-1 px-1.5 rounded-lg text-center flex items-center justify-center transition-all cursor-pointer ${
                  pomoMode === "longBreak" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("editor.longBreak15m") || "Long 15m"}
              </button>
            </div>

            <div className="text-3xl font-bold tracking-tight text-foreground my-1">
              {formatTimer(pomoTimeLeft)}
            </div>

            <div className="text-[11px] text-muted-foreground font-medium my-0.5">
              {t("editor.completedSessions") || "Completed sessions:"} <span className="font-bold text-foreground">{pomoSessions}</span>
            </div>

            <div className="flex items-center gap-2 my-0.5">
              <Button
                type="button"
                variant={pomoRunning ? "secondary" : "default"}
                size="sm"
                onClick={() => setPomoRunning(!pomoRunning)}
                className={`h-8 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-xs ${
                  pomoRunning
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-0"
                    : ""
                }`}
              >
                {pomoRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                <span>{pomoRunning ? (t("editor.pause") || "Pause") : (t("editor.start") || "Start")}</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoTimeLeft(getPomoDuration(pomoMode));
                    }}
                    className="h-8 w-8 rounded-xl border-border/70 text-foreground flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.reset") || "Reset"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </TooltipProvider>
  );
}
