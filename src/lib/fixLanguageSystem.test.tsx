import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import {
  FIX_LANGUAGE_EVENT,
  fixLanguageInActiveElement,
  isFixLanguageShortcutEvent,
  triggerInAppFixLanguage,
  type FixLanguageEventDetail,
} from "./fixLanguageSystem";
import { EN_TO_TH_MAP, TH_TO_EN_MAP, swapKeyboardLayout } from "./thaiKeyboardMapper";
import * as toastModule from "@/hooks/use-toast";

const nodeRequire = createRequire(import.meta.url);
const electronMapper = nodeRequire("../../electron/thaiKeyboardMapper.js") as {
  EN_TO_TH_MAP: Record<string, string>;
  TH_TO_EN_MAP: Record<string, string>;
  swapKeyboardLayout: (text: string) => string;
  buildWebViewFixLanguageScript: () => string;
};
const electronSystemFix = nodeRequire("../../electron/systemFixLanguage.js") as {
  GLOBAL_FIX_LANGUAGE_SHORTCUT: string;
  WM_LUNO_FIX_LANGUAGE: number;
  createSystemFixLanguageManager: (opts: Record<string, unknown>) => {
    configure: (config?: {
      enabled?: boolean;
      backgroundHelper?: boolean;
      language?: "en" | "th";
      labels?: Record<string, string>;
    }) => Promise<{
      enabled: boolean;
      registered: boolean;
      shortcut: string;
      platform: string;
      backgroundHelperSupported: boolean;
      backgroundHelperEnabled: boolean;
      backgroundHelperRunning: boolean;
      backgroundHelperAutoStart: boolean;
      mode: "helper" | "electron" | "disabled";
    }>;
    getStatus: () => Promise<{
      enabled: boolean;
      registered: boolean;
      shortcut: string;
      platform: string;
      backgroundHelperSupported: boolean;
      backgroundHelperEnabled: boolean;
      backgroundHelperRunning: boolean;
      backgroundHelperAutoStart: boolean;
      mode: "helper" | "electron" | "disabled";
    }>;
    handleShortcutTrigger: () => Promise<unknown>;
    attachWindowMessageHook: (win: Record<string, unknown>) => void;
    attachWebViewShortcut: (contents: Record<string, unknown>) => void;
    dispose: () => void;
  };
};

