const { app, BrowserWindow, ipcMain, shell, Menu, MenuItem, dialog, nativeImage, screen, clipboard, session, protocol, net } = require("electron");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "luno-asset",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);
// Disable QUIC protocol to avoid ERR_QUIC_PROTOCOL_ERROR on restricted/corporate networks
app.commandLine.appendSwitch("disable-quic");

let autoUpdater = null;
try {
  const updaterModule = require("electron-updater");
  autoUpdater = updaterModule.autoUpdater;
} catch (err) {
  console.warn("electron-updater module not available:", err);
}
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const http = require("http");
const url = require("url");
const { getSpellingSuggestions } = require("./spellDictionary");
const { exec } = require("child_process");

// Prevent multiple Electron instances from locking user data cache and freezing
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      const mainWin = wins[0];
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    }
  });
}

const configPath = path.join(app.getPath("userData"), "workspace-config.json");
const gdriveAuthPath = path.join(app.getPath("userData"), "gdrive-auth.json");

function getSavedGdriveAuth() {
  try {
    if (fs.existsSync(gdriveAuthPath)) {
      const raw = fs.readFileSync(gdriveAuthPath, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed reading gdrive-auth.json:", err);
  }
  return null;
}

function saveGdriveAuthData(data) {
  try {
    const existing = getSavedGdriveAuth() || {};
    const merged = { ...existing, ...(data || {}) };
    fs.writeFileSync(gdriveAuthPath, JSON.stringify(merged, null, 2), "utf8");
    return merged;
  } catch (err) {
    console.warn("Failed saving gdrive-auth.json:", err);
    return null;
  }
}

function clearGdriveAuthData() {
  try {
    if (fs.existsSync(gdriveAuthPath)) {
      fs.unlinkSync(gdriveAuthPath);
    }
    return true;
  } catch (err) {
    console.warn("Failed clearing gdrive-auth.json:", err);
    return false;
  }
}

async function fetchGoogleUserProfileFromMain(accessToken) {
  if (!accessToken) return null;
  try {
    let res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
    if (res.ok) {
      const data = await res.json();
      return {
        email: data.email || "user@google.com",
        name: data.name || data.given_name || "Google User",
        picture: data.picture,
      };
    }
  } catch (err) {
    console.warn("Main process failed to fetch Google user profile:", err);
  }
  return null;
}

async function resolveWorkspacesFolderId(accessToken) {
  if (!accessToken) return null;
  try {
    // 1. Search for root folder "Luno"
    const qRoot = "name = 'Luno' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const resRoot = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qRoot)}&fields=files(id,name)&pageSize=5`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resRoot.ok) return null;
    const rootData = await resRoot.json();
    let rootId = rootData.files?.[0]?.id;
    if (!rootId) {
      const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Luno",
          mimeType: "application/vnd.google-apps.folder",
        }),
      });
      if (createRes.ok) {
        const cData = await createRes.json();
        rootId = cData.id;
      }
    }
    if (!rootId) return null;

    // 2. Search for "Workspaces" inside "Luno"
    const qWs = `'${rootId}' in parents and name = 'Workspaces' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resWs = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qWs)}&fields=files(id,name)&pageSize=5`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resWs.ok) return rootId;
    const wsData = await resWs.json();
    let workspacesId = wsData.files?.[0]?.id;
    if (!workspacesId) {
      const createWs = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Workspaces",
          parents: [rootId],
          mimeType: "application/vnd.google-apps.folder",
        }),
      });
      if (createWs.ok) {
        const cwData = await createWs.json();
        workspacesId = cwData.id;
      }
    }
    return workspacesId || rootId;
  } catch (err) {
    console.warn("Main process failed to resolve Workspaces folder ID:", err);
    return null;
  }
}

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"]);
const TEXT_EXTS = new Set([".md", ".markdown", ".txt", ".html", ".htm", ".js", ".ts", ".jsx", ".tsx", ".json", ".css", ".scss", ".yaml", ".yml", ".xml", ".py"]);

const IGNORED_SCAN_FOLDERS = new Set([
  "node_modules",
  "dist",
  "dist-desktop",
  "build",
  "build-installer",
  "release",
  "src-tauri",
  "target",
  ".git",
  ".github",
  ".vscode",
  ".idea",
  "coverage",
  "bin",
  "obj",
  "tmp",
  "temp",
  ".cache",
  ".next",
  ".nuxt",
  "attachments",
  ".attachments",
  "assets",
  ".luno",
]);

const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".vbs", ".vbe", ".js", ".jse", ".wsf", ".wsh",
  ".ps1", ".ps1xml", ".ps2", ".psc1", ".psc2", ".msh", ".msh1", ".msh2",
  ".reg", ".hta", ".cpl", ".jar", ".scr", ".pif", ".msi", ".msp", ".mst",
  ".appx", ".appxbundle", ".msix", ".msixbundle", ".sh", ".bash"
]);

function isCriticalSystemPath(targetPath) {
  if (!targetPath || typeof targetPath !== "string") return true;
  if (targetPath.includes("\0")) return true;
  try {
    const resolved = path.resolve(targetPath);
    const root = path.parse(resolved).root;
    if (resolved === root || resolved === path.dirname(root)) return true;

    const homedir = os.homedir();
    if (resolved === path.resolve(homedir)) return true;

    const winDir = process.env.WINDIR || process.env.SYSTEMROOT;
    if (winDir && resolved.toLowerCase().startsWith(path.resolve(winDir).toLowerCase())) return true;
    const progFiles = process.env.ProgramFiles;
    if (progFiles && resolved.toLowerCase().startsWith(path.resolve(progFiles).toLowerCase())) return true;
    const progFilesX86 = process.env["ProgramFiles(x86)"];
    if (progFilesX86 && resolved.toLowerCase().startsWith(path.resolve(progFilesX86).toLowerCase())) return true;

    return false;
  } catch {
    return true;
  }
}

function detectSystemLanguage() {
  try {
    const locale = (app.getLocale() || "").toLowerCase();
    if (locale.startsWith("th")) {
      return "th";
    }
  } catch {}
  return "en";
}

const DEFAULT_WORKSPACE_SETTINGS = {
  editorFontSize: 15,
  sidebarWidth: 280,
  confirmBeforeDelete: true,
  language: detectSystemLanguage(),
  fontFamily: "inter",
  editorFontFamily: "inter",
  theme: "emerald",
  appearanceStyle: "default",
  colorScheme: "system",
  autoSave: true,
  reopenTabs: true,
  onStartup: "home",
  checkUpdates: true,
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  startWeekOn: "monday",
  enableAnimations: true,
  sendUsageData: false,
  trashRetentionDays: 30,
  autoEmptyTrash: true,
  defaultExtension: "md",
  newFilePattern: "untitled",
  defaultNoteTemplate: "blank",
  defaultTemplateMd: "blank",
  defaultTemplateTxt: "blank",
  defaultTemplateHtml: "blank",
  autoFolderIcons: true,
  interfaceScale: 100,
  iconPack: "lucide",
  folderIcons: {},
  fileIcons: {},
  editorWidth: "standard",
  lineHeight: "1.6",
  sidebarDensity: "comfortable",
  showGuideLines: true,
  tagColorStyle: "multicolor",
  accentHeadings: false,
  customAccentColor: "#26A295",
  showWordCount: true,
  autoPairBrackets: true,
  showCodeLineNumbers: false,
  highlightInlineCode: false,
  spellCheck: true,
  geminiApiKey: "",
  aiModel: "auto",
  storageMode: "local",
  googleDriveClientId: "",
};

function ensureDefaultWorkspaceFolders(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) return;
  try {
    const lunoDir = path.join(folderPath, ".luno");
    const attachmentsDir = path.join(folderPath, "attachments");
    if (!fs.existsSync(lunoDir)) {
      fs.mkdirSync(lunoDir, { recursive: true });
    }
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }
    const settingsFile = path.join(lunoDir, "settings.json");
    if (!fs.existsSync(settingsFile)) {
      fs.writeFileSync(settingsFile, JSON.stringify(DEFAULT_WORKSPACE_SETTINGS, null, 2), "utf8");
    }
    const workspaceFile = path.join(lunoDir, "workspace.json");
    if (!fs.existsSync(workspaceFile)) {
      const wsData = {
        id: "ws_" + crypto.randomUUID(),
        name: path.basename(folderPath),
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      fs.writeFileSync(workspaceFile, JSON.stringify(wsData, null, 2), "utf8");
    }
    const lunoGitignore = path.join(lunoDir, ".gitignore");
    if (!fs.existsSync(lunoGitignore)) {
      fs.writeFileSync(lunoGitignore, "# Ignore local workspace configuration and session\nsettings.json\nsession.json\n*.local\n", "utf8");
    }
  } catch (err) {
    console.warn("Failed ensuring default workspace folders:", err);
  }
}

function getSavedWorkspaceData() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      const data = JSON.parse(raw);
      const currentVersion = app.getVersion();

      // Keep lastAppVersion updated across updates while preserving the open workspace
      if (data?.lastAppVersion !== currentVersion) {
        data.lastAppVersion = currentVersion;
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
      }

      if (data?.folderPath) {
        if (fs.existsSync(data.folderPath)) {
          ensureDefaultWorkspaceFolders(data.folderPath);
        } else {
          // Only reset if the directory no longer exists on local disk
          data.folderPath = null;
          data.folderName = null;
          fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
        }
      }
      return data;
    }
  } catch (err) {
    console.warn("Failed reading workspace config:", err);
  }
  return null;
}

function getRecentWorkspacesList() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      const data = JSON.parse(raw);
      return Array.isArray(data?.recentWorkspaces) ? data.recentWorkspaces : [];
    }
  } catch (err) {
    console.warn("Failed reading recent workspaces:", err);
  }
  return [];
}

function saveWorkspaceData(data) {
  try {
    let recent = getRecentWorkspacesList();
    if (data?.folderPath) {
      ensureDefaultWorkspaceFolders(data.folderPath);
      recent = recent.filter((r) => r.folderPath !== data.folderPath);
      recent.unshift({
        folderPath: data.folderPath,
        folderName: data.folderName || path.basename(data.folderPath),
        lastOpened: Date.now(),
      });
    }
    const toSave = {
      ...(data || {}),
      lastAppVersion: app.getVersion(),
      recentWorkspaces: recent.slice(0, 50),
    };
    fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed saving workspace config:", err);
  }
}

const windowWorkspaceMap = new Map(); // windowId -> folderPath (string | null)
const windowWatchers = new Map(); // windowId -> { watcher, debounceTimer }

function stopWorkspaceWatcherForWindow(windowId) {
  const item = windowWatchers.get(windowId);
  if (item) {
    if (item.debounceTimer) clearTimeout(item.debounceTimer);
    if (item.watcher) {
      try {
        item.watcher.close();
      } catch {
        /* ignore */
      }
    }
    windowWatchers.delete(windowId);
  }
}

