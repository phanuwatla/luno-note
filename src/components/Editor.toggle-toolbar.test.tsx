import { describe, expect, it } from "vitest";
import { getToggleButtonMode } from "@/components/Editor";

describe("toggle toolbar mode selection", () => {
  it("uses wrap mode when selection is not empty", () => {
    expect(getToggleButtonMode({ empty: false })).toBe("wrap");
  });

  it("uses insert mode when the cursor is collapsed", () => {
    expect(getToggleButtonMode({ empty: true })).toBe("insert");
  });
});
