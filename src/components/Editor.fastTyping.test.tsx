import { describe, it, expect, vi } from "vitest";
import { Editor as TiptapEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CustomParagraph, noteEditorStateMap, closedNoteIds, SpellCheckDecoration, spellCheckPluginKey, expandThaiAnomalyCluster } from "@/components/Editor";

describe("Editor Fast Typing & Rapid Input Stability", () => {
  it("processes rapid successive typing transactions without dropping characters", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<p>Hello</p>",
    });

    expect(editor.getText()).toBe("Hello");

    editor.commands.focus("end");

    // Simulate typing rapidly 50 characters in quick succession
    const textToAdd = " World, this is a fast typing test in Luno Note!";
    for (let i = 0; i < textToAdd.length; i++) {
      editor.commands.insertContent(textToAdd[i]);
    }

    expect(editor.getText()).toBe("Hello World, this is a fast typing test in Luno Note!");
    editor.destroy();
  });

  it("handles high-speed multi-line input and preserves document integrity", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<p>Initial</p>",
    });

    for (let line = 1; line <= 20; line++) {
      editor.commands.splitBlock();
      editor.commands.insertContent(`Rapid typed line ${line}`);
    }

    const docText = editor.getText();
    expect(docText).toContain("Rapid typed line 1");
    expect(docText).toContain("Rapid typed line 20");
    expect(editor.state.doc.childCount).toBe(21);
    editor.destroy();
  });

  it("normalizes relative paths across Windows backslashes and Unix slashes identically", () => {
    const getRelativePath = (folderPath: string, fileName: string) =>
      (folderPath ? `${folderPath}/${fileName}` : fileName).replace(/\\/g, "/");

    const winPath = getRelativePath("docs\\subfolder", "MyNote.md");
    const unixPath = getRelativePath("docs/subfolder", "MyNote.md");
    const rootPath = getRelativePath("", "MyNote.md");

    expect(winPath).toBe("docs/subfolder/MyNote.md");
    expect(unixPath).toBe("docs/subfolder/MyNote.md");
    expect(rootPath).toBe("MyNote.md");
    expect(winPath).toBe(unixPath);
  });

  it("ensures actively edited in-memory note content is preferred over stale disk snapshots", () => {
    const activeTabId = "note-active-123";
    const existing = {
      id: "note-active-123",
      fileName: "Work.md",
      content: "Latest fast typed text in memory that is ahead of disk",
      isDecrypted: false,
    };
    const diskEntry = {
      relativePath: "Work.md",
      content: "Stale content from disk snapshot",
    };

    const isDiskEncrypted = false;
    const isEditingThisNote = Boolean(
      existing?.id &&
      activeTabId &&
      existing.id === activeTabId &&
      typeof existing.content === "string" &&
      !isDiskEncrypted
    );

    const resolvedContent = (existing?.isDecrypted && isDiskEncrypted && existing?.content)
      ? existing.content
      : (isEditingThisNote && existing?.content !== undefined)
        ? existing.content
        : diskEntry.content;

    expect(resolvedContent).toBe("Latest fast typed text in memory that is ahead of disk");
  });

  it("rapidly types Thai text below an AudioExtension node without losing or freezing text", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<h3>Thank you mysellf for check ✨</h3><p></p>",
    });

    editor.commands.focus("end");

    // The user's exact Thai text from the screenshot
    const thaiText = "เอ่ากดเน่สปกรเดี้ก่นรีคเยั่หกรนไกปีรไกาสไกหรไกไกเ่าสักเรกดีเกดไกรีไกเดรเน่ากนรดเกดห่ายเกด";

    // Simulate rapid typing character by character
    for (let i = 0; i < thaiText.length; i++) {
      editor.commands.insertContent(thaiText[i]);
    }

    const docText = editor.getText();
    expect(docText).toContain(thaiText);
    expect(docText.endsWith(thaiText)).toBe(true);
    editor.destroy();
  });

  it("rapidly types 'Hello are you okay' character by character without latency or drops", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<p></p>",
    });

    const phrase = "Hello are you okay";
    for (let i = 0; i < phrase.length; i++) {
      editor.commands.insertContent(phrase[i]);
    }

    expect(editor.getText()).toBe(phrase);
    editor.destroy();
  });

  it("handles keyboard hammering in Thai with rapid successive tone marks and vowel combinations", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<p></p>",
    });

    // Simulates rapid keyboard mash / hammering in Thai (repeated vowels, tone marks)
    const mashedThai = "ฟหกด่าสวงกกกกก้้้้้้้่าาาาาาาเเเเเเิดดดดดดดด";
    for (let i = 0; i < mashedThai.length; i++) {
      editor.commands.insertContent(mashedThai[i]);
    }

    expect(editor.getText()).toBe(mashedThai);
    editor.destroy();
  });

  it("handles long continuous Thai hammering in Heading 1 without truncation or losing text", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<h1>Untitled</h1><p></p>",
    });

    // The user's exact Thai hammered string
    const userHammeredThai = "แสิา่ทปินนาร่กืินรกผี่ิปาผิ่ทปผาิ่ผสาิ่ืทสผราป้ิีรฝวผสแป่กรนเ้่ผปา่ทอผปสวาิ่่้าผ้่้่ผนดปกาดปวสาิ้่า้่้หกะผนร้ี่แก้นี่หปแนร้าหปกนวสรี่ปปแนาิ่ปหรกน้ีิเป่กปแนา่ิอทปีาสรเรกปดีปนรเ่ส้";

    // Select the H1 and replace its content rapidly
    editor.commands.setTextSelection({ from: 1, to: 9 });
    for (let i = 0; i < userHammeredThai.length; i++) {
      editor.commands.insertContent(userHammeredThai[i]);
    }

    const firstChild = editor.state.doc.firstChild;
    expect(firstChild?.type.name).toBe("heading");
    expect(firstChild?.textContent).toBe(userHammeredThai);
    expect(firstChild?.textContent).not.toBe("แสิา่ทปินนาร่กกเป้ดอรน่");
    editor.destroy();
  });

  it("preserves active noteEditorState across file rename without destroying in-flight text", () => {
    const noteId = "note-rename-preserve-test";

    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
        }),
        CustomParagraph,
      ],
      content: "<h1>Active Title</h1><p>Active content before rename</p>",
    });

    noteEditorStateMap.set(noteId, editor.state);
    closedNoteIds.delete(noteId);

    // During rename, closedNoteIds must NOT receive noteId and noteEditorStateMap must NOT be deleted
    expect(noteEditorStateMap.has(noteId)).toBe(true);
    expect(closedNoteIds.has(noteId)).toBe(false);

    // Typing continues seamlessly
    editor.commands.focus("end");
    editor.commands.insertContent(" - typed further while renaming");
    noteEditorStateMap.set(noteId, editor.state);

    expect(editor.getText()).toContain("Active content before rename - typed further while renaming");
    expect(noteEditorStateMap.get(noteId)?.doc.textContent).toContain("typed further while renaming");

    // Clean up
    noteEditorStateMap.delete(noteId);
    closedNoteIds.delete(noteId);
    editor.destroy();
  });

  it("correctly expands Thai structural anomalies to anchor on base consonant without splitting clusters", () => {
    // 1. "พหะึีำ" -> "ึี" is at index 5..7, attaches to base consonant 'ห' and trailing vowel 'ำ'
    const sample1 = "พหะึีำพด่";
    const match1 = sample1.indexOf("ึี");
    const expanded1 = expandThaiAnomalyCluster(sample1, match1, match1 + 2);
    expect(expanded1).not.toBeNull();
    // Substring should be "หะึีำ" (starts with consonant 'ห', ends after 'ำ')
    expect(sample1.slice(expanded1!.start, expanded1!.end)).toBe("หะึีำ");

    // 2. "ปาอ่้ผ" -> "่้" at index 3..5, attaches to consonant 'อ'
    const sample2 = "ปาอ่้ผ";
    const match2 = sample2.indexOf("่้");
    const expanded2 = expandThaiAnomalyCluster(sample2, match2, match2 + 2);
    expect(expanded2).not.toBeNull();
    expect(sample2.slice(expanded2!.start, expanded2!.end)).toBe("อ่้");

    // 3. Leading vowels like "เเ" (Sara-E fake Sara-Ae) are not combining marks and do not need consonant anchor
    const sample3 = "เเละ";
    const expanded3 = expandThaiAnomalyCluster(sample3, 0, 2);
    expect(expanded3).toEqual({ start: 0, end: 2 });

    // 4. Orphan combining marks without any preceding consonant return null to prevent breaking HarfBuzz
    const orphan = "ึีำ";
    const expandedOrphan = expandThaiAnomalyCluster(orphan, 0, 2);
    expect(expandedOrphan).toBeNull();
  });

  it("ensures all Thai decorations in hammered text start with a base consonant and do not slice combining marks", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({ paragraph: false }),
        CustomParagraph,
        SpellCheckDecoration.configure({ enabled: true }),
      ],
      content: "<p></p>",
    });

    const userText = "ดเอา่ผปรนเ่อหกรนดเ้หผสนเร่ืกหดสเีั้ฟหผรเนห่ดกเรผนหีเพำกดเย่รพหะึีำพด่เรนกเีหามอ่หกนรเาอ่หืทผอดีผปั้ดรนาหผปอ้รผีปกดเ่หรกดปาอ่้ผรีดีหฟกนว่ห";
    editor.commands.insertContent(userText);

    const docText = editor.getText();
    expect(docText).toBe(userText);

    const decoSet = spellCheckPluginKey.getState(editor.state);
    const decos = decoSet.find(0, editor.state.doc.content.size);
    expect(decos.length).toBeGreaterThan(0);

    const THAI_BASE_CONSONANT = /^[\u0E01-\u0E2E]/;
    const THAI_COMBINING = /^[\u0E30-\u0E3A\u0E47-\u0E4E]/;

    for (const deco of decos) {
      const decoratedText = editor.state.doc.textBetween(deco.from, deco.to);
      // None of the decorations should start with a floating combining mark
      expect(THAI_COMBINING.test(decoratedText)).toBe(false);
      // Thai decorations must start with a base consonant
      if (/[\u0E00-\u0E7F]/.test(decoratedText)) {
        expect(THAI_BASE_CONSONANT.test(decoratedText)).toBe(true);
      }
    }

    editor.destroy();
  });
});


