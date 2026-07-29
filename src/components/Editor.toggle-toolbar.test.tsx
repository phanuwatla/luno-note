import { describe, expect, it, vi } from "vitest";
import { getToggleButtonMode, handleToggleClick } from "@/components/Editor";

describe("toggle toolbar mode selection", () => {
  it("uses wrap mode when selection is not empty", () => {
    expect(getToggleButtonMode({ empty: false })).toBe("wrap");
  });

  it("uses insert mode when the cursor is collapsed", () => {
    expect(getToggleButtonMode({ empty: true })).toBe("insert");
  });

  it("inserts toggle with selected text as title when text is selected", () => {
    const runMock = vi.fn();
    const insertContentMock = vi.fn().mockReturnValue({ run: runMock });
    const focusMock = vi.fn().mockReturnValue({ insertContent: insertContentMock });
    const chainMock = vi.fn().mockReturnValue({ focus: focusMock });

    const mockEditor = {
      state: {
        selection: { from: 0, to: 10, empty: false },
        doc: { textBetween: () => "Selected Header Text" },
      },
      chain: chainMock,
    };

    handleToggleClick(mockEditor as unknown as Parameters<typeof handleToggleClick>[0]);

    expect(insertContentMock).toHaveBeenCalledWith({
      type: "toggle",
      attrs: { title: "Selected Header Text" },
      content: [{ type: "paragraph" }],
    });
    expect(runMock).toHaveBeenCalled();
  });
});
