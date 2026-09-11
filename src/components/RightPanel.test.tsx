import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RightPanel from "./RightPanel";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Note } from "@/hooks/useNotes";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AppSettingsProvider>
      <TooltipProvider delayDuration={0}>
        {ui}
      </TooltipProvider>
    </AppSettingsProvider>
  );
}

describe("RightPanel Component - File Type Specific Info Display", () => {
  const baseMarkdownNote: Note = {
    id: "note-md",
    title: "Document Title",
    fileName: "Document.md",
    content: "This is a simple markdown document with seven words.",
    createdAt: 1724119800000,
    updatedAt: 1724120000000,
    contentFormat: "markdown",
  };

  const imageNote: Note = {
    id: "note-img",
    title: "Photo",
    fileName: "Photo.png",
    fileType: "image",
    content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    createdAt: 1724119800000,
    updatedAt: 1724120000000,
    fileSize: 2048576, // ~2 MB
  };

  const audioNote: Note = {
    id: "note-audio",
    title: "Voice Recording",
    fileName: "Voice Recording.mp3",
    fileType: "binary",
    content: "",
    createdAt: 1724119800000,
    updatedAt: 1724120000000,
    fileSize: 5242880, // ~5 MB
  };

  const codeNote: Note = {
    id: "note-code",
    title: "Script",
    fileName: "server.ts",
    content: "const port = 3000;\nconsole.log(port);\nexport default port;\n",
    createdAt: 1724119800000,
    updatedAt: 1724120000000,
    fileSize: 1024,
  };

  it("renders markdown note with word count, character count, reading time, and outline tab", () => {
    renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={baseMarkdownNote}
      />
    );

    // Section header
    expect(screen.getByText(/INFO|ข้อมูล/i)).toBeInTheDocument();

    // Outline tab is available for markdown
    expect(screen.getByText(/Outline|โครงร่าง/i)).toBeInTheDocument();

    // Text metrics should be displayed for markdown
    expect(screen.getByText(/Words|จำนวนคำ/i)).toBeInTheDocument();
    expect(screen.getByText(/Characters|จำนวนตัวอักษร/i)).toBeInTheDocument();
    expect(screen.getByText(/Reading time|เวลาอ่าน/i)).toBeInTheDocument();

    // Format and File size MUST NOT be in the INFO section
    expect(screen.queryByText(/rightPanel\.format|Format/i)).toBeNull();

    // Export dropdown is available
    expect(screen.getByText(/Export|ส่งออก/i)).toBeInTheDocument();
  });

  it("renders image note with filesize under folder in properties, dimensions in info, and no format/filesize in info", () => {
    renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={imageNote}
        imageDimensions={{ width: 1920, height: 1080 }}
        fileSize={2048576}
      />
    );

    // Text stats MUST NOT be rendered
    expect(screen.queryByText(/Words|จำนวนคำ/i)).toBeNull();
    expect(screen.queryByText(/Reading time|เวลาอ่าน/i)).toBeNull();

    // Dimensions shown in INFO
    expect(screen.getByText(/1920 × 1080 px/i)).toBeInTheDocument();

    // File size rendered exactly once (under Folder in Properties tab)
    expect(screen.getAllByText(/2.0 MB/i).length).toBe(1);

    // Outline tab and Word/PDF export MUST NOT be rendered for images
    expect(screen.queryByText(/Outline|โครงร่าง/i)).toBeNull();
    expect(screen.queryByText(/Export as PDF|ส่งออกเป็น PDF/i)).toBeNull();

    // Change icon row MUST NOT be displayed when no custom icon is set
    expect(screen.queryByText(/Change Icon|sidebar\.changeNoteIcon/i)).toBeNull();
  });

  it("renders binary/audio note with file size in properties and without text metrics or format in info", () => {
    renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={audioNote}
        fileSize={5242880}
      />
    );

    // Word count, characters, reading time MUST NOT be displayed
    expect(screen.queryByText(/Words|จำนวนคำ/i)).toBeNull();
    expect(screen.queryByText(/Characters|จำนวนตัวอักษร/i)).toBeNull();
    expect(screen.queryByText(/Reading time|เวลาอ่าน/i)).toBeNull();

    // File size should be displayed exactly once in Properties tab
    expect(screen.getAllByText(/5.0 MB/i).length).toBe(1);

    // Outline tab should not be displayed
    expect(screen.queryByText(/Outline|โครงร่าง/i)).toBeNull();
  });

  it("renders code note with line count and characters, but without reading time or words count", () => {
    renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={codeNote}
        fileSize={1024}
      />
    );

    // Lines & Characters should be displayed for code
    expect(screen.getByText(/Lines|จำนวนบรรทัด/i)).toBeInTheDocument();
    expect(screen.getByText(/Characters|จำนวนตัวอักษร/i)).toBeInTheDocument();

    // Words count & reading time should NOT be displayed for code
    expect(screen.queryByText(/Words|จำนวนคำ/i)).toBeNull();
    expect(screen.queryByText(/Reading time|เวลาอ่าน/i)).toBeNull();

    // Format should NOT be in info section
    expect(screen.queryByText(/rightPanel\.format|Format/i)).toBeNull();
  });

  it("renders file size under folder when switching to properties tab", () => {
    renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={baseMarkdownNote}
      />
    );

    // Switch to Properties tab
    const propsTab = screen.getByText(/Properties|คุณสมบัติ/i);
    fireEvent.click(propsTab);

    // File size is displayed under folder
    expect(screen.getByText(/File size|ขนาดไฟล์/i)).toBeInTheDocument();
  });

  it("hides change icon row when note has no custom icon, and shows it when note has a custom icon", () => {
    // 1. Without custom icon
    const { unmount } = renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={imageNote}
      />
    );
    expect(screen.queryByText(/Change Icon|sidebar\.changeNoteIcon/i)).toBeNull();
    unmount();

    // 2. With custom icon
    const noteWithIcon: Note = {
      ...imageNote,
      icon: "lucide:image",
    };
    renderWithProviders(
      <RightPanel
        isOpen={true}
        onClose={vi.fn()}
        note={noteWithIcon}
      />
    );
    expect(screen.getByText(/Change Icon|sidebar\.changeNoteIcon/i)).toBeInTheDocument();
  });
});
