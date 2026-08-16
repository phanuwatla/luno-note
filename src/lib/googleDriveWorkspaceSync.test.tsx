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
});
