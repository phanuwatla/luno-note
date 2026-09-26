import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Maximize2,
  Minimize,
  Repeat,
  PictureInPicture2,
  VideoOff,
  ExternalLink,
  X,
  RotateCcw,
  GripHorizontal,
  Copy,
  Scissors,
  Trash2,
  FolderOpen,
  Link as LinkIcon,
  Gauge,
  Download,
  Check,
  FileText,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useActivePipVideo, videoPipStore } from "@/lib/videoPipStore";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "00:00";
  const totalSecs = Math.round(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.floor(totalSecs % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  width?: number | null;
  selected?: boolean;
  onLoadedMetadata?: (data: { width: number; height: number; duration: number }) => void;
  onError?: () => void;
  onOpenInSystemApp?: () => void;

  // Global In-App PiP properties
  noteId?: string;
  isFloatingPip?: boolean;
  initialTime?: number;
  initialVolume?: number;
  initialMuted?: boolean;
  initialPlaybackRate?: number;
  initialLoop?: boolean;
  initialPos?: { x: number; y: number } | null;
  onPipPosChange?: (pos: { x: number; y: number } | null) => void;
  onPipReturn?: (currentTime: number, isPlaying: boolean) => void;
  onPipClose?: () => void;
  onPipTimeUpdate?: (currentTime: number, isPlaying: boolean) => void;

  // Context menu actions
  onDelete?: () => void;
  onResetSize?: (e: React.MouseEvent) => void;
  onViewFull?: () => void;
  dataRelativeSrc?: string;
}

const VideoPlayerComponent: React.FC<VideoPlayerProps> = ({
  src,
  title,
  className = "",
  style,
  autoPlay = false,
  width,
  selected = false,
  onLoadedMetadata,
  onError,
  onOpenInSystemApp,
  noteId,
  isFloatingPip = false,
  initialTime = 0,
  initialVolume,
  initialMuted,
  initialPlaybackRate,
  initialLoop,
  initialPos,
  onPipPosChange,
  onPipReturn,
  onPipClose,
  onPipTimeUpdate,
  onDelete,
  onResetSize,
  onViewFull,
  dataRelativeSrc,
}) => {
  const { t } = useTranslation();

  const originalParentRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activePip = useActivePipVideo();
  const isThisVideoInPip = !isFloatingPip && activePip !== null && activePip.src === src;

  const [hasStarted, setHasStarted] = useState(autoPlay || initialTime > 0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(initialTime || 0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(initialVolume !== undefined ? initialVolume : 1);
  const [prevVolume, setPrevVolume] = useState(initialVolume !== undefined ? initialVolume : 1);
  const [isMuted, setIsMuted] = useState(initialMuted || false);
  const [playbackRate, setPlaybackRate] = useState<number>(initialPlaybackRate || 1);
  const [isLooping, setIsLooping] = useState(initialLoop || false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [splashState, setSplashState] = useState<"play" | "pause" | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  // Draggable position state for In-App PiP window
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(initialPos || null);
  const isDraggingPipRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    const el = playerWrapperRef.current;
    if (!el) return;

    if (el.offsetWidth > 0) {
      setContainerWidth(el.offsetWidth);
    }

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMini = isFloatingPip;
  const isCompact = !isFloatingPip && containerWidth < 420;
  const isVeryCompact = !isFloatingPip && containerWidth < 320;
  const isTiny = !isFloatingPip && containerWidth < 230;

  // Reset states when src changes (for inline player)
  useEffect(() => {
    if (!isFloatingPip) {
      setHasError(false);
      setHasStarted(autoPlay || initialTime > 0);
    }
  }, [src, autoPlay, initialTime, isFloatingPip]);

  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (initialVolume !== undefined) video.volume = initialVolume;
    if (initialMuted !== undefined) video.muted = initialMuted;
    if (initialPlaybackRate !== undefined) video.playbackRate = initialPlaybackRate;
    if (initialLoop !== undefined) video.loop = initialLoop;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
      if (initialTime && initialTime > 0 && Math.abs(video.currentTime - initialTime) > 0.5) {
        video.currentTime = initialTime;
        setCurrentTime(initialTime);
      } else if (currentTimeRef.current > 0 && Math.abs(video.currentTime - currentTimeRef.current) > 0.5) {
        video.currentTime = currentTimeRef.current;
      }
      if (isPlayingRef.current || autoPlay) {
        void video.play().catch(() => {});
        setIsPlaying(true);
      }
      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
        if (onLoadedMetadata) {
          onLoadedMetadata({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration || 0,
          });
        }
      }
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
      if (onPipTimeUpdate) {
        onPipTimeUpdate(video.currentTime, !video.paused);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsControlsVisible(true);
      if (onPipTimeUpdate) {
        onPipTimeUpdate(video.currentTime, false);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
      if (onPipTimeUpdate) {
        onPipTimeUpdate(video.currentTime, true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      setIsControlsVisible(true);
      if (onPipTimeUpdate) {
        onPipTimeUpdate(video.currentTime, false);
      }
    };

    const handleError = () => {
      const err = video.error;
      console.warn("VideoPlayer error loading src:", src, "code:", err?.code, "message:", err?.message);
      setHasError(true);
      if (onError) onError();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    if (video.readyState >= 1) {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
      if (initialTime && initialTime > 0 && video.currentTime < 0.1) {
        video.currentTime = initialTime;
        setCurrentTime(initialTime);
      } else if (currentTimeRef.current > 0 && Math.abs(video.currentTime - currentTimeRef.current) > 0.5) {
        video.currentTime = currentTimeRef.current;
      }
      if (autoPlay || isPlayingRef.current) {
        void video.play().catch(() => {});
        setIsPlaying(true);
      }
    } else if (autoPlay) {
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
    };
  }, [isSeeking, src, autoPlay, initialTime, onLoadedMetadata, onError, onPipTimeUpdate, initialVolume, initialMuted, initialPlaybackRate, initialLoop]);

  // Auto-hide controls when mouse is inactive during playback
  const resetHideTimer = useCallback(() => {
    setIsControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 2500);
    }
  }, [isPlaying]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(async () => {
    const container = playerWrapperRef.current;
    if (!container) return;

    const electronAPI = (window as unknown as {
      electronAPI?: {
        setFullScreen?: (flag: boolean) => void;
      };
    }).electronAPI;

    if (!isFullscreen && !document.fullscreenElement) {
      setIsFullscreen(true);
      if (electronAPI?.setFullScreen) {
        electronAPI.setFullScreen(true);
      }
      try {
        const req =
          container.requestFullscreen ||
          (container as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;
        if (req) {
          await req.call(container);
        }
      } catch (err) {
        console.warn("Native fullscreen request rejected, using overlay fallback:", err);
      }
    } else {
      setIsFullscreen(false);
      if (electronAPI?.setFullScreen) {
        electronAPI.setFullScreen(false);
      }
      try {
        if (document.fullscreenElement) {
          const exit =
            document.exitFullscreen ||
            (document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen;
          if (exit) {
            await exit.call(document);
          }
        }
      } catch (err) {
        console.warn("Exit fullscreen error:", err);
      }
    }
    resetHideTimer();
  }, [isFullscreen, resetHideTimer]);

  // Sync fullscreen change listener and handle ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFs = Boolean(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      if (!isNativeFs && isFullscreen) {
        const electronAPI = (window as unknown as {
          electronAPI?: {
            setFullScreen?: (flag: boolean) => void;
          };
        }).electronAPI;
        if (electronAPI?.setFullScreen) {
          electronAPI.setFullScreen(false);
        }
        setIsFullscreen(false);
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          e.preventDefault();
          void toggleFullscreen();
        } else if (isFloatingPip) {
          e.preventDefault();
          if (onPipClose) {
            onPipClose();
          } else {
            videoPipStore.close();
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isFullscreen, isFloatingPip, toggleFullscreen, onPipClose]);

  // Toggle Global In-App Picture-in-Picture
  const togglePiP = useCallback(() => {
    if (isFloatingPip) {
      if (onPipReturn) {
        onPipReturn(currentTimeRef.current, isPlayingRef.current);
      } else {
        videoPipStore.close();
      }
      return;
    }

    if (isThisVideoInPip) {
      // return to note
      if (videoRef.current && activePip) {
        videoRef.current.currentTime = activePip.currentTime;
        setCurrentTime(activePip.currentTime);
        if (activePip.isPlaying) {
          void videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
      videoPipStore.close();
      return;
    }

    // Activate global PiP
    const video = videoRef.current;
    const curTime = video ? video.currentTime : currentTime;
    const playing = isPlaying;
    const vWidth = video?.videoWidth || videoDimensions?.width;
    const vHeight = video?.videoHeight || videoDimensions?.height;
    if (video) video.pause();
    setIsPlaying(false);

    videoPipStore.set({
      id: `${noteId || ""}_${src}`,
      src,
      title,
      currentTime: curTime,
      duration,
      isPlaying: playing,
      playbackRate,
      volume,
      isMuted,
      isLooping,
      noteId,
      pos: pipPos,
      videoWidth: vWidth,
      videoHeight: vHeight,
      containerWidth: width || null,
    });
  }, [
    isFloatingPip,
    onPipReturn,
    isThisVideoInPip,
    activePip,
    currentTime,
    isPlaying,
    src,
    title,
    duration,
    playbackRate,
    volume,
    isMuted,
    isLooping,
    noteId,
    pipPos,
    videoDimensions,
    width,
  ]);

  // Pointer drag handlers for In-App PiP Window
  const handlePipHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const el = playerWrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const curX = pipPos ? pipPos.x : rect.left;
    const curY = pipPos ? pipPos.y : rect.top;

    isDraggingPipRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: curX,
      initialY: curY,
    };
  };

  const handlePipHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPipRef.current) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = dragStartRef.current.initialX + deltaX;
    const newY = dragStartRef.current.initialY + deltaY;

    const el = playerWrapperRef.current;
    const width = el ? el.offsetWidth : 380;
    const height = el ? el.offsetHeight : 240;
    const maxX = Math.max(10, window.innerWidth - width - 10);
    const maxY = Math.max(10, window.innerHeight - height - 10);

    const nextPos = {
      x: Math.max(10, Math.min(maxX, newX)),
      y: Math.max(10, Math.min(maxY, newY)),
    };
    setPipPos(nextPos);
    if (onPipPosChange) {
      onPipPosChange(nextPos);
    }
  };

  const handlePipHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingPipRef.current) {
      isDraggingPipRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleMouseMove = () => {
    resetHideTimer();
  };

  const handleMouseLeave = () => {
    if (!isSeeking) {
      setIsControlsVisible(false);
    }
    setHoverTime(null);
    setHoverPosition(null);
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setSplashState("pause");
      setTimeout(() => setSplashState(null), 500);
    } else {
      setHasStarted(true);
      if (duration > 0 && (video.currentTime >= duration || video.ended)) {
        video.currentTime = 0;
        setCurrentTime(0);
      }
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setSplashState("play");
          setTimeout(() => setSplashState(null), 500);
        })
        .catch((err) => {
          console.warn("Video play error:", err);
          setIsPlaying(false);
        });
    }
    resetHideTimer();
  }, [isPlaying, duration, resetHideTimer]);

  // Scrubbing & Seeking
  const handleSeek = (clientX: number) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setCurrentTime(newTime);
    video.currentTime = newTime;
  };

  const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !duration || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(e.clientX - rect.left);
  };

  // Volume & Mute
  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (video) {
      video.volume = clamped;
      video.muted = clamped === 0;
    }
    resetHideTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.8;
      setVolume(restored);
      setIsMuted(false);
      video.muted = false;
      video.volume = restored;
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
      video.muted = true;
    }
    resetHideTimer();
  };

  // Speed Rate
  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
    resetHideTimer();
  };

  // Loop toggle
  const toggleLoop = () => {
    const video = videoRef.current;
    const next = !isLooping;
    setIsLooping(next);
    if (video) video.loop = next;
    resetHideTimer();
  };

  // Keyboard Shortcuts inside player
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === " " || e.key === "k" || e.key === "K") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleVolumeChange(volume + 0.1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleVolumeChange(volume - 0.1);
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      toggleMute();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      void toggleFullscreen();
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border border-border/80 bg-card/60 text-center max-w-lg mx-auto ${className}`}>
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
          <VideoOff className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">
          {t("editor.videoLoadError") || "Video could not be played"}
        </h4>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          {t("editor.videoUnsupported") || "This video format cannot be previewed in the browser. You can open it in your system's default media player."}
        </p>
        {onOpenInSystemApp && (
          <Button
            type="button"
            size="sm"
            onClick={onOpenInSystemApp}
            className="text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("editor.openInDefaultApp") || "Open in App"}
          </Button>
        )}
      </div>
    );
  }

  // Determine computed style for draggable In-App PiP
  const computedWrapperStyle: React.CSSProperties | undefined = isFullscreen
    ? undefined
    : isFloatingPip
    ? {
        position: "fixed",
        left: pipPos ? `${pipPos.x}px` : undefined,
        top: pipPos ? `${pipPos.y}px` : undefined,
        bottom: pipPos ? undefined : "24px",
        right: pipPos ? undefined : "24px",
        zIndex: 99998,
        width: "380px",
        maxWidth: "calc(100vw - 32px)",
      }
    : {
        ...style,
        width: width ? `${width}px` : "fit-content",
        maxWidth: "100%",
      };

  const dynamicVideoRadiusCls = isFullscreen ? "!rounded-none" : "rounded-xl";

  // The core player JSX
  const playerContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={(e) => e.stopPropagation()}>
        <div
          ref={playerWrapperRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseMove}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={computedWrapperStyle}
          className={`relative inline-block max-w-full ${dynamicVideoRadiusCls} overflow-hidden border border-border/80 shadow-2xs bg-muted/20 dark:bg-black select-none outline-none group/player ${
        isFullscreen
          ? "!fixed !inset-0 !z-[99999] !w-screen !h-screen !max-w-none !max-h-none !rounded-none !border-none !shadow-none !m-0 !p-0 flex flex-col items-center justify-center bg-black"
          : isFloatingPip
          ? "!fixed !z-[99998] border border-border bg-black rounded-2xl shadow-lg"
          : ""
      } ${className}`}
    >
      {/* PiP Top Bar: File Name WITHOUT Background & with subtle drop-shadow */}
      {isMini && (
        <div
          onPointerDown={handlePipHeaderPointerDown}
          onPointerMove={handlePipHeaderPointerMove}
          onPointerUp={handlePipHeaderPointerUp}
          onPointerCancel={() => {
            isDraggingPipRef.current = false;
          }}
          onLostPointerCapture={() => {
            isDraggingPipRef.current = false;
          }}
          className="absolute top-2 left-2 right-2 z-40 flex items-center justify-between pointer-events-auto select-none touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-1.5 truncate max-w-[240px]">
            <GripHorizontal className="h-3.5 w-3.5 text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="truncate text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-default"
                >
                  {title || t("editor.videoPip") || "Picture in Picture"}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-xs break-all">
                {title || t("editor.videoPip") || "Picture in Picture"}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            {/* Return to Note Button with Tooltip (NO title attribute!) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (onPipReturn) {
                      onPipReturn(currentTimeRef.current, isPlayingRef.current);
                    } else {
                      videoPipStore.close();
                    }
                  }}
                  className="p-1 text-white/80 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-colors cursor-pointer focus:outline-none focus:text-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t("editor.videoReturnFromPip") || "Return to note"}
              </TooltipContent>
            </Tooltip>

            {/* Close Button with Tooltip (NO title attribute!) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (onPipClose) {
                      onPipClose();
                    } else {
                      videoPipStore.close();
                    }
                  }}
                  className="p-1 text-white/80 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-colors cursor-pointer focus:outline-none focus:text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t("editor.videoCloseFull") || "Close"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* HTML5 Video Element (Native browser controls disabled) */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        className={`!m-0 !p-0 block cursor-pointer object-contain transition-all rounded-xl ${
          isFullscreen
            ? "!w-full !h-full !max-w-full !max-h-screen !rounded-none"
            : isFloatingPip
            ? "!w-full h-auto max-h-[260px] !rounded-2xl"
            : "max-w-full max-h-[calc(100vh-220px)] h-auto rounded-xl"
        }`}
        style={{
          width: width ? `${width}px` : "auto",
          maxWidth: "100%",
        }}
        onClick={togglePlay}
        onDoubleClick={() => void toggleFullscreen()}
      />

      {/* Center Splash Icon Animation (Play / Pause feedback) */}
      {splashState && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="h-12 w-12 rounded-full bg-black/60 text-white flex items-center justify-center animate-in zoom-in-50 fade-out-0 duration-500 shadow-md border border-white/20">
            {splashState === "play" ? (
              <Play className="h-6 w-6 fill-current ml-0.5" />
            ) : (
              <Pause className="h-6 w-6 fill-current" />
            )}
          </div>
        </div>
      )}

      {/* Center Play Button (Shown ONLY before video starts playing) */}
      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-15 bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
        >
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-primary-foreground/20 focus:outline-none"
          >
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </button>
        </div>
      )}

      {/* Floating Custom Control Bar - Shown ONLY after video has started, NO blur */}
      {hasStarted && (
        <div
          className={`absolute z-30 transition-all duration-300 ${
            isMini ? "bottom-2 left-2 right-2" : "bottom-2.5 left-2.5 right-2.5"
          } ${
            isControlsVisible || isSeeking
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div
            className={`flex items-center rounded-xl border border-border/80 bg-background dark:bg-card text-foreground dark:text-white transition-colors overflow-hidden ${
              isMini
                ? "px-2 py-1 gap-1.5 shadow-none"
                : isTiny
                ? "px-1.5 py-1 gap-1 shadow-sm"
                : isVeryCompact
                ? "px-2 py-1 gap-1.5 shadow-sm"
                : isCompact
                ? "px-2.5 py-1.5 gap-1.5 shadow-sm"
                : "px-3 py-1.5 gap-2 sm:gap-2.5 shadow-sm"
            }`}
          >
            {/* Play / Pause Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={togglePlay}
                  className={`${
                    isMini || isVeryCompact ? "h-6 w-6" : isCompact ? "h-6.5 w-6.5" : "h-7 w-7"
                  } rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0 focus:outline-none focus-visible:outline-none`}
                >
                  {isPlaying ? (
                    <Pause className={isMini || isVeryCompact ? "h-3 w-3 fill-current" : "h-3.5 w-3.5 fill-current"} />
                  ) : (
                    <Play className={isMini || isVeryCompact ? "h-3 w-3 fill-current ml-0.5" : "h-3.5 w-3.5 fill-current ml-0.5"} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isPlaying ? t("editor.videoPause") || "Pause" : t("editor.videoPlay") || "Play"}
              </TooltipContent>
            </Tooltip>

            {/* Volume & Hover Slider */}
            {!isTiny && (
              <div className="group/vol flex items-center gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`${
                        isMini || isCompact ? "h-6 w-6" : "h-7 w-7"
                      } rounded-md text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus:text-primary`}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className={isMini || isCompact ? "h-3 w-3" : "h-4 w-4"} />
                      ) : volume < 0.5 ? (
                        <Volume1 className={isMini || isCompact ? "h-3 w-3" : "h-4 w-4"} />
                      ) : (
                        <Volume2 className={isMini || isCompact ? "h-3 w-3" : "h-4 w-4"} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isMuted ? t("editor.videoUnmute") || "Unmute" : t("editor.videoMute") || "Mute"}
                  </TooltipContent>
                </Tooltip>

                {/* Volume Slider on Hover */}
                {!isVeryCompact && (
                  <div className={`w-0 ${isMini ? "group-hover/vol:w-12" : "group-hover/vol:w-16"} transition-all duration-200 overflow-hidden flex items-center`}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className={`${isMini ? "w-12" : "w-16"} h-1 accent-primary cursor-pointer bg-muted-foreground/30 dark:bg-white/30 rounded-full`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Time Display (Interface Font, No Mono!) */}
            <div className={`tabular-nums text-muted-foreground dark:text-zinc-300 shrink-0 select-none ${isMini || isCompact ? "text-[10px]" : "text-[11px]"}`}>
              <span className="text-foreground dark:text-white font-medium">{formatTime(currentTime)}</span>
              {!isVeryCompact && (
                <>
                  <span className="mx-0.5 opacity-50">/</span>
                  <span>{formatTime(duration)}</span>
                </>
              )}
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
              className="group/bar relative flex-1 min-w-[20px] h-4 flex items-center cursor-pointer touch-none select-none mx-1"
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
            <div className={`flex items-center shrink-0 ${isMini || isCompact ? "gap-1" : "gap-1.5 sm:gap-2"}`}>
              {/* Playback Rate (Shown in floating player or when width >= 420px) */}
              {(isMini || !isCompact) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleSpeedChange}
                      className={`${
                        isMini ? "h-6 px-1 text-[10px]" : "h-7 px-1.5 text-[11px]"
                      } font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:outline-none ${
                        playbackRate !== 1
                          ? "text-primary hover:text-primary"
                          : "text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
                      }`}
                    >
                      {playbackRate}x
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("editor.videoSpeed") || "Playback speed"}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Loop Toggle (Shown in floating player or when width >= 340px) */}
              {(isMini || containerWidth >= 340) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleLoop}
                      className={`${
                        isMini || isCompact ? "h-6 w-6" : "h-7 w-7"
                      } rounded-md flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:outline-none ${
                        isLooping
                          ? "text-primary hover:text-primary"
                          : "text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
                      }`}
                    >
                      <Repeat className={isMini || isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("editor.videoLoop") || "Loop"}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Picture-in-Picture (Shown only in inline/editor player when !isTiny and not floating PiP) */}
              {!isFloatingPip && !isTiny && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={togglePiP}
                      className={`${
                        isCompact ? "h-6 w-6" : "h-7 w-7"
                      } rounded-md flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:outline-none ${
                        isThisVideoInPip
                          ? "text-primary hover:text-primary"
                          : "text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
                      }`}
                    >
                      <PictureInPicture2 className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("editor.videoPip") || "Picture in Picture"}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Fullscreen Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void toggleFullscreen()}
                    className={`${
                      isMini || isCompact ? "h-6 w-6" : "h-7 w-7"
                    } rounded-md text-muted-foreground hover:text-primary dark:text-zinc-300 dark:hover:text-primary flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus:text-primary`}
                  >
                    {isFullscreen ? (
                      <Minimize className={isMini || isCompact ? "h-3 w-3" : "h-4 w-4"} />
                    ) : (
                      <Maximize className={isMini || isCompact ? "h-3 w-3" : "h-4 w-4"} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isFullscreen
                    ? t("editor.videoExitFullscreen") || "Exit fullscreen"
                    : t("editor.videoFullscreen") || "Fullscreen"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
    </ContextMenuTrigger>
    <ContextMenuContent className="w-56 rounded-xl">
      <ContextMenuItem onClick={togglePlay} className="gap-2.5">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        <span>{isPlaying ? (t("editor.videoPause") || "หยุดชั่วคราว") : (t("editor.videoPlay") || "เล่น")}</span>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() => {
          if (onViewFull) onViewFull();
          else void toggleFullscreen();
        }}
        className="gap-2.5"
      >
        <Maximize2 className="h-4 w-4" />
        <span>{t("editor.videoViewFull") || "ดูวิดีโอขนาดเต็ม"}</span>
      </ContextMenuItem>

      {!isFloatingPip && (
        <ContextMenuItem onClick={togglePiP} className="gap-2.5">
          <PictureInPicture2 className="h-4 w-4" />
          <span>{t("editor.videoPip") || "เล่นแบบย่อมุมจอ"}</span>
        </ContextMenuItem>
      )}

      <ContextMenuItem onClick={toggleMute} className="gap-2.5">
        {isMuted || volume === 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span>{isMuted || volume === 0 ? (t("editor.videoUnmute") || "เปิดเสียง") : (t("editor.videoMute") || "ปิดเสียง")}</span>
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
          <span>{t("editor.videoLoop") || "เล่นวนซ้ำ"}</span>
        </div>
        {isLooping && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
      </ContextMenuItem>

      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2.5">
          <Gauge className="h-4 w-4" />
          <span>{t("editor.videoSpeed") || "ความเร็วในการเล่น"} ({playbackRate}x)</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-36 rounded-xl">
          {[1, 1.25, 1.5, 2].map((rate) => (
            <ContextMenuCheckboxItem
              key={rate}
              checked={playbackRate === rate}
              onClick={() => {
                setPlaybackRate(rate);
                if (videoRef.current) videoRef.current.playbackRate = rate;
              }}
            >
              {rate}x {rate === 1 && `(${t("editor.speedNormal") || "ปกติ"})`}
            </ContextMenuCheckboxItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={() => {
          if (onOpenInSystemApp) onOpenInSystemApp();
          else void openMediaFileInSystemApp(src, dataRelativeSrc);
        }}
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
          <span>{t("editor.copyVideoPath") || "คัดลอกพาธวิดีโอ"}</span>
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

      <ContextMenuItem onClick={() => downloadMediaFile(src, title || "video.mp4")} className="gap-2.5">
        <Download className="h-4 w-4" />
        <span>{t("editor.downloadVideo") || "ดาวน์โหลดวิดีโอ"}</span>
      </ContextMenuItem>

      {Boolean(width && onResetSize) && (
        <ContextMenuItem onClick={onResetSize} className="gap-2.5">
          <RotateCcw className="h-4 w-4" />
          <span>{t("editor.videoResetSize") || "รีเซ็ตขนาดเดิม"}</span>
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      {onDelete && (
        <ContextMenuItem
          onClick={() => {
            const targetRel = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
            const md = targetRel ? `<video src="${targetRel}" controls></video>` : `<video src="${src}" controls></video>`;
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
          const md = targetRel ? `<video src="${targetRel}" controls></video>` : `<video src="${src}" controls></video>`;
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
          <span>{t("editor.deleteVideo") || "ลบวิดีโอ"}</span>
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  </ContextMenu>
  );

  if (isFloatingPip) {
    return (
      <TooltipProvider delayDuration={250}>
        {playerContent}
      </TooltipProvider>
    );
  }

  const effVideoWidth = videoDimensions?.width || activePip?.videoWidth;
  const effVideoHeight = videoDimensions?.height || activePip?.videoHeight;
  const effRatio = effVideoWidth && effVideoHeight ? effVideoWidth / effVideoHeight : 16 / 9;

  return (
    <TooltipProvider delayDuration={250}>
      {isThisVideoInPip ? (
        <div
          ref={originalParentRef}
          className={`relative inline-block max-w-full align-middle ${className || ""}`}
          style={{
            ...style,
            width: width ? `${width}px` : "fit-content",
            maxWidth: "100%",
          }}
        >
          {/* Placeholder shown in original note location when playing in In-App PiP */}
          <div
            className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 text-center rounded-xl border border-border/70 bg-muted/20 dark:bg-card/40 max-w-full overflow-hidden select-none"
            style={{
              aspectRatio: `${effRatio}`,
              width: width ? `${width}px` : effVideoWidth ? `${effVideoWidth}px` : "fit-content",
              maxWidth: "100%",
              maxHeight: "calc(100vh - 220px)",
            }}
          >
            <PictureInPicture2 className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 stroke-[1.5] text-muted-foreground/70" />
            <div className="flex flex-col items-center gap-1 text-center max-w-full px-2 overflow-hidden">
              {title ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-full">{title}</p>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground truncate max-w-full">
                    <span>{t("editor.videoPlayingInPip") || "Video is playing in Picture-in-Picture"}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-full">
                  {t("editor.videoPlayingInPip") || "Video is playing in Picture-in-Picture"}
                </p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 cursor-pointer mt-1 h-8 px-3 shrink-0"
              onClick={() => {
                if (videoRef.current && activePip) {
                  videoRef.current.currentTime = activePip.currentTime;
                  setCurrentTime(activePip.currentTime);
                  if (activePip.isPlaying) {
                    void videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }
                videoPipStore.close();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("editor.videoReturnFromPip") || "Return to note"}
            </Button>
          </div>
        </div>
      ) : (
        playerContent
      )}
    </TooltipProvider>
  );
};

export const VideoPlayer = React.memo(VideoPlayerComponent);
export default VideoPlayer;
