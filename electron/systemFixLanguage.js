const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn, execFile } = require("child_process");
const { swapKeyboardLayout, buildWebViewFixLanguageScript } = require("./thaiKeyboardMapper");

const GLOBAL_FIX_LANGUAGE_SHORTCUT = "CommandOrControl+Shift+L";
const WM_LUNO_FIX_LANGUAGE = 0x804c; // WM_APP + 'L'
const HELPER_EXE_NAME = "LunoFixLang.exe";
const HELPER_CONFIG_FILE = "fix-language-helper.json";
const HELPER_STATUS_FILE = "fix-language-helper-status.json";

const WIN32_WORKER_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading;

public static class LunoWin32Input {
  [DllImport("user32.dll")]
  public static extern uint GetClipboardSequenceNumber();

  [DllImport("user32.dll")]
  public static extern short GetAsyncKeyState(int vKey);

  [DllImport("user32.dll")]
  public static extern uint MapVirtualKey(uint uCode, uint uMapType);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

  [StructLayout(LayoutKind.Sequential)]
  public struct INPUT {
    public uint type;
    public InputUnion u;
  }

  [StructLayout(LayoutKind.Explicit)]
  public struct InputUnion {
    [FieldOffset(0)] public MOUSEINPUT mi;
    [FieldOffset(0)] public KEYBDINPUT ki;
    [FieldOffset(0)] public HARDWAREINPUT hi;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct MOUSEINPUT {
    public int dx;
    public int dy;
    public uint mouseData;
    public uint dwFlags;
    public uint time;
    public IntPtr dwExtraInfo;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct KEYBDINPUT {
    public ushort wVk;
    public ushort wScan;
    public uint dwFlags;
    public uint time;
    public IntPtr dwExtraInfo;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct HARDWAREINPUT {
    public uint uMsg;
    public ushort wParamL;
    public ushort wParamH;
  }

  private const uint INPUT_KEYBOARD = 1;
  private const uint KEYEVENTF_KEYUP = 0x0002;
  private const ushort VK_SHIFT = 0x10;
  private const ushort VK_CONTROL = 0x11;
  private const ushort VK_MENU = 0x12;
  private const ushort VK_LSHIFT = 0xA0;
  private const ushort VK_RSHIFT = 0xA1;
  private const ushort VK_LCONTROL = 0xA2;
  private const ushort VK_RCONTROL = 0xA3;
  private const ushort VK_LMENU = 0xA4;
  private const ushort VK_RMENU = 0xA5;
  private const ushort VK_L = 0x4C;
  private const ushort VK_C = 0x43;
  private const ushort VK_V = 0x56;

  private static bool IsKeyDown(int vk) {
    return (GetAsyncKeyState(vk) & 0x8000) != 0;
  }

  private static INPUT MakeKey(ushort vk, bool keyUp) {
    INPUT inp = new INPUT();
    inp.type = INPUT_KEYBOARD;
    inp.u.ki.wVk = vk;
    inp.u.ki.wScan = (ushort)MapVirtualKey(vk, 0);
    inp.u.ki.dwFlags = keyUp ? KEYEVENTF_KEYUP : 0;
    inp.u.ki.time = 0;
    inp.u.ki.dwExtraInfo = IntPtr.Zero;
    return inp;
  }

  private static void WaitForModifiersRelease(int maxWaitMs) {
    int[] keys = new int[] {
      VK_LSHIFT, VK_RSHIFT, VK_SHIFT,
      VK_LCONTROL, VK_RCONTROL, VK_CONTROL,
      VK_LMENU, VK_RMENU, VK_MENU,
      VK_L
    };
    int elapsed = 0;
    while (elapsed < maxWaitMs) {
      bool anyDown = false;
      for (int i = 0; i < keys.Length; i++) {
        if (IsKeyDown(keys[i])) {
          anyDown = true;
          break;
        }
      }
      if (!anyDown) break;
      Thread.Sleep(10);
      elapsed += 10;
    }
  }

  private static void ReleaseConflictingModifiers() {
    ushort[] toRelease = new ushort[] {
      VK_LSHIFT, VK_RSHIFT, VK_SHIFT,
      VK_LMENU, VK_RMENU, VK_MENU,
      VK_L,
      VK_LCONTROL, VK_RCONTROL, VK_CONTROL
    };
    List<INPUT> list = new List<INPUT>();
    for (int i = 0; i < toRelease.Length; i++) {
      if (IsKeyDown(toRelease[i])) {
        list.Add(MakeKey(toRelease[i], true));
      }
    }
    if (list.Count > 0) {
      SendInput((uint)list.Count, list.ToArray(), Marshal.SizeOf(typeof(INPUT)));
      Thread.Sleep(15);
    }
  }

  private static void SendCtrlKey(ushort vk) {
    ReleaseConflictingModifiers();
    INPUT[] inputs = new INPUT[] {
      MakeKey(VK_LCONTROL, false),
      MakeKey(vk, false),
      MakeKey(vk, true),
      MakeKey(VK_LCONTROL, true)
    };
    SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
  }

  public static string CopySelection(int releaseWaitMs, int clipboardWaitMs) {
    WaitForModifiersRelease(releaseWaitMs);
    uint seqBefore = GetClipboardSequenceNumber();
    SendCtrlKey(VK_C);
    int elapsed = 0;
    while (elapsed < clipboardWaitMs) {
      if (GetClipboardSequenceNumber() != seqBefore) {
        Thread.Sleep(15);
        return "COPIED";
      }
      Thread.Sleep(10);
      elapsed += 10;
    }
    return "UNCHANGED";
  }

  public static string PasteClipboard() {
    SendCtrlKey(VK_V);
    return "PASTED";
  }
}
'@
[Console]::Out.WriteLine("READY")
[Console]::Out.Flush()
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $cmd = $line.Trim()
  if ($cmd -eq "EXIT") { break }
  elseif ($cmd -eq "COPY") {
    $res = [LunoWin32Input]::CopySelection(400, 300)
    [Console]::Out.WriteLine($res)
    [Console]::Out.Flush()
  }
  elseif ($cmd -eq "PASTE") {
    $res = [LunoWin32Input]::PasteClipboard()
    [Console]::Out.WriteLine($res)
    [Console]::Out.Flush()
  }
  else {
    [Console]::Out.WriteLine("UNKNOWN")
    [Console]::Out.Flush()
  }
}
`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha256File(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex");
  } catch {
    return null;
  }
}

function execHelperCommand(exePath, args, timeoutMs = 4000) {
  return new Promise((resolve) => {
    try {
      execFile(exePath, args, { windowsHide: true, timeout: timeoutMs }, (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err && typeof err.code === "number" ? err.code : err ? 1 : 0,
          stdout: (stdout || "").trim(),
          stderr: (stderr || "").trim(),
        });
      });
    } catch {
      resolve({ ok: false, code: 1, stdout: "", stderr: "" });
    }
  });
}

function createWin32InputWorker(spawnImpl = spawn) {
  let child = null;
  let readyPromise = null;
  let stdoutBuffer = "";
  let pendingResolve = null;
  let pendingReject = null;
  let pendingTimer = null;
  let queue = Promise.resolve();
  let disposed = false;

  const cleanupChild = () => {
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    if (pendingReject) {
      const reject = pendingReject;
      pendingResolve = null;
      pendingReject = null;
      reject(new Error("Win32 input worker closed"));
    }
    if (child) {
      try {
        child.stdin?.write("EXIT\n");
      } catch {
        /* ignore write failure during cleanup */
      }
      try {
        child.kill();
      } catch {
        /* ignore kill failure during cleanup */
      }
      child = null;
    }
    readyPromise = null;
    stdoutBuffer = "";
  };

  const ensureReady = () => {
    if (disposed) return Promise.reject(new Error("Win32 input worker disposed"));
    if (readyPromise && child && !child.killed) {
      return readyPromise;
    }

    readyPromise = new Promise((resolveReady, rejectReady) => {
      try {
        const encoded = Buffer.from(WIN32_WORKER_SCRIPT, "utf16le").toString("base64");
        const proc = spawnImpl(
          "powershell.exe",
          ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-EncodedCommand", encoded],
          {
            windowsHide: true,
            stdio: ["pipe", "pipe", "pipe"],
          }
        );

        child = proc;
        stdoutBuffer = "";
        let isReady = false;

        const bootTimer = setTimeout(() => {
          if (!isReady) {
            cleanupChild();
            rejectReady(new Error("Win32 input worker startup timeout"));
          }
        }, 8000);

        proc.stdout.setEncoding("utf8");
        proc.stdout.on("data", (chunk) => {
          stdoutBuffer += chunk;
          let newlineIdx;
          while ((newlineIdx = stdoutBuffer.indexOf("\n")) !== -1) {
            const line = stdoutBuffer.slice(0, newlineIdx).trim();
            stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
            if (!line) continue;

            if (!isReady) {
              if (line === "READY") {
                isReady = true;
                clearTimeout(bootTimer);
                resolveReady();
              }
              continue;
            }

            if (pendingResolve) {
              const resolve = pendingResolve;
              pendingResolve = null;
              pendingReject = null;
              if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
              }
              resolve(line);
            }
          }
        });

        proc.on("error", (err) => {
          clearTimeout(bootTimer);
          cleanupChild();
          if (!isReady) rejectReady(err);
        });

        proc.on("exit", () => {
          clearTimeout(bootTimer);
          if (child === proc) {
            cleanupChild();
          }
          if (!isReady) {
            rejectReady(new Error("Win32 input worker exited before ready"));
          }
        });
      } catch (err) {
        cleanupChild();
        rejectReady(err);
      }
    });

    return readyPromise;
  };

  const sendCommand = (command, timeoutMs = 2000) => {
    const run = async () => {
      await ensureReady();
      if (!child || child.killed || !child.stdin) {
        throw new Error("Win32 input worker unavailable");
      }
      return await new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;
        pendingTimer = setTimeout(() => {
          pendingResolve = null;
          pendingReject = null;
          pendingTimer = null;
          cleanupChild();
          reject(new Error(`Win32 input worker timeout on ${command}`));
        }, timeoutMs);
        try {
          child.stdin.write(`${command}\n`);
        } catch (err) {
          if (pendingTimer) {
            clearTimeout(pendingTimer);
            pendingTimer = null;
          }
          pendingResolve = null;
          pendingReject = null;
          cleanupChild();
          reject(err);
        }
      });
    };

    const next = queue.then(run, run);
    queue = next.catch(() => {});
    return next;
  };

  return {
    warmUp: () => {
      if (disposed) return;
      ensureReady().catch((err) => {
        console.warn("Win32 global fix-language worker warm-up failed:", err?.message || err);
      });
    },
    copySelection: () => sendCommand("COPY", 2000),
    pasteClipboard: () => sendCommand("PASTE", 1500),
    dispose: () => {
      disposed = true;
      cleanupChild();
    },
    stop: () => {
      cleanupChild();
    },
  };
}

function runOsascript(script) {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], { timeout: 2000 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function createNativeHelperController({
  platform,
  userDataPath,
  sourceExePath,
  lunoAppPath,
  lunoPid = process.pid,
  spawnImpl = spawn,
  execHelperImpl = execHelperCommand,
}) {
  const helperDir = userDataPath ? path.join(userDataPath, "helper") : null;
  const deployedExePath = helperDir ? path.join(helperDir, HELPER_EXE_NAME) : null;
  const configPath = userDataPath ? path.join(userDataPath, HELPER_CONFIG_FILE) : null;
  const statusPath = userDataPath ? path.join(userDataPath, HELPER_STATUS_FILE) : null;

  const isSupported = () => {
    if (platform !== "win32" || !userDataPath) return false;
    return Boolean(
      (sourceExePath && fs.existsSync(sourceExePath)) ||
        (deployedExePath && fs.existsSync(deployedExePath))
    );
  };

  const resolveActiveExePath = () => {
    if (deployedExePath && fs.existsSync(deployedExePath)) return deployedExePath;
    if (sourceExePath && fs.existsSync(sourceExePath)) return sourceExePath;
    return null;
  };

  const readStatusFile = () => {
    if (!statusPath || !fs.existsSync(statusPath)) return null;
    try {
      const parsed = JSON.parse(fs.readFileSync(statusPath, "utf8"));
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const readConfigFile = () => {
    if (!configPath || !fs.existsSync(configPath)) return null;
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeConfigFile = (payload) => {
    if (!configPath) return false;
    try {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), "utf8");
      return true;
    } catch (err) {
      console.warn("Failed writing fix-language-helper.json:", err?.message || err);
      return false;
    }
  };

  const ensureDeployedBinary = async () => {
    if (!isSupported()) return null;
    if (!sourceExePath || !fs.existsSync(sourceExePath)) {
      return deployedExePath && fs.existsSync(deployedExePath) ? deployedExePath : null;
    }
    if (!deployedExePath) return sourceExePath;

    try {
      fs.mkdirSync(helperDir, { recursive: true });
      const srcHash = sha256File(sourceExePath);
      const dstHash = fs.existsSync(deployedExePath) ? sha256File(deployedExePath) : null;

      if (!dstHash || (srcHash && srcHash !== dstHash)) {
        if (fs.existsSync(deployedExePath)) {
          await execHelperImpl(deployedExePath, ["--stop"], 3000);
          await delay(80);
        }
        fs.copyFileSync(sourceExePath, deployedExePath);
      }
      return deployedExePath;
    } catch (err) {
      console.warn("Failed deploying LunoFixLang.exe to userData:", err?.message || err);
      return fs.existsSync(deployedExePath) ? deployedExePath : sourceExePath;
    }
  };

  const isRunning = async () => {
    const exePath = resolveActiveExePath();
    if (!exePath) return false;
    const res = await execHelperImpl(exePath, ["--status"], 2000);
    return res.ok && res.code === 0;
  };

  const isAutoStartInstalled = async () => {
    const exePath = resolveActiveExePath();
    if (!exePath) return false;
    const res = await execHelperImpl(exePath, ["--check-autostart"], 2000);
    return res.ok && res.code === 0;
  };

  const startOrSync = async ({ enabled, language, labels, installAutoStart = true }) => {
    const exePath = await ensureDeployedBinary();
    if (!exePath) {
      return { running: false, registered: false, autoStart: false };
    }

    writeConfigFile({
      enabled: Boolean(enabled),
      language: language || "en",
      lunoPid,
      lunoAppPath: lunoAppPath || "",
      labels: labels || {},
    });

    if (installAutoStart) {
      await execHelperImpl(exePath, ["--install-autostart", "--config", configPath], 3000);
    }

    const alreadyRunning = await isRunning();
    if (alreadyRunning) {
      await execHelperImpl(exePath, ["--reload"], 2000);
      await delay(120);
    } else {
      try {
        const proc = spawnImpl(exePath, ["--config", configPath], {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        });
        if (proc && typeof proc.unref === "function") {
          proc.unref();
        }
      } catch (err) {
        console.warn("Failed launching LunoFixLang.exe:", err?.message || err);
        return { running: false, registered: false, autoStart: false };
      }
      const bootStartedAt = Date.now();
      while (Date.now() - bootStartedAt < 4000) {
        await delay(100);
        const st = readStatusFile();
        if (st && st.running && typeof st.updatedAt === "number" && st.updatedAt >= bootStartedAt - 1000) {
          break;
        }
      }
    }

    const runningNow = await isRunning();
    const statusJson = readStatusFile();
    const autoStart = await isAutoStartInstalled();
    return {
      running: runningNow,
      registered: runningNow && (statusJson ? Boolean(statusJson.registered) : true),
      autoStart,
    };
  };

  const stopAndUninstall = async ({ uninstallAutoStart = true } = {}) => {
    const exePath = resolveActiveExePath();
    if (!exePath) {
      return { running: false, registered: false, autoStart: false };
    }
    if (uninstallAutoStart) {
      await execHelperImpl(exePath, ["--uninstall-autostart"], 3000);
    }
    await execHelperImpl(exePath, ["--stop"], 3000);
    return { running: false, registered: false, autoStart: false };
  };

  const detachFromLunoOnQuit = ({ enabled, language, labels }) => {
    if (!configPath) return;
    writeConfigFile({
      enabled: Boolean(enabled),
      language: language || "en",
      lunoPid: 0,
      lunoAppPath: lunoAppPath || "",
      labels: labels || {},
    });
    const exePath = resolveActiveExePath();
    if (exePath) {
      try {
        const proc = spawnImpl(exePath, ["--reload"], {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        });
        if (proc && typeof proc.unref === "function") {
          proc.unref();
        }
      } catch {
        /* ignore reload error during app quit */
      }
    }
  };

  const queryLiveStatus = async () => {
    const supported = isSupported();
    if (!supported) {
      return {
        supported: false,
        running: false,
        registered: false,
        autoStart: false,
      };
    }
    const running = await isRunning();
    const statusJson = readStatusFile();
    const autoStart = await isAutoStartInstalled();
    return {
      supported: true,
      running,
      registered: running && (statusJson ? Boolean(statusJson.registered) : false),
      autoStart,
    };
  };

  return {
    isSupported,
    readConfigFile,
    startOrSync,
    stopAndUninstall,
    detachFromLunoOnQuit,
    queryLiveStatus,
  };
}

function createSystemFixLanguageManager({
  BrowserWindow,
  webContents,
  globalShortcut,
  clipboard,
  Notification,
  getAppIcon,
  platform = process.platform,
  userDataPath = null,
  sourceExePath = null,
  lunoAppPath = "",
  lunoPid = process.pid,
  inputDriver = null,
  helperController = null,
  restoreDelayMs = 240,
} = {}) {
  let enabled = false;
  let backgroundHelperEnabled = false;
  let language = "en";
  let electronRegistered = false;
  let helperRunning = false;
  let helperRegistered = false;
  let helperAutoStart = false;
  let isProcessing = false;
  let lastCompletedAt = 0;
  let configureQueue = Promise.resolve();
  let labels = {
    title: "Fix language",
    selectTextFirst: "Select text before fixing language.",
  };

  const nativeHelper =
    helperController ||
    createNativeHelperController({
      platform,
      userDataPath,
      sourceExePath,
      lunoAppPath,
      lunoPid,
    });

  const win32Worker = !inputDriver && platform === "win32" ? createWin32InputWorker() : null;

  const driver = inputDriver || {
    warmUp: () => {
      if (win32Worker) win32Worker.warmUp();
    },
    stop: () => {
      if (win32Worker) win32Worker.stop();
    },
    dispose: () => {
      if (win32Worker) win32Worker.dispose();
    },
    copySelection: async () => {
      if (win32Worker) {
        return await win32Worker.copySelection();
      }
      if (platform === "darwin") {
        await delay(140);
        const before = clipboard.readText();
        await runOsascript('tell application "System Events" to keystroke "c" using command down');
        await delay(120);
        const after = clipboard.readText();
        return after && after !== before ? "COPIED" : "UNCHANGED";
      }
      return "UNSUPPORTED";
    },
    pasteClipboard: async () => {
      if (win32Worker) {
        return await win32Worker.pasteClipboard();
      }
      if (platform === "darwin") {
        await runOsascript('tell application "System Events" to keystroke "v" using command down');
        return "PASTED";
      }
      return "UNSUPPORTED";
    },
  };

  const snapshotClipboard = () => {
    try {
      const formats = typeof clipboard.availableFormats === "function" ? clipboard.availableFormats() : [];
      const data = {};
      const text = typeof clipboard.readText === "function" ? clipboard.readText() : "";
      if (text) data.text = text;
      const html = typeof clipboard.readHTML === "function" ? clipboard.readHTML() : "";
      if (html) data.html = html;
      const rtf = typeof clipboard.readRTF === "function" ? clipboard.readRTF() : "";
      if (rtf) data.rtf = rtf;
      if (formats.some((f) => String(f).startsWith("image/")) && typeof clipboard.readImage === "function") {
        const img = clipboard.readImage();
        if (img && typeof img.isEmpty === "function" && !img.isEmpty()) {
          data.image = img;
        }
      }
      return { data, hadContent: Object.keys(data).length > 0 };
    } catch {
      return { data: {}, hadContent: false };
    }
  };

  const restoreClipboard = (snapshot, expectedCurrentText) => {
    try {
      if (expectedCurrentText !== undefined && typeof clipboard.readText === "function") {
        if (clipboard.readText() !== expectedCurrentText) {
          return;
        }
      }
      if (!snapshot || !snapshot.hadContent) {
        if (typeof clipboard.clear === "function") {
          clipboard.clear();
        }
        return;
      }
      if (typeof clipboard.write === "function") {
        clipboard.write(snapshot.data);
      } else if (typeof snapshot.data.text === "string" && typeof clipboard.writeText === "function") {
        clipboard.writeText(snapshot.data.text);
      }
    } catch {
      /* ignore clipboard restore failures */
    }
  };

  const showSelectTextNotification = () => {
    try {
      if (Notification && typeof Notification.isSupported === "function" && Notification.isSupported()) {
        const icon = typeof getAppIcon === "function" ? getAppIcon() : undefined;
        const notif = new Notification({
          title: labels.title || "Fix language",
          body: labels.selectTextFirst || "Select text before fixing language.",
          silent: true,
          ...(icon ? { icon } : {}),
        });
        notif.show();
      }
    } catch {
      /* ignore OS notification errors */
    }
  };

  const fixLanguageInWebContents = async (targetWc, hostWin) => {
    if (!targetWc || targetWc.isDestroyed?.()) return "error";
    try {
      const result = await targetWc.executeJavaScript(buildWebViewFixLanguageScript(), true);
      if (result === "empty-selection" && hostWin && !hostWin.isDestroyed?.()) {
        hostWin.webContents.send("fix-language-feedback", { status: "empty-selection" });
      }
      return result;
    } catch (err) {
      console.warn("Failed fixing language inside webview:", err?.message || err);
      return "error";
    }
  };

  const triggerInFocusedWindow = async (targetWin) => {
    const win =
      targetWin && !targetWin.isDestroyed?.()
        ? targetWin
        : BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
          ? BrowserWindow.getFocusedWindow()
          : null;

    if (!win || win.isDestroyed?.()) {
      return { status: "no-focused-window" };
    }

    const focusedWc =
      webContents && typeof webContents.getFocusedWebContents === "function"
        ? webContents.getFocusedWebContents()
        : null;

    if (
      focusedWc &&
      !focusedWc.isDestroyed?.() &&
      typeof focusedWc.getType === "function" &&
      focusedWc.getType() === "webview"
    ) {
      return await fixLanguageInWebContents(focusedWc, win);
    }

    win.webContents.send("trigger-fix-language");
    return { status: "dispatched-to-renderer" };
  };

  const runExternalFixLanguage = async () => {
    if (isProcessing) return { status: "busy" };
    if (Date.now() - lastCompletedAt < 150) return { status: "cooldown" };

    isProcessing = true;
    try {
      const snapshot = snapshotClipboard();
      const copyResult = await driver.copySelection();

      if (copyResult !== "COPIED") {
        showSelectTextNotification();
        return { status: "empty-selection" };
      }

      const selectedText = typeof clipboard.readText === "function" ? clipboard.readText() : "";
      if (!selectedText || !selectedText.trim()) {
        restoreClipboard(snapshot);
        showSelectTextNotification();
        return { status: "empty-selection" };
      }

      const convertedText = swapKeyboardLayout(selectedText);
      if (convertedText === selectedText) {
        restoreClipboard(snapshot);
        return { status: "unchanged" };
      }

      clipboard.writeText(convertedText);
      await delay(20);
      await driver.pasteClipboard();

      if (restoreDelayMs > 0) {
        setTimeout(() => {
          restoreClipboard(snapshot, convertedText);
        }, restoreDelayMs);
      } else {
        restoreClipboard(snapshot, convertedText);
      }

      return { status: "converted", originalText: selectedText, convertedText };
    } catch (err) {
      console.warn("Global fix language failed:", err?.message || err);
      return { status: "error", error: err?.message || String(err) };
    } finally {
      lastCompletedAt = Date.now();
      isProcessing = false;
    }
  };

  const handleShortcutTrigger = async () => {
    try {
      const focusedWin =
        BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
          ? BrowserWindow.getFocusedWindow()
          : null;

      if (focusedWin && !focusedWin.isDestroyed?.()) {
        return await triggerInFocusedWindow(focusedWin);
      }

      return await runExternalFixLanguage();
    } catch (err) {
      console.warn("handleShortcutTrigger error:", err?.message || err);
      return { status: "error" };
    }
  };

  const unregisterElectronShortcut = () => {
    if (electronRegistered && globalShortcut && typeof globalShortcut.unregister === "function") {
      try {
        globalShortcut.unregister(GLOBAL_FIX_LANGUAGE_SHORTCUT);
      } catch {
        /* ignore unregister failure */
      }
    }
    electronRegistered = false;
  };

  const registerElectronShortcut = () => {
    if (!electronRegistered && globalShortcut && typeof globalShortcut.register === "function") {
      try {
        electronRegistered = Boolean(
          globalShortcut.register(GLOBAL_FIX_LANGUAGE_SHORTCUT, () => {
            void handleShortcutTrigger();
          })
        );
      } catch (err) {
        console.warn("Failed registering global Fix Language shortcut:", err?.message || err);
        electronRegistered = false;
      }
    }
    if (electronRegistered) {
      driver.warmUp?.();
    }
  };

  const buildStatus = () => {
    const backgroundHelperSupported = Boolean(nativeHelper.isSupported?.());
    const useHelper = enabled && backgroundHelperEnabled && backgroundHelperSupported && helperRunning;
    return {
      enabled,
      registered: useHelper ? helperRegistered : electronRegistered,
      shortcut: GLOBAL_FIX_LANGUAGE_SHORTCUT,
      platform,
      backgroundHelperSupported,
      backgroundHelperEnabled: backgroundHelperSupported && backgroundHelperEnabled,
      backgroundHelperRunning: helperRunning,
      backgroundHelperAutoStart: helperAutoStart,
      mode: !enabled ? "disabled" : useHelper ? "helper" : "electron",
    };
  };

  const applyConfiguration = async (config = {}) => {
    if (config && typeof config === "object") {
      if (config.language === "th" || config.language === "en") {
        language = config.language;
      }
      if (config.labels && typeof config.labels === "object") {
        labels = { ...labels };
        for (const [k, v] of Object.entries(config.labels)) {
          if (typeof v === "string" && v.trim()) {
            labels[k] = v.trim();
          }
        }
      }
      if (typeof config.enabled === "boolean") {
        enabled = config.enabled;
      }
      if (typeof config.backgroundHelper === "boolean") {
        backgroundHelperEnabled = config.backgroundHelper;
      }
    }

    const helperSupported = Boolean(nativeHelper.isSupported?.());

    if (!enabled) {
      unregisterElectronShortcut();
      driver.stop?.();
      if (helperSupported) {
        const res = await nativeHelper.stopAndUninstall({ uninstallAutoStart: true });
        helperRunning = Boolean(res.running);
        helperRegistered = Boolean(res.registered);
        helperAutoStart = Boolean(res.autoStart);
      }
      return buildStatus();
    }

    if (backgroundHelperEnabled && helperSupported) {
      // Yield Electron globalShortcut so LunoFixLang.exe owns Ctrl+Shift+L exclusively without conflict
      unregisterElectronShortcut();
      driver.stop?.();

      const res = await nativeHelper.startOrSync({
        enabled: true,
        language,
        labels,
        installAutoStart: true,
      });
      helperRunning = Boolean(res.running);
      helperRegistered = Boolean(res.registered);
      helperAutoStart = Boolean(res.autoStart);

      if (helperRunning) {
        return buildStatus();
      }
      // Graceful fallback to Electron globalShortcut if helper failed to start
      console.warn("LunoFixLang.exe failed to start; falling back to Electron globalShortcut.");
    } else if (helperSupported) {
      const res = await nativeHelper.stopAndUninstall({ uninstallAutoStart: true });
      helperRunning = Boolean(res.running);
      helperRegistered = Boolean(res.registered);
      helperAutoStart = Boolean(res.autoStart);
    }

    registerElectronShortcut();
    return buildStatus();
  };

  const configure = (config = {}) => {
    const next = configureQueue.then(() => applyConfiguration(config), () => applyConfiguration(config));
    configureQueue = next.catch(() => {});
    return next;
  };

  const restartBackgroundHelper = () => {
    return configure({
      enabled: true,
      backgroundHelper: true,
      language,
      labels,
    });
  };

  const getStatus = async () => {
    if (nativeHelper.isSupported?.()) {
      const live = await nativeHelper.queryLiveStatus();
      helperRunning = Boolean(live.running);
      helperRegistered = Boolean(live.registered);
      helperAutoStart = Boolean(live.autoStart);
    }
    return buildStatus();
  };

  const attachWindowMessageHook = (win) => {
    if (!win || win.isDestroyed?.() || platform !== "win32") return;
    if (typeof win.hookWindowMessage !== "function") return;
    try {
      win.hookWindowMessage(WM_LUNO_FIX_LANGUAGE, () => {
        void triggerInFocusedWindow(win);
      });
    } catch (err) {
      console.warn("Failed hooking WM_LUNO_FIX_LANGUAGE on BrowserWindow:", err?.message || err);
    }
  };

  const attachWebViewShortcut = (contents) => {
    if (!contents || typeof contents.on !== "function") return;
    contents.on("before-input-event", (event, input) => {
      if (!input || input.type !== "keyDown") return;
      const ctrlOrCmd = Boolean(input.control || input.meta);
      if (!ctrlOrCmd || !input.shift || input.alt) return;
      const keyLower = typeof input.key === "string" ? input.key.toLowerCase() : "";
      const isL = input.code === "KeyL" || keyLower === "l" || input.key === "ศ";
      if (!isL) return;

      event.preventDefault();
      const hostWin =
        BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
          ? BrowserWindow.getFocusedWindow()
          : null;
      void fixLanguageInWebContents(contents, hostWin);
    });
  };

  const dispose = () => {
    unregisterElectronShortcut();
    driver.dispose?.();
    // If background helper is enabled, keep it alive in the System Tray after Luno Note exits!
    // Clear lunoPid so the helper won't accidentally match a recycled OS PID later.
    if (enabled && backgroundHelperEnabled && nativeHelper.isSupported?.()) {
      nativeHelper.detachFromLunoOnQuit({ enabled: true, language, labels });
    }
  };

  return {
    configure,
    getStatus,
    restartBackgroundHelper,
    handleShortcutTrigger,
    triggerInFocusedWindow,
    attachWindowMessageHook,
    attachWebViewShortcut,
    dispose,
  };
}

module.exports = {
  GLOBAL_FIX_LANGUAGE_SHORTCUT,
  WM_LUNO_FIX_LANGUAGE,
  createNativeHelperController,
  createSystemFixLanguageManager,
};
