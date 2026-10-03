import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Editor from "./Editor";
import { toast } from "@/hooks/use-toast";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({
    toast: (...args: unknown[]) => mockToast(...args),
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

const mockNote: Note = {
  id: "test-note-ai",
  title: "Test Note",
  content: "Hello world for AI test",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  fileName: "test.md",
  contentFormat: "markdown",
};

describe("Editor AI when Gemini API Key is missing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined" && typeof localStorage.clear === "function") {
      localStorage.clear();
    }
  });

  it("navigates to Settings > Luno AI and shows toast when clicking AI Assistant button in toolbar without API key", async () => {
    const onOpenSettings = vi.fn();
    const eventSpy = vi.fn();
    window.addEventListener("luno:open-settings", eventSpy);

    render(
      <AppSettingsProvider>
        <Editor
          note={mockNote}
          notes={[mockNote]}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
          onOpenSidebar={vi.fn()}
          onOpenSettings={onOpenSettings}
        />
      </AppSettingsProvider>
    );

    // Find AI Assistant toolbar button (has aria-label or accessible text "Luno AI")
    const aiButton = await screen.findByRole("button", { name: /Luno AI/i });
    expect(aiButton).toBeInTheDocument();

    fireEvent.click(aiButton);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/Gemini API Key|จำเป็นต้องมี/i),
      })
    );
    expect(onOpenSettings).toHaveBeenCalledWith("ai");

    window.removeEventListener("luno:open-settings", eventSpy);
  });
});
