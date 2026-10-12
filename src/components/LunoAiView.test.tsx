import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LunoAiView, {
  WorkspaceFolderTree,
  WorkspaceNoteIcon,
  WorkspaceFolderIcon,
  AttachedFileChipIcon,
  getSessionLastModified,
  type ChatSession,
} from "./LunoAiView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Note } from "@/hooks/useNotes";

describe("LunoAiView Workspace Note and Folder Icons", () => {
  const storageMap = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => { storageMap.set(key, String(value)); },
    removeItem: (key: string) => { storageMap.delete(key); },
    clear: () => { storageMap.clear(); },
    key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
    get length() { return storageMap.size; },
  };

  beforeEach(() => {
    storageMap.clear();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  it("renders custom note emoji icon in WorkspaceNoteIcon", () => {
    const note: Note = {
      id: "note-1",
      title: "Review",
      fileName: "review.md",
      content: "",
      icon: "🚀",
      iconColor: "#ef4444",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceNoteIcon note={note} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("renders custom file icon from settings.fileIcons in WorkspaceNoteIcon", () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({
        fileIcons: {
          "sample.mp3": { icon: "🎵", color: "#3b82f6" },
        },
      })
    );

    const note: Note = {
      id: "note-audio",
      title: "Audio",
      fileName: "sample.mp3",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceNoteIcon note={note} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("renders custom folder icon from settings.folderIcons in WorkspaceFolderIcon", () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({
        folderIcons: {
          "Chapter 1": { icon: "🎨", color: "#f59e0b" },
        },
      })
    );

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderIcon path="Chapter 1" isOpen={false} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🎨")).toBeInTheDocument();
  });

  it("renders custom note and folder icons inside WorkspaceFolderTree", () => {
    storageMap.set(
      "notes-app-settings",
      JSON.stringify({
        folderIcons: {
          "Chapter 1": { icon: "📁✨", color: "#10b981" },
        },
      })
    );

    const testNotes: Note[] = [
      {
        id: "n1",
        title: "My Note",
        fileName: "review.md",
        content: "",
        icon: "📝⭐",
        folderPath: "Chapter 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "n2",
        title: "Audio File",
        fileName: "Sample MP3 audio files.mp3",
        content: "",
        folderPath: "Chapter 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Custom folder icon
    expect(screen.getByText("📁✨")).toBeInTheDocument();
    // Folder name
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();

    // Click folder to expand
    fireEvent.click(screen.getByText("Chapter 1"));

    // Custom note icon
    expect(screen.getByText("📝⭐")).toBeInTheDocument();
    // Note filename
    expect(screen.getByText("review.md")).toBeInTheDocument();
  });

  it("remembers expanded/collapsed folder state in localStorage across modal re-renders", () => {
    const testNotes: Note[] = [
      {
        id: "n1",
        title: "Test Note",
        fileName: "notes.md",
        content: "",
        folderPath: "Docs",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    // First render: Docs is collapsed by default
    const { unmount } = render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            openedFolderName="workspace-a"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.queryByText("notes.md")).not.toBeInTheDocument();

    // Click Docs to expand
    fireEvent.click(screen.getByText("Docs"));
    expect(screen.getByText("notes.md")).toBeInTheDocument();

    // Verify localStorage has saved the open folder
    const saved = JSON.parse(storageMap.get("luno_open_folders_workspace-a") || "[]");
    expect(saved).toContain("Docs");

    // Close / unmount modal (simulating closing dialog)
    unmount();

    // Reopen modal: Should restore open folder state from localStorage
    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            openedFolderName="workspace-a"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // It should already be expanded!
    expect(screen.getByText("notes.md")).toBeInTheDocument();

    // Click Docs again to collapse
    fireEvent.click(screen.getByText("Docs"));
    expect(screen.queryByText("notes.md")).not.toBeInTheDocument();

    // Verify collapsed state is saved
    const savedAfterCollapse = JSON.parse(storageMap.get("luno_open_folders_workspace-a") || "[]");
    expect(savedAfterCollapse).not.toContain("Docs");
  });

  it("syncs open folders when luno:open-folders-changed event is fired", () => {
    const testNotes: Note[] = [
      {
        id: "n1",
        title: "Sync Note",
        fileName: "sync.md",
        content: "",
        folderPath: "Projects",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <WorkspaceFolderTree
            notes={testNotes}
            actionType="attach"
            openedFolderName="workspace-sync"
            onSelectNote={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.queryByText("sync.md")).not.toBeInTheDocument();

    // Dispatch external folder change event (e.g. from Sidebar)
    act(() => {
      window.dispatchEvent(
        new CustomEvent("luno:open-folders-changed", {
          detail: {
            workspace: "workspace-sync",
            openFolders: ["__opened_root__", "Projects"],
          },
        })
      );
    });

    expect(screen.getByText("sync.md")).toBeInTheDocument();
  });

  it("renders custom note icon inside AttachedFileChipIcon", () => {
    const testNotes: Note[] = [
      {
        id: "n1",
        title: "Attached Note",
        fileName: "attached.md",
        content: "",
        icon: "🔥",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <AttachedFileChipIcon fileName="attached.md" notes={testNotes} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    expect(screen.getByText("🔥")).toBeInTheDocument();
  });

  it("does not render attached file names in the top header bar when files are uploaded", async () => {
    const originalFileReader = window.FileReader;
    class MockFileReader {
      onload: ((event: any) => void) | null = null;
      readAsText(_file: any) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: "dummy content" } });
          }
        }, 0);
      }
      readAsDataURL(_file: any) {}
    }
    (window as any).FileReader = MockFileReader;

    try {
      const { container } = render(
        <TooltipProvider>
          <AppSettingsProvider>
            <LunoAiView isSidebar={false} />
          </AppSettingsProvider>
        </TooltipProvider>
      );

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      const testFile = new File(["dummy content"], "my-attached-doc.pdf", { type: "text/plain" });
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [testFile] } });
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // The attached file chip should be visible in the prompt input area
      expect(await screen.findByText("my-attached-doc.pdf")).toBeInTheDocument();

      // Top header bar should NOT contain the attached file name
      const topHeader = container.querySelector(".h-11.shrink-0.px-4.bg-background");
      expect(topHeader).not.toBeNull();
      expect(topHeader?.textContent).not.toContain("my-attached-doc.pdf");
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it("renders markdown and code blocks consistent with Editor, and supports copying code block", async () => {
    let clipboardText = "";
    Object.assign(navigator, {
      clipboard: {
        writeText: async (t: string) => {
          clipboardText = t;
        },
      },
    });

    const sessionId = "session-test-md";
    storageMap.set(
      "luno-ai-chat-sessions-v2",
      JSON.stringify([
        {
          id: sessionId,
          title: "Markdown Test",
          createdAt: Date.now(),
          messages: [
            {
              id: "msg-ai-1",
              role: "assistant",
              content:
                "## Calculation\n```javascript\nconst result = 42;\n```\n- [ ] Task to do\n| Header A | Header B |\n| --- | --- |\n| 1 | 2 |",
              timestamp: Date.now(),
            },
          ],
        },
      ])
    );
    storageMap.set("luno-ai-last-active-session-id", sessionId);

    const { container } = render(
      <TooltipProvider>
        <AppSettingsProvider>
          <LunoAiView isSidebar={false} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Verify code block wrapper and header
    const codeWrapper = container.querySelector(".code-block-wrapper");
    expect(codeWrapper).not.toBeNull();

    const codeHeader = container.querySelector(".code-block-header");
    expect(codeHeader).not.toBeNull();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    // Verify syntax highlighting
    const keyword = container.querySelector(".hljs-keyword");
    expect(keyword).not.toBeNull();
    expect(keyword?.textContent).toBe("const");

    // Verify tableWrapper structure
    const tableWrapper = container.querySelector(".tableWrapper");
    expect(tableWrapper).not.toBeNull();

    // Verify task item structure
    const taskItem = container.querySelector('[data-type="taskItem"]');
    expect(taskItem).not.toBeNull();

    // Test clicking copy-code button
    const copyCodeBtn = container.querySelector('[data-copy-code="true"]') as HTMLButtonElement;
    expect(copyCodeBtn).not.toBeNull();

    fireEvent.click(copyCodeBtn);
    expect(clipboardText).toBe("const result = 42;");
  });

  it("copies user message and AI response to clipboard when copy button is clicked", async () => {
    let clipboardText = "";
    Object.assign(navigator, {
      clipboard: {
        writeText: async (t: string) => {
          clipboardText = t;
        },
      },
    });

    const sessionId = "session-test-copy";
    storageMap.set(
      "luno-ai-chat-sessions-v2",
      JSON.stringify([
        {
          id: sessionId,
          title: "Copy Test Chat",
          createdAt: 1000,
          messages: [
            {
              id: "msg-user-1",
              role: "user",
              content: "Hello from user!",
              timestamp: 1000,
            },
            {
              id: "msg-assistant-1",
              role: "assistant",
              content: "Hello from assistant!",
              timestamp: 1010,
            },
          ],
        },
      ])
    );
    storageMap.set("luno-ai-last-active-session-id", sessionId);

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <LunoAiView isSidebar={false} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // 1. User message copy button
    const userCopyBtn = screen.getByRole("button", { name: /copy message|คัดลอกข้อความ/i });
    expect(userCopyBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(userCopyBtn);
    });
    expect(clipboardText).toBe("Hello from user!");

    // 2. AI response copy button
    const assistantCopyBtn = screen.getByRole("button", { name: /copy response|คัดลอกคำตอบ/i });
    expect(assistantCopyBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(assistantCopyBtn);
    });
    expect(clipboardText).toBe("Hello from assistant!");
  });

  it("orders chat history sessions descending by last modified date (updatedAt or latest message)", () => {
    // Session 1: Old creation (1000), but updated recently (5000)
    // Session 2: Created at 3000, no updatedAt, last message at 3500
    // Session 3: Created at 2000, no messages, no updatedAt
    const s1: ChatSession = {
      id: "s1",
      title: "Chat 1 - Recently Edited",
      createdAt: 1000,
      updatedAt: 5000,
      messages: [{ id: "m1", role: "user", content: "Hi", timestamp: 1000 }],
    };
    const s2: ChatSession = {
      id: "s2",
      title: "Chat 2 - Mid Activity",
      createdAt: 3000,
      messages: [{ id: "m2", role: "user", content: "Mid", timestamp: 3500 }],
    };
    const s3: ChatSession = {
      id: "s3",
      title: "Chat 3 - Oldest",
      createdAt: 2000,
      messages: [],
    };

    // Stored in arbitrary order
    storageMap.set("luno-ai-chat-sessions-v2", JSON.stringify([s3, s1, s2]));
    // Open history panel by default
    storageMap.set("luno-ai-history-panel-open", "true");

    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <LunoAiView isSidebar={false} />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // Check sessions rendered in right panel
    const sessionTitles = screen.getAllByText(/Chat \d -/i);
    expect(sessionTitles.length).toBe(3);
    // Ordered descending by last modified: s1 (5000) -> s2 (3500) -> s3 (2000)
    expect(sessionTitles[0]).toHaveTextContent("Chat 1 - Recently Edited");
    expect(sessionTitles[1]).toHaveTextContent("Chat 2 - Mid Activity");
    expect(sessionTitles[2]).toHaveTextContent("Chat 3 - Oldest");
  });

  it("computes getSessionLastModified correctly for all session variations", () => {
    expect(getSessionLastModified({
      id: "100",
      title: "With updatedAt",
      createdAt: 200,
      updatedAt: 500,
      messages: [],
    })).toBe(500);

    expect(getSessionLastModified({
      id: "100",
      title: "With message timestamp",
      createdAt: 200,
      messages: [
        { id: "m1", role: "user", content: "first", timestamp: 300 },
        { id: "m2", role: "assistant", content: "second", timestamp: 450 },
      ],
    })).toBe(450);

    expect(getSessionLastModified({
      id: "100",
      title: "Only createdAt",
      createdAt: 250,
      messages: [],
    })).toBe(250);

    expect(getSessionLastModified({
      id: "999",
      title: "Only numeric id",
      createdAt: 0,
      messages: [],
    })).toBe(999);
  });
});

