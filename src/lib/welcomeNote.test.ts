import { describe, it, expect } from "vitest";
import { getWelcomeNoteContent, WELCOME_NOTE_FILENAME } from "./welcomeNote";

describe("welcomeNote", () => {
  it("provides correct filename", () => {
    expect(WELCOME_NOTE_FILENAME).toBe("Welcome.md");
  });

  it("generates Thai welcome note with workspace name, lucide:BookOpen, and no emoji in code block", () => {
    const content = getWelcomeNoteContent("th", "Project Alpha");
    expect(content).toContain("# 👋 ยินดีต้อนรับสู่ Project Alpha!");
    expect(content).toContain("icon: \"lucide:BookOpen\"");
    expect(content).toContain("tags:");
    expect(content).toContain("- welcome");
    expect(content).toContain("---\n# 👋 ยินดีต้อนรับสู่ Project Alpha!\nนี่คือพื้นที่สำหรับจดบันทึก");
    expect(content).toContain("### 💡 ตัวอย่างรูปแบบการเขียน (Markdown & Interactive Features)\n* **ตัวหนา (Bold)**");
    expect(content).toContain("### ⌨️ คีย์ลัดที่มีประโยชน์\n| การทำงาน |");
    expect(content).toContain("return `Hello, ${name}! Welcome to Luno Note`;");
    expect(content).not.toContain("Welcome to Luno Note ✨");
    expect(content).toContain("- [ ]");
    expect(content).toContain("Ctrl + N");
    expect(content).toContain("Ctrl + K");
    expect(content).toContain("[[ชื่อโน้ต]]");
    expect(content).toContain("คีย์ลัดที่มีประโยชน์");
  });

  it("generates English welcome note with workspace name, lucide:BookOpen, and no emoji in code block", () => {
    const content = getWelcomeNoteContent("en", "Knowledge Base");
    expect(content).toContain("# 👋 Welcome to Knowledge Base!");
    expect(content).toContain("icon: \"lucide:BookOpen\"");
    expect(content).toContain("tags:");
    expect(content).toContain("- welcome");
    expect(content).toContain("---\n# 👋 Welcome to Knowledge Base!\nThis is your personal workspace");
    expect(content).toContain("### 💡 Formatting Showcase (Markdown & Features)\n* **Bold text**");
    expect(content).toContain("### ⌨️ Handy Shortcuts\n| Action |");
    expect(content).toContain("return `Hello, ${name}! Welcome to Luno Note`;");
    expect(content).not.toContain("Welcome to Luno Note ✨");
    expect(content).toContain("- [ ]");
    expect(content).toContain("Ctrl + N");
    expect(content).toContain("Ctrl + K");
    expect(content).toContain("[[Note Title]]");
    expect(content).toContain("Handy Shortcuts");
  });

  it("falls back to default workspace name when not provided", () => {
    const thContent = getWelcomeNoteContent("th");
    expect(thContent).toContain("# 👋 ยินดีต้อนรับสู่ Luno Note!");

    const enContent = getWelcomeNoteContent("en");
    expect(enContent).toContain("# 👋 Welcome to Luno Note!");
  });
});
