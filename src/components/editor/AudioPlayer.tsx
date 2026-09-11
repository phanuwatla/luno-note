import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

const WAVEFORM_BAR_HEIGHTS = [
  30, 45, 60, 40, 75, 90, 65, 35, 80, 95,
  70, 45, 85, 100, 60, 40, 70, 85, 50, 65,
  90, 75, 40, 80, 95, 60, 35, 70, 85, 55,
  75, 90, 65, 45, 85, 100, 70, 40, 60, 80,
  50, 70, 90, 65, 40, 75, 90, 55
];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "00:00";
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onDelete?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  className = "",
  onDelete,
  autoPlay = false,
}) => {
  const { t } = useTranslation();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        audio.currentTime = 1e101;
        const fixTime = () => {
          audio.removeEventListener("timeupdate", fixTime);
          audio.currentTime = 0;
          if (audio.duration && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        };
        audio.addEventListener("timeupdate", fixTime);
      }
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        if (duration > 0 && audio.currentTime >= duration) {
          audio.pause();
          audio.currentTime = 0;
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(audio.currentTime);
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    if (audio.readyState >= 1 && audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [isSeeking, src, duration, autoPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (duration > 0 && (audio.currentTime >= duration || audio.ended)) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio play error:", err);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, duration]);

  const handleWaveformScrub = (clientX: number) => {
    const container = waveformContainerRef.current;
    const audio = audioRef.current;
    if (!container || !audio || !duration || duration <= 0) return;
    const rect = container.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setCurrentTime(newTime);
    audio.currentTime = newTime;
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleDownload = () => {
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    const safeTitle = (title || "audio-file").replace(/[\\/:*?"<>|]/g, "_");
    link.download = safeTitle.endsWith(".webm") || safeTitle.endsWith(".wav") || safeTitle.endsWith(".mp3") || safeTitle.endsWith(".ogg") || safeTitle.endsWith(".m4a") || safeTitle.endsWith(".flac")
      ? safeTitle
      : `${safeTitle}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`flex items-center gap-2 rounded-xl border p-1.5 pl-2.5 pr-3 shadow-xs transition-all w-full max-w-[430px] border-border/70 bg-muted/40 hover:bg-muted/60 ${className}`}
      >
        <audio ref={audioRef} src={src} preload="metadata" />

        {/* Play/Pause Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              onClick={togglePlay}
              className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
        </Tooltip>

        {/* Interactive Waveform Scrubber with SVG */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={waveformContainerRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setIsSeeking(true);
                handleWaveformScrub(e.clientX);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleWaveformScrub(e.clientX);
              }}
              onPointerUp={() => setIsSeeking(false)}
              className="flex flex-1 items-center h-6 cursor-pointer select-none touch-none px-2"
            >
              <svg className="w-full h-5 overflow-visible" preserveAspectRatio="none">
                {WAVEFORM_BAR_HEIGHTS.map((heightPercent, index) => {
                  const xPercent = (index / (WAVEFORM_BAR_HEIGHTS.length - 1)) * 100;
                  const isPlayed = xPercent <= progressPercent;
                  const barHeight = Math.max(3, (heightPercent / 100) * 16);
                  const y1 = (20 - barHeight) / 2;
                  const y2 = y1 + barHeight;
                  return (
                    <line
                      key={index}
                      x1={`${xPercent}%`}
                      x2={`${xPercent}%`}
                      y1={y1}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className={`transition-colors ${
                        isPlayed ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                  );
                })}
              </svg>
            </div>
          </TooltipTrigger>
          <TooltipContent>{t("editor.seekAudio") || "Click or drag to seek"}</TooltipContent>
        </Tooltip>

        {/* Time Display */}
        <span className="shrink-0 tabular-nums text-[11px] font-medium text-muted-foreground">
          {isPlaying || currentTime > 0
            ? formatTime(Math.max(0, duration - currentTime))
            : formatTime(duration)}
        </span>

        {/* Right Actions: Speed, Download, Delete (if onDelete passed) */}
        <div className="flex items-center gap-0.5 shrink-0 border-l border-border/40 pl-1.5 ml-0.5">
          {/* Speed Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleSpeedChange}
                className="h-6 px-1 rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors cursor-pointer"
              >
                {playbackRate}x
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.audioSpeed") || "Playback speed"}</TooltipContent>
          </Tooltip>

          {/* Download */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleDownload}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors cursor-pointer"
              >
                <Download className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.audioDownload") || "Download"}</TooltipContent>
          </Tooltip>

          {/* Delete (only if onDelete handler provided) */}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("common.delete") || "Delete"}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AudioPlayer;
