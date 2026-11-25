/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | Array<{ version: string; note: string }>;
  files?: Array<{ url: string; size: number; sha512: string }>;
  releaseUrl?: string;
  downloadUrl?: string;
  isFallback?: boolean;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface WorkspaceInfo {
  folderPath: string | null;
  path?: string | null;
  folderName: string | null;
  openedInNewWindow?: boolean;
  focusedExisting?: boolean;
  lastOpened?: number;
  manifest?: { id: string; name: string; [key: string]: unknown } | null;
}

export interface WorkspaceTreeEntry {
  fileName: string;
  folderPath: string;
  relativePath?: string;
  fullPath: string;
  content?: string;
  contentFormat?: "markdown" | "plain" | "html" | "css" | "javascript" | string;
  fileType?: "markdown" | "image" | "binary" | "zip" | string;
  fileSize?: number;
  size?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface DirectoryFileItem {
  name: string;
  fullPath: string;
  isDirectory: boolean;
}

export interface ClipboardImageResult {
  hasImage: boolean;
  dataUrl: string | null;
  width?: number;
  height?: number;
}

export interface GlobalFixLanguageStatus {
  enabled: boolean;
  registered: boolean;
  shortcut: string;
  platform: string;
  backgroundHelperSupported: boolean;
  backgroundHelperEnabled: boolean;
  backgroundHelperRunning: boolean;
  backgroundHelperAutoStart: boolean;
  mode: "helper" | "electron" | "disabled";
}

export interface GlobalFixLanguageConfig {
  enabled?: boolean;
  backgroundHelper?: boolean;
  language?: "en" | "th";
  labels?: {
    title?: string;
    selectTextFirst?: string;
    trayTooltipActive?: string;
    trayTooltipPaused?: string;
    menuHeader?: string;
    menuEnabled?: string;
    menuOpenApp?: string;
    menuExit?: string;
    conflictBalloon?: string;
  };
}

export interface GoogleDriveAuthData {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  expires_at?: number;
  expiresAt?: number;
  clientId?: string;
  connected?: boolean;
  tokenInfo?: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    scope?: string;
  } | null;
  profile?: { email?: string; name?: string; picture?: string } | null;
  userProfile?: { email?: string; name?: string; picture?: string } | null;
  [key: string]: unknown;
}

export interface OllamaIpcRequest {
  baseUrl?: string;
  endpoint: "/api/tags" | "/api/chat" | "/api/generate" | "/api/version";
  body?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface OllamaIpcResponse {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
}

export interface OllamaStreamChunkPayload {
  requestId: string;
  delta?: string;
  done?: boolean;
  error?: string;
  model?: string;
}

export interface OllamaSetupProgressPayload {
  stage: "downloading" | "installing" | "starting" | "pulling" | "ready";
  percent?: number;
  model?: string;
  statusText?: string;
}

export interface ElectronAPI {
  isElectron?: boolean;
  // Window controls
  minimize?: () => void;
  maximize?: () => void;
  setFullScreen?: (flag: boolean) => void;
  isFullScreen?: () => Promise<boolean>;
  snapWindow?: (boundsRatio: { xRatio: number; yRatio: number; wRatio: number; hRatio: number }) => void;
  close?: () => void;
  isMaximized?: () => Promise<boolean>;
  setZoomFactor?: (factor: number) => void;
  getZoomFactor?: () => number;
  resetZoom?: () => void;

