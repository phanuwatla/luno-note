import { useSyncExternalStore } from "react";

export interface ActivePipVideo {
  id: string;
  src: string;
  title?: string;
  currentTime: number;
  duration?: number;
  isPlaying: boolean;
  playbackRate?: number;
  volume?: number;
  isMuted?: boolean;
  isLooping?: boolean;
  noteId?: string;
  pos?: { x: number; y: number } | null;
  videoWidth?: number;
  videoHeight?: number;
  containerWidth?: number | null;
}

type Listener = () => void;

let activePip: ActivePipVideo | null = null;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const videoPipStore = {
  get(): ActivePipVideo | null {
    return activePip;
  },
  set(video: ActivePipVideo | null) {
    activePip = video;
    emitChange();
  },
  update(partial: Partial<ActivePipVideo>) {
    if (activePip) {
      activePip = { ...activePip, ...partial };
      emitChange();
    }
  },
  close() {
    activePip = null;
    emitChange();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useActivePipVideo(): ActivePipVideo | null {
  return useSyncExternalStore(videoPipStore.subscribe, videoPipStore.get);
}
