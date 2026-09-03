const { contextBridge, ipcRenderer, webFrame } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  snapWindow: (boundsRatio) => ipcRenderer.send("window-snap", boundsRatio),
  close: () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  setZoomFactor: (factor) => {
    try {
      webFrame.setZoomFactor(factor);
    } catch (e) {
      console.warn("setZoomFactor failed", e);
    }
  },
  getZoomFactor: () => {
    try {
      return webFrame.getZoomFactor();
    } catch {
      return 1;
    }
  },
  resetZoom: () => {
    try {
      webFrame.setZoomFactor(1);
      webFrame.setZoomLevel(0);
    } catch (e) {
      console.warn("resetZoom failed", e);
    }
  },
  getSavedWorkspace: () => ipcRenderer.invoke("get-saved-workspace"),
  getRecentWorkspaces: () => ipcRenderer.invoke("get-recent-workspaces"),
  scanLocalWorkspaces: () => ipcRenderer.invoke("scan-local-workspaces"),
  setSavedWorkspace: (data) => ipcRenderer.invoke("set-saved-workspace", data),
  selectWorkspaceDialog: () => ipcRenderer.invoke("select-workspace-dialog"),
  selectDirectoryDialog: (title) => ipcRenderer.invoke("select-directory-dialog", title),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  createNewWorkspace: (data) => ipcRenderer.invoke("create-new-workspace", data),
  openWorkspaceInNewWindow: (folderPath) => ipcRenderer.invoke("open-workspace-in-new-window", folderPath),
  readWorkspaceTree: (folderPath) => ipcRenderer.invoke("read-workspace-tree", folderPath),
  readDirectoryFiles: (folderPath) => ipcRenderer.invoke("read-directory-files", folderPath),
  readFileContent: (fullPath) => ipcRenderer.invoke("read-file-content", fullPath),
  readFileBase64: (fullPath) => ipcRenderer.invoke("read-file-base64", fullPath),
  readImageDataUrl: (fullPath) => ipcRenderer.invoke("read-image-data-url", fullPath),
  writeFileContent: (data) => ipcRenderer.invoke("write-file-content", data),
  writeFileBase64: (data) => ipcRenderer.invoke("write-file-base64", data),
  deleteFileOrFolder: (fullPath) => ipcRenderer.invoke("delete-file-or-folder", fullPath),
  createWorkspaceFolder: (data) => ipcRenderer.invoke("create-workspace-folder", data),
  renameFileOrFolder: (data) => ipcRenderer.invoke("rename-file-or-folder", data),
  copyFileOrFolder: (data) => ipcRenderer.invoke("copy-file-or-folder", data),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  googleOAuthLogin: (clientId) => ipcRenderer.invoke("google-oauth-login", clientId),
  fetchTtsAudio: (data) => ipcRenderer.invoke("fetch-tts-audio", data),
  getOsUserInfo: () => ipcRenderer.invoke("get-os-user-info"),
  onWorkspaceChanged: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("workspace-changed", subscription);
    return () => ipcRenderer.removeListener("workspace-changed", subscription);
  },
  onNativeSpellSuggestions: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("native-spell-suggestions", subscription);
    return () => ipcRenderer.removeListener("native-spell-suggestions", subscription);
  },
  getNativeKeyboardLanguage: () => ipcRenderer.invoke("get-native-keyboard-language"),
  onNativeKeyboardLanguageChanged: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("native-keyboard-language-changed", subscription);
    return () => ipcRenderer.removeListener("native-keyboard-language-changed", subscription);
  },
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  quitAndInstallUpdate: () => ipcRenderer.invoke("quit-and-install-update"),
  onUpdateChecking: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-checking", subscription);
    return () => ipcRenderer.removeListener("update-checking", subscription);
  },
  onUpdateAvailable: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-available", subscription);
    return () => ipcRenderer.removeListener("update-available", subscription);
  },
  onUpdateNotAvailable: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-not-available", subscription);
    return () => ipcRenderer.removeListener("update-not-available", subscription);
  },
  onUpdateError: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-error", subscription);
    return () => ipcRenderer.removeListener("update-error", subscription);
  },
  onUpdateDownloadProgress: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-download-progress", subscription);
    return () => ipcRenderer.removeListener("update-download-progress", subscription);
  },
  onUpdateDownloaded: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-downloaded", subscription);
    return () => ipcRenderer.removeListener("update-downloaded", subscription);
  },
});
