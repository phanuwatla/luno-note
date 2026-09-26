import React, { useCallback } from "react";
import { useActivePipVideo, videoPipStore } from "@/lib/videoPipStore";
import VideoPlayer from "./VideoPlayer";

interface GlobalVideoPipProps {
  onNavigateToNote?: (noteId: string) => void;
}

export const GlobalVideoPip: React.FC<GlobalVideoPipProps> = ({ onNavigateToNote }) => {
  const activePip = useActivePipVideo();

  const handleReturn = useCallback(
    (currentTime: number, isPlaying: boolean) => {
      if (!activePip) return;
      const targetNoteId = activePip.noteId;
      videoPipStore.close();
      if (targetNoteId && onNavigateToNote) {
        onNavigateToNote(targetNoteId);
      }
    },
    [activePip, onNavigateToNote]
  );

  const handleClose = useCallback(() => {
    videoPipStore.close();
  }, []);

  const handlePosChange = useCallback((pos: { x: number; y: number } | null) => {
    videoPipStore.update({ pos });
  }, []);

  if (!activePip) return null;

  return (
    <VideoPlayer
      isFloatingPip
      src={activePip.src}
      title={activePip.title}
      noteId={activePip.noteId}
      initialTime={activePip.currentTime}
      autoPlay={activePip.isPlaying}
      initialVolume={activePip.volume}
      initialMuted={activePip.isMuted}
      initialPlaybackRate={activePip.playbackRate}
      initialLoop={activePip.isLooping}
      initialPos={activePip.pos}
      onPipPosChange={handlePosChange}
      onPipReturn={handleReturn}
      onPipClose={handleClose}
      onPipTimeUpdate={(time, playing) => {
        if (activePip) {
          activePip.currentTime = time;
          activePip.isPlaying = playing;
        }
      }}
    />
  );
};

export default GlobalVideoPip;
