import { describe, it, expect } from "vitest";
import { getAutoFolderIconAndColor } from "./iconPacks";

describe("getAutoFolderIconAndColor", () => {
  it("matches image/images/picture folder names across icon packs", () => {
    const lucideResult = getAutoFolderIconAndColor("images", "lucide");
    expect(lucideResult).toEqual({
      icon: "lucide:Image",
      color: "#3b82f6",
    });

    const tablerResult = getAutoFolderIconAndColor("picture", "tabler");
    expect(tablerResult).toEqual({
      icon: "tabler:IconPhoto",
      color: "#3b82f6",
    });

    const phosphorResult = getAutoFolderIconAndColor("รูปภาพ", "phosphor");
    expect(phosphorResult).toEqual({
      icon: "phosphor:Image",
      color: "#3b82f6",
    });
  });

  it("matches documents and notes folders", () => {
    const docResult = getAutoFolderIconAndColor("Documents", "lucide");
    expect(docResult).toEqual({
      icon: "lucide:FileText",
      color: "#f59e0b",
    });

    const thaiDoc = getAutoFolderIconAndColor("เอกสาร", "tabler");
    expect(thaiDoc).toEqual({
      icon: "tabler:IconFileText",
      color: "#f59e0b",
    });
  });

  it("matches code and development folders", () => {
    const codeResult = getAutoFolderIconAndColor("projects", "lucide");
    expect(codeResult).toEqual({
      icon: "lucide:Code",
      color: "#6366f1",
    });

    const devResult = getAutoFolderIconAndColor("01_src", "tabler");
    expect(devResult).toEqual({
      icon: "tabler:IconCode",
      color: "#6366f1",
    });
  });

  it("matches music and audio folders", () => {
    const musicResult = getAutoFolderIconAndColor("Music", "phosphor");
    expect(musicResult).toEqual({
      icon: "phosphor:MusicNotes",
      color: "#f43f5e",
    });
  });

  it("matches video and movies folders", () => {
    const videoResult = getAutoFolderIconAndColor("videos", "lucide");
    expect(videoResult).toEqual({
      icon: "lucide:Video",
      color: "#ef4444",
    });
  });

  it("matches study, school, and learning folders", () => {
    const studyResult = getAutoFolderIconAndColor("Study", "lucide");
    expect(studyResult).toEqual({
      icon: "lucide:GraduationCap",
      color: "#a855f7",
    });
  });

  it("returns null for non-matching generic folder names", () => {
    expect(getAutoFolderIconAndColor("RandomFolder123", "lucide")).toBeNull();
    expect(getAutoFolderIconAndColor("", "lucide")).toBeNull();
  });
});
