import { describe, it, expect } from "vitest";
import {
  calculateWorkspaceStatus,
  generateWorkspaceId,
  WorkspaceManifest,
} from "./workspaceIdentity";

describe("workspaceIdentity", () => {
  it("generates a unique workspace ID with ws_ prefix", () => {
    const id1 = generateWorkspaceId();
    const id2 = generateWorkspaceId();
    expect(id1.startsWith("ws_")).toBe(true);
    expect(id2.startsWith("ws_")).toBe(true);
    expect(id1).not.toBe(id2);
  });

  describe("calculateWorkspaceStatus", () => {
    it("returns 'cloud_only' when no local workspace manifest exists", () => {
      const status = calculateWorkspaceStatus("ws_12345", null);
      expect(status).toBe("cloud_only");
    });

    it("returns 'cloud_only' when local workspace has a different workspace ID", () => {
      const localManifest: WorkspaceManifest = {
        id: "ws_local_999",
        name: "University",
      };
      // Same name, different ID -> must be cloud_only!
      const status = calculateWorkspaceStatus("ws_cloud_111", localManifest);
      expect(status).toBe("cloud_only");
    });

    it("returns 'connected' when local and cloud have matching workspace ID and are in-sync", () => {
      const localManifest: WorkspaceManifest = {
        id: "ws_matching_123",
        name: "University",
      };
      const status = calculateWorkspaceStatus("ws_matching_123", localManifest);
      expect(status).toBe("connected");
    });

    it("returns 'differs' when matching ID has un-synced/divergent differences", () => {
      const localManifest: WorkspaceManifest = {
        id: "ws_matching_123",
        name: "University",
      };
      const status = calculateWorkspaceStatus("ws_matching_123", localManifest, {
        isDiffering: true,
      });
      expect(status).toBe("differs");
    });
  });
});
