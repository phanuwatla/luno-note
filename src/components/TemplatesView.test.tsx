import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TemplatesView from "./TemplatesView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";

describe("TemplatesView Component", () => {
  it("renders catalog and navigates into template preview on click", () => {
    const onCreate = vi.fn();
    const { container } = render(
      <AppSettingsProvider>
        <TemplatesView onCreateWithTemplate={onCreate} notes={[]} />
      </AppSettingsProvider>
    );

    // Initial catalog header
    expect(screen.getAllByText(/All Templates|เทมเพลตทั้งหมด/i).length).toBeGreaterThanOrEqual(1);

    // Click on a markdown template card, e.g. "Meeting Notes" or "บันทึกการประชุม"
    const meetingCard = screen.getAllByText(/Meeting Notes|บันทึกการประชุม/i)[0];
    fireEvent.click(meetingCard);

    // In-tab preview opens
    expect(screen.getByText(/Use this template|ใช้เทมเพลตนี้/i)).toBeInTheDocument();

    // Verify NoteEditorPreview rendered the markdown content in TipTap
    const editorContent = container.querySelector(".luno-reading-view");
    expect(editorContent).toBeInTheDocument();

    // Verify tag badges are rendered
    expect(screen.getByText("#meeting")).toBeInTheDocument();
  });

  it("renders plain text templates using NoteEditorPreview with TipTap", () => {
    const onCreate = vi.fn();
    const { container } = render(
      <AppSettingsProvider>
        <TemplatesView onCreateWithTemplate={onCreate} notes={[]} />
      </AppSettingsProvider>
    );

    // Switch to Text (.txt) tab or find a .txt template
    const txtFilterBtn = screen.getAllByText(/Plain Text|ข้อความธรรมดา|\.txt/i)[0];
    if (txtFilterBtn) fireEvent.click(txtFilterBtn);

    // Click on a text template card
    const txtCard = screen.getAllByText(/Quick Notes|โน้ตบันทึก|Todo List/i)[0];
    fireEvent.click(txtCard);

    // Verify NoteEditorPreview rendered with TipTap editor classes (not raw monospace div)
    const editorView = container.querySelector(".luno-reading-view");
    expect(editorView).toBeInTheDocument();
  });
});
