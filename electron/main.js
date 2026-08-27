const { app, BrowserWindow, ipcMain, shell, Menu, MenuItem, dialog, nativeImage, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { getSpellingSuggestions } = require("./spellDictionary");

const configPath = path.join(app.getPath("userData"), "workspace-config.json");

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

const DEFAULT_WORKSPACE_SETTINGS = {
  editorFontSize: 15,
  sidebarWidth: 280,
  confirmBeforeDelete: true,
  language: "en",
  fontFamily: "inter",
  editorFontFamily: "inter",
  theme: "emerald",
  colorScheme: "system",
  autoSave: true,
  defaultExtension: "md",
  newFilePattern: "untitled",
  defaultNoteTemplate: "blank",
  editorWidth: "standard",
  lineHeight: "1.6",
  sidebarDensity: "comfortable",
  showGuideLines: true,
  tagColorStyle: "multicolor",
  showWordCount: true,
  autoPairBrackets: true,
  showCodeLineNumbers: false,
  spellCheck: true,
  geminiApiKey: "",
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
  } catch (err) {
    console.warn("Failed ensuring default workspace folders:", err);
  }
}

function getSavedWorkspaceData() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      const data = JSON.parse(raw);
      if (data?.folderPath) {
        ensureDefaultWorkspaceFolders(data.folderPath);
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
      recentWorkspaces: recent.slice(0, 50),
    };
    fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed saving workspace config:", err);
  }
}

let currentWatcher = null;
let watcherDebounceTimer = null;

function stopWorkspaceWatcher() {
  if (watcherDebounceTimer) {
    clearTimeout(watcherDebounceTimer);
    watcherDebounceTimer = null;
  }
  if (currentWatcher) {
    try {
      currentWatcher.close();
    } catch {
      /* ignore */
    }
    currentWatcher = null;
  }
}

