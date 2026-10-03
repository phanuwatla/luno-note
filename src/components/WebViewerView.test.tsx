import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WebViewerView from "./WebViewerView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";
import * as toastHook from "@/hooks/use-toast";

describe("WebViewerView Insert Link Functionality", () => {
  const note1: Note = {
    id: "note-1",
    title: "My Note 1",
    fileName: "My Note 1.md",
    content: "Content 1",
    createdAt: 1000,
    updatedAt: 1000,
  };

  const note2: Note = {
    id: "note-2",
    title: "Project Plan",
    fileName: "Project Plan.md",
    content: "Content 2",
    createdAt: 2000,
    updatedAt: 2000,
  };

  it("shows alert toast when no active notes are open", () => {
    const toastSpy = vi.spyOn(toastHook, "toast");
    const onInsertMock = vi.fn();

    render(
      <AppSettingsProvider>
        <WebViewerView
          initialUrl="https://example.com"
          title="Example Page"
          onInsertToActiveNote={onInsertMock}
          activeNotes={[]}
        />
      </AppSettingsProvider>
    );

    const insertBtn = screen.getByRole("button", { name: /Insert link to active note|แทรกลิงก์ลงในโน้ตปัจจุบัน/i });
    fireEvent.click(insertBtn);

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
      })
    );
    expect(onInsertMock).not.toHaveBeenCalled();
    toastSpy.mockRestore();
  });

  it("inserts directly into the active note when exactly 1 active note is open", () => {
    const onInsertMock = vi.fn();

    render(
      <AppSettingsProvider>
        <WebViewerView
          initialUrl="https://example.com"
          title="Example Page"
          onInsertToActiveNote={onInsertMock}
          activeNotes={[note1]}
        />
      </AppSettingsProvider>
    );

    const insertBtn = screen.getByRole("button", { name: /Insert link to active note|แทรกลิงก์ลงในโน้ตปัจจุบัน/i });
    fireEvent.click(insertBtn);

    expect(onInsertMock).toHaveBeenCalledTimes(1);
    expect(onInsertMock).toHaveBeenCalledWith("https://example.com", "Example Page", "note-1");
  });

  it("shows dropdown menu with active note names and file icons when more than 1 active note is open", () => {
    const onInsertMock = vi.fn();

    render(
      <AppSettingsProvider>
        <WebViewerView
          initialUrl="https://example.com"
          title="Example Page"
          onInsertToActiveNote={onInsertMock}
          activeNotes={[note1, note2]}
        />
      </AppSettingsProvider>
    );

    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();

    const insertBtn = screen.getByRole("button", { name: /Insert link to active note|แทรกลิงก์ลงในโน้ตปัจจุบัน/i });
    fireEvent.keyDown(insertBtn, { key: "Enter", code: "Enter" });

    // Dropdown menu items should appear
    expect(screen.getByText("My Note 1.md")).toBeInTheDocument();
    expect(screen.getByText("Project Plan.md")).toBeInTheDocument();

    // Clicking an item from dropdown calls onInsertToActiveNote with that note's id
    fireEvent.click(screen.getByText("Project Plan.md"));
    expect(onInsertMock).toHaveBeenCalledWith("https://example.com", "Example Page", "note-2");
  });

  it("toggles browser right panel when three-dots menu button is clicked and shows browser tools", async () => {
    render(
      <AppSettingsProvider>
        <WebViewerView
          initialUrl="https://example.com"
          title="Example Page"
          activeNotes={[]}
        />
      </AppSettingsProvider>
    );

    const menuBtn = screen.getByRole("button", { name: /More|เพิ่มเติม/i });
    expect(menuBtn).toBeInTheDocument();

    // Initially panel is not open
    expect(screen.queryByRole("button", { name: /History|ประวัติ/i })).not.toBeInTheDocument();

    // Click three-dots button to open right panel
    fireEvent.click(menuBtn);

    // Panel tabs should be visible
    expect(screen.getByRole("button", { name: /History|ประวัติ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bookmarks|บุ๊กมาร์ก/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Privacy|ความเป็นส่วนตัว/i })).toBeInTheDocument();

    // Switch to Privacy tab
    const privacyTab = screen.getByRole("button", { name: /Privacy|ความเป็นส่วนตัว/i });
    fireEvent.click(privacyTab);

    expect(screen.getAllByText(/Clear Cookies|ล้างคุกกี้/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Clear Cache|ล้างแคช/i).length).toBeGreaterThan(0);

    // Switch to Bookmarks tab
    const bookmarksTab = screen.getByRole("button", { name: /Bookmarks|บุ๊กมาร์ก/i });
    fireEvent.click(bookmarksTab);
    expect(screen.getAllByText(/Bookmark This Page|บุ๊กมาร์กหน้านี้/i).length).toBeGreaterThan(0);

    // Close panel
    const closeBtn = screen.getByRole("button", { name: /Close panel|ปิด/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Close panel|ปิด/i })).not.toBeInTheDocument();
    });
  });
});

