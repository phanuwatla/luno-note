import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteEditorPreview from "./NoteEditorPreview";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { navigateFootnoteOrAnchor } from "./Editor";

describe("NoteEditorPreview Component", () => {
  it("renders markdown content with custom colors and font styles", () => {
    const md = `
# Project Plan

This is <span style="color: rgb(16, 185, 129); font-weight: 600;">Completed</span> and this is <span style="color: rgb(239, 68, 68);">Blocked</span>.

Quote: <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px;">Wise words</span>
`;

    const { container } = render(
      <AppSettingsProvider>
        <NoteEditorPreview content={md} format="markdown" />
      </AppSettingsProvider>
    );

    expect(screen.getByText("Project Plan")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Wise words")).toBeInTheDocument();

    // Verify style attributes are preserved by TipTap extensions
    const completedEl = screen.getByText("Completed");
    expect(completedEl.getAttribute("style") || "").toContain("color");

    const quoteEl = screen.getByText("Wise words");
    expect(quoteEl.closest("[style*='font-family']") || quoteEl.closest("[data-font-family]")).toBeTruthy();
    expect(quoteEl.closest("[style*='font-size']") || quoteEl.closest("[data-font-size]")).toBeTruthy();
  });

  it("renders tag badges when tags prop is provided", () => {
    const md = "# Note with tags\n\nContent here";
    render(
      <AppSettingsProvider>
        <NoteEditorPreview content={md} tags={["work", "urgent"]} format="markdown" />
      </AppSettingsProvider>
    );

    expect(screen.getByText("#work")).toBeInTheDocument();
    expect(screen.getByText("#urgent")).toBeInTheDocument();
  });

  it("renders plain text format using editor paragraph lines", () => {
    const plainText = "Line 1: System info\nLine 2: Config options\nLine 3: Status OK";
    const { container } = render(
      <AppSettingsProvider>
        <NoteEditorPreview content={plainText} format="plain" />
      </AppSettingsProvider>
    );

    expect(screen.getByText("Line 1: System info")).toBeInTheDocument();
    expect(screen.getByText("Line 2: Config options")).toBeInTheDocument();
    expect(screen.getByText("Line 3: Status OK")).toBeInTheDocument();

    // Verify TipTap rendered p elements with standard editor classes
    const paragraphs = container.querySelectorAll(".luno-reading-view p");
    expect(paragraphs.length).toBe(3);
  });

  it("renders HTML format inside an iframe", () => {
    const htmlContent = "<!DOCTYPE html><html><body><h1>Hello Web</h1></body></html>";
    const { container } = render(
      <AppSettingsProvider>
        <NoteEditorPreview content={htmlContent} format="html" />
      </AppSettingsProvider>
    );

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute("srcdoc")).toBe(htmlContent);
  });

  it("navigateFootnoteOrAnchor smoothly navigates citations and backrefs", () => {
    const root = document.createElement("div");
    root.className = "editor-scroll-container";
    root.innerHTML = `
      <p>Here is a fact<sup id="fnref-1"><a href="#fn-1" data-footnote-ref="1" class="footnote-ref">[1]</a></sup>.</p>
      <hr class="footnotes-sep" />
      <ol class="footnotes-list">
        <li id="fn-1" data-footnote-id="1">
          Reference source book <a href="#fnref-1" data-footnote-backref="1" class="footnote-backref">↩</a>
        </li>
      </ol>
    `;
    document.body.appendChild(root);

    // Mock scrollIntoView
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    const citationLink = root.querySelector("[data-footnote-ref='1']") as HTMLElement;
    expect(citationLink).toBeTruthy();

    const handledCitation = navigateFootnoteOrAnchor(citationLink, root);
    expect(handledCitation).toBe(true);
    expect(scrollMock).toHaveBeenCalled();

    // Backref
    const backrefLink = root.querySelector("[data-footnote-backref='1']") as HTMLElement;
    expect(backrefLink).toBeTruthy();

    const handledBackref = navigateFootnoteOrAnchor(backrefLink, root);
    expect(handledBackref).toBe(true);

    document.body.removeChild(root);
  });
});