function startWorkspaceWatcher(folderPath, targetWindow) {
  stopWorkspaceWatcher();
  if (!folderPath || !fs.existsSync(folderPath)) return;

  try {
    currentWatcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        const norm = filename.replace(/\\/g, "/").toLowerCase();
        const parts = norm.split("/");
        if (parts.some((p) => p.startsWith(".") || IGNORED_SCAN_FOLDERS.has(p))) {
          return;
        }
      }

      if (watcherDebounceTimer) clearTimeout(watcherDebounceTimer);
      watcherDebounceTimer = setTimeout(() => {
        if (targetWindow && !targetWindow.isDestroyed()) {
          const tree = scanWorkspaceTree(folderPath);
          targetWindow.webContents.send("workspace-changed", {
            folderPath,
            ...tree,
          });
        }
      }, 500);
    });
  } catch (err) {
    console.warn("Failed starting workspace watcher:", folderPath, err);
  }
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
      if (name.startsWith(".") || IGNORED_SCAN_FOLDERS.has(lowerName)) {
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
          contentFormat = ext === ".md" || ext === ".markdown" || ext === "" ? "markdown" : ext === ".html" || ext === ".htm" ? "html" : "plain";
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

function createWindow() {
  const appIcon = getNativeAppIcon();
  const mainWindow = new BrowserWindow({
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

  // Remove default application menu so ALL shortcuts (Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+W, etc.) pass cleanly to React
  Menu.setApplicationMenu(null);

  // Prevent pinch-to-zoom from distorting the whole window layout
  try {
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  } catch {
    /* ignore */
  }

  // Configure spell checker languages for Thai and English
  try {
    const session = mainWindow.webContents.session;
    const cleanUserAgent = mainWindow.webContents.userAgent.replace(/Electron\/\S+\s?/, "").replace(/luno-note(s)?\/\S+\s?/, "");
    mainWindow.webContents.setUserAgent(cleanUserAgent);

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
  } catch (err) {
    console.warn("Could not set spellchecker languages:", err);
  }

  // Forward Chromium's native spell check suggestions to renderer
  mainWindow.webContents.on("context-menu", (_event, params) => {
    if (params.misspelledWord && ["luno", "luno-ai"].includes(params.misspelledWord.toLowerCase())) {
      return;
    }
    if (params.misspelledWord || (params.dictionarySuggestions && params.dictionarySuggestions.length > 0)) {
      mainWindow.webContents.send("native-spell-suggestions", {
        word: params.misspelledWord,
        suggestions: params.dictionarySuggestions || [],
      });
    }
  });

  ipcMain.removeAllListeners("window-minimize");
  ipcMain.removeAllListeners("window-maximize");
  ipcMain.removeAllListeners("window-snap");
  ipcMain.removeAllListeners("window-close");
  ipcMain.removeHandler("window-is-maximized");
  ipcMain.removeHandler("get-saved-workspace");
  ipcMain.removeHandler("set-saved-workspace");
  ipcMain.removeHandler("select-workspace-dialog");
  ipcMain.removeHandler("select-directory-dialog");
  ipcMain.removeHandler("create-new-workspace");
  ipcMain.removeHandler("read-workspace-tree");
  ipcMain.removeHandler("read-file-content");
  ipcMain.removeHandler("read-image-data-url");
  ipcMain.removeHandler("write-file-content");
  ipcMain.removeHandler("write-file-base64");
  ipcMain.removeHandler("delete-file-or-folder");
  ipcMain.removeHandler("create-workspace-folder");
  ipcMain.removeHandler("rename-file-or-folder");
  ipcMain.removeHandler("copy-file-or-folder");
  ipcMain.removeHandler("open-external");
  ipcMain.removeHandler("fetch-tts-audio");

  ipcMain.handle("open-external", async (event, url) => {
    try {
      if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("tel:"))) {
        await shell.openExternal(url);
        return true;
      }
    } catch (err) {
      console.warn("Failed opening external URL:", url, err);
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

  ipcMain.on("window-minimize", () => {
    if (!mainWindow.isDestroyed()) mainWindow.minimize();
  });
  ipcMain.on("window-maximize", () => {
    if (!mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  ipcMain.on("window-snap", (_event, boundsRatio) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const currentBounds = mainWindow.getBounds();
      const currentDisplay = screen.getDisplayMatching(currentBounds) || screen.getPrimaryDisplay();
      const workArea = currentDisplay.workArea;

      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      }

      const x = Math.round(workArea.x + workArea.width * (boundsRatio.xRatio || 0));
      const y = Math.round(workArea.y + workArea.height * (boundsRatio.yRatio || 0));
      const width = Math.round(workArea.width * (boundsRatio.wRatio || 1));
      const height = Math.round(workArea.height * (boundsRatio.hRatio || 1));

      mainWindow.setBounds({ x, y, width, height }, true);
    } catch (err) {
      console.warn("window-snap failed:", err);
    }
  });
  ipcMain.on("window-close", () => {
    if (!mainWindow.isDestroyed()) mainWindow.close();
  });
  ipcMain.handle("window-is-maximized", () => {
    return !mainWindow.isDestroyed() && mainWindow.isMaximized();
  });

  ipcMain.handle("get-saved-workspace", () => {
    const data = getSavedWorkspaceData() || {};
    const recent = getRecentWorkspacesList();
    if (data?.folderPath) {
      ensureDefaultWorkspaceFolders(data.folderPath);
      startWorkspaceWatcher(data.folderPath, mainWindow);
    }
    return { ...data, recentWorkspaces: recent };
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
    try {
      if (data?.folderPath) {
        saveWorkspaceData(data);
        startWorkspaceWatcher(data.folderPath, mainWindow);
      } else {
        const recent = getRecentWorkspacesList();
        const toSave = {
          folderPath: null,
          folderName: null,
          recentWorkspaces: recent,
        };
        fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2), "utf8");
        stopWorkspaceWatcher();
      }
      return true;
    } catch (err) {
      console.warn("Failed setting saved workspace:", err);
      return false;
    }
  });

  ipcMain.handle("read-workspace-tree", (event, folderPath) => {
    if (!folderPath || !fs.existsSync(folderPath)) return { entries: [], folderPaths: [] };
    ensureDefaultWorkspaceFolders(folderPath);
    startWorkspaceWatcher(folderPath, mainWindow);
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

  ipcMain.handle("write-file-base64", (event, { fullPath, base64 }) => {
    try {
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const rawData = (base64 || "").includes(",") ? base64.split(",")[1] : (base64 || "");
      const buffer = Buffer.from(rawData, "base64");
      fs.writeFileSync(fullPath, buffer);
      return true;
    } catch (err) {
      console.warn("Failed writing base64 file content:", fullPath, err);
      return false;
    }
  });

  ipcMain.handle("delete-file-or-folder", (event, fullPath) => {
    try {
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return true;
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

  ipcMain.handle("read-file-base64", (event, fullPath) => {
    try {
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        return buffer.toString("base64");
      }
    } catch (err) {
      console.warn("Failed reading file base64:", fullPath, err);
    }
    return null;
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

  ipcMain.handle("select-workspace-dialog", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Workspace Folder",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      const folderName = path.basename(folderPath);
      ensureDefaultWorkspaceFolders(folderPath);
      startWorkspaceWatcher(folderPath, mainWindow);
      const data = { folderPath, folderName };
      saveWorkspaceData(data);
      return data;
    }
    return null;
  });

  ipcMain.handle("select-directory-dialog", async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: title || "Select Location",
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("show-save-dialog", async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
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

  ipcMain.handle("create-new-workspace", async (event, { parentPath, workspaceName }) => {
    try {
      if (!parentPath || !workspaceName) return null;
      const targetPath = path.join(parentPath, workspaceName.trim());
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      ensureDefaultWorkspaceFolders(targetPath);
      startWorkspaceWatcher(targetPath, mainWindow);
      const data = { folderPath: targetPath, folderName: workspaceName.trim() };
      saveWorkspaceData(data);
      return data;
    } catch (err) {
      console.warn("Failed creating new workspace:", err);
      return null;
    }
  });

  mainWindow.on("closed", () => {
    stopWorkspaceWatcher();
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:8080");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Open external links in user's default browser, but allow Google OAuth login popup
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("accounts.google.com") || url.includes("google.com/gsi/")) {
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
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
}

app.whenReady().then(() => {
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

    if (contents.getType() === "webview") {
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

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
