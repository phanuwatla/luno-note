import { describe, it, expect, vi } from "vitest";
import { saveWorkspaceFavorites, loadWorkspaceFavorites } from "./workspaceFavorites";

describe("workspaceFavorites utility", () => {
  it("saves and loads favorites in Electron environment via .luno/favorites.json", async () => {
    let savedPath = "";
    let savedContent = "";

    (window as any).electronAPI = {
      getSavedWorkspace: vi.fn().mockResolvedValue({ folderPath: "E:/my-workspace" }),
      writeFileContent: vi.fn().mockImplementation(async ({ fullPath, content }) => {
        savedPath = fullPath;
        savedContent = content;
        return true;
      }),
      readFileContent: vi.fn().mockImplementation(async (fullPath) => {
        if (fullPath === savedPath) return savedContent;
        return null;
      }),
    };

    const favPaths = ["images/diagram.png", "notes/todo.txt", "data.json"];
    await saveWorkspaceFavorites(null, favPaths);

    expect(savedPath).toBe("E:/my-workspace/.luno/favorites.json");
    expect(JSON.parse(savedContent).favorites).toEqual(["data.json", "images/diagram.png", "notes/todo.txt"]);

    const loaded = await loadWorkspaceFavorites(null);
    expect(loaded).toEqual(["data.json", "images/diagram.png", "notes/todo.txt"]);

    delete (window as any).electronAPI;
  });

  it("handles non-existent .luno/favorites.json gracefully returning empty array", async () => {
    (window as any).electronAPI = {
      getSavedWorkspace: vi.fn().mockResolvedValue({ folderPath: "E:/empty-workspace" }),
      readFileContent: vi.fn().mockResolvedValue(null),
    };

    const loaded = await loadWorkspaceFavorites(null);
    expect(loaded).toEqual([]);

    delete (window as any).electronAPI;
  });
});