  // Workspace & dialogs
  getSavedWorkspace?: () => Promise<WorkspaceInfo | null>;
  getRecentWorkspaces?: () => Promise<WorkspaceInfo[]>;
  scanLocalWorkspaces?: () => Promise<WorkspaceInfo[]>;
  setSavedWorkspace?: (data: WorkspaceInfo | null) => Promise<boolean>;
  getDocumentsPath?: () => Promise<string>;
  selectWorkspaceDialog?: () => Promise<WorkspaceInfo | null>;
  selectDirectoryDialog?: (title?: string, defaultPath?: string) => Promise<string | null>;
  showSaveDialog?: (options?: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  createNewWorkspace?: (data: { parentPath: string; workspaceName: string; welcomeContent?: string }) => Promise<WorkspaceInfo | null>;
  openWorkspaceInNewWindow?: (folderPath: string) => Promise<boolean>;

  // Filesystem
  readWorkspaceTree?: (folderPath: string) => Promise<{ entries: WorkspaceTreeEntry[]; folderPaths: string[] }>;
  readDirectoryFiles?: (folderPath: string) => Promise<DirectoryFileItem[]>;
  readFileContent?: (fullPath: string) => Promise<string>;
  readFileBase64?: (fullPath: string) => Promise<string>;
  fileExists?: (fullPath: string) => Promise<boolean>;
  readImageDataUrl?: (fullPath: string) => Promise<string>;
  readFileBuffer?: (fullPath: string) => Promise<ArrayBuffer | Uint8Array<ArrayBuffer> | null>;
  getPathForFile?: (file: File) => string;
  writeFileContent?: (
    data: string | { fullPath: string; content: string },
    content?: string
  ) => Promise<boolean>;
  writeFileBase64?: (data: { fullPath: string; base64?: string; contentBase64?: string }) => Promise<boolean>;
  writeFileBuffer?: (data: { fullPath: string; buffer: ArrayBuffer | Uint8Array }) => Promise<boolean>;
  deleteFileOrFolder?: (fullPath: string) => Promise<boolean>;
  deleteFile?: (fullPath: string) => Promise<boolean>;
  createWorkspaceFolder?: (data: { workspacePath: string; folderPath?: string; folderName: string }) => Promise<boolean>;
  renameFileOrFolder?: (data: { oldFullPath?: string; oldPath?: string; newFullPath?: string; newPath?: string }) => Promise<boolean>;
  copyFileOrFolder?: (data: { sourceFullPath: string; targetFullPath: string }) => Promise<boolean>;
  savePreviewFile?: (data: { fileName?: string; content: string }) => Promise<string | null>;

  // System, shell & browser
  openExternal?: (url: string) => Promise<boolean>;
  clearBrowserData?: (options?: { history?: boolean; cookies?: boolean; storage?: boolean; cache?: boolean; auth?: boolean }) => Promise<{ success: boolean; error?: string } | boolean>;
  openPath?: (fullPath: string) => Promise<boolean>;
  showItemInFolder?: (fullPath: string) => Promise<boolean>;
  printContent?: (options: { html: string; title?: string }) => Promise<{ success: boolean; failureReason?: string; error?: string }>;
  exportPdf?: (options: { html: string; title?: string; defaultPath?: string }) => Promise<{ success?: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  fetchTtsAudio?: (data: { text: string; lang: string }) => Promise<string | null>;
  ollamaRequest?: (payload: OllamaIpcRequest) => Promise<OllamaIpcResponse>;
  ollamaStreamChat?: (payload: OllamaIpcRequest & { requestId: string }) => Promise<OllamaIpcResponse>;
  ollamaAbortChat?: (payload: { requestId: string }) => Promise<{ ok: boolean }>;
  onOllamaChatStream?: (callback: (payload: OllamaStreamChunkPayload) => void) => () => void;
  ollamaCheckSystem?: () => Promise<{ installed: boolean; platform: string }>;
  ollamaStartService?: (payload?: { baseUrl?: string }) => Promise<{ ok: boolean; error?: string }>;
  ollamaInstallSystem?: (payload?: { baseUrl?: string }) => Promise<{ ok: boolean; error?: string }>;
  ollamaPullModel?: (payload: { baseUrl?: string; model: string }) => Promise<{ ok: boolean; model?: string; canceled?: boolean; error?: string }>;
  ollamaGetActivePulls?: () => Promise<OllamaSetupProgressPayload[]>;
  ollamaCancelPull?: (payload: { model: string }) => Promise<{ ok: boolean; canceled?: boolean; error?: string }>;
  ollamaDeleteModel?: (payload: { baseUrl?: string; model: string }) => Promise<{ ok: boolean; error?: string }>;
  onOllamaSetupProgress?: (callback: (progress: OllamaSetupProgressPayload) => void) => () => void;
  getOsUserInfo?: () => Promise<{ username?: string }>;

  // Clipboard
  readClipboardText?: () => Promise<string>;
  writeClipboardText?: (text: string) => Promise<boolean>;
  writeClipboardImage?: (dataUrl: string) => Promise<boolean>;
  readClipboardImage?: () => Promise<ClipboardImageResult>;
  hasClipboardImage?: () => boolean;
  readClipboardImageSync?: () => ClipboardImageResult;

  // Google Drive OAuth & Sync
  getGdriveAuth?: () => Promise<GoogleDriveAuthData | null>;
  saveGdriveAuth?: (data: GoogleDriveAuthData) => Promise<GoogleDriveAuthData | null>;
  clearGdriveAuth?: () => Promise<boolean>;
  googleFetchProfile?: (token: string) => Promise<{ email?: string; name?: string; picture?: string } | null>;
  googleOAuthLogin?: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  googleOAuthRefresh?: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  googleOAuthLogout?: (token: string) => Promise<boolean>;
  updateSyncState?: (payload: Record<string, unknown>) => Promise<{ ok: boolean } | boolean>;

  // Listeners & IME
  onWorkspaceChanged?: (callback: (data: unknown) => void) => () => void;
  onNativeSpellSuggestions?: (callback: (data: unknown) => void) => () => void;
  getNativeKeyboardLanguage?: () => Promise<string>;
  onNativeKeyboardLanguageChanged?: (callback: (lang: string) => void) => () => void;
  configureGlobalFixLanguage?: (config: GlobalFixLanguageConfig) => Promise<GlobalFixLanguageStatus>;
  getGlobalFixLanguageStatus?: () => Promise<GlobalFixLanguageStatus>;
  restartGlobalFixLanguageHelper?: () => Promise<GlobalFixLanguageStatus>;
  onTriggerFixLanguage?: (callback: () => void) => () => void;
  onFixLanguageFeedback?: (callback: (payload: { status: "empty-selection" | "converted" | "unchanged" }) => void) => () => void;

  // Auto-updater
  getAppVersion?: () => Promise<string>;
  checkForUpdates?: () => Promise<{
    success: boolean;
    isDev?: boolean;
    updateInfo?: UpdateInfo | null;
    error?: string;
    currentVersion?: string;
    message?: string;
    isUpdateAvailable?: boolean;
  }>;
  downloadUpdate?: () => Promise<{ success: boolean; error?: string; openedExternally?: boolean }>;
  quitAndInstallUpdate?: () => Promise<boolean>;
  onUpdateChecking?: (callback: () => void) => () => void;
  onUpdateAvailable?: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateNotAvailable?: (callback: (info: { version?: string; currentVersion?: string }) => void) => () => void;
  onUpdateError?: (callback: (err: { message: string }) => void) => () => void;
  onUpdateDownloadProgress?: (callback: (progress: UpdateProgress) => void) => () => void;
  onUpdateDownloaded?: (callback: (info: { version?: string; releaseNotes?: UpdateInfo["releaseNotes"] }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

declare module "nspell" {
  export interface NSpellInstance {
    correct(word: string): boolean;
    suggest(word: string): string[];
    spell(word: string): { correct: boolean; forbidden: boolean; warn: boolean };
    add(word: string, model?: string): this;
    remove(word: string): this;
    wordCharacters(): string | undefined;
    dictionary(dic: string | Uint8Array): this;
    personal(dic: string | Uint8Array): this;
  }

  export default function nspell(
    aff: string | Uint8Array | { aff: string | Uint8Array; dic?: string | Uint8Array },
    dic?: string | Uint8Array
  ): NSpellInstance;
}