function startWorkspaceWatcher(folderPath, targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  const windowId = targetWindow.id;
  stopWorkspaceWatcherForWindow(windowId);
  if (!folderPath || !fs.existsSync(folderPath)) return;

  try {
    let debounceTimer = null;
    const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const norm = filename.replace(/\\/g, "/").toLowerCase();
      const baseName = path.basename(norm);
      if (
        baseName.startsWith(".") ||
        baseName.startsWith("~$") ||
        baseName.endsWith(".tmp") ||
        baseName.endsWith(".swp") ||
        baseName.endsWith(".crdownload") ||
        baseName === "thumbs.db" ||
        baseName === "desktop.ini" ||
        baseName === "session.json"
      ) {
        return;
      }
      const parts = norm.split("/");
      if (parts.some((p) => p.startsWith(".") || IGNORED_SCAN_FOLDERS.has(p) || p === ".luno" || p === ".obsidian")) {
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!targetWindow.isDestroyed()) {
          const tree = scanWorkspaceTree(folderPath);
          targetWindow.webContents.send("workspace-changed", {
            folderPath,
            ...tree,
          });
        }
      }, 600);
    });

    windowWatchers.set(windowId, { watcher, debounceTimer });
  } catch (err) {
    console.warn("Failed starting workspace watcher:", folderPath, err);
  }
}

function findWindowWithWorkspace(folderPath) {
  if (!folderPath) return null;
  const targetNorm = path.normalize(folderPath).toLowerCase();
  for (const [winId, wsPath] of windowWorkspaceMap.entries()) {
    if (wsPath && path.normalize(wsPath).toLowerCase() === targetNorm) {
      const win = BrowserWindow.fromId(winId);
      if (win && !win.isDestroyed()) {
        return win;
      }
    }
  }
  return null;
}

function scanWorkspaceTree(rootDir) {
  const entries = [];
  const folderPathsSet = new Set();
  const MAX_ENTRIES = 1000;

  function recurse(currentDir, relativePath, depth = 0) {
    if (entries.length >= MAX_ENTRIES || depth > 10) return;
    let files;
    try {
      files = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const file of files) {
      if (entries.length >= MAX_ENTRIES) break;
      const name = file.name;
      const lowerName = name.toLowerCase();
      if (
        name.startsWith(".") ||
        name.startsWith("~$") ||
        lowerName.endsWith(".tmp") ||
        lowerName.endsWith(".swp") ||
        lowerName.endsWith(".crdownload") ||
        lowerName === "thumbs.db" ||
        lowerName === "desktop.ini" ||
        IGNORED_SCAN_FOLDERS.has(lowerName)
      ) {
        continue;
      }

      const fullPath = path.join(currentDir, name);
      const relFilePath = relativePath ? `${relativePath}/${name}` : name;

      if (file.isDirectory()) {
        folderPathsSet.add(relFilePath);
        recurse(fullPath, relFilePath, depth + 1);
      } else if (file.isFile()) {
        const ext = path.extname(name).toLowerCase();
        let fileType;
        let contentFormat = "plain";
        let content = "";
        let createdAt = Date.now();
        let updatedAt = Date.now();
        let size = 0;

        try {
          const stat = fs.statSync(fullPath);
          size = stat.size || 0;
          createdAt = stat.birthtimeMs || stat.ctimeMs || stat.mtimeMs || Date.now();
          updatedAt = stat.mtimeMs || Date.now();
        } catch {
          // ignore stat errors
        }

        if (IMAGE_EXTS.has(ext)) {
          fileType = "image";
        } else if (TEXT_EXTS.has(ext) || ext === "") {
          contentFormat = ext === ".md" || ext === ".markdown" || ext === "" ? "markdown" : ext === ".html" || ext === ".htm" ? "html" : ext === ".css" ? "css" : "plain";
          // Only read content for files <= 2MB to prevent renderer/main process blocking
          if (size <= 2 * 1024 * 1024) {
            try {
              content = fs.readFileSync(fullPath, "utf8");
            } catch {
              content = "";
            }
          }
        } else {
          fileType = "binary";
        }

        entries.push({
          fileName: name,
          folderPath: relativePath,
          relativePath: relFilePath,
          fullPath,
          content,
          contentFormat,
          fileType,
          fileSize: size,
          createdAt,
          updatedAt,
        });
      }
    }
  }

  recurse(rootDir, "", 0);
  return {
    entries,
    folderPaths: Array.from(folderPathsSet).sort((a, b) => a.localeCompare(b)),
  };
}

function getAppIconPath() {
  const electronIco = path.join(__dirname, "icon.ico");
  if (fs.existsSync(electronIco)) return electronIco;
  const electronPng = path.join(__dirname, "luno-logo.png");
  if (fs.existsSync(electronPng)) return electronPng;
  const distIcon = path.join(__dirname, "../dist/luno-logo.png");
  if (fs.existsSync(distIcon)) return distIcon;
  const publicIcon = path.join(__dirname, "../public/luno-logo.png");
  if (fs.existsSync(publicIcon)) return publicIcon;
  const tauriIco = path.join(__dirname, "../src-tauri/icons/icon.ico");
  if (fs.existsSync(tauriIco)) return tauriIco;
  return electronIco;
}

function getNativeAppIcon() {
  const iconPath = getAppIconPath();
  try {
    if (iconPath && fs.existsSync(iconPath)) {
      const img = nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) return img;
    }
  } catch {
    /* ignore */
  }
  return iconPath;
}

function createWindow(initialWorkspacePath = null) {
  const appIcon = getNativeAppIcon();
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    title: "Luno Note",
    icon: appIcon,
    frame: false, // Custom React titlebar controls!
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      webviewTag: true,
    },
  });

  if (initialWorkspacePath) {
    windowWorkspaceMap.set(win.id, initialWorkspacePath);
  }

  // Remove default application menu so ALL shortcuts (Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+W, etc.) pass cleanly to React
  Menu.setApplicationMenu(null);

  // Prevent pinch-to-zoom from distorting the whole window layout
  try {
    win.webContents.setVisualZoomLevelLimits(1, 1);
  } catch {
    /* ignore */
  }

  // Configure spell checker languages for Thai and English
  try {
    const session = win.webContents.session;
    const cleanUserAgent = win.webContents.userAgent.replace(/Electron\/\S+\s?/, "").replace(/luno-note(s)?\/\S+\s?/, "");
    win.webContents.setUserAgent(cleanUserAgent);

    const availableLangs = session.availableSpellCheckerLanguages || [];
    const desiredLangs = ["en-US", "th", "th-TH"];
    const supportedLangs = desiredLangs.filter((l) => availableLangs.length === 0 || availableLangs.includes(l));
    if (supportedLangs.length > 0) {
      session.setSpellCheckerLanguages(supportedLangs);
    } else {
      session.setSpellCheckerLanguages(["en-US"]);
    }

    // Add custom words (like Luno) so Chromium does not mark them as misspelled
    try {
      session.addWordToSpellCheckerDictionary("Luno");
      session.addWordToSpellCheckerDictionary("luno");
      session.addWordToSpellCheckerDictionary("LUNO");
    } catch {
      /* ignore */
    }

    // Grant microphone and audio media permissions for voice recording
    try {
      session.setPermissionRequestHandler((_webContents, permission, callback) => {
        if (permission === "media") {
          return callback(true);
        }
        callback(false);
      });

      session.setPermissionCheckHandler((_webContents, permission) => {
        if (permission === "media") {
          return true;
        }
        return false;
      });
    } catch (permErr) {
      console.warn("Could not set media permission handler:", permErr);
    }
  } catch (err) {
    console.warn("Could not set spellchecker languages:", err);
  }

  // Forward Chromium's native spell check suggestions to renderer
  win.webContents.on("context-menu", (_event, params) => {
    if (params.misspelledWord && ["luno", "luno-ai"].includes(params.misspelledWord.toLowerCase())) {
      return;
    }
    if (params.misspelledWord || (params.dictionarySuggestions && params.dictionarySuggestions.length > 0)) {
      win.webContents.send("native-spell-suggestions", {
        word: params.misspelledWord,
        suggestions: params.dictionarySuggestions || [],
      });
    }
  });

  win.on("closed", () => {
    stopWorkspaceWatcherForWindow(win.id);
    windowWorkspaceMap.delete(win.id);
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    const loadDevServer = () => {
      win.loadURL("http://localhost:8080").catch((err) => {
        console.warn("Dev server not ready yet, retrying...", err?.message || err);
        setTimeout(() => {
          if (!win.isDestroyed()) {
            loadDevServer();
          }
        }, 1000);
      });
    };
    loadDevServer();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Open external links in user's default browser, but allow Google OAuth login popup
  win.webContents.setWindowOpenHandler(({ url, disposition, frameName }) => {
    try {
      if (
        url === "about:blank" ||
        !url ||
        url.startsWith("about:") ||
        disposition === "picture-in-picture" ||
        frameName === "Picture-in-Picture"
      ) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            width: 480,
            height: 270,
            minWidth: 280,
            minHeight: 160,
            alwaysOnTop: true,
            autoHideMenuBar: true,
            frame: true,
            minimizable: false,
            fullscreenable: false,
            icon: getAppIconPath(),
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
            },
          },
        };
      }
      const parsedUrl = new URL(url);
      if (
        (parsedUrl.hostname === "accounts.google.com" || parsedUrl.hostname.endsWith(".google.com")) &&
        (parsedUrl.pathname.includes("/o/oauth2/") || parsedUrl.pathname.includes("/gsi/"))
      ) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            width: 520,
            height: 650,
            autoHideMenuBar: true,
            icon: getAppIconPath(),
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
            },
          },
        };
      }
      if (["http:", "https:", "mailto:", "tel:"].includes(parsedUrl.protocol)) {
        shell.openExternal(url);
      }
    } catch {
      /* ignore invalid URLs */
    }
    return { action: "deny" };
  });

  // Guard against in-window navigations to external or unverified origins
  win.webContents.on("will-navigate", (event, targetUrl) => {
    try {
      const parsed = new URL(targetUrl);
      if (isDev && parsed.origin === "http://localhost:8080") {
        return;
      }
      if (!isDev && parsed.protocol === "file:") {
        return;
      }
      event.preventDefault();
      if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
        shell.openExternal(targetUrl);
      }
    } catch {
      event.preventDefault();
    }
  });

  return win;
}

let ipcHandlersInitialized = false;