describe("fixLanguageSystem", () => {
  let toastSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    toastSpy = vi.spyOn(toastModule, "toast").mockImplementation(() => ({
      id: "test-toast",
      dismiss: vi.fn(),
      update: vi.fn(),
    }));
  });

  afterEach(() => {
    toastSpy.mockRestore();
    document.body.innerHTML = "";
  });

  describe("isFixLanguageShortcutEvent", () => {
    it("matches Ctrl+Shift+L and Cmd+Shift+L in both English and Thai layouts", () => {
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, key: "L", code: "KeyL" }))
      ).toBe(true);
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { metaKey: true, shiftKey: true, key: "l", code: "KeyL" }))
      ).toBe(true);
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, key: "ศ", code: "KeyL" }))
      ).toBe(true);
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, key: "ศ" }))
      ).toBe(true);
    });

    it("rejects non-matching modifier combinations", () => {
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: false, key: "l", code: "KeyL" }))
      ).toBe(false);
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, altKey: true, key: "L", code: "KeyL" }))
      ).toBe(false);
      expect(
        isFixLanguageShortcutEvent(new KeyboardEvent("keydown", { shiftKey: true, key: "L", code: "KeyL" }))
      ).toBe(false);
    });
  });

  describe("in-app inputs, textareas, contentEditable, and iframes", () => {
    it("converts selected text in a React controlled <input>, fires onChange, and keeps selection reversible", () => {
      const ControlledInput = () => {
        const [val, setVal] = useState("Hi l;ylfu!");
        return (
          <input
            aria-label="search"
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        );
      };

      const { getByLabelText } = render(<ControlledInput />);
      const input = getByLabelText("search") as HTMLInputElement;
      input.focus();
      input.setSelectionRange(3, 9); // "l;ylfu"

      let first: ReturnType<typeof triggerInAppFixLanguage> | undefined;
      act(() => {
        first = triggerInAppFixLanguage();
      });
      expect(first).toEqual({
        status: "converted",
        originalText: "l;ylfu",
        convertedText: "สวัสดี",
      });
      expect(input.value).toBe("Hi สวัสดี!");
      expect(input.selectionStart).toBe(3);
      expect(input.selectionEnd).toBe(9);

      // Re-running toggles back cleanly because selection was preserved
      let second: ReturnType<typeof triggerInAppFixLanguage> | undefined;
      act(() => {
        second = triggerInAppFixLanguage();
      });
      expect(second).toEqual({
        status: "converted",
        originalText: "สวัสดี",
        convertedText: "l;ylfu",
      });
      expect(input.value).toBe("Hi l;ylfu!");
      expect(toastSpy).not.toHaveBeenCalled();
    });

    it("converts multi-line selection in a React controlled <textarea>", () => {
      const ControlledTextarea = () => {
        const [val, setVal] = useState("l;ylfu\nธ้ฟรสฟืก");
        return (
          <textarea
            aria-label="chat"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        );
      };

      const { getByLabelText } = render(<ControlledTextarea />);
      const textarea = getByLabelText("chat") as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(0, textarea.value.length);

      let outcome: ReturnType<typeof triggerInAppFixLanguage> | undefined;
      act(() => {
        outcome = triggerInAppFixLanguage();
      });
      expect(outcome).toEqual({
        status: "converted",
        originalText: "l;ylfu\nธ้ฟรสฟืก",
        convertedText: "สวัสดี\nThailand",
      });
      expect(textarea.value).toBe("สวัสดี\nThailand");
    });

    it("shows the localized select-text toast when nothing is selected in an input", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = "l;ylfu";
      document.body.appendChild(input);
      input.focus();
      input.setSelectionRange(2, 2);

      const outcome = fixLanguageInActiveElement();
      expect(outcome).toEqual({ status: "empty-selection" });
      expect(input.value).toBe("l;ylfu");
      expect(toastSpy).toHaveBeenCalledTimes(1);
    });

    it("does not mutate readOnly or disabled inputs and does not throw on non-selectable input types", () => {
      const ro = document.createElement("input");
      ro.type = "text";
      ro.value = "l;ylfu";
      ro.readOnly = true;
      document.body.appendChild(ro);
      ro.focus();
      ro.setSelectionRange(0, 6);

      expect(fixLanguageInActiveElement()).toEqual({ status: "empty-selection" });
      expect(ro.value).toBe("l;ylfu");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      document.body.appendChild(checkbox);
      checkbox.focus();
      expect(() => fixLanguageInActiveElement()).not.toThrow();
    });

    it("converts selected text inside a generic contentEditable element", () => {
      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", { value: true });
      editable.textContent = "l;ylfu";
      document.body.appendChild(editable);
      editable.focus();

      const range = document.createRange();
      range.selectNodeContents(editable.firstChild!);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);

      const outcome = fixLanguageInActiveElement();
      expect(outcome).toEqual({
        status: "converted",
        originalText: "l;ylfu",
        convertedText: "สวัสดี",
      });
      expect(editable.textContent).toBe("สวัสดี");
    });

    it("descends into same-origin iframe active inputs (e.g., PDF annotation editor)", () => {
      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);
      const innerDoc = iframe.contentDocument!;
      const innerTextarea = innerDoc.createElement("textarea");
      innerTextarea.value = "l;ylfu";
      innerDoc.body.appendChild(innerTextarea);

      iframe.focus();
      innerTextarea.focus();
      innerTextarea.setSelectionRange(0, 6);

      const outcome = fixLanguageInActiveElement(document);
      expect(outcome).toEqual({
        status: "converted",
        originalText: "l;ylfu",
        convertedText: "สวัสดี",
      });
      expect(innerTextarea.value).toBe("สวัสดี");
    });

    it("delegates to focused custom editor listeners via luno:fix-language without double-converting", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = "l;ylfu";
      document.body.appendChild(input);
      input.focus();
      input.setSelectionRange(0, 6);

      const onCustomFix = (event: Event) => {
        const detail = (event as CustomEvent<FixLanguageEventDetail>).detail;
        detail.handled = true;
      };
      window.addEventListener(FIX_LANGUAGE_EVENT, onCustomFix);
      try {
        const outcome = triggerInAppFixLanguage();
        expect(outcome).toEqual({ status: "handled-by-listener" });
        expect(input.value).toBe("l;ylfu");
      } finally {
        window.removeEventListener(FIX_LANGUAGE_EVENT, onCustomFix);
      }
    });
  });

  describe("Electron mapper parity & systemFixLanguage manager", () => {
    it("keeps electron/thaiKeyboardMapper.js in exact 1:1 parity with src/lib/thaiKeyboardMapper.ts", () => {
      expect(electronMapper.EN_TO_TH_MAP).toEqual(EN_TO_TH_MAP);
      expect(electronMapper.TH_TO_EN_MAP).toEqual(TH_TO_EN_MAP);

      const samples = [
        "l;ylfumujouj ธ้ฟรสฟืก",
        "hello world",
        "้ำสสน ไนรสก",
        "12345 !@#$% 😊",
      ];
      for (const sample of samples) {
        expect(electronMapper.swapKeyboardLayout(sample)).toBe(swapKeyboardLayout(sample));
      }
    });

    it("routes shortcut to focused Luno Note renderer without touching clipboard", async () => {
      const sendSpy = vi.fn();
      const copySpy = vi.fn();
      const registerSpy = vi.fn(() => true);
      const unregisterSpy = vi.fn();

      const manager = electronSystemFix.createSystemFixLanguageManager({
        BrowserWindow: {
          getFocusedWindow: () => ({
            isDestroyed: () => false,
            webContents: { send: sendSpy },
          }),
        },
        webContents: {
          getFocusedWebContents: () => ({
            isDestroyed: () => false,
            getType: () => "window",
          }),
        },
        globalShortcut: {
          register: registerSpy,
          unregister: unregisterSpy,
        },
        clipboard: {
          availableFormats: () => [],
          readText: () => "untouched",
          writeText: vi.fn(),
        },
        Notification: { isSupported: () => false },
        inputDriver: {
          warmUp: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
          copySelection: copySpy,
          pasteClipboard: vi.fn(),
        },
        restoreDelayMs: 0,
      });

      const status = await manager.configure({ enabled: true, backgroundHelper: false });
      expect(status.enabled).toBe(true);
      expect(status.registered).toBe(true);
      expect(status.mode).toBe("electron");
      expect(registerSpy).toHaveBeenCalledWith(
        electronSystemFix.GLOBAL_FIX_LANGUAGE_SHORTCUT,
        expect.any(Function)
      );

      await manager.handleShortcutTrigger();
      expect(sendSpy).toHaveBeenCalledWith("trigger-fix-language");
      expect(copySpy).not.toHaveBeenCalled();

      manager.dispose();
      expect(unregisterSpy).toHaveBeenCalledWith(electronSystemFix.GLOBAL_FIX_LANGUAGE_SHORTCUT);
    });

    it("executes layout swap inside focused <webview> and forwards empty-selection feedback", async () => {
      const hostSend = vi.fn();
      const webviewExec = vi.fn().mockResolvedValue("empty-selection");

      const manager = electronSystemFix.createSystemFixLanguageManager({
        BrowserWindow: {
          getFocusedWindow: () => ({
            isDestroyed: () => false,
            webContents: { send: hostSend },
          }),
        },
        webContents: {
          getFocusedWebContents: () => ({
            isDestroyed: () => false,
            getType: () => "webview",
            executeJavaScript: webviewExec,
          }),
        },
        globalShortcut: { register: () => true, unregister: vi.fn() },
        clipboard: { availableFormats: () => [], readText: () => "" },
        Notification: { isSupported: () => false },
        inputDriver: {
          warmUp: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
          copySelection: vi.fn(),
          pasteClipboard: vi.fn(),
        },
        restoreDelayMs: 0,
      });

      await manager.handleShortcutTrigger();
      expect(webviewExec).toHaveBeenCalledTimes(1);
      expect(hostSend).toHaveBeenCalledWith("fix-language-feedback", {
        status: "empty-selection",
      });
    });

    it("fixes selected text in external OS apps and restores the original clipboard", async () => {
      let clipText = "original-clipboard-item";
      const pasteSpy = vi.fn(async () => "PASTED");
      const copiedOutputs: string[] = [];

      const manager = electronSystemFix.createSystemFixLanguageManager({
        BrowserWindow: { getFocusedWindow: () => null },
        webContents: { getFocusedWebContents: () => null },
        globalShortcut: { register: () => true, unregister: vi.fn() },
        clipboard: {
          availableFormats: () => ["text/plain"],
          readText: () => clipText,
          readHTML: () => "",
          readRTF: () => "",
          writeText: (val: string) => {
            clipText = val;
            copiedOutputs.push(val);
          },
          write: (data: { text?: string }) => {
            clipText = data.text || "";
          },
          clear: () => {
            clipText = "";
          },
        },
        Notification: { isSupported: () => false },
        inputDriver: {
          warmUp: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
          copySelection: async () => {
            clipText = "l;ylfu";
            return "COPIED";
          },
          pasteClipboard: pasteSpy,
        },
        restoreDelayMs: 0,
      });

      const result = await manager.handleShortcutTrigger();
      expect(result).toEqual({
        status: "converted",
        originalText: "l;ylfu",
        convertedText: "สวัสดี",
      });
      expect(copiedOutputs).toEqual(["สวัสดี"]);
      expect(pasteSpy).toHaveBeenCalledTimes(1);
      expect(clipText).toBe("original-clipboard-item");
    });

    it("shows localized OS notification and leaves clipboard untouched when external app has no selection", async () => {
      let clipText = "keep-my-clipboard";
      const notifShowSpy = vi.fn();
      const notifCalls: Array<{ title: string; body: string; silent?: boolean }> = [];

      class MockNotification {
        static isSupported() {
          return true;
        }
        constructor(opts: { title: string; body: string; silent?: boolean }) {
          notifCalls.push(opts);
        }
        show() {
          notifShowSpy();
        }
      }

      const manager = electronSystemFix.createSystemFixLanguageManager({
        BrowserWindow: { getFocusedWindow: () => null },
        webContents: { getFocusedWebContents: () => null },
        globalShortcut: { register: () => true, unregister: vi.fn() },
        clipboard: {
          availableFormats: () => ["text/plain"],
          readText: () => clipText,
          writeText: (val: string) => {
            clipText = val;
          },
        },
        Notification: MockNotification,
        inputDriver: {
          warmUp: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
          copySelection: async () => "UNCHANGED",
          pasteClipboard: vi.fn(),
        },
        restoreDelayMs: 0,
      });

      await manager.configure({
        enabled: true,
        backgroundHelper: false,
        labels: {
          title: "ซ่อมภาษา",
          selectTextFirst: "กรุณาครอบข้อความก่อนซ่อมภาษา",
        },
      });

      const result = await manager.handleShortcutTrigger();
      expect(result).toEqual({ status: "empty-selection" });
      expect(clipText).toBe("keep-my-clipboard");
      expect(notifShowSpy).toHaveBeenCalledTimes(1);
      expect(notifCalls[0]).toMatchObject({
        title: "ซ่อมภาษา",
        body: "กรุณาครอบข้อความก่อนซ่อมภาษา",
        silent: true,
      });
    });

    it("handles Ctrl+Shift+L inside webview via before-input-event even when OS shortcut is off", async () => {
      let beforeInputHandler: ((event: { preventDefault: () => void }, input: Record<string, unknown>) => void) | null = null;
      const webviewExec = vi.fn().mockResolvedValue("converted");

      const manager = electronSystemFix.createSystemFixLanguageManager({
        BrowserWindow: { getFocusedWindow: () => null },
        webContents: { getFocusedWebContents: () => null },
        globalShortcut: { register: () => true, unregister: vi.fn() },
        clipboard: { availableFormats: () => [], readText: () => "" },
        Notification: { isSupported: () => false },
        inputDriver: {
          warmUp: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
          copySelection: vi.fn(),
          pasteClipboard: vi.fn(),
        },
      });

      manager.attachWebViewShortcut({
        on: (eventName: string, handler: typeof beforeInputHandler) => {
          if (eventName === "before-input-event") beforeInputHandler = handler;
        },
        executeJavaScript: webviewExec,
        isDestroyed: () => false,
      });

      const preventDefault = vi.fn();
      beforeInputHandler?.(
        { preventDefault },
        { type: "keyDown", control: true, shift: true, alt: false, key: "ศ", code: "KeyL" }
      );

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(webviewExec).toHaveBeenCalledTimes(1);
    });

    it("delegates Ctrl+Shift+L exclusively to native LunoFixLang.exe helper and keeps it alive on app quit", async () => {
      const registerSpy = vi.fn(() => true);
      const unregisterSpy = vi.fn();
      const startOrSyncSpy = vi.fn(async () => ({
        running: true,
        registered: true,
        autoStart: true,
      }));
      const stopAndUninstallSpy = vi.fn(async () => ({
        running: false,
        registered: false,
        autoStart: false,
      }));
      const detachSpy = vi.fn();
      const sendSpy = vi.fn();

      const manager = electronSystemFix.createSystemFixLanguageManager({
        platform: "win32",
        BrowserWindow: { getFocusedWindow: () => null },
        webContents: { getFocusedWebContents: () => null },
        globalShortcut: { register: registerSpy, unregister: unregisterSpy },
        clipboard: { availableFormats: () => [], readText: () => "" },
        Notification: { isSupported: () => false },
        helperController: {
          isSupported: () => true,
          startOrSync: startOrSyncSpy,
          stopAndUninstall: stopAndUninstallSpy,
          detachFromLunoOnQuit: detachSpy,
          queryLiveStatus: async () => ({
            supported: true,
            running: true,
            registered: true,
            autoStart: true,
          }),
        },
      });

      const status = await manager.configure({
        enabled: true,
        backgroundHelper: true,
        language: "th",
        labels: { title: "ซ่อมภาษา", selectTextFirst: "กรุณาครอบข้อความก่อนซ่อมภาษา" },
      });

      expect(status.mode).toBe("helper");
      expect(status.registered).toBe(true);
      expect(status.backgroundHelperRunning).toBe(true);
      expect(status.backgroundHelperAutoStart).toBe(true);
      // Electron must NOT claim globalShortcut while native helper owns it
      expect(registerSpy).not.toHaveBeenCalled();
      expect(startOrSyncSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          language: "th",
          installAutoStart: true,
        })
      );

      // Verify WM_LUNO_FIX_LANGUAGE hook routes helper handoff directly to renderer
      let hookedCb: (() => void) | null = null;
      manager.attachWindowMessageHook({
        isDestroyed: () => false,
        webContents: { send: sendSpy },
        hookWindowMessage: (msg: number, cb: () => void) => {
          if (msg === electronSystemFix.WM_LUNO_FIX_LANGUAGE) hookedCb = cb;
        },
      });
      expect(hookedCb).not.toBeNull();
      hookedCb?.();
      expect(sendSpy).toHaveBeenCalledWith("trigger-fix-language");

      // Quitting Luno Note detaches PID cleanly while keeping LunoFixLang.exe running
      manager.dispose();
      expect(detachSpy).toHaveBeenCalledTimes(1);
      expect(stopAndUninstallSpy).not.toHaveBeenCalled();

      // Explicitly disabling background helper stops it, removes auto-start, and falls back to Electron
      const fallbackStatus = await manager.configure({
        enabled: true,
        backgroundHelper: false,
      });
      expect(stopAndUninstallSpy).toHaveBeenCalledWith({ uninstallAutoStart: true });
      expect(registerSpy).toHaveBeenCalledWith(
        electronSystemFix.GLOBAL_FIX_LANGUAGE_SHORTCUT,
        expect.any(Function)
      );
      expect(fallbackStatus.mode).toBe("electron");
    });

    it("compiled Windows native helper LunoFixLang.exe passes selftest and matches TS mapper 1:1", () => {
      const exePath = path.resolve(__dirname, "../../electron/bin/LunoFixLang.exe");
      if (process.platform !== "win32" || !fs.existsSync(exePath)) {
        return;
      }

      const selfTestOut = execFileSync(exePath, ["--selftest"], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 5000,
      }).trim();
      expect(selfTestOut).toMatch(/^OK SIZE=(40|28)$/);

      const allKeysSample =
        Object.keys(EN_TO_TH_MAP).join("") +
        " " +
        Object.keys(TH_TO_EN_MAP).join("") +
        " l;ylfumujouj ธ้ฟรสฟืก 😊\r\n";

      const encodedIn = Buffer.from(allKeysSample, "utf8").toString("base64");
      const encodedOut = execFileSync(exePath, ["--swap-base64", encodedIn], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 5000,
      }).trim();
      const decodedOut = Buffer.from(encodedOut, "base64").toString("utf8");

      expect(decodedOut).toBe(swapKeyboardLayout(allKeysSample));
    });
  });

  it("handles keyboard event firing on window in controlled inputs seamlessly", () => {
    const TestApp = () => {
      const [text, setText] = useState("l;ylfu");
      return (
        <input
          aria-label="note-title"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (isFixLanguageShortcutEvent(e.nativeEvent)) {
              e.preventDefault();
              triggerInAppFixLanguage();
            }
          }}
        />
      );
    };

    const { getByLabelText } = render(<TestApp />);
    const input = getByLabelText("note-title") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(0, 6);
    fireEvent.keyDown(input, { ctrlKey: true, shiftKey: true, key: "L", code: "KeyL" });
    expect(input.value).toBe("สวัสดี");
  });
});
