import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, RotateCcw, Check, X, GripHorizontal, AlertCircle, Minus, Maximize2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatDateTime } from "@/lib/dateTimeFormatter";

interface FloatingAudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAudio: (audioData: { src: string; title: string }) => void;
  zIndex?: number;
  onFocusWindow?: () => void;
  rootDirHandle?: FileSystemDirectoryHandle | null;
}

export interface RecordedClip {
  id: string;
  title: string;
  src: string;
  duration: number;
  createdAt: number;
  fileName?: string;
}

const WAVEFORM_BAR_HEIGHTS = [
  35, 60, 45, 80, 95, 70, 40, 85, 60, 90, 50, 75, 100, 65, 40, 80, 55, 70, 90, 45, 60, 85, 40, 30
];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "00:00";
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getAudioDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(src);
      const onLoaded = () => {
        if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
          resolve(Math.round(audio.duration));
        } else {
          audio.currentTime = 1e101;
          audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            audio.currentTime = 0;
            resolve(audio.duration && isFinite(audio.duration) ? Math.round(audio.duration) : 0);
          };
        }
      };
      audio.onloadedmetadata = onLoaded;
      audio.onerror = () => resolve(0);
      setTimeout(() => resolve(0), 2000);
    } catch {
      resolve(0);
    }
  });
}

