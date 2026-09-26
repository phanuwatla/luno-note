import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TrashView from "./TrashView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import type { TrashedNote } from "@/hooks/useTrash";

describe("TrashView Component", () => {
  const lockedNote: TrashedNote = {
    id: "locked-1",
    title: "review-copy",
    fileName: "review-copy.md",
    content: "U2FsdGVkX1+encrypted",
    isLocked: true,
    isDecrypted: false,
    deletedAt: Date.now(),
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 5000,
  };

  it("renders locked content description instead of pin dots for locked items", () => {
    render(
      <AppSettingsProvider>
        <TrashView
          trashedNotes={[lockedNote]}
          onRestore={vi.fn()}
          onDeletePermanently={vi.fn()}
          onEmptyTrash={vi.fn()}
        />
      </AppSettingsProvider>
    );

    // Should display note title
    expect(screen.getByText("review-copy")).toBeInTheDocument();

    // Should NOT display 6 pin dots
    expect(screen.queryByText("••••••")).toBeNull();

    // Should display locked content description
    expect(screen.getByText(/This content is locked|เนื้อหานี้ถูกล็อกไว้/i)).toBeInTheDocument();
  });
});
