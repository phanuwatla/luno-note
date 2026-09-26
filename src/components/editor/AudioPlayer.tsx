import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Download,
  Trash2,
  Copy,
  Scissors,
  ExternalLink,
  FolderOpen,
  Link as LinkIcon,
  Gauge,
  Repeat,
  Check,
  Volume1,
  Volume2,
  VolumeX,
  FileText,
  Folder,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuCheckboxItem,
} from "@/components/ui/context-menu";
import {
  copyTextToClipboard,
  copyMediaPath,
  openMediaFileInSystemApp,
  revealMediaFileInFolder,
  downloadMediaFile,
} from "./mediaContextMenuUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

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
  selected?: boolean;
  onDelete?: () => void;
  autoPlay?: boolean;
  onError?: () => void;
  dataRelativeSrc?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  className = "",
  selected = false,
  onDelete,
  autoPlay = false,
  onError,
  dataRelativeSrc,
}) => {
  const { t } = useTranslation();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState<number>(1);
  const [prevVolume, setPrevVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

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
        if (!isLooping && duration > 0 && audio.currentTime >= duration) {
          audio.pause();
          audio.currentTime = 0;
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(audio.currentTime);
        }
      }
      if (audio.buffered.length > 0) {
        setBufferedEnd(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      onError?.();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

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
      audio.removeEventListener("error", handleError);
    };
  }, [isSeeking, src, duration, autoPlay, onError, isLooping]);

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

  const toggleLoop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isLooping;
    audio.loop = next;
    setIsLooping(next);
  }, [isLooping]);

  const handleSeek = (clientX: number) => {
    const bar = progressBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setCurrentTime(newTime);
    audio.currentTime = newTime;
  };

  const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !duration || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(e.clientX - rect.left);
  };

  const handleVolumeChange = (newVol: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (audio) {
      audio.volume = clamped;
      audio.muted = clamped === 0;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.8;
      setVolume(restored);
      setIsMuted(false);
      audio.muted = false;
      audio.volume = restored;
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
      audio.muted = true;
    }
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
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <ContextMenu>
        <ContextMenuTrigger asChild onContextMenu={(e) => e.stopPropagation()}>
          <div
            className={`flex items-center rounded-xl border border-border/80 bg-background dark:bg-card text-foreground dark:text-white transition-colors overflow-hidden px-3 py-1.5 gap-2 sm:gap-2.5 shadow-sm w-full select-none ${
              selected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : ""
            } ${className}`}
          >
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play / Pause Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0 focus:outline-none focus-visible:outline-none"
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isPlaying ? (t("editor.videoPause") || "Pause") : (t("editor.videoPlay") || "Play")}
              </TooltipContent>
            </Tooltip>

            {/* Volume & Hover Slider */}
            <div className="group/vol flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus:text-primary"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isMuted ? (t("editor.videoUnmute") || "Unmute") : (t("editor.videoMute") || "Mute")}
                </TooltipContent>
              </Tooltip>

              {/* Volume Slider on Hover */}
              <div className="w-0 group-hover/vol:w-16 transition-all duration-200 overflow-hidden flex items-center">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 accent-primary cursor-pointer bg-muted-foreground/30 dark:bg-white/30 rounded-full"
                />
              </div>
            </div>

            {/* Time Display (Interface Font) */}
            <div className="tabular-nums text-muted-foreground dark:text-zinc-300 shrink-0 select-none text-[11px] flex items-center">
              <span className="text-foreground dark:text-white font-medium">{formatTime(currentTime)}</span>
              <span className="mx-0.5 opacity-50">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Scrubber Progress Bar */}
            <div
              ref={progressBarRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setIsSeeking(true);
                handleSeek(e.clientX);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleSeek(e.clientX);
                handleBarMouseMove(e);
              }}
              onPointerUp={() => setIsSeeking(false)}
              onMouseMove={handleBarMouseMove}
              onMouseLeave={() => {
                setHoverTime(null);
                setHoverPosition(null);
              }}
              className="group/bar relative flex-1 min-w-[30px] h-4 flex items-center cursor-pointer touch-none select-none mx-1"
            >
              {/* Hover Timestamp Tooltip */}
              {hoverTime !== null && hoverPosition !== null && (
                <div
                  className="absolute bottom-5 -translate-x-1/2 px-1.5 py-0.5 rounded bg-popover text-popover-foreground border border-border dark:bg-zinc-900 dark:text-white dark:border-zinc-800 text-[10px] font-medium shadow-md pointer-events-none tabular-nums"
                  style={{ left: `${hoverPosition}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              {/* Progress Background Track */}
              <div className="relative w-full rounded-full bg-muted-foreground/20 dark:bg-white/20 overflow-hidden transition-all duration-150 h-1 group-hover/bar:h-1.5">
                {/* Buffered Progress */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-muted-foreground/35 dark:bg-white/30 transition-all"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Played Progress */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Scrubber Head Thumb */}
              <div
                className="absolute rounded-full bg-primary border-2 border-background dark:border-card shadow-md scale-0 group-hover/bar:scale-100 transition-transform duration-150 h-2.5 w-2.5 -ml-1"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center shrink-0 gap-1.5 sm:gap-2">
              {/* Playback Rate */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSpeedChange}
                    className={`h-7 px-1.5 text-[11px] font-semibold transition-colors cursor-pointer rounded-md focus:outline-none focus-visible:outline-none ${
                      playbackRate !== 1
                        ? "text-primary hover:text-primary"
                        : "text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
                    }`}
                  >
                    {playbackRate}x
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.audioSpeed") || t("editor.videoSpeed") || "Playback speed"}
                </TooltipContent>
              </Tooltip>

              {/* Loop Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleLoop}
                    className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:outline-none ${
                      isLooping
                        ? "text-primary hover:text-primary"
                        : "text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
                    }`}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.audioLoop") || t("editor.videoLoop") || "Loop"}
                </TooltipContent>
              </Tooltip>

              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary focus:outline-none focus-visible:outline-none"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.audioDownload") || "Download"}
                </TooltipContent>
              </Tooltip>

              {/* Delete Button (only if onDelete handler provided) */}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:outline-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("common.delete") || "Delete"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56 rounded-xl">
          <ContextMenuItem onClick={togglePlay} className="gap-2.5">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            <span>{isPlaying ? (t("editor.videoPause") || "หยุดชั่วคราว") : (t("editor.videoPlay") || "เล่น")}</span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={toggleLoop}
            className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
              isLooping
                ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18"
                : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Repeat className={`h-4 w-4 shrink-0 ${isLooping ? "text-primary" : ""}`} />
              <span>{t("editor.audioLoop") || t("editor.videoLoop") || "เล่นวนซ้ำ"}</span>
            </div>
            {isLooping && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2.5">
              <Gauge className="h-4 w-4" />
              <span>{t("editor.audioSpeed") || "ความเร็วในการเล่น"} ({playbackRate}x)</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-36 rounded-xl">
              {[1, 1.25, 1.5, 2].map((rate) => (
                <ContextMenuCheckboxItem
                  key={rate}
                  checked={playbackRate === rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    if (audioRef.current) audioRef.current.playbackRate = rate;
                  }}
                >
                  {rate}x {rate === 1 && `(${t("editor.speedNormal") || "ปกติ"})`}
                </ContextMenuCheckboxItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => void openMediaFileInSystemApp(src, dataRelativeSrc)}
            className="gap-2.5"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t("editor.openInDefaultApp") || "เปิดในโปรแกรมเริ่มต้น"}</span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => void revealMediaFileInFolder(src, dataRelativeSrc)}
            className="gap-2.5"
          >
            <FolderOpen className="h-4 w-4" />
            <span>{t("editor.revealInFolder") || "แสดงในโฟลเดอร์"}</span>
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2.5">
              <LinkIcon className="h-4 w-4" />
              <span>{t("editor.copyAudioPath") || "คัดลอกพาธไฟล์เสียง"}</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 rounded-xl">
              <ContextMenuItem
                onClick={() => {
                  void copyMediaPath(src, dataRelativeSrc, "relative", {
                    title: t("editor.copiedRelativePath") || "คัดลอกพาธสัมพัทธ์แล้ว",
                  });
                }}
                className="gap-2.5 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>{t("editor.copyRelativePath") || "คัดลอกพาธสัมพัทธ์"}</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  void copyMediaPath(src, dataRelativeSrc, "full", {
                    title: t("editor.copiedAbsolutePath") || "คัดลอกพาธแบบเต็มแล้ว",
                  });
                }}
                className="gap-2.5 cursor-pointer"
              >
                <Folder className="h-4 w-4" />
                <span>{t("editor.copyAbsolutePath") || "คัดลอกพาธแบบเต็ม"}</span>
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem onClick={handleDownload} className="gap-2.5">
            <Download className="h-4 w-4" />
            <span>{t("editor.audioDownload") || "ดาวน์โหลดไฟล์เสียง"}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {onDelete && (
            <ContextMenuItem
              onClick={() => {
                const targetRel = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
                const md = targetRel ? `<audio src="${targetRel}" controls></audio>` : `<audio src="${src}" controls></audio>`;
                void copyTextToClipboard(md, t("editor.copiedMarkdown") || "คัดลอก Markdown แล้ว");
                onDelete();
              }}
              className="gap-2.5"
            >
              <Scissors className="h-4 w-4" />
              <span>{t("editor.cut") || "ตัด"}</span>
              <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
            </ContextMenuItem>
          )}

          <ContextMenuItem
            onClick={() => {
              const targetRel = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
              const md = targetRel ? `<audio src="${targetRel}" controls></audio>` : `<audio src="${src}" controls></audio>`;
              void copyTextToClipboard(md, t("editor.copiedMarkdown") || "คัดลอก Markdown แล้ว");
            }}
            className="gap-2.5"
          >
            <Copy className="h-4 w-4" />
            <span>{t("editor.copyMarkdown") || "คัดลอก Markdown"}</span>
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>

          {onDelete && (
            <ContextMenuItem
              onClick={onDelete}
              variant="destructive"
              className="gap-2.5 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("editor.deleteAudio") || "ลบไฟล์เสียง"}</span>
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
};

export default AudioPlayer;
