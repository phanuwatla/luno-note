import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  DEFAULT_SETTINGS,
  sanitizeWorkspaceSettingsPayload,
  parseWorkspaceSettings,
  saveWorkspaceSettings,
  loadWorkspaceSettings,
  AppSettingsProvider,
  useAppSettings,
} from "./useAppSettings";

describe("useAppSettings - Workspace Settings Isolation", () => {
  it("sanitizeWorkspaceSettingsPayload removes userName from the workspace payload", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      userName: "phanuwatla",
      theme: "cyan" as const,
    };

    const payload = sanitizeWorkspaceSettingsPayload(settings);
    expect(payload.userName).toBeUndefined();
    expect("userName" in payload).toBe(false);
    expect(payload.theme).toBe("cyan");
  });

  it("parseWorkspaceSettings ignores userName even if present in workspace JSON file", () => {
    const rawWorkspaceJson = JSON.stringify({
      theme: "ruby",
      editorFontSize: 18,
      userName: "intruder_user_name",
    });

    const parsed = parseWorkspaceSettings(rawWorkspaceJson);
    expect(parsed).not.toBeNull();
    expect(parsed?.theme).toBe("ruby");
    expect(parsed?.editorFontSize).toBe(18);
    expect(parsed?.userName).toBeUndefined();
    expect("userName" in (parsed || {})).toBe(false);
  });

  it("saveWorkspaceSettings does not write userName into Electron .luno/settings.json", async () => {
    const writeFileContentMock = vi.fn().mockResolvedValue(true);
    (window as any).electronAPI = {
      getSavedWorkspace: vi.fn().mockResolvedValue({
        folderPath: "C:/Users/LENOVO/Documents/TestWorkspace",
      }),
      writeFileContent: writeFileContentMock,
    };

    const settingsWithUser = {
      ...DEFAULT_SETTINGS,
      userName: "my_custom_user",
    };

    await saveWorkspaceSettings(null, settingsWithUser);

    expect(writeFileContentMock).toHaveBeenCalledTimes(1);
    const callArgs = writeFileContentMock.mock.calls[0][0];
    expect(callArgs.fullPath).toBe("C:/Users/LENOVO/Documents/TestWorkspace/.luno/settings.json");

    const savedJson = JSON.parse(callArgs.content);
    expect(savedJson.userName).toBeUndefined();
    expect("userName" in savedJson).toBe(false);

    delete (window as any).electronAPI;
  });

  it("loadWorkspaceSettings strips userName when reading from Electron workspace", async () => {
    (window as any).electronAPI = {
      getSavedWorkspace: vi.fn().mockResolvedValue({
        folderPath: "C:/Users/LENOVO/Documents/TestWorkspace",
      }),
      readFileContent: vi.fn().mockResolvedValue(
        JSON.stringify({
          editorFontSize: 16,
          theme: "amber",
          userName: "should_be_omitted",
        })
      ),
    };

    const loaded = await loadWorkspaceSettings(null);
    expect(loaded).not.toBeNull();
    expect(loaded?.editorFontSize).toBe(16);
    expect(loaded?.theme).toBe("amber");
    expect(loaded?.userName).toBeUndefined();
    expect("userName" in (loaded || {})).toBe(false);

    delete (window as any).electronAPI;
  });

  it("resetSettings preserves userName and personal credentials while restoring general settings to default", () => {
    localStorage.setItem("notes-app-settings", JSON.stringify({
      theme: "amber",
      editorFontSize: 20,
      userName: "Alice In Wonderland",
      geminiApiKey: "custom-gemini-key",
      googleDriveClientId: "custom-gdrive-client",
    }));

    const { result } = renderHook(() => useAppSettings(), {
      wrapper: AppSettingsProvider,
    });

    expect(result.current.settings.userName).toBe("Alice In Wonderland");
    expect(result.current.settings.editorFontSize).toBe(20);
    expect(result.current.settings.theme).toBe("amber");

    act(() => {
      result.current.resetSettings();
    });

    // General app settings are restored to default
    expect(result.current.settings.editorFontSize).toBe(DEFAULT_SETTINGS.editorFontSize);
    expect(result.current.settings.theme).toBe(DEFAULT_SETTINGS.theme);

    // Personal identity, credentials and assets remain intact
    expect(result.current.settings.userName).toBe("Alice In Wonderland");
    expect(result.current.settings.geminiApiKey).toBe("custom-gemini-key");
    expect(result.current.settings.googleDriveClientId).toBe("custom-gdrive-client");
  });

  it("copyFolderIcons copies custom folder icons, subfolder icons, and nested file icons to the duplicated folder while keeping the source intact", () => {
    localStorage.setItem(
      "notes-app-settings",
      JSON.stringify({
        folderIcons: {
          Projects: { icon: "lucide:rocket", color: "#ff5500" },
          "Projects/Sub": { icon: "lucide:folder-code", color: "#00aa88" },
          Other: { icon: "lucide:star", color: "#ffcc00" },
        },
        fileIcons: {
          "Projects/diagram.png": { icon: "lucide:image", color: "#3366ff" },
          "Projects/Sub/data.pdf": { icon: "lucide:file-text", color: "#dd2255" },
          "Other/readme.txt": { icon: "lucide:book" },
        },
      })
    );

    const { result } = renderHook(() => useAppSettings(), {
      wrapper: AppSettingsProvider,
    });

    act(() => {
      result.current.copyFolderIcons("Projects", "Projects-copy");
    });

    // Source icons remain intact
    expect(result.current.settings.folderIcons?.["Projects"]).toEqual({
      icon: "lucide:rocket",
      color: "#ff5500",
    });
    expect(result.current.settings.folderIcons?.["Projects/Sub"]).toEqual({
      icon: "lucide:folder-code",
      color: "#00aa88",
    });
    expect(result.current.settings.fileIcons?.["Projects/diagram.png"]).toEqual({
      icon: "lucide:image",
      color: "#3366ff",
    });

    // Duplicated folder, subfolders, and files receive copied custom icons
    expect(result.current.settings.folderIcons?.["Projects-copy"]).toEqual({
      icon: "lucide:rocket",
      color: "#ff5500",
    });
    expect(result.current.settings.folderIcons?.["Projects-copy/Sub"]).toEqual({
      icon: "lucide:folder-code",
      color: "#00aa88",
    });
    expect(result.current.settings.fileIcons?.["Projects-copy/diagram.png"]).toEqual({
      icon: "lucide:image",
      color: "#3366ff",
    });
    expect(result.current.settings.fileIcons?.["Projects-copy/Sub/data.pdf"]).toEqual({
      icon: "lucide:file-text",
      color: "#dd2255",
    });

    // Unrelated folders/files are untouched
    expect(result.current.settings.folderIcons?.["Other"]).toEqual({
      icon: "lucide:star",
      color: "#ffcc00",
    });
    expect(result.current.settings.fileIcons?.["Other/readme.txt"]).toEqual({
      icon: "lucide:book",
    });
  });
});
