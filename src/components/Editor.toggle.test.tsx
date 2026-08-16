import { describe, expect, it } from "vitest";
import { Toggle } from "@/components/Editor";

describe("Toggle node serialization", () => {
  it("should keep the open attribute absent for a collapsed toggle", () => {
    const attributes = (Toggle.config.addAttributes?.call(Toggle) ?? {}) as Record<string, any>;
    const openAttribute = attributes.open as {
      default: boolean;
      renderHTML: (attrs: { open?: boolean }) => Record<string, string>;
    };

    expect(openAttribute.default).toBe(false);
    expect(openAttribute.renderHTML({ open: false })).toEqual({});
    expect(openAttribute.renderHTML({ open: true })).toEqual({ open: "" });
  });
});
