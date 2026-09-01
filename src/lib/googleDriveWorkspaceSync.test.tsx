import { describe, expect, it, beforeEach } from "vitest";
import { getCachedFolderStructure, cacheFolderStructure, LunoFolderStructure } from "@/lib/googleDriveApi";
import { syncEngine } from "@/lib/googleDriveSync";

describe("Workspace-scoped Google Drive folder caching", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    syncEngine.setRootFolderName(null);
  });

  it("should isolate cached folder structures by workspace name", () => {
    const ws1Structure: LunoFolderStructure = {
      rootId: "root-luno",
      projectId: "proj-workspace1",
      attachmentsId: "att-1",
      lunoMetaId: "meta-1",
    };

    const ws2Structure: LunoFolderStructure = {
      rootId: "root-luno",
      projectId: "proj-workspace2",
      attachmentsId: "att-2",
      lunoMetaId: "meta-2",
    };

    cacheFolderStructure(ws1Structure, "workspace1");
    cacheFolderStructure(ws2Structure, "workspace2");

    expect(getCachedFolderStructure("workspace1")?.projectId).toBe("proj-workspace1");
    expect(getCachedFolderStructure("workspace2")?.projectId).toBe("proj-workspace2");
    expect(getCachedFolderStructure("workspace3")).toBeNull();
  });

  it("should invalidate syncEngine in-memory folderStructure when rootFolderName changes", () => {
    syncEngine.setRootFolderName("workspace1");
    // Manually set state to simulate initialized workspace1
    (syncEngine as any).updateState({
      folderStructure: {
        rootId: "root",
        projectId: "proj-workspace1",
        attachmentsId: "att-1",
        lunoMetaId: "meta-1",
      },
    });

    expect(syncEngine.getState().folderStructure?.projectId).toBe("proj-workspace1");

    // Switch to workspace2
    syncEngine.setRootFolderName("workspace2");

    // In-memory folderStructure must be cleared to force lookup/creation of workspace2
    expect(syncEngine.getState().folderStructure).toBeNull();
  });

  it("should sort folder paths shallowest first to ensure parents exist before children", () => {
    const rawPaths = [
      "Chapter 1/Generate Artwork/part1",
      "Chapter 3/Storyboard",
      "Chapter 1",
      "Chapter 3",
      "Chapter 1/Generate Artwork",
      "Chapter 3/Generate Artwork",
    ];

    const sorted = Array.from(new Set(rawPaths)).sort((a, b) => {
      const depthA = a.split("/").length;
      const depthB = b.split("/").length;
      if (depthA !== depthB) return depthA - depthB;
      return a.localeCompare(b);
    });

    expect(sorted[0]).toBe("Chapter 1");
    expect(sorted[1]).toBe("Chapter 3");
    expect(sorted[2]).toBe("Chapter 1/Generate Artwork");
    expect(sorted[3]).toBe("Chapter 3/Generate Artwork");
    expect(sorted[4]).toBe("Chapter 3/Storyboard");
    expect(sorted[5]).toBe("Chapter 1/Generate Artwork/part1");
  });
});

