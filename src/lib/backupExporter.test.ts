import { describe, it, expect, vi } from "vitest";
import { exportWorkspaceBackupZip } from "@/lib/backupExporter";
import type { Note } from "@/hooks/useNotes";

describe("backupExporter", () => {
  it("returns error when notes list is empty", async () => {
    const result = await exportWorkspaceBackupZip({ notes: [] });
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBe("No notes found to export");
  });

  it("exports notes with folders and metadata in browser mode", async () => {
    const mockNotes: Note[] = [
      {
        id: "note-1",
        title: "Test Note 1",
        content: "# Heading\nHello world",
        fileName: "Test Note 1.md",
        folderPath: "",
        createdAt: 1000,
        updatedAt: 2000,
      },
      {
        id: "note-2",
        title: "Nested Note",
        content: "console.log('test')",
        fileName: "Nested Note.md",
        folderPath: "Projects/Luno",
        createdAt: 3000,
        updatedAt: 4000,
      },
    ];

    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        el.click = clickSpy;
      }
      return el;
    });

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => "blob:test");
      globalThis.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(globalThis.URL, "createObjectURL").mockReturnValue("blob:test");
      vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(() => {});
    }

    const result = await exportWorkspaceBackupZip({
      notes: mockNotes,
      workspaceName: "My Workspace",
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("exports notes in Electron mode using showSaveDialog and writeFileBase64", async () => {
    const mockNotes: Note[] = [
      {
        id: "note-1",
        title: "Test Note 1",
        content: "# Heading\nHello world",
        fileName: "Test Note 1.md",
        folderPath: "",
        createdAt: 1000,
        updatedAt: 2000,
      },
    ];

    let writtenPayload: any = null;
    (window as any).electronAPI = {
      showSaveDialog: vi.fn().mockResolvedValue("C:\\test\\backup.zip"),
      writeFileBase64: vi.fn().mockImplementation((payload) => {
        writtenPayload = payload;
        return Promise.resolve(true);
      }),
    };

    const result = await exportWorkspaceBackupZip({
      notes: mockNotes,
      workspaceName: "My Workspace",
    });

    expect(result.success).toBe(true);
    expect(result.filePath).toBe("C:\\test\\backup.zip");
    expect(writtenPayload).toBeDefined();
    expect(writtenPayload.fullPath).toBe("C:\\test\\backup.zip");
    expect(writtenPayload.base64).toBeTruthy();
    expect(writtenPayload.base64.length).toBeGreaterThan(50);

    // Clean up
    delete (window as any).electronAPI;
  });
});
