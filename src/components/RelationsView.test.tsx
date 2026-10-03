import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RelationsView from "./RelationsView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { Note } from "@/hooks/useNotes";

const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "review",
    fileName: "review.md",
    content: "Content with image: ![Diagram](attachments/diagram.png)",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "note-2",
    title: "Part 1 Asylum",
    fileName: "Part 1 Asylum.md",
    content: "Link to [[review]] and image ![[photo.jpg]]",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "note-3",
    title: "Ancient Philosophy",
    fileName: "Ancient Philosophy.md",
    content: "Connected to [[review]]",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "note-4",
    title: "Room 13",
    fileName: "Room 13.md",
    content: "Orphan note without links",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe("RelationsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders status bar with note count, image count, and links count", () => {
    render(
      <AppSettingsProvider>
        <RelationsView notes={mockNotes} />
      </AppSettingsProvider>
    );

    // 4 notes
    expect(screen.getByText(/4 โน้ต|4 notes/i)).toBeInTheDocument();
    // 2 images (diagram.png, photo.jpg)
    expect(screen.getByText(/2 รูปภาพ|2 images/i)).toBeInTheDocument();
    // Zoom 100% indicator
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("resets fit to 100% when clicking 100% button", () => {
    render(
      <AppSettingsProvider>
        <RelationsView notes={mockNotes} />
      </AppSettingsProvider>
    );

    const zoom100Button = screen.getByText("100%");
    expect(zoom100Button).toBeInTheDocument();
    fireEvent.click(zoom100Button);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("toggles image nodes visibility when clicking the image toggle button", () => {
    render(
      <AppSettingsProvider>
        <RelationsView notes={mockNotes} />
      </AppSettingsProvider>
    );

    // Initially images are shown
    expect(screen.getByText(/2 รูปภาพ|2 images/i)).toBeInTheDocument();

    // Find and click the toggle media button
    const toggleButton = screen.getByRole("button", { name: /ซ่อนไฟล์มีเดีย|ซ่อนรูปภาพ|hide media|hide images/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // After toggling off, image count badge in status bar is hidden
    expect(screen.queryByText(/2 รูปภาพ|2 images/i)).not.toBeInTheDocument();

    // Click again to show images
    fireEvent.click(toggleButton);
    expect(screen.getByText(/2 รูปภาพ|2 images/i)).toBeInTheDocument();
  });

  it("rearranges graph layout and maintains 100% zoom when clicking rearrange button", () => {
    render(
      <AppSettingsProvider>
        <RelationsView notes={mockNotes} />
      </AppSettingsProvider>
    );

    const rearrangeButton = screen.getByRole("button", { name: /จัดเรียงกราฟใหม่|rearrange graph/i });
    expect(rearrangeButton).toBeInTheDocument();

    fireEvent.click(rearrangeButton);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders status bar with video, audio, and image counts and toggles them", () => {
    const multimediaNotes: Note[] = [
      {
        id: "note-media-1",
        title: "Video & Audio Note",
        fileName: "media.md",
        content: "Here is a video: ![[attachments/sample.mp4|640]] and an audio: ![[voice.mp3]] and image: ![pic](pic.png)",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <AppSettingsProvider>
        <RelationsView notes={multimediaNotes} />
      </AppSettingsProvider>
    );

    expect(screen.getByText(/1 โน้ต|1 notes/i)).toBeInTheDocument();
    expect(screen.getByText(/1 รูปภาพ|1 images/i)).toBeInTheDocument();
    expect(screen.getByText(/1 วิดีโอ|1 videos/i)).toBeInTheDocument();
    expect(screen.getByText(/1 เสียง|1 audio/i)).toBeInTheDocument();

    // Toggle off
    const toggleButton = screen.getByRole("button", { name: /ซ่อนไฟล์มีเดีย|ซ่อนรูปภาพ|hide media|hide images/i });
    fireEvent.click(toggleButton);

    expect(screen.queryByText(/1 รูปภาพ|1 images/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 วิดีโอ|1 videos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 เสียง|1 audio/i)).not.toBeInTheDocument();
  });
});
