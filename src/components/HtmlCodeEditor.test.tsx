import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HtmlCodeEditor from "./HtmlCodeEditor";

describe("HtmlCodeEditor CSS Mode", () => {
  it("renders CSS code with syntax highlighting", () => {
    const cssCode = "/* Theme */\n.container { width: 100%; color: #14afa9; }";
    const handleChange = vi.fn();

    const { container } = render(
      <HtmlCodeEditor
        value={cssCode}
        onChange={handleChange}
        language="css"
      />
    );

    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre?.innerHTML).toContain("var(--hl-comment)");
    expect(pre?.innerHTML).toContain("var(--hl-tag)");
    expect(pre?.innerHTML).toContain("var(--hl-attr)");
    expect(pre?.innerHTML).toContain("var(--hl-string)");

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea?.value).toBe(cssCode);
  });

  it("triggers onChange when user edits CSS content", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <HtmlCodeEditor
        value="body { margin: 0; }"
        onChange={handleChange}
        language="css"
      />
    );

    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    if (textarea) {
      fireEvent.change(textarea, { target: { value: "body { margin: 10px; }" } });
      expect(handleChange).toHaveBeenCalledWith("body { margin: 10px; }");
    }
  });
});