export default function FloatingAudioRecorder({
  isOpen,
  onClose,
  onInsertAudio,
  zIndex,
  onFocusWindow,
  rootDirHandle,
}: FloatingAudioRecorderProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();

  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "preview">("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const [recordedClips, setRecordedClips] = useState<RecordedClip[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [clipCurrentTime, setClipCurrentTime] = useState<number>(0);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editingClipTitle, setEditingClipTitle] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const clipAudioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  const loadClipsFromWorkspace = useCallback(async () => {
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    // 1. Electron Desktop mode
    if (electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles && electronAPI?.readFileBase64) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        const workspacePath = saved?.folderPath || saved?.path;
        if (workspacePath) {
          const attachDir = `${workspacePath}/attachments`;
          const files = await electronAPI.readDirectoryFiles(attachDir);
          const clips: RecordedClip[] = [];
          if (Array.isArray(files)) {
            for (const f of files) {
              if (!f.isDirectory) {
                const lower = f.name.toLowerCase();
                const isAudio = [".webm", ".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac"].some((ext) => lower.endsWith(ext));
                if (isAudio) {
                  try {
                    const rawBase64 = await electronAPI.readFileBase64(f.fullPath);
                    if (rawBase64) {
                      const mime = lower.endsWith(".mp3") ? "audio/mp3" : lower.endsWith(".wav") ? "audio/wav" : lower.endsWith(".ogg") ? "audio/ogg" : "audio/webm";
                      const dataUrl = rawBase64.startsWith("data:") ? rawBase64 : `data:${mime};base64,${rawBase64}`;
                      const titleWithoutExt = f.name.replace(/\.[^/.]+$/, "");
                      const duration = await getAudioDuration(dataUrl);
                      clips.push({
                        id: `attach_${f.name}`,
                        fileName: f.name,
                        title: titleWithoutExt,
                        src: dataUrl,
                        duration,
                        createdAt: Date.now(),
                      });
                    }
                  } catch (err) {
                    console.warn("Failed reading audio file in electron attachments:", f.name, err);
                  }
                }
              }
            }
          }
          setRecordedClips(clips);
          return;
        }
      } catch (err) {
        console.warn("Failed to load clips from electron attachments:", err);
      }
    }

    // 2. Web File System Access API
    if (rootDirHandle) {
      try {
        const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
        const clips: RecordedClip[] = [];
        const entries = typeof (attachmentsDir as any).entries === "function"
          ? (attachmentsDir as any).entries()
          : (attachmentsDir as unknown as AsyncIterable<[string, FileSystemHandle]>);

        for await (const [name, handle] of entries) {
          if (handle.kind === "file") {
            const lower = name.toLowerCase();
            const isAudio = [".webm", ".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac"].some((ext) => lower.endsWith(ext));
            if (isAudio) {
              try {
                const file = await (handle as FileSystemFileHandle).getFile();
                const base64Data = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });

                if (base64Data) {
                  const titleWithoutExt = name.replace(/\.[^/.]+$/, "");
                  const duration = await getAudioDuration(base64Data);
                  clips.push({
                    id: `attach_${name}`,
                    fileName: name,
                    title: titleWithoutExt,
                    src: base64Data,
                    duration,
                    createdAt: file.lastModified,
                  });
                }
              } catch (err) {
                console.warn("Failed to read audio attachment file:", name, err);
              }
            }
          }
        }

        clips.sort((a, b) => b.createdAt - a.createdAt);
        setRecordedClips(clips);
        return;
      } catch (err) {
        console.warn("Failed to load clips from attachments:", err);
      }
    }

    // If no workspace is open
    setRecordedClips([]);
  }, [rootDirHandle]);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const formattedNow = formatDateTime(now, settings.dateFormat, settings.timeFormat, settings.language);
      setAudioTitle(`Voice Note - ${formattedNow}`);
      setRecordingState("idle");
      setRecordDuration(0);
      setAudioBlob(null);
      setAudioUrl(null);
      setErrorMessage(null);
      setIsPlayingPreview(false);
      setPreviewCurrentTime(0);
      setPreviewDuration(0);
      setIsMinimized(false);
      accumulatedMsRef.current = 0;
      recordStartTimeRef.current = 0;
      void loadClipsFromWorkspace();
    } else {
      cleanupResources();
    }
  }, [isOpen, loadClipsFromWorkspace]);

  const cleanupResources = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        let totalMs = accumulatedMsRef.current;
        if (recordStartTimeRef.current > 0) {
          totalMs += Date.now() - recordStartTimeRef.current;
        }
        const finalSecs = Math.max(1, Math.round(totalMs / 1000));
        setPreviewDuration(finalSecs);
        setRecordDuration(finalSecs);
        setPreviewCurrentTime(0);

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState("preview");

        const clipTitle = audioTitle.trim() || `Voice Note - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          if (base64Data) {
            const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
            const sanitizedTitle = clipTitle.replace(/[\\/:*?"<>|]/g, "_");
            const targetName = `${sanitizedTitle}.webm`;

            // 1. Electron Desktop mode
            if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileBase64) {
              try {
                const saved = await electronAPI.getSavedWorkspace();
                const workspacePath = saved?.folderPath || saved?.path;
                if (workspacePath) {
                  const fullPath = `${workspacePath}/attachments/${targetName}`;
                  await electronAPI.writeFileBase64({ fullPath, base64: base64Data });
                  await loadClipsFromWorkspace();
                  return;
                }
              } catch (err) {
                console.warn("Failed writing audio to electron attachments:", err);
              }
            }

            // 2. Web File System Access API
            if (rootDirHandle) {
              try {
                const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
                const fileHandle = await attachmentsDir.getFileHandle(targetName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                await loadClipsFromWorkspace();
                return;
              } catch (err) {
                console.warn("Failed to write audio to attachments folder:", err);
              }
            }

            // Fallback in case no workspace is open
            const newClip: RecordedClip = {
              id: Date.now().toString(),
              fileName: targetName,
              title: clipTitle,
              src: base64Data,
              duration: finalSecs,
              createdAt: Date.now(),
            };
            setRecordedClips((prev) => [newClip, ...prev.filter((c) => c.title !== clipTitle)].slice(0, 50));
          }
        };
        reader.readAsDataURL(blob);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      accumulatedMsRef.current = 0;
      recordStartTimeRef.current = Date.now();
      mediaRecorder.start(200);
      setRecordingState("recording");
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        const elapsed = accumulatedMsRef.current + (Date.now() - recordStartTimeRef.current);
        setRecordDuration(Math.floor(elapsed / 1000));
      }, 250);
    } catch (err: any) {
      console.error("Microphone error:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? (t("editor.micPermissionDenied") || "Microphone access denied.")
          : (t("editor.micUnavailable") || "Microphone unavailable.")
      );
      setRecordingState("idle");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      accumulatedMsRef.current += Date.now() - recordStartTimeRef.current;
      recordStartTimeRef.current = 0;
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      recordStartTimeRef.current = Date.now();
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        const elapsed = accumulatedMsRef.current + (Date.now() - recordStartTimeRef.current);
        setRecordDuration(Math.floor(elapsed / 1000));
      }, 250);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleDiscard = () => {
    cleanupResources();
    setRecordingState("idle");
    setRecordDuration(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlayingPreview(false);
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
    accumulatedMsRef.current = 0;
    recordStartTimeRef.current = 0;
  };

  const togglePlayClip = (clip: RecordedClip) => {
    const audio = clipAudioRef.current;
    if (!audio) return;
    if (playingClipId === clip.id) {
      audio.pause();
      setPlayingClipId(null);
      setClipCurrentTime(0);
    } else {
      if (previewAudioRef.current && isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      }
      setClipCurrentTime(0);
      audio.src = clip.src;
      audio.play().then(() => {
        setPlayingClipId(clip.id);
      }).catch(() => {
        setPlayingClipId(null);
        setClipCurrentTime(0);
      });
    }
  };

  const handleInsertClip = (clip: RecordedClip) => {
    onInsertAudio({
      src: clip.src,
      title: clip.title,
    });
  };

  const deleteClip = async (id: string) => {
    if (playingClipId === id && clipAudioRef.current) {
      clipAudioRef.current.pause();
      setPlayingClipId(null);
    }
    const clipToDelete = recordedClips.find((c) => c.id === id);
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    if (electronAPI?.getSavedWorkspace && electronAPI?.deleteFileOrFolder && clipToDelete?.fileName) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        const workspacePath = saved?.folderPath || saved?.path;
        if (workspacePath) {
          await electronAPI.deleteFileOrFolder(`${workspacePath}/attachments/${clipToDelete.fileName}`);
          await loadClipsFromWorkspace();
          return;
        }
      } catch (err) {
        console.warn("Failed deleting attachment in electron:", err);
      }
    } else if (rootDirHandle && clipToDelete?.fileName) {
      try {
        const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: false });
        await attachmentsDir.removeEntry(clipToDelete.fileName);
        await loadClipsFromWorkspace();
        return;
      } catch (err) {
        console.warn("Failed to remove attachment file from workspace:", err);
      }
    }
    setRecordedClips((prev) => prev.filter((c) => c.id !== id));
  };

  const clearAllClips = async () => {
    if (clipAudioRef.current) {
      clipAudioRef.current.pause();
      setPlayingClipId(null);
    }
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    if (electronAPI?.getSavedWorkspace && electronAPI?.deleteFileOrFolder) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        const workspacePath = saved?.folderPath || saved?.path;
        if (workspacePath) {
          for (const clip of recordedClips) {
            if (clip.fileName) {
              try {
                await electronAPI.deleteFileOrFolder(`${workspacePath}/attachments/${clip.fileName}`);
              } catch {}
            }
          }
          await loadClipsFromWorkspace();
          return;
        }
      } catch {}
    } else if (rootDirHandle) {
      try {
        const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: false });
        for (const clip of recordedClips) {
          if (clip.fileName) {
            try {
              await attachmentsDir.removeEntry(clip.fileName);
            } catch {}
          }
        }
        await loadClipsFromWorkspace();
        return;
      } catch {}
    }
    setRecordedClips([]);
  };

  const handleStartRename = (clip: RecordedClip, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClipId(clip.id);
    setEditingClipTitle(clip.title);
  };

  const handleSaveRename = async (clipId: string) => {
    const trimmed = editingClipTitle.trim();
    const clipToRename = recordedClips.find((c) => c.id === clipId);
    setEditingClipId(null);

    if (trimmed && clipToRename && trimmed !== clipToRename.title) {
      const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

      if (electronAPI?.getSavedWorkspace && electronAPI?.renameFileOrFolder && clipToRename?.fileName) {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          const workspacePath = saved?.folderPath || saved?.path;
          if (workspacePath) {
            const oldName = clipToRename.fileName;
            const ext = oldName.includes(".") ? oldName.slice(oldName.lastIndexOf(".")) : ".webm";
            const sanitized = trimmed.replace(/[\\/:*?"<>|]/g, "_");
            const candidateName = `${sanitized}${ext}`;
            if (candidateName !== oldName) {
              const oldFullPath = `${workspacePath}/attachments/${oldName}`;
              const newFullPath = `${workspacePath}/attachments/${candidateName}`;
              await electronAPI.renameFileOrFolder({
                oldFullPath,
                newFullPath,
                oldPath: oldFullPath,
                newPath: newFullPath,
              });
              await loadClipsFromWorkspace();
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to rename attachment in electron:", err);
        }
      } else if (rootDirHandle && clipToRename?.fileName) {
        try {
          const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: false });
          const oldName = clipToRename.fileName;
          const ext = oldName.includes(".") ? oldName.slice(oldName.lastIndexOf(".")) : ".webm";
          const sanitized = trimmed.replace(/[\\/:*?"<>|]/g, "_");
          const candidateName = `${sanitized}${ext}`;

          if (candidateName !== oldName) {
            const oldHandle = await attachmentsDir.getFileHandle(oldName);
            const oldFile = await oldHandle.getFile();
            const newHandle = await attachmentsDir.getFileHandle(candidateName, { create: true });
            const writable = await newHandle.createWritable();
            await writable.write(oldFile);
            await writable.close();
            await attachmentsDir.removeEntry(oldName);
            await loadClipsFromWorkspace();
            return;
          }
        } catch (err) {
          console.warn("Failed to rename attachment file in workspace:", err);
        }
      }

      setRecordedClips((prev) =>
        prev.map((c) => (c.id === clipId ? { ...c, title: trimmed } : c))
      );
    }
  };

  const handleCancelRename = () => {
    setEditingClipId(null);
  };

  const effectiveDuration = previewDuration > 0
    ? previewDuration
    : (recordDuration > 0 ? recordDuration : 1);

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      if (audio.currentTime >= effectiveDuration || audio.ended) {
        audio.currentTime = 0;
        setPreviewCurrentTime(0);
      }
      audio.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((err) => {
        console.warn("Preview audio play error:", err);
        setIsPlayingPreview(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    const cur = audio.currentTime;
    if (cur >= effectiveDuration) {
      audio.pause();
      audio.currentTime = 0;
      setPreviewCurrentTime(0);
      setIsPlayingPreview(false);
    } else {
      setPreviewCurrentTime(cur);
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (previewCurrentTime / effectiveDuration) * 100));
  const remainingSeconds = Math.max(0, effectiveDuration - previewCurrentTime);

  const handleWaveformScrub = (clientX: number) => {
    const container = waveformContainerRef.current;
    const audio = previewAudioRef.current;
    if (!container || !audio) return;
    const rect = container.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const newTime = Math.min(effectiveDuration, Math.max(0, percent * effectiveDuration));
    setPreviewCurrentTime(newTime);
    audio.currentTime = newTime;
  };

  const handleInsert = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        if (base64Data) {
          onInsertAudio({
            src: base64Data,
            title: audioTitle.trim() || t("editor.audioRecording") || "Voice Recording",
          });
          onClose();
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // MINIMIZED MODE (Exact match with FloatingClock styling & dimensions)
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
          style={{ top: "18%", right: "12%", zIndex: zIndex ?? 50, fontFamily: "var(--app-font-family, inherit)" }}
        >
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground opacity-60 cursor-grab active:cursor-grabbing shrink-0" />

          {/* Clickable Status Display to Expand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {recordingState === "recording" && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                )}
                {recordingState === "paused" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"></span>
                )}
                {recordingState === "idle" && (
                  <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                {recordingState === "preview" && (
                  <Play className="h-3.5 w-3.5 text-primary fill-current shrink-0" />
                )}

                <span className="tabular-nums">
                  {(recordingState === "recording" || recordingState === "paused") && formatTime(recordDuration)}
                  {recordingState === "preview" && formatTime(remainingSeconds)}
                  {recordingState === "idle" && (t("editor.recordAudio") || "Record")}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.expand") || "Expand"}</TooltipContent>
          </Tooltip>

          <div className="h-3 w-px bg-border/60 mx-0.5" />

          {/* Quick Controls & Window Actions in Minimized Mode */}
          <div className="flex items-center gap-0.5">
            {recordingState === "recording" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Pause className="h-3 w-3" strokeWidth={2.2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.recordingPaused") || "Pause"}</TooltipContent>
              </Tooltip>
            )}
            {recordingState === "paused" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-current" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.resumeRecording") || "Resume"}</TooltipContent>
              </Tooltip>
            )}
            {(recordingState === "recording" || recordingState === "paused") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Square className="h-3 w-3 fill-current" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.finishRecording") || "Done"}</TooltipContent>
              </Tooltip>
            )}
            {recordingState === "idle" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.startRecording") || "Start Recording"}</TooltipContent>
              </Tooltip>
            )}

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
    <TooltipProvider delayDuration={200}>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onPointerDown={onFocusWindow}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="fixed w-[320px] rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md select-none text-foreground z-50"
        data-floating-window="true"
        style={{ top: "18%", right: "12%", zIndex: zIndex ?? 50, fontFamily: "var(--app-font-family, inherit)" }}
      >
        {/* Header with Grip and Minimize/Close Buttons */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <GripHorizontal className="h-3.5 w-3.5 opacity-60" />
            <span>{t("editor.recordAudio") || "Voice Recorder"}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.close") || "Close"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-2 flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 p-2 text-[10.5px] text-destructive leading-tight">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. IDLE STATE: Simple Tap to Record */}
        {recordingState === "idle" && (
          <div className="flex flex-col items-center justify-center gap-2.5 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={startRecording}
                  className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-destructive group-hover:bg-white transition-all" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("editor.startRecording") || "Start Recording"}</TooltipContent>
            </Tooltip>
            <span className="text-[11.5px] font-medium text-muted-foreground">
              {t("editor.readyToRecord") || "Tap to record"}
            </span>
          </div>
        )}

        {/* 2. RECORDING / PAUSED STATE: Timer & Simple Controls */}
        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="flex flex-col items-center justify-center gap-3 py-2">
            {/* Pulsing Dot & Timer */}
            <div className="flex items-center gap-2">
              {recordingState === "recording" ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                </span>
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50"></span>
              )}
              <span className="tabular-nums text-2xl font-bold tracking-tight text-foreground">
                {formatTime(recordDuration)}
              </span>
            </div>

            {/* Minimalist Live Wave Animation with SVG Vector */}
            {recordingState === "recording" && (
              <div className="flex items-center justify-center h-4 my-0.5">
                <svg className="w-24 h-4 overflow-visible" viewBox="0 0 96 16">
                  {[35, 75, 55, 95, 45, 80, 90, 40].map((h, i) => {
                    const x = (i / 7) * 96;
                    const barHeight = Math.max(3, (h / 100) * 14);
                    const y1 = (16 - barHeight) / 2;
                    const y2 = y1 + barHeight;
                    return (
                      <line
                        key={i}
                        x1={x}
                        x2={x}
                        y1={y1}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="text-destructive animate-pulse"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Simple Control Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {recordingState === "recording" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/60 text-foreground hover:bg-muted transition-all cursor-pointer active:scale-95"
                    >
                      <Pause className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("editor.recordingPaused") || "Pause"}</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/60 text-foreground hover:bg-muted transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("editor.resumeRecording") || "Resume"}</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.finishRecording") || "Done"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* 3. PREVIEW & INSERT STATE */}
        {recordingState === "preview" && (
          <div className="flex flex-col gap-2.5 py-1">
            {audioUrl && (
              <audio
                ref={previewAudioRef}
                src={audioUrl}
                onLoadedMetadata={(e) => {
                  const d = (e.target as HTMLAudioElement).duration;
                  if (isFinite(d) && d > 0) {
                    setPreviewDuration(d);
                  } else if (recordDuration > 0) {
                    setPreviewDuration(recordDuration);
                  }
                }}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setIsPlayingPreview(false);
                  setPreviewCurrentTime(0);
                }}
                onPlay={() => setIsPlayingPreview(true)}
                onPause={() => setIsPlayingPreview(false)}
              />
            )}

            {/* Interactive Waveform Audio Bar */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2 px-2.5 border border-border/50">
              {/* Play/Pause Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-transform active:scale-95"
                  >
                    {isPlayingPreview ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isPlayingPreview ? "Pause" : "Play"}</TooltipContent>
              </Tooltip>

              {/* Waveform Scrubber Bars */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    ref={waveformContainerRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      handleWaveformScrub(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons === 1) handleWaveformScrub(e.clientX);
                    }}
                    className="flex flex-1 items-center h-7 cursor-pointer select-none touch-none px-2"
                  >
                    <svg className="w-full h-5 overflow-visible" preserveAspectRatio="none">
                      {WAVEFORM_BAR_HEIGHTS.map((heightPercent, index) => {
                        const xPercent = (index / (WAVEFORM_BAR_HEIGHTS.length - 1)) * 100;
                        const isPlayed = xPercent <= progressPercent;
                        const barHeight = Math.max(4, (heightPercent / 100) * 18);
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
                            strokeWidth="2.5"
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

              {/* Countdown Remaining Time */}
              <span className="shrink-0 tabular-nums text-[11.5px] font-semibold text-muted-foreground">
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {/* Action Buttons: Centered with Insert button in front */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleInsert}
                disabled={isProcessing}
                className="h-8 gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-4 cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t("editor.insertAudioAction") || "Insert"}</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDiscard}
                    className="h-8 w-8 rounded-xl border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor.reRecord") || "Record again"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Audio element for recorded clips preview */}
        <audio
          ref={clipAudioRef}
          onTimeUpdate={() => {
            if (clipAudioRef.current) {
              setClipCurrentTime(clipAudioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            const audio = clipAudioRef.current;
            if (audio && playingClipId) {
              const dur = audio.duration && isFinite(audio.duration) ? Math.round(audio.duration) : 0;
              if (dur > 0) {
                setRecordedClips((prev) =>
                  prev.map((c) => (c.id === playingClipId && c.duration === 0 ? { ...c, duration: dur } : c))
                );
              }
            }
          }}
          onEnded={() => {
            setPlayingClipId(null);
            setClipCurrentTime(0);
          }}
          onPause={() => {
            setPlayingClipId(null);
            setClipCurrentTime(0);
          }}
          className="hidden"
        />

        {/* 4. RECORDED CLIPS LIST: Pick and Insert into Note */}
        {recordedClips.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-0.5">
              <span>
                {t("editor.recordedClips") || "Recordings"} ({recordedClips.length})
              </span>
              <button
                type="button"
                onClick={clearAllClips}
                className="text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer font-normal"
              >
                {t("editor.clearAll") || "Clear all"}
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
              {recordedClips.map((clip) => (
                <div
                  key={clip.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors border border-border/30 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Play/Pause Button - Voice Player Style */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => togglePlayClip(clip)}
                          className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                        >
                          {playingClipId === clip.id ? (
                            <Pause className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{playingClipId === clip.id ? "Pause" : "Play"}</TooltipContent>
                    </Tooltip>

                    <div className="min-w-0 flex-1">
                      {editingClipId === clip.id ? (
                        <input
                          type="text"
                          value={editingClipTitle}
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setEditingClipTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveRename(clip.id);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelRename();
                            }
                          }}
                          onBlur={() => handleSaveRename(clip.id)}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          className="w-full bg-background border border-primary rounded-md px-1.5 py-0.5 text-xs font-bold text-foreground outline-none shadow-xs focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onDoubleClick={(e) => handleStartRename(clip, e)}
                              className="font-bold text-sm leading-tight text-foreground truncate cursor-text select-none hover:text-primary transition-colors"
                            >
                              {clip.title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-[260px] break-words z-[99999]">
                            <p className="font-semibold text-xs">{clip.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t("editor.doubleClickToRename") || "Double-click to rename"}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {playingClipId === clip.id
                          ? formatTime(Math.max(0, clip.duration - clipCurrentTime))
                          : formatTime(clip.duration)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleInsertClip(clip)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.insertClip") || "Insert into note"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => deleteClip(clip.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.deleteClip") || "Delete recording"}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}