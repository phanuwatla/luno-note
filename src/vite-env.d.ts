/// <reference types="vite/client" />

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | Array<{ version: string; note: string }>;
  files?: Array<{ url: string; size: number; sha512: string }>;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  isElectron?: boolean;
  minimize?: () => void;
  maximize?: () => void;
  snapWindow?: (boundsRatio: { xRatio: number; yRatio: number; wRatio: number; hRatio: number }) => void;
  close?: () => void;
  isMaximized?: () => Promise<boolean>;
  getAppVersion?: () => Promise<string>;
  checkForUpdates?: () => Promise<{ success: boolean; isDev?: boolean; updateInfo?: UpdateInfo; error?: string; currentVersion?: string; message?: string }>;
  downloadUpdate?: () => Promise<{ success: boolean; error?: string }>;
  quitAndInstallUpdate?: () => Promise<boolean>;
  onUpdateChecking?: (callback: () => void) => () => void;
  onUpdateAvailable?: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateNotAvailable?: (callback: (info: { version?: string; currentVersion?: string }) => void) => () => void;
  onUpdateError?: (callback: (err: { message: string }) => void) => () => void;
  onUpdateDownloadProgress?: (callback: (progress: UpdateProgress) => void) => () => void;
  onUpdateDownloaded?: (callback: (info: { version?: string; releaseNotes?: any }) => void) => () => void;
  [key: string]: any;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

