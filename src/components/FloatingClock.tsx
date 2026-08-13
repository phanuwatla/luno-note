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
  VolumeX
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface FloatingClockProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "stopwatch" | "timer" | "alarm" | "pomodoro";

interface AlarmItem {
  id: string;
  time: string; // HH:mm
  label: string;
  enabled: boolean;
}

export default function FloatingClock({ isOpen, onClose }: FloatingClockProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Mode>("stopwatch");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

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
  const [alarms, setAlarms] = useState<AlarmItem[]>([
    { id: "1", time: "07:00", label: "Morning", enabled: false },
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
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
    if (!newAlarmTime) return;
    setAlarms((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        time: newAlarmTime,
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

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed z-50 w-[260px] rounded-2xl border border-border/60 bg-card/95 p-3 shadow-md backdrop-blur-md select-none text-foreground"
      style={{ top: "15%", right: "20%", fontFamily: "var(--app-font-family, inherit)" }}
    >
      {/* Window Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <GripHorizontal className="h-4 w-4 opacity-60" />
          <span>{t("editor.clock") || "Clock & Timers"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 opacity-40" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-4 gap-0.5 p-1 bg-foreground/[0.04] rounded-xl my-2 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("stopwatch")}
          className={`py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "stopwatch"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={t("editor.stopwatch") || "Stopwatch"}
        >
          <TimerIcon className="h-3 w-3 shrink-0" />
          <span className="truncate text-[11px]">{t("editor.stopwatch") || "Stopwatch"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("timer")}
          className={`py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "timer"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={t("editor.timer") || "Timer"}
        >
          <Hourglass className="h-3 w-3 shrink-0" />
          <span className="truncate text-[11px]">{t("editor.timer") || "Timer"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alarm")}
          className={`py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "alarm"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={t("editor.alarm") || "Alarm"}
        >
          <Bell className="h-3 w-3 shrink-0" />
          <span className="truncate text-[11px]">{t("editor.alarm") || "Alarm"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pomodoro")}
          className={`py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "pomodoro"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={t("editor.pomodoro") || "Pomodoro"}
        >
          <Target className="h-3 w-3 shrink-0" />
          <span className="truncate text-[11px]">{t("editor.pomodoro") || "Pomodoro"}</span>
        </button>
      </div>

      {/* Mode Content */}
      <div className="pt-1">
        {/* 1. STOPWATCH */}
        {activeTab === "stopwatch" && (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {formatSwTime(swTime)}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSwRunning(!swRunning)}
                className={`h-9 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  swRunning
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                }`}
              >
                {swRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>{swRunning ? (t("editor.pause") || "Pause") : (t("editor.start") || "Start")}</span>
              </button>

              <button
                type="button"
                onClick={handleSwLap}
                disabled={!swRunning}
                className="h-9 px-3 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground disabled:opacity-40 flex items-center gap-1 text-xs font-medium transition-all cursor-pointer active:scale-95"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{t("editor.lap") || "Lap"}</span>
              </button>

              <button
                type="button"
                onClick={handleSwReset}
                className="h-9 w-9 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={t("editor.reset") || "Reset"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lap list */}
            {swLaps.length > 0 && (
              <div className="w-full max-h-28 overflow-y-auto no-scrollbar border-t border-border/40 pt-1.5 flex flex-col gap-1 text-xs">
                {swLaps.map((lap, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2 py-1 rounded-md bg-foreground/[0.02]">
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
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {formatTimer(timerLeft)}
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full justify-center">
              {[60, 300, 600, 900, 1800].map((secs) => (
                <button
                  key={secs}
                  type="button"
                  onClick={() => setPresetTimer(secs)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    timerInitial === secs
                      ? "bg-foreground/15 text-foreground font-semibold"
                      : "bg-foreground/[0.03] hover:bg-foreground/[0.08] text-muted-foreground"
                  }`}
                >
                  {secs / 60}m
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`h-9 px-5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  timerRunning
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                }`}
              >
                {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>{timerRunning ? (t("editor.pause") || "Pause") : (t("editor.start") || "Start")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerLeft(timerInitial);
                }}
                className="h-9 w-9 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={t("editor.reset") || "Reset"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. ALARM */}
        {activeTab === "alarm" && (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                <ClockIcon className="h-3.5 w-3.5" /> {currentTimeStr || "00:00:00"}
              </span>
              <button
                type="button"
                onClick={() => setShowAddAlarm(!showAddAlarm)}
                className="px-2 py-1 rounded-lg bg-foreground/[0.05] hover:bg-foreground/10 text-foreground flex items-center gap-1 text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> {t("editor.add") || "Add"}
              </button>
            </div>

            {showAddAlarm && (
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-foreground/[0.03] border border-border/40 text-xs">
                <input
                  type="time"
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  className="bg-card border border-border/60 rounded-lg px-2.5 py-1 outline-none text-foreground text-center font-semibold text-sm"
                />
                <input
                  type="text"
                  placeholder={t("editor.alarmLabelPlaceholder") || "Alarm label (optional)"}
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  className="bg-card border border-border/60 rounded-lg px-2.5 py-1 outline-none text-foreground text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddAlarm}
                  className="py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-all cursor-pointer"
                >
                  {t("editor.saveAlarm") || "Save Alarm"}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {alarms.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground/60">
                  {t("editor.noAlarms") || "No alarms set"}
                </div>
              ) : (
                alarms.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-foreground/[0.03] text-xs">
                    <div>
                      <div className="font-bold text-base leading-none">{a.time}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{a.label}</div>
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
                      <button
                        type="button"
                        onClick={() => deleteAlarm(a.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
            <div className="flex gap-1 p-0.5 bg-foreground/[0.04] rounded-lg text-xs font-medium w-full justify-center">
              <button
                type="button"
                onClick={() => switchPomoMode("work")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  pomoMode === "work" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground"
                }`}
              >
                {t("editor.focus25m") || "Focus 25m"}
              </button>
              <button
                type="button"
                onClick={() => switchPomoMode("shortBreak")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  pomoMode === "shortBreak" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground"
                }`}
              >
                {t("editor.break5m") || "Break 5m"}
              </button>
              <button
                type="button"
                onClick={() => switchPomoMode("longBreak")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  pomoMode === "longBreak" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground"
                }`}
              >
                {t("editor.longBreak15m") || "Long 15m"}
              </button>
            </div>

            <div className="text-3xl font-bold tracking-tight text-foreground">
              {formatTimer(pomoTimeLeft)}
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              {t("editor.completedSessions") || "Completed sessions:"} <span className="font-bold text-foreground">{pomoSessions}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPomoRunning(!pomoRunning)}
                className={`h-9 px-5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  pomoRunning
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                }`}
              >
                {pomoRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>{pomoRunning ? (t("editor.pause") || "Pause") : (t("editor.start") || "Start")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPomoRunning(false);
                  setPomoTimeLeft(getPomoDuration(pomoMode));
                }}
                className="h-9 w-9 rounded-xl bg-foreground/[0.05] hover:bg-foreground/10 text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={t("editor.reset") || "Reset"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