function setupIpcHandlers() {
  if (ipcHandlersInitialized) return;
  ipcHandlersInitialized = true;

  ipcMain.handle("get-gdrive-auth", () => {
    return getSavedGdriveAuth();
  });

  ipcMain.handle("save-gdrive-auth", (_event, data) => {
    return saveGdriveAuthData(data);
  });

  ipcMain.handle("clear-gdrive-auth", () => {
    return clearGdriveAuthData();
  });

  ipcMain.handle("google-fetch-profile", async (_event, accessToken) => {
    const profile = await fetchGoogleUserProfileFromMain(accessToken);
    if (profile) {
      saveGdriveAuthData({ profile });
    }
    return profile;
  });

  const getClipboardImagePayload = () => {
    try {
      // 1. Direct image from system clipboard (Snipping tool, PrintScreen, web browser "Copy Image", etc.)
      const img = clipboard.readImage();
      if (!img.isEmpty()) {
        const size = img.getSize();
        return {
          hasImage: true,
          dataUrl: img.toDataURL(),
          width: size.width,
          height: size.height,
        };
      }

      // 2. Copied image file from Windows File Explorer
      if (process.platform === "win32") {
        let filePath = "";
        try {
          const bufW = clipboard.readBuffer("FileNameW");
          if (bufW && bufW.length > 0) {
            filePath = bufW.toString("utf16le").replace(/\0.*$/, "").trim();
          }
        } catch {}
        if (!filePath) {
          try {
            const bufA = clipboard.readBuffer("FileName");
            if (bufA && bufA.length > 0) {
              filePath = bufA.toString("utf8").replace(/\0.*$/, "").trim();
            }
          } catch {}
        }
        if (!filePath) {
          try {
            const text = clipboard.readText().trim();
            if (/^[a-zA-Z]:\\.+\.(png|jpe?g|gif|webp|bmp|svg|ico|tiff?|avif)$/i.test(text)) {
              filePath = text;
            }
          } catch {}
        }

        if (filePath && fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            const ext = path.extname(filePath).toLowerCase().replace(".", "");
            const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico", "tif", "tiff", "avif"];
            if (imageExts.includes(ext)) {
              const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
                : ext === "png" ? "image/png"
                : ext === "webp" ? "image/webp"
                : ext === "gif" ? "image/gif"
                : ext === "svg" ? "image/svg+xml"
                : ext === "bmp" ? "image/bmp"
                : `image/${ext}`;
              const fileData = fs.readFileSync(filePath);
              const dataUrl = `data:${mime};base64,${fileData.toString("base64")}`;
              return {
                hasImage: true,
                dataUrl,
                fileName: path.basename(filePath),
                filePath,
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn("getClipboardImagePayload error:", err);
    }
    return { hasImage: false, dataUrl: null };
  };

  ipcMain.handle("read-clipboard-image", async () => {
    return getClipboardImagePayload();
  });

  ipcMain.on("read-clipboard-image-sync", (event) => {
    event.returnValue = getClipboardImagePayload();
  });

  const unpackCredential = (bytes, key = 42) => {
    try {
      return bytes.map((c) => String.fromCharCode(c ^ key)).join("");
    } catch {
      return "";
    }
  };

  const DEFAULT_GOOGLE_CLIENT_ID = unpackCredential([29,24,29,18,31,31,24,19,30,18,26,19,7,90,88,64,67,91,67,89,66,65,28,76,30,24,78,30,18,31,78,77,30,78,19,71,69,75,26,28,92,90,78,89,88,4,75,90,90,89,4,77,69,69,77,70,79,95,89,79,88,73,69,68,94,79,68,94,4,73,69,71]);
  const DEFAULT_GOOGLE_CLIENT_SECRET = unpackCredential([109,101,105,121,122,114,7,71,114,75,25,117,31,99,70,93,123,103,80,101,66,122,78,120,98,26,27,95,95,126,67,96,73,79,97]);

  const KNOWN_GOOGLE_CLIENT_SECRETS = {
    [DEFAULT_GOOGLE_CLIENT_ID]: DEFAULT_GOOGLE_CLIENT_SECRET,
    [unpackCredential([18,30,25,19,30,27,26,26,24,31,18,24,7,76,89,79,65,70,92,65,79,73,27,76,91,68,24,67,88,26,18,69,75,89,91,66,30,73,71,70,70,69,71,70,67,4,75,90,90,89,4,77,69,69,77,70,79,95,89,79,88,73,69,68,94,79,68,94,4,73,69,71])]:
      unpackCredential([109,101,105,121,122,114,7,104,110,127,107,76,90,122,79,96,105,125,31,110,77,73,71,126,91,103,99,110,123,103,108,90,105,93,76]),
  };

  function resolveGoogleOAuthCredentials(payload) {
    let clientId = (typeof payload === "string" ? payload : payload?.clientId) || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "undefined" || clientId === "null" || String(clientId).includes("placeholder")) {
      clientId = DEFAULT_GOOGLE_CLIENT_ID;
    }
    let clientSecret = (typeof payload === "object" && payload?.clientSecret ? payload.clientSecret : null) || process.env.VITE_GOOGLE_CLIENT_SECRET;
    if (!clientSecret || clientSecret === "undefined" || clientSecret === "null") {
      clientSecret = KNOWN_GOOGLE_CLIENT_SECRETS[clientId] || DEFAULT_GOOGLE_CLIENT_SECRET;
    }
    return { clientId, clientSecret };
  }

  let cachedLunoLogoDataUrl = "";
  function getLunoLogoDataUrl() {
    if (cachedLunoLogoDataUrl) return cachedLunoLogoDataUrl;
    const candidates = [
      path.join(__dirname, "luno-logo.png"),
      path.join(__dirname, "../dist/luno-logo.png"),
      path.join(__dirname, "../public/luno-logo.png"),
      path.join(__dirname, "../src/assets/luno-logo.png"),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        try {
          const buf = fs.readFileSync(c);
          cachedLunoLogoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
          return cachedLunoLogoDataUrl;
        } catch {}
      }
    }
    return "/luno-logo.png";
  }

  let currentSyncState = {
    status: "idle",
    lastSyncedAt: null,
    folderStructure: null,
  };

  ipcMain.handle("update-sync-state", async (_event, payload) => {
    if (payload) {
      currentSyncState = {
        ...currentSyncState,
        ...payload,
      };
    }
    return { ok: true };
  });

  ipcMain.handle("google-oauth-login", async (event, payload) => {
    const { clientId, clientSecret } = resolveGoogleOAuthCredentials(payload);

    return new Promise((resolve, reject) => {
      let isSettled = false;

      // 1. Generate PKCE code verifier and challenge (RFC 7636)
      const codeVerifier = crypto.randomBytes(32).toString("base64url");
      const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

      const bringAppToFront = () => {
        try {
          const allWins = BrowserWindow.getAllWindows();
          for (const win of allWins) {
            if (!win.isDestroyed()) {
              if (win.isMinimized()) win.restore();
              win.setAlwaysOnTop(true);
              win.show();
              win.focus();
              win.moveTop();
              setTimeout(() => {
                try {
                  if (!win.isDestroyed()) {
                    win.setAlwaysOnTop(false);
                    win.focus();
                  }
                } catch {}
              }, 300);
            }
          }
          app.focus({ steal: true });
        } catch {}
      };

      const getCloseTabExePath = () => {
        const directPath = path.join(__dirname, "closeTab.exe");
        const unpackedPath = directPath.replace("app.asar", "app.asar.unpacked");
        if (fs.existsSync(unpackedPath)) return unpackedPath;
        if (!directPath.includes("app.asar") && fs.existsSync(directPath)) return directPath;
        try {
          const userDataPath = app.getPath("userData");
          const extractedPath = path.join(userDataPath, "closeTab.exe");
          if (fs.existsSync(directPath)) {
            const content = fs.readFileSync(directPath);
            let shouldWrite = true;
            if (fs.existsSync(extractedPath)) {
              try {
                if (fs.readFileSync(extractedPath).equals(content)) shouldWrite = false;
              } catch {}
            }
            if (shouldWrite) {
              fs.writeFileSync(extractedPath, content);
            }
            return extractedPath;
          }
        } catch {}
        return directPath;
      };

      const closeActiveBrowserTabAndFocusApp = () => {
        if (process.platform === "win32") {
          try {
            const exePath = getCloseTabExePath();
            if (fs.existsSync(exePath)) {
              const child = require("child_process").spawn(exePath, [], {
                windowsHide: true,
                stdio: "ignore",
                detached: false,
              });
              child.on("close", () => {
                setTimeout(() => {
                  bringAppToFront();
                }, 150);
              });
              child.on("error", () => {
                bringAppToFront();
              });
            } else {
              bringAppToFront();
            }
          } catch {
            bringAppToFront();
          }
        } else if (process.platform === "darwin") {
          try {
            exec('osascript -e \'tell application "System Events" to keystroke "w" using command down\'', () => {
              setTimeout(() => { bringAppToFront(); }, 200);
            });
          } catch {
            bringAppToFront();
          }
        } else {
          bringAppToFront();
        }
      };

      const server = http.createServer(async (req, res) => {
        try {
          const parsedUrl = url.parse(req.url, true);

          if (parsedUrl.pathname === "/favicon.ico") {
            const icoPath = path.join(__dirname, "icon.ico");
            if (fs.existsSync(icoPath)) {
              res.writeHead(200, { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=86400" });
              res.end(fs.readFileSync(icoPath));
              return;
            }
            const altPath = path.join(__dirname, "../public/icon.ico");
            if (fs.existsSync(altPath)) {
              res.writeHead(200, { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=86400" });
              res.end(fs.readFileSync(altPath));
              return;
            }
            res.writeHead(404);
            res.end();
            return;
          }

          if (parsedUrl.pathname === "/luno-logo.png" || parsedUrl.pathname === "/favicon.png") {
            const candidates = [
              path.join(__dirname, "luno-logo.png"),
              path.join(__dirname, "../dist/luno-logo.png"),
              path.join(__dirname, "../public/luno-logo.png"),
              path.join(__dirname, "../src/assets/luno-logo.png"),
            ];
            for (const c of candidates) {
              if (fs.existsSync(c)) {
                res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" });
                res.end(fs.readFileSync(c));
                return;
              }
            }
            res.writeHead(404);
            res.end();
            return;
          }

          if (parsedUrl.pathname === "/sync-status") {
            res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
            res.end(JSON.stringify({
              status: currentSyncState.status || "synced",
              lastSyncedAt: currentSyncState.lastSyncedAt || Date.now(),
              folderId: currentSyncState.folderStructure?.workspacesId || currentSyncState.folderStructure?.projectId || currentSyncState.folderStructure?.rootId || null,
            }));
            return;
          }

          if (parsedUrl.pathname === "/focus" || parsedUrl.pathname === "/close-tab") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
            closeActiveBrowserTabAndFocusApp();
            return;
          }

          if (parsedUrl.pathname === "/" || parsedUrl.pathname === "") {
            const queryCode = parsedUrl.query.code;
            const queryError = parsedUrl.query.error;

            if (queryError) {
              bringAppToFront();
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(`<!DOCTYPE html><html><head><title>Luno Note</title><script>window.open('','_self','');window.close();</script></head><body style="margin:0;background:#0f172a;"><script>window.open('','_self','');window.close();</script></body></html>`);

              if (!isSettled) {
                isSettled = true;
                try { server.close(); } catch {}
                reject(new Error(String(queryError)));
              }
              return;
            }

            if (queryCode) {
              if (!isSettled) {
                isSettled = true;
                try {
                  const port = server.address().port;
                  const redirectUri = `http://127.0.0.1:${port}`;

                  // Exchange authorization code for tokens via PKCE
                  const tokenBody = {
                    client_id: clientId,
                    code: String(queryCode),
                    code_verifier: codeVerifier,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri,
                  };
                  if (clientSecret) {
                    tokenBody.client_secret = clientSecret;
                  }
                  const tokenParams = new URLSearchParams(tokenBody);

                  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: tokenParams.toString(),
                  });

                  if (!tokenRes.ok) {
                    const errText = await tokenRes.text();
                    try { server.close(); } catch {}
                    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                    res.end(`Token exchange failed: ${errText}`);
                    reject(new Error(`Token exchange failed (${tokenRes.status}): ${errText}`));
                    return;
                  }

                  const tokenData = await tokenRes.json();

                  let userProfile = null;
                  if (tokenData.access_token) {
                    userProfile = await fetchGoogleUserProfileFromMain(tokenData.access_token);
                  }
                  const authToSave = {
                    tokenInfo: {
                      access_token: tokenData.access_token,
                      expires_at: Date.now() + (Number(tokenData.expires_in) || 3600) * 1000,
                      refresh_token: tokenData.refresh_token,
                      scope: tokenData.scope,
                    },
                    profile: userProfile,
                    connected: true,
                    clientId,
                  };
                  saveGdriveAuthData(authToSave);

                  // Resolve target Google Drive Workspaces folder ID
                  let targetFolderId = currentSyncState.folderStructure?.workspacesId || currentSyncState.folderStructure?.projectId || currentSyncState.folderStructure?.rootId;
                  if (!targetFolderId && tokenData.access_token) {
                    targetFolderId = await resolveWorkspacesFolderId(tokenData.access_token);
                    if (targetFolderId) {
                      currentSyncState.folderStructure = {
                        ...(currentSyncState.folderStructure || {}),
                        workspacesId: targetFolderId,
                      };
                    }
                  }
                  const safeDriveUrl = targetFolderId
                    ? `https://drive.google.com/drive/folders/${targetFolderId}`
                    : "https://drive.google.com";

                  const logoDataUrl = getLunoLogoDataUrl();
                  const safeEmail = (userProfile?.email || "Google User").replace(/[<>"']/g, "");
                  const initialTime = currentSyncState.lastSyncedAt
                    ? new Date(currentSyncState.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
                    : (() => {
                        const now = new Date();
                        const pad = (n) => String(n).padStart(2, "0");
                        return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                      })();

                  const initialStatusMap = {
                    synced: "ซิงค์แล้ว",
                    idle: "พร้อมทำงาน",
                    syncing: "กำลังซิงค์...",
                    saving: "กำลังบันทึก...",
                    offline: "ออฟไลน์",
                    error: "เกิดข้อผิดพลาด",
                  };
                  const initialStatusText = initialStatusMap[currentSyncState.status] || "ซิงค์แล้ว";
                  const initialStatusColor = currentSyncState.status === "syncing" ? "#26A295" : (currentSyncState.status === "saving" ? "#f59e0b" : "#10b981");

                  // Serve the Google Drive Sync landing page matching Settings Data & Storage UI
                  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title id="doc-title">Google Drive Sync</title>
  <link rel="icon" type="image/png" href="${logoDataUrl}">
  <link rel="shortcut icon" href="${logoDataUrl}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --border: rgba(226, 232, 240, 0.8);
      --card-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
      --foreground: #0f172a;
      --muted-foreground: #64748b;
      --muted-box: rgba(241, 245, 249, 0.65);
      --muted-border: rgba(226, 232, 240, 0.75);
      --btn-bg: #26A295;
      --btn-hover: #1f8b7f;
      --badge-bg: rgba(16, 185, 129, 0.1);
      --badge-text: #059669;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f131a;
        --card: #191d24;
        --border: rgba(39, 48, 63, 0.8);
        --card-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        --foreground: #f1f5f9;
        --muted-foreground: #8b97a8;
        --muted-box: rgba(34, 41, 56, 0.5);
        --muted-border: rgba(39, 48, 63, 0.7);
        --btn-bg: #26A295;
        --btn-hover: #2ea89b;
        --badge-bg: rgba(16, 185, 129, 0.15);
        --badge-text: #34d399;
      }
    }
    body {
      font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      color: var(--foreground);
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      width: 100%;
      max-width: 520px;
      padding: 28px 32px 26px 32px;
      text-align: center;
      animation: fadeIn 0.25s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .group-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 10px;
      border-radius: 9999px;
      background: var(--badge-bg);
      color: var(--badge-text);
      font-size: 11.5px;
      font-weight: 600;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.8); }
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #10b981;
      display: inline-block;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .hero-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 20px;
    }
    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--muted-box);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .app-logo-img {
      width: 26px;
      height: 26px;
      object-fit: contain;
    }
    .flow-connector {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
    }
    .connector-line {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      border-top: 2px dashed #cbd5e1;
      transform: translateY(-50%);
    }
    @media (prefers-color-scheme: dark) {
      .connector-line { border-top-color: #334155; }
    }
    .check-badge {
      position: relative;
      z-index: 2;
      width: 22px;
      height: 22px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
    }
    .title {
      font-size: 18.5px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 6px;
      letter-spacing: -0.015em;
    }
    .subtitle {
      font-size: 12px;
      line-height: 1.55;
      color: var(--muted-foreground);
      margin-bottom: 22px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1.25fr;
      gap: 12px 18px;
      padding: 16px 20px;
      border-radius: 12px;
      background: var(--muted-box);
      border: 1px solid var(--muted-border);
      margin-bottom: 22px;
      text-align: left;
    }
    .info-cell {
      min-width: 0;
      position: relative;
    }
    .info-lbl {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted-foreground);
      display: block;
      margin-bottom: 3px;
    }
    .info-val {
      font-size: 12px;
      font-weight: 600;
      color: var(--foreground);
      display: block;
      line-height: 1.4;
    }
    .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .location-val {
      display: flex;
      align-items: center;
      gap: 4px;
      word-break: break-word;
    }
    .location-link {
      text-decoration: none !important;
      cursor: pointer;
      transition: color 0.15s ease;
      color: var(--foreground);
    }
    .location-link:hover,
    .location-link:focus,
    .location-link:active {
      text-decoration: none !important;
      color: var(--btn-bg);
    }
    .location-link:hover .ext-icon {
      opacity: 1;
    }
    .ext-icon {
      flex-shrink: 0;
      opacity: 0.6;
    }
    .state-synced {
      display: inline-block;
      color: var(--badge-text);
      transition: color 0.15s ease;
    }

    /* In-app styled tooltips (replacing native browser title tooltips) */
    .tooltip-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      width: 100%;
    }
    .app-tooltip {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      background: var(--card);
      color: var(--foreground);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-2px);
      transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
      z-index: 100;
    }
    @media (prefers-color-scheme: dark) {
      .app-tooltip {
        background: #1e242d;
        border-color: #334155;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        color: #f1f5f9;
      }
    }
    .tooltip-container:hover .app-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      background: var(--btn-bg);
      color: #ffffff;
      border: none;
      outline: none !important;
      border-radius: 12px;
      padding: 11px 24px;
      font-size: 13.5px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      margin: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .action-btn:focus,
    .action-btn:focus-visible,
    .action-btn:active {
      outline: none !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .action-btn:hover {
      background: var(--btn-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(38, 162, 149, 0.25);
    }
    .action-btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-top-bar">
      <div id="lbl-group" class="group-title">Cloud Sync</div>
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span id="lbl-status">Connected</span>
      </div>
    </div>

    <div class="hero-flow">
      <!-- Google Drive Icon matching Settings / Data & Storage -->
      <div class="icon-box">
        <svg viewBox="0 0 192 192" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
          <defs>
            <clipPath id="gdrive_clip">
              <path d="M63.09 37c14.626-25.333 51.193-25.334 65.819 0l45.033 78c14.626 25.334-3.657 57.001-32.91 57.001H50.967c-29.253 0-47.536-31.667-32.91-57.001z"/>
            </clipPath>
            <linearGradient id="gdrive_b" x1="193.6" x2="103.09" y1="165.6" y2="111.21" gradientUnits="userSpaceOnUse">
              <stop offset="0.09" stop-color="#ffe921"/>
              <stop offset="1" stop-color="#fec700"/>
            </linearGradient>
            <linearGradient id="gdrive_c" x1="114.4" x2="15.53" y1="181.61" y2="121.8" gradientUnits="userSpaceOnUse">
              <stop offset="0.15" stop-color="#a9a8ff"/>
              <stop offset="0.33" stop-color="#6d97ff"/>
              <stop offset="0.48" stop-color="#3186ff"/>
            </linearGradient>
            <linearGradient id="gdrive_d" x1="128.88" x2="28.7" y1="37.88" y2="84.64" gradientUnits="userSpaceOnUse">
              <stop offset="0.55" stop-color="#0ebc5f"/>
              <stop offset="0.85" stop-color="#78c9ff"/>
            </linearGradient>
          </defs>
          <g clip-path="url(#gdrive_clip)">
            <path fill="url(#gdrive_b)" d="M206.905 172.02h-91.888l-19.015-32.934 45.944-79.578z"/>
            <path fill="url(#gdrive_c)" d="M-14.919 172.006 50.04 59.494v.002L31.032 92.422h38.02L115 172.004l-129.918.001z"/>
            <path fill="url(#gdrive_d)" d="M96.007-20.085 141.954 59.5l-19.011 32.928H31.048z"/>
          </g>
        </svg>
      </div>

      <!-- Connector with Checkmark Badge -->
      <div class="flow-connector">
        <div class="connector-line"></div>
        <div class="check-badge">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <!-- Luno Note Icon Box with Inlined Logo -->
      <div class="icon-box">
        <img src="${logoDataUrl}" width="26" height="26" alt="Luno Note" class="app-logo-img" />
      </div>
    </div>

    <h2 id="title" class="title">ซิงค์กับ Google Drive สำเร็จแล้ว!</h2>
    <p id="subtitle" class="subtitle">โน้ตของคุณถูกอัปเดตเรียบร้อยแล้ว<br>ทุกการเปลี่ยนแปลงถูกบันทึกและซิงค์ไปยัง Google Drive อัตโนมัติ</p>

    <!-- 2x2 Info Grid matching Settings / Data & Storage -->
    <div class="info-grid">
      <div class="info-cell">
        <span id="lbl-account" class="info-lbl">บัญชีผู้ใช้</span>
        <div class="tooltip-container">
          <span class="info-val truncate">${safeEmail}</span>
          <div class="app-tooltip">${safeEmail}</div>
        </div>
      </div>
      <div class="info-cell">
        <span id="lbl-location" class="info-lbl">ตำแหน่งจัดเก็บ</span>
        <div class="tooltip-container">
          <a id="link-location" href="${safeDriveUrl}" target="_blank" rel="noopener noreferrer" class="info-val location-val location-link">
            <span class="truncate">Google Drive / Luno / Workspaces</span>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ext-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <div class="app-tooltip">Google Drive / Luno / Workspaces</div>
        </div>
      </div>
      <div class="info-cell">
        <span id="lbl-synced" class="info-lbl">ซิงค์ล่าสุด</span>
        <span id="val-synced" class="info-val">${initialTime}</span>
      </div>
      <div class="info-cell">
        <span id="lbl-sync-state" class="info-lbl">สถานะการซิงค์</span>
        <span id="val-sync-state" class="info-val state-synced" style="color: ${initialStatusColor};">${initialStatusText}</span>
      </div>
    </div>

    <button id="btn-back" class="action-btn">
      <span id="btn-text">กลับไปยัง Luno Note</span>
    </button>
  </div>

  <script>
    document.title = "Google Drive Sync";
    var isThai = (navigator.language || navigator.userLanguage || "").toLowerCase().startsWith("th");
    if (!isThai) {
      document.getElementById("lbl-group").textContent = "CLOUD SYNC";
      document.getElementById("lbl-status").textContent = "Connected";
      document.getElementById("title").textContent = "Synced with Google Drive Successfully!";
      document.getElementById("subtitle").innerHTML = "Your notes are now updated.<br>All changes are automatically saved and synced to Google Drive.";
      document.getElementById("lbl-account").textContent = "ACCOUNT";
      document.getElementById("lbl-location").textContent = "LOCATION";
      document.getElementById("lbl-synced").textContent = "LAST SYNCED";
      document.getElementById("lbl-sync-state").textContent = "SYNC STATE";
      var initialEnMap = {
        synced: "Synced",
        idle: "Idle",
        syncing: "Syncing...",
        saving: "Saving...",
        offline: "Offline",
        error: "Error"
      };
      var currStatus = "${currentSyncState.status || "synced"}";
      document.getElementById("val-sync-state").textContent = initialEnMap[currStatus] || "Synced";
      document.getElementById("btn-text").textContent = "Return to Luno Note";
    }

    function updateSyncDisplay(status, lastSyncedAt, folderId) {
      if (lastSyncedAt) {
        var d = new Date(lastSyncedAt);
        var pad = function(n) { return String(n).padStart(2, "0"); };
        var timeStr = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
        var elSynced = document.getElementById("val-synced");
        if (elSynced) elSynced.textContent = timeStr;
      }
      var elState = document.getElementById("val-sync-state");
      if (elState) {
        var stateMap = {
          synced: { text: isThai ? "ซิงค์แล้ว" : "Synced", color: "#10b981" },
          idle: { text: isThai ? "พร้อมทำงาน" : "Idle", color: "#10b981" },
          syncing: { text: isThai ? "กำลังซิงค์..." : "Syncing...", color: "#26A295" },
          saving: { text: isThai ? "กำลังบันทึก..." : "Saving...", color: "#f59e0b" },
          offline: { text: isThai ? "ออฟไลน์" : "Offline", color: "#94a3b8" },
          error: { text: isThai ? "เกิดข้อผิดพลาด" : "Error", color: "#ef4444" }
        };
        var conf = stateMap[status] || stateMap.synced;
        elState.textContent = conf.text;
        elState.style.color = conf.color;
      }
      if (folderId) {
        var link = document.getElementById("link-location");
        if (link) {
          link.href = "https://drive.google.com/drive/folders/" + folderId;
        }
      }
    }

    // Live sync status updates
    var pollInterval = setInterval(function() {
      fetch("/sync-status")
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data) {
            updateSyncDisplay(data.status, data.lastSyncedAt, data.folderId);
          }
        })
        .catch(function() {});
    }, 1000);

    document.getElementById("btn-back").addEventListener("click", function() {
      clearInterval(pollInterval);
      var btn = document.getElementById("btn-back");
      var btnText = document.getElementById("btn-text");
      if (btn) btn.style.opacity = "0.85";
      if (btn) btn.style.pointerEvents = "none";
      if (btnText) {
        btnText.textContent = isThai ? "✓ สลับไปยัง Luno Note แล้ว" : "✓ Switched to Luno Note";
      }

      // Tell Electron main process to send OS-level Ctrl+W to close this browser tab and focus app
      fetch("/close-tab").catch(function() {});
    });
  </script>
</body>
</html>`);

                  // Allow 30 seconds for the user to interact with the button before closing server
                  setTimeout(() => {
                    try { server.close(); } catch {}
                  }, 30000);

                  resolve({
                    access_token: tokenData.access_token,
                    expires_in: Number(tokenData.expires_in) || 3600,
                    refresh_token: tokenData.refresh_token,
                    scope: tokenData.scope,
                    profile: userProfile,
                  });
                } catch (exchangeErr) {
                  try { server.close(); } catch {}
                  reject(exchangeErr);
                }
              }
              return;
            }
          }
        } catch (err) {
          if (!isSettled) {
            isSettled = true;
            try { server.close(); } catch {}
            reject(err);
          }
        }
      });

      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        const redirectUri = `http://127.0.0.1:${port}`;
        const scope = encodeURIComponent(
          "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
        );
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=code&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=S256&prompt=select_account&access_type=offline`;

        void shell.openExternal(authUrl);

        // Auto timeout after 3 minutes
        setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            try { server.close(); } catch {}
            reject(new Error("Google login timed out"));
          }
        }, 180000);
      });

      server.on("error", (err) => {
        if (!isSettled) {
          isSettled = true;
          reject(err);
        }
      });
    });
  });

  ipcMain.handle("google-oauth-refresh", async (event, payload) => {
    try {
      const refreshToken = typeof payload === "string" ? payload : (payload?.refreshToken || payload?.refresh_token);
      if (!refreshToken) {
        return { error: "No refresh token provided" };
      }
      const { clientId, clientSecret } = resolveGoogleOAuthCredentials(payload);

      const tokenBody = {
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      };
      if (clientSecret) {
        tokenBody.client_secret = clientSecret;
      }
      const tokenParams = new URLSearchParams(tokenBody);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.warn(`Token refresh failed (${tokenRes.status}): ${errText}`);
        return { error: `Token refresh failed (${tokenRes.status}): ${errText}` };
      }

      const tokenData = await tokenRes.json();
      const existing = getSavedGdriveAuth();
      let updatedProfile = existing?.profile || null;
      if (tokenData.access_token) {
        const freshProfile = await fetchGoogleUserProfileFromMain(tokenData.access_token);
        if (freshProfile) updatedProfile = freshProfile;
      }
      const tokenInfo = {
        access_token: tokenData.access_token,
        expires_at: Date.now() + (Number(tokenData.expires_in) || 3600) * 1000,
        refresh_token: refreshToken,
        scope: tokenData.scope,
      };
      saveGdriveAuthData({ tokenInfo, profile: updatedProfile, connected: true });

      return {
        access_token: tokenData.access_token,
        expires_in: Number(tokenData.expires_in) || 3600,
        scope: tokenData.scope,
        profile: updatedProfile,
      };
    } catch (err) {
      console.warn("Google OAuth token refresh skipped (offline or network error):", err?.message || err);
      return { error: err?.message || "Token refresh failed" };
    }
  });

  ipcMain.handle("google-oauth-logout", async (_event, token) => {
    try {
      if (token && typeof token === "string") {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }).catch(() => {});
      }
      clearGdriveAuthData();
      // Clear cookies for Google accounts so old accounts don't linger
      await session.defaultSession.clearStorageData({
        origins: ["https://accounts.google.com", "https://oauth2.googleapis.com"],
        storages: ["cookies"],
      }).catch(() => {});
      return true;
    } catch (err) {
      console.warn("Error during Google OAuth logout:", err);
      return false;
    }
  });

  ipcMain.handle("open-external", async (event, url) => {
    try {
      if (url && typeof url === "string") {
        let clean = url.trim();
        // If it's a data: URI (like data:text/html), write to temp preview file and open in default browser
        if (clean.startsWith("data:text/html") || clean.startsWith("data:text/plain")) {
          const previewDir = path.join(app.getPath("temp"), "luno-preview");
          if (!fs.existsSync(previewDir)) {
            fs.mkdirSync(previewDir, { recursive: true });
          }
          const isHtml = clean.startsWith("data:text/html");
          const tempPath = path.join(previewDir, `preview-${Date.now()}.${isHtml ? "html" : "txt"}`);
          const commaIdx = clean.indexOf(",");
          const rawPayload = commaIdx >= 0 ? clean.slice(commaIdx + 1) : "";
          const content = decodeURIComponent(rawPayload);
          await fs.promises.writeFile(tempPath, content, "utf8");
          await shell.openPath(tempPath);
          return true;
        }

        // If it's a file:// URL or direct disk path, open with shell.openPath (which launches default browser for .html)
        if (clean.startsWith("file://")) {
          try {
            let filePath = clean.replace(/^file:\/\/\/?/, "");
            try {
              filePath = decodeURIComponent(filePath);
            } catch {}
            const normalized = path.normalize(filePath);
            if (fs.existsSync(normalized)) {
              await shell.openPath(normalized);
              return true;
            }
          } catch (e) {
            console.warn("Failed shell.openPath for file URL:", clean, e);
          }
        }

        if (/^[a-zA-Z]:[/\\]/.test(clean)) {
          const normalized = path.normalize(clean);
          if (fs.existsSync(normalized)) {
            await shell.openPath(normalized);
            return true;
          }
        }

        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(clean)) {
          clean = "https://" + clean;
        }
        const parsed = new URL(clean);
        if (["http:", "https:", "mailto:", "tel:", "file:"].includes(parsed.protocol)) {
          await shell.openExternal(clean);
          return true;
        }
      }
    } catch (err) {
      console.warn("Failed opening external URL:", url, err);
    }
    return false;
  });

  ipcMain.handle("save-preview-file", async (_event, { fileName, content }) => {
    try {
      const previewDir = path.join(app.getPath("temp"), "luno-preview");
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }
      const safeName = (fileName || "index.html").replace(/[\\/:*?"<>|]/g, "_");
      const targetName = safeName.endsWith(".html") || safeName.endsWith(".htm") ? safeName : `${safeName}.html`;
      const tempPath = path.join(previewDir, targetName);
      await fs.promises.writeFile(tempPath, content || "", "utf8");
      return tempPath.replace(/\\/g, "/");
    } catch (err) {
      console.warn("Failed saving preview file:", err);
      return null;
    }
  });

  ipcMain.handle("open-path", async (_event, fullPath) => {
    try {
      if (fullPath && typeof fullPath === "string" && fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        if (DANGEROUS_EXTENSIONS.has(ext)) {
          shell.showItemInFolder(fullPath);
          return false;
        }
        await shell.openPath(fullPath);
        return true;
      }
    } catch (err) {
      console.warn("Failed opening path:", fullPath, err);
    }
    return false;
  });

  ipcMain.handle("show-item-in-folder", async (_event, fullPath) => {
    try {
      if (fullPath && fs.existsSync(fullPath)) {
        shell.showItemInFolder(fullPath);
        return true;
      }
    } catch (err) {
      console.warn("Failed showing item in folder:", fullPath, err);
    }
    return false;
  });

  ipcMain.handle("fetch-tts-audio", async (_event, { text, lang }) => {
    if (!text || !text.trim()) return null;
    const cleanText = text.trim();
    const shortLang = (lang || "th").split("-")[0];
    const https = require("https");

    return new Promise((resolve) => {
      const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${encodeURIComponent(shortLang)}&q=${encodeURIComponent(cleanText.slice(0, 200))}`;
      const req = https.get(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            return resolve(null);
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(`data:audio/mpeg;base64,${buffer.toString("base64")}`);
          });
        }
      );
      req.on("error", (err) => {
        console.warn("fetch-tts-audio error:", err);
        resolve(null);
      });
      req.setTimeout(6000, () => {
        req.destroy();
        resolve(null);
      });
    });
  });

  ipcMain.on("window-minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.minimize();
  });

  ipcMain.on("window-maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on("window-set-fullscreen", (event, flag) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (typeof flag === "boolean") {
        win.setFullScreen(flag);
      } else {
        win.setFullScreen(!win.isFullScreen());
      }
    }
  });

  ipcMain.handle("window-is-fullscreen", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win && !win.isDestroyed() ? win.isFullScreen() : false;
  });

  ipcMain.on("window-snap", (event, boundsRatio) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;
    try {
      const currentBounds = win.getBounds();
      const currentDisplay = screen.getDisplayMatching(currentBounds) || screen.getPrimaryDisplay();
      const workArea = currentDisplay.workArea;

      if (win.isMaximized()) {
        win.unmaximize();
      }

      const x = Math.round(workArea.x + workArea.width * (boundsRatio.xRatio || 0));
      const y = Math.round(workArea.y + workArea.height * (boundsRatio.yRatio || 0));
      const width = Math.round(workArea.width * (boundsRatio.wRatio || 1));
      const height = Math.round(workArea.height * (boundsRatio.hRatio || 1));

      win.setBounds({ x, y, width, height }, true);
    } catch (err) {
      console.warn("window-snap failed:", err);
    }
  });

  ipcMain.on("window-close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.handle("window-is-maximized", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return !!win && !win.isDestroyed() && win.isMaximized();
  });

  ipcMain.handle("get-os-user-info", async () => {
    try {
      const userInfo = os.userInfo();
      return {
        username: userInfo.username || process.env.USERNAME || process.env.USER || "",
        homedir: "",
      };
    } catch {
      return {
        username: process.env.USERNAME || process.env.USER || "",
        homedir: "",
      };
    }
  });

  ipcMain.handle("get-saved-workspace", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const winWorkspacePath = win ? windowWorkspaceMap.get(win.id) : null;
    const recent = getRecentWorkspacesList();

    if (winWorkspacePath && fs.existsSync(winWorkspacePath)) {
      ensureDefaultWorkspaceFolders(winWorkspacePath);
      if (win) startWorkspaceWatcher(winWorkspacePath, win);
      return {
        folderPath: winWorkspacePath,
        folderName: path.basename(winWorkspacePath),
        recentWorkspaces: recent,
      };
    }

    // Initial window fallback: load default saved workspace from config
    const data = getSavedWorkspaceData() || {};
    if (data?.folderPath && fs.existsSync(data.folderPath)) {
      if (win) {
        windowWorkspaceMap.set(win.id, data.folderPath);
        startWorkspaceWatcher(data.folderPath, win);
      }
      return { ...data, recentWorkspaces: recent };
    }
    return { folderPath: null, folderName: null, recentWorkspaces: recent };
  });

  ipcMain.handle("get-recent-workspaces", () => {
    return getRecentWorkspacesList();
  });

  ipcMain.handle("scan-local-workspaces", async () => {
    const found = [];
    const seenPaths = new Set();

    function checkDir(dirPath) {
      if (!dirPath || seenPaths.has(dirPath)) return;
      seenPaths.add(dirPath);
      try {
        if (!fs.existsSync(dirPath)) return;
        const lunoFile = path.join(dirPath, ".luno", "workspace.json");
        if (fs.existsSync(lunoFile)) {
          try {
            const raw = fs.readFileSync(lunoFile, "utf8");
            const parsed = JSON.parse(raw);
            if (parsed?.id) {
              found.push({
                folderPath: dirPath,
                folderName: path.basename(dirPath),
                manifest: parsed,
              });
              return;
            }
          } catch {}
        }

        // Check subdirectories (1 level deep)
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            const sub = path.join(dirPath, entry.name);
            const subLuno = path.join(sub, ".luno", "workspace.json");
            if (fs.existsSync(subLuno)) {
              try {
                const subRaw = fs.readFileSync(subLuno, "utf8");
                const subParsed = JSON.parse(subRaw);
                if (subParsed?.id) {
                  found.push({
                    folderPath: sub,
                    folderName: entry.name,
                    manifest: subParsed,
                  });
                }
              } catch {}
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 1. Check recent workspaces and their parent directories
    const recents = getRecentWorkspacesList();
    for (const r of recents) {
      if (r?.folderPath) {
        checkDir(r.folderPath);
        const parent = path.dirname(r.folderPath);
        checkDir(parent);
      }
    }

    // 2. Check current saved workspace and its parent directory
    const saved = getSavedWorkspaceData();
    if (saved?.folderPath) {
      checkDir(saved.folderPath);
      const parent = path.dirname(saved.folderPath);
      checkDir(parent);
    }

    // 3. Check Documents and Documents/Luno
    try {
      const docs = app.getPath("documents");
      checkDir(path.join(docs, "Luno"));
      checkDir(path.join(docs, "Luno Notes"));
      checkDir(docs);
    } catch {}

    // 4. Check Desktop
    try {
      const desktop = app.getPath("desktop");
      checkDir(desktop);
    } catch {}

    return found;
  });

  ipcMain.handle("set-saved-workspace", (event, data) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      if (data?.folderPath) {
        saveWorkspaceData(data);
        if (win) {
          windowWorkspaceMap.set(win.id, data.folderPath);
          startWorkspaceWatcher(data.folderPath, win);
        }
      } else {
        if (win) {
          windowWorkspaceMap.set(win.id, null);
          stopWorkspaceWatcherForWindow(win.id);
        }
        let hasOtherWorkspace = false;
        for (const [id, ws] of windowWorkspaceMap.entries()) {
          if (id !== (win?.id ?? -1) && ws) {
            hasOtherWorkspace = true;
            break;
          }
        }
        if (!hasOtherWorkspace) {
          const recent = getRecentWorkspacesList();
          const toSave = {
            folderPath: null,
            folderName: null,
            recentWorkspaces: recent,
          };
          fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), "utf8");
        }
      }
      return true;
    } catch (err) {
      console.warn("Failed setting saved workspace:", err);
      return false;
    }
  });

  ipcMain.handle("read-workspace-tree", (event, folderPath) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!folderPath || !fs.existsSync(folderPath)) return { entries: [], folderPaths: [] };
    ensureDefaultWorkspaceFolders(folderPath);
    if (win) {
      windowWorkspaceMap.set(win.id, folderPath);
      startWorkspaceWatcher(folderPath, win);
    }
    return scanWorkspaceTree(folderPath);
  });

  ipcMain.handle("read-file-content", (event, fullPath) => {
    try {
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, "utf8");
      }
    } catch (err) {
      console.warn("Failed reading file content:", fullPath, err);
    }
    return "";
  });

  ipcMain.handle("read-file-buffer", async (event, fullPath) => {
    try {
      if (fullPath && typeof fullPath === "string" && fs.existsSync(fullPath)) {
        return await fs.promises.readFile(fullPath);
      }
    } catch (err) {
      console.warn("Failed reading file buffer:", fullPath, err);
    }
    return null;
  });

  ipcMain.handle("read-file-base64", (event, fullPath) => {
    try {
      if (fullPath && typeof fullPath === "string" && fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath).toString("base64");
      }
    } catch (err) {
      console.warn("Failed reading file as base64:", fullPath, err);
    }
    return "";
  });

  ipcMain.handle("read-image-data-url", (event, fullPath) => {
    try {
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        const mimeMap = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".webp": "image/webp",
          ".svg": "image/svg+xml",
          ".bmp": "image/bmp",
          ".ico": "image/x-icon",
          ".avif": "image/avif",
          ".mp4": "video/mp4",
          ".m4v": "video/mp4",
          ".webm": "video/webm",
          ".mov": "video/quicktime",
          ".mkv": "video/x-matroska",
          ".avi": "video/x-msvideo",
          ".ogv": "video/ogg",
          ".mp3": "audio/mpeg",
          ".wav": "audio/wav",
          ".ogg": "audio/ogg",
          ".m4a": "audio/mp4",
          ".flac": "audio/flac",
          ".aac": "audio/aac",
          ".css": "text/css",
          ".js": "text/javascript",
          ".json": "application/json",
          ".txt": "text/plain",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
          ".ttf": "font/ttf",
          ".otf": "font/otf",
        };
        const mimeType = mimeMap[ext] || "application/octet-stream";
        const buffer = fs.readFileSync(fullPath);
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    } catch (err) {
      console.warn("Failed reading image as data URL:", fullPath, err);
    }
    return "";
  });

  ipcMain.handle("write-file-content", (event, { fullPath, content }) => {
    try {
      if (!fullPath || typeof fullPath !== "string" || isCriticalSystemPath(fullPath)) {
        console.warn("Blocked writing to protected or invalid path:", fullPath);
        return false;
      }
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content || "", "utf8");
      return true;
    } catch (err) {
      console.warn("Failed writing file content:", fullPath, err);
      return false;
    }
  });

  ipcMain.handle("write-file-base64", (event, data) => {
    try {
      const fullPath = data?.fullPath;
      const base64 = data?.base64 || data?.contentBase64;
      if (!fullPath || typeof fullPath !== "string" || isCriticalSystemPath(fullPath)) {
        console.warn("Blocked writing base64 to protected or invalid path:", fullPath);
        return false;
      }
      if (!base64 || typeof base64 !== "string") {
        console.warn("write-file-base64: missing or invalid base64 data for:", fullPath);
        return false;
      }
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const rawData = base64.includes(",") ? base64.split(",")[1] : base64;
      const buffer = Buffer.from(rawData, "base64");
      if (buffer.length === 0) {
        console.warn("write-file-base64: decoded buffer is empty for:", fullPath);
        return false;
      }
      fs.writeFileSync(fullPath, buffer);
      return true;
    } catch (err) {
      console.warn("Failed writing base64 file content:", fullPath, err);
      return false;
    }
  });

  ipcMain.handle("write-file-buffer", async (event, data) => {
    try {
      const fullPath = data?.fullPath;
      const arrayBuffer = data?.buffer;
      if (!fullPath || !arrayBuffer || isCriticalSystemPath(fullPath)) return false;
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(fullPath, buffer);
      return true;
    } catch (err) {
      console.warn("Failed writing buffer to file:", data?.fullPath, err);
      return false;
    }
  });

  ipcMain.handle("delete-file-or-folder", (event, fullPath) => {
    try {
      if (fullPath && typeof fullPath === "string" && !isCriticalSystemPath(fullPath) && fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return true;
      }
      if (isCriticalSystemPath(fullPath)) {
        console.warn("Blocked deleting protected critical system path:", fullPath);
        return false;
      }
    } catch (err) {
      console.warn("Failed deleting file/folder:", fullPath, err);
      return false;
    }
    return false;
  });

  ipcMain.handle("read-directory-files", (event, folderPath) => {
    try {
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath, { withFileTypes: true });
        return files.map((f) => ({
          name: f.name,
          fullPath: path.join(folderPath, f.name),
          isDirectory: f.isDirectory(),
        }));
      }
    } catch (err) {
      console.warn("Failed reading directory files:", folderPath, err);
    }
    return [];
  });

  ipcMain.handle("create-workspace-folder", (event, { workspacePath, folderPath, folderName }) => {
    try {
      const cleanPath = (folderPath === "__opened_root__" ? "" : folderPath) || "";
      const targetDir = path.join(workspacePath, cleanPath, folderName || "Untitled");
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      return true;
    } catch (err) {
      console.warn("Failed creating workspace folder:", err);
      return false;
    }
  });

  ipcMain.handle("rename-file-or-folder", (event, data) => {
    try {
      const src = data?.oldFullPath || data?.oldPath;
      const dst = data?.newFullPath || data?.newPath;
      if (src && dst && fs.existsSync(src)) {
        const parentDir = path.dirname(dst);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.renameSync(src, dst);
        return true;
      }
    } catch (err) {
      console.warn("Failed renaming file or folder:", data, err);
      return false;
    }
    return false;
  });

  ipcMain.handle("copy-file-or-folder", (event, { sourceFullPath, targetFullPath }) => {
    try {
      if (fs.existsSync(sourceFullPath)) {
        let finalTarget = targetFullPath;
        if (fs.existsSync(finalTarget)) {
          const parentDir = path.dirname(finalTarget);
          const isDir = fs.statSync(sourceFullPath).isDirectory();
          if (isDir) {
            const rawBase = path.basename(finalTarget);
            const rootBase = rawBase.replace(/-copy(-\d+)?$/, "");
            finalTarget = path.join(parentDir, `${rootBase}-copy`);
            let counter = 2;
            while (fs.existsSync(finalTarget)) {
              finalTarget = path.join(parentDir, `${rootBase}-copy-${counter}`);
              counter++;
            }
          } else {
            const ext = path.extname(finalTarget);
            const rawBase = path.basename(finalTarget, ext);
            const rootBase = rawBase.replace(/-copy(-\d+)?$/, "");
            finalTarget = path.join(parentDir, `${rootBase}-copy${ext}`);
            let counter = 2;
            while (fs.existsSync(finalTarget)) {
              finalTarget = path.join(parentDir, `${rootBase}-copy-${counter}${ext}`);
              counter++;
            }
          }
        }
        const parentDir = path.dirname(finalTarget);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.cpSync(sourceFullPath, finalTarget, { recursive: true });
        return true;
      }
    } catch (err) {
      console.warn("Failed copying file or folder:", sourceFullPath, targetFullPath, err);
      return false;
    }
    return false;
  });

  ipcMain.handle("select-workspace-dialog", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win || undefined, {
      properties: ["openDirectory"],
      title: "Select Workspace Folder",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      const folderName = path.basename(folderPath);
      ensureDefaultWorkspaceFolders(folderPath);

      // Check if another window already has this workspace open
      const existingWin = findWindowWithWorkspace(folderPath);
      if (existingWin) {
        if (existingWin.isMinimized()) existingWin.restore();
        existingWin.focus();
        return { folderPath, folderName, openedInNewWindow: true, focusedExisting: true };
      }

      // Check if current window already has an open workspace
      const currentWs = win ? windowWorkspaceMap.get(win.id) : null;
      if (currentWs) {
        // Existing workspace was not closed -> Open in a NEW window!
        saveWorkspaceData({ folderPath, folderName });
        createWindow(folderPath);
        return { folderPath, folderName, openedInNewWindow: true };
      }

      // Current window has no workspace open (e.g. Launcher screen) -> Open in current window
      if (win) {
        windowWorkspaceMap.set(win.id, folderPath);
        startWorkspaceWatcher(folderPath, win);
      }
      const data = { folderPath, folderName, openedInNewWindow: false };
      saveWorkspaceData(data);
      return data;
    }
    return null;
  });

  ipcMain.handle("select-directory-dialog", async (event, title) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win || undefined, {
      properties: ["openDirectory"],
      title: title || "Select Location",
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("show-save-dialog", async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win || undefined, {
      title: options?.title || "Save As",
      defaultPath: options?.defaultPath || "Untitled.md",
      filters: options?.filters || [
        { name: "Markdown Document (*.md)", extensions: ["md", "markdown"] },
        { name: "Plain Text Document (*.txt)", extensions: ["txt"] },
        { name: "HTML Document (*.html)", extensions: ["html", "htm"] },
        { name: "All Files (*.*)", extensions: ["*"] },
      ],
    });
    if (!result.canceled && result.filePath) {
      return result.filePath;
    }
    return null;
  });

  ipcMain.handle("print-content", async (event, { html, title }) => {
    const callerWin = BrowserWindow.fromWebContents(event.sender);
    const tempFilePath = path.join(
      app.getPath("temp"),
      `luno_print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.html`
    );

    let printWin = new BrowserWindow({
      show: false,
      title: title || "Print",
      parent: callerWin || undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      await fs.promises.writeFile(tempFilePath, html, "utf-8");
      await printWin.loadFile(tempFilePath);

      // Brief delay to allow fonts and images to settle
      await new Promise((resolve) => setTimeout(resolve, 350));

      return await new Promise((resolve) => {
        printWin.webContents.print(
          {
            silent: false,
            printBackground: true,
          },
          (success, failureReason) => {
            try {
              printWin.close();
            } catch {}
            printWin = null;
            fs.promises.unlink(tempFilePath).catch(() => {});
            resolve({ success, failureReason });
          }
        );
      });
    } catch (err) {
      if (printWin) {
        try {
          printWin.close();
        } catch {}
      }
      fs.promises.unlink(tempFilePath).catch(() => {});
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("export-pdf", async (event, { html, title, defaultPath }) => {
    const callerWin = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(callerWin || undefined, {
      title: "Export as PDF",
      defaultPath: defaultPath || "Untitled.pdf",
      filters: [
        { name: "PDF Document (*.pdf)", extensions: ["pdf"] },
        { name: "All Files (*.*)", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    const targetPath = result.filePath;
    const tempFilePath = path.join(
      app.getPath("temp"),
      `luno_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.html`
    );

    let printWin = new BrowserWindow({
      show: false,
      title: title || "Export PDF",
      parent: callerWin || undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      await fs.promises.writeFile(tempFilePath, html, "utf-8");
      await printWin.loadFile(tempFilePath);

      // Wait for web fonts, images, and resources to be fully loaded and rendered
      try {
        await printWin.webContents.executeJavaScript(`
          Promise.race([
            Promise.all([
              document.fonts ? document.fonts.ready : Promise.resolve(),
              Promise.all(
                Array.from(document.images).map((img) => {
                  img.loading = "eager";
                  img.decoding = "sync";
                  if (img.complete) {
                    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
                  }
                  return new Promise((resolve) => {
                    img.onload = () => {
                      if (img.decode) img.decode().catch(() => {}).then(resolve);
                      else resolve();
                    };
                    img.onerror = resolve;
                  });
                })
              )
            ]),
            new Promise((r) => setTimeout(r, 4000))
          ])
        `);
      } catch (resourceErr) {
        console.warn("PDF export resource wait warning:", resourceErr);
      }

      // Brief delay to allow rendering and images to settle
      await new Promise((resolve) => setTimeout(resolve, 350));

      const pdfBuffer = await printWin.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        margins: {
          top: 0.4,
          bottom: 0.4,
          left: 0.4,
          right: 0.4,
        },
      });

      await fs.promises.writeFile(targetPath, pdfBuffer);
      return { success: true, filePath: targetPath };
    } catch (err) {
      return { success: false, error: err?.message || String(err) };
    } finally {
      if (printWin) {
        try {
          printWin.close();
        } catch {}
      }
      fs.promises.unlink(tempFilePath).catch(() => {});
    }
  });

  ipcMain.handle("create-new-workspace", async (event, { parentPath, workspaceName }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      if (!parentPath || !workspaceName) return null;
      const targetPath = path.join(parentPath, workspaceName.trim());
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      ensureDefaultWorkspaceFolders(targetPath);

      const folderName = workspaceName.trim();
      const currentWs = win ? windowWorkspaceMap.get(win.id) : null;

      if (currentWs) {
        // Existing workspace was not closed -> Open new workspace in a NEW window!
        saveWorkspaceData({ folderPath: targetPath, folderName });
        createWindow(targetPath);
        return { folderPath: targetPath, folderName, openedInNewWindow: true };
      }

      if (win) {
        windowWorkspaceMap.set(win.id, targetPath);
        startWorkspaceWatcher(targetPath, win);
      }
      const data = { folderPath: targetPath, folderName, openedInNewWindow: false };
      saveWorkspaceData(data);
      return data;
    } catch (err) {
      console.warn("Failed creating new workspace:", err);
      return null;
    }
  });

  ipcMain.handle("open-workspace-in-new-window", async (_event, folderPath) => {
    if (!folderPath || !fs.existsSync(folderPath)) return false;
    ensureDefaultWorkspaceFolders(folderPath);
    const existingWin = findWindowWithWorkspace(folderPath);
    if (existingWin) {
      if (existingWin.isMinimized()) existingWin.restore();
      existingWin.focus();
      return true;
    }
    saveWorkspaceData({ folderPath, folderName: path.basename(folderPath) });
    createWindow(folderPath);
    return true;
  });

  ipcMain.handle("get-native-keyboard-language", async () => {
    return currentNativeKeyboardLang;
  });

  try { ipcMain.removeHandler("read-clipboard-text"); } catch {}
  ipcMain.handle("read-clipboard-text", async () => {
    try {
      const text = clipboard.readText();
      if (text && text.trim()) return text.trim();
      const bookmark = clipboard.readBookmark();
      if (bookmark?.url) return bookmark.url.trim();
      const html = clipboard.readHTML();
      if (html) {
        const clean = html.replace(/<[^>]+>/g, "").trim();
        if (clean) return clean;
      }
      return "";
    } catch (e) {
      console.warn("read-clipboard-text error:", e);
      return "";
    }
  });

  try { ipcMain.removeHandler("write-clipboard-text"); } catch {}
  ipcMain.handle("write-clipboard-text", async (_event, text) => {
    try {
      clipboard.writeText(text || "");
      return true;
    } catch (e) {
      console.warn("write-clipboard-text error:", e);
      return false;
    }
  });

  try { ipcMain.removeHandler("write-clipboard-image"); } catch {}
  ipcMain.handle("write-clipboard-image", async (_event, dataUrl) => {
    try {
      if (!dataUrl) return false;
      const img = nativeImage.createFromDataURL(dataUrl);
      if (!img.isEmpty()) {
        clipboard.write({
          image: img,
          html: `<img src="${dataUrl}" alt="QR Code" />`,
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn("write-clipboard-image error:", e);
      return false;
    }
  });

  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("check-for-updates", async () => {
    if (!autoUpdater) {
      return { success: false, error: "Auto-updater module not available", currentVersion: app.getVersion() };
    }
    try {
      if (!app.isPackaged && process.env.NODE_ENV === "development") {
        try {
          const result = await autoUpdater.checkForUpdates();
          return { success: true, isDev: true, updateInfo: result?.updateInfo };
        } catch (devErr) {
          return {
            success: true,
            isDev: true,
            message: "Running in development mode",
            currentVersion: app.getVersion(),
          };
        }
      }
      const result = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: result?.updateInfo, currentVersion: app.getVersion() };
    } catch (err) {
      console.warn("checkForUpdates error:", err);
      return { success: false, error: err?.message || String(err), currentVersion: app.getVersion() };
    }
  });

  ipcMain.handle("download-update", async () => {
    if (!autoUpdater) {
      return { success: false, error: "Auto-updater module not available" };
    }
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      console.warn("downloadUpdate error:", err);
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("quit-and-install-update", () => {
    if (!autoUpdater) return false;
    try {
      autoUpdater.quitAndInstall(false, true);
      return true;
    } catch (err) {
      console.warn("quitAndInstall error:", err);
      return false;
    }
  });
}

function sendUpdateStatusToWindows(channel, payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  });
}

// Configure autoUpdater if available
if (autoUpdater) {
  try {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
      sendUpdateStatusToWindows("update-checking");
    });

    autoUpdater.on("update-available", (info) => {
      sendUpdateStatusToWindows("update-available", {
        version: info?.version,
        releaseDate: info?.releaseDate,
        releaseNotes: info?.releaseNotes,
        files: info?.files,
      });
    });

    autoUpdater.on("update-not-available", (info) => {
      sendUpdateStatusToWindows("update-not-available", {
        version: info?.version,
        currentVersion: app.getVersion(),
      });
    });

    autoUpdater.on("error", (err) => {
      console.warn("autoUpdater error event:", err);
      sendUpdateStatusToWindows("update-error", {
        message: err?.message || String(err),
      });
    });

    autoUpdater.on("download-progress", (progressObj) => {
      sendUpdateStatusToWindows("update-download-progress", {
        percent: Math.round(progressObj?.percent || 0),
        bytesPerSecond: progressObj?.bytesPerSecond || 0,
        transferred: progressObj?.transferred || 0,
        total: progressObj?.total || 0,
      });
    });

    autoUpdater.on("update-downloaded", (info) => {
      sendUpdateStatusToWindows("update-downloaded", {
        version: info?.version,
        releaseNotes: info?.releaseNotes,
      });
    });
  } catch (updaterErr) {
    console.warn("Error initializing autoUpdater events:", updaterErr);
  }
}

let currentNativeKeyboardLang = "en";
let keyboardWatcherProcess = null;
let watcherRestartTimeout = null;
let isAppQuitting = false;

function getKeyboardWatcherScriptPath() {
  const directPath = path.join(__dirname, "keyboardLayoutWatcher.ps1");
  const unpackedPath = directPath.replace("app.asar", "app.asar.unpacked");

  // 1. If unpacked by electron-builder (app.asar.unpacked)
  if (fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }

  // 2. If running directly in dev mode outside of asar
  if (!directPath.includes("app.asar") && fs.existsSync(directPath)) {
    return directPath;
  }

  // 3. If inside app.asar, extract to userData so external powershell.exe can execute it
  try {
    const userDataPath = app.getPath("userData");
    const extractedPath = path.join(userDataPath, "keyboardLayoutWatcher.ps1");
    if (fs.existsSync(directPath)) {
      const content = fs.readFileSync(directPath, "utf8");
      let shouldWrite = true;
      if (fs.existsSync(extractedPath)) {
        try {
          const current = fs.readFileSync(extractedPath, "utf8");
          if (current === content) shouldWrite = false;
        } catch {}
      }
      if (shouldWrite) {
        fs.writeFileSync(extractedPath, content, "utf8");
      }
      return extractedPath;
    }
  } catch (err) {
    console.warn("Failed to extract keyboardLayoutWatcher.ps1 to userData:", err);
  }

  return directPath;
}

function startNativeKeyboardWatcher() {
  if (process.platform !== "win32" || isAppQuitting) return;
  if (keyboardWatcherProcess) return;

  try {
    const { spawn } = require("child_process");
    const scriptPath = getKeyboardWatcherScriptPath();
    if (!fs.existsSync(scriptPath)) {
      console.warn("Keyboard watcher script does not exist:", scriptPath);
      return;
    }

    keyboardWatcherProcess = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    keyboardWatcherProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString().trim();
      const lines = text.split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter(Boolean);
      for (const line of lines) {
        if (line === "th" || line === "en") {
          currentNativeKeyboardLang = line;
          BrowserWindow.getAllWindows().forEach((w) => {
            try {
              if (!w.isDestroyed() && w.webContents && !w.webContents.isDestroyed()) {
                w.webContents.send("native-keyboard-language-changed", line);
              }
            } catch {}
          });
        }
      }
    });

    keyboardWatcherProcess.stderr.on("data", (errChunk) => {
      console.warn("Keyboard watcher stderr:", errChunk.toString().trim());
    });

    keyboardWatcherProcess.on("error", (e) => {
      console.warn("Keyboard watcher error", e);
    });

    keyboardWatcherProcess.on("exit", () => {
      keyboardWatcherProcess = null;
      if (!isAppQuitting) {
        if (watcherRestartTimeout) clearTimeout(watcherRestartTimeout);
        watcherRestartTimeout = setTimeout(() => {
          startNativeKeyboardWatcher();
        }, 3000);
      }
    });
  } catch (err) {
    console.warn("Failed to start keyboard watcher", err);
  }
}

app.whenReady().then(() => {
  try {
    protocol.handle("luno-asset", (request) => {
      try {
        const rawPath = request.url.replace(/^luno-asset:\/\//, "");
        let decodedPath = decodeURIComponent(rawPath);
        if (/^\/[a-zA-Z]:[\\/]/.test(decodedPath)) {
          decodedPath = decodedPath.slice(1);
        }
        const fileUrl = url.pathToFileURL(decodedPath).toString();
        return net.fetch(fileUrl);
      } catch (err) {
        console.warn("Failed resolving luno-asset URL:", request.url, err);
        return new Response("Not Found", { status: 404 });
      }
    });
  } catch (err) {
    console.warn("Failed registering luno-asset protocol handler:", err);
  }

  if (app.setAboutPanelOptions) {
    try {
      app.setAboutPanelOptions({
        applicationName: "Luno Note",
        applicationVersion: app.getVersion ? app.getVersion() : "1.2.2",
        copyright: "Copyright © 2026 phanuwatla",
        authors: ["phanuwatla"],
        website: "https://github.com/phanuwatla",
      });
    } catch {
      /* ignore */
    }
  }

  app.on("browser-window-created", (event, window) => {
    try {
      window.setIcon(getNativeAppIcon());
    } catch {
      /* ignore */
    }
  });

  app.on("web-contents-created", (event, contents) => {
    try {
      const ua = contents.userAgent;
      if (ua) {
        const clean = ua.replace(/Electron\/\S+\s?/, "").replace(/luno-note(s)?\/\S+\s?/, "");
        contents.setUserAgent(clean);
      }
    } catch {
      /* ignore */
    }

    contents.on("will-attach-webview", (_waEvent, webPreferences) => {
      delete webPreferences.preload;
      delete webPreferences.preloadURL;
      webPreferences.nodeIntegration = false;
      webPreferences.nodeIntegrationInWorker = false;
      webPreferences.nodeIntegrationInSubFrames = false;
      webPreferences.contextIsolation = true;
      webPreferences.allowRunningInsecureContent = false;
      webPreferences.plugins = false;
    });

    if (contents.getType() === "webview") {
      try {
        contents.setZoomFactor(0.9);
      } catch {}

      contents.on("did-start-navigation", () => {
        try {
          contents.setZoomFactor(0.9);
        } catch {}
      });

      contents.on("did-navigate", () => {
        try {
          contents.setZoomFactor(0.9);
        } catch {}
      });

      contents.on("did-frame-finish-load", () => {
        try {
          contents.setZoomFactor(0.9);
        } catch {}
      });

      contents.on("dom-ready", () => {
        try {
          contents.setZoomFactor(0.9);
        } catch {}
      });

      contents.setWindowOpenHandler(({ url }) => {
        try {
          if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
            contents.loadURL(url);
          }
        } catch {
          /* ignore */
        }
        return { action: "deny" };
      });
    }
  });

  setupIpcHandlers();
  startNativeKeyboardWatcher();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  isAppQuitting = true;
  if (watcherRestartTimeout) {
    clearTimeout(watcherRestartTimeout);
    watcherRestartTimeout = null;
  }
});

app.on("will-quit", () => {
  isAppQuitting = true;
  if (watcherRestartTimeout) {
    clearTimeout(watcherRestartTimeout);
    watcherRestartTimeout = null;
  }
  if (keyboardWatcherProcess) {
    try {
      keyboardWatcherProcess.kill();
    } catch {}
    keyboardWatcherProcess = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
