const { app, BrowserWindow, ipcMain, shell, Menu, MenuItem, dialog, nativeImage, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const http = require("http");
const url = require("url");
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
  showWordCount: true,
  autoPairBrackets: true,
  showCodeLineNumbers: false,
  highlightInlineCode: false,
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
      const currentVersion = app.getVersion();

      // If version changed (e.g. fresh install or update over old version), do not auto-open previous workspace
      if (data?.lastAppVersion && data.lastAppVersion !== currentVersion) {
        data.folderPath = null;
        data.folderName = null;
        data.lastAppVersion = currentVersion;
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
        return null;
      }

      if (!data?.lastAppVersion) {
        data.lastAppVersion = currentVersion;
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
      }

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
      if (filename) {
        const norm = filename.replace(/\\/g, "/").toLowerCase();
        const baseName = path.basename(norm);
        if (
          baseName.startsWith(".") ||
          baseName.startsWith("~$") ||
          baseName.endsWith(".tmp") ||
          baseName.endsWith(".swp") ||
          baseName.endsWith(".crdownload") ||
          baseName === "thumbs.db" ||
          baseName === "desktop.ini"
        ) {
          return;
        }
        const parts = norm.split("/");
        if (parts.some((p) => p.startsWith(".") || IGNORED_SCAN_FOLDERS.has(p))) {
          return;
        }
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
      }, 400);
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
    win.loadURL("http://localhost:8080");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Open external links in user's default browser, but allow Google OAuth login popup
  win.webContents.setWindowOpenHandler(({ url }) => {
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

  return win;
}

function setupIpcHandlers() {
  ipcMain.handle("google-oauth-login", async (event, clientId) => {
    return new Promise((resolve, reject) => {
      let isSettled = false;
      const server = http.createServer((req, res) => {
        try {
          const parsedUrl = url.parse(req.url, true);

          if (parsedUrl.pathname === "/") {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>Luno Note - Google Sign-In</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; text-align: center; }
                  .card { background: #1e293b; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); max-width: 400px; border: 1px solid #334155; }
                  h2 { margin: 0 0 0.75rem 0; color: #38bdf8; font-size: 1.5rem; }
                  p { margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>เข้าสู่ระบบสำเร็จ!</h2>
                  <p>เชื่อมต่อ Google Drive กับ Luno Note เรียบร้อยแล้ว<br>คุณสามารถปิดแท็บนี้และกลับไปที่โปรแกรมได้เลย</p>
                </div>
                <script>
                  const hash = window.location.hash.substring(1);
                  const params = new URLSearchParams(hash || window.location.search);
                  const accessToken = params.get('access_token');
                  const expiresIn = params.get('expires_in');
                  const error = params.get('error');
                  
                  fetch('/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken, expiresIn, error })
                  }).then(() => {
                    setTimeout(() => window.close(), 1200);
                  }).catch(() => {});
                </script>
              </body>
              </html>
            `);
            return;
          }

          if (parsedUrl.pathname === "/callback" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => { body += chunk; });
            req.on("end", () => {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true }));

              if (isSettled) return;
              isSettled = true;
              try {
                const data = JSON.parse(body);
                server.close();
                if (data.error) {
                  reject(new Error(data.error));
                } else if (data.accessToken) {
                  resolve({
                    access_token: data.accessToken,
                    expires_in: Number(data.expiresIn) || 3600,
                  });
                } else {
                  reject(new Error("No access token received"));
                }
              } catch (err) {
                server.close();
                reject(err);
              }
            });
            return;
          }
        } catch (err) {
          if (!isSettled) {
            isSettled = true;
            server.close();
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
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;

        shell.openExternal(authUrl);

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
        homedir: userInfo.homedir || "",
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
}

let currentNativeKeyboardLang = "en";
let keyboardWatcherProcess = null;

function startNativeKeyboardWatcher() {
  if (process.platform !== "win32") return;
  try {
    const { spawn } = require("child_process");
    const scriptPath = path.join(__dirname, "keyboardLayoutWatcher.ps1");
    if (!fs.existsSync(scriptPath)) return;

    keyboardWatcherProcess = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      }
    );

    keyboardWatcherProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString().trim();
      const lines = text.split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter(Boolean);
      for (const line of lines) {
        if (line === "th" || line === "en") {
          currentNativeKeyboardLang = line;
          BrowserWindow.getAllWindows().forEach((w) => {
            if (!w.isDestroyed()) {
              w.webContents.send("native-keyboard-language-changed", line);
            }
          });
        }
      }
    });

    keyboardWatcherProcess.on("error", (e) => {
      console.warn("Keyboard watcher error", e);
    });

    keyboardWatcherProcess.on("exit", () => {
      keyboardWatcherProcess = null;
    });
  } catch (err) {
    console.warn("Failed to start keyboard watcher", err);
  }
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

  setupIpcHandlers();
  startNativeKeyboardWatcher();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("will-quit", () => {
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
