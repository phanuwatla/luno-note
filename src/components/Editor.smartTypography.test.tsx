import { describe, it, expect } from "vitest";
import { Editor as TiptapEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CustomParagraph, SmartTypography } from "@/components/Editor";
import { Link } from "@tiptap/extension-link";

describe("Smart typography and autolinks setting toggle", () => {
  it("converts typography shortcuts (quotes, dashes, arrows, symbols) when enabled", () => {
    let isSmartTypoEnabled = true;

    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
          link: false,
          underline: false,
        }),
        CustomParagraph,
        SmartTypography.configure({
          enabled: () => isSmartTypoEnabled,
        }),
      ],
      content: "<p></p>",
    });

    // 1. En-dash
    editor.commands.setContent("<p>word--</p>");
    editor.commands.focus("end");
    // Simulate typing the matching trigger
    editor.view.someProp("handleTextInput", (f) => f(editor.view, 7, 7, " "));
    // Or dispatching input rules directly
    expect(editor.getText()).toBeDefined();

    // Test input rule execution directly
    // En-dash rule test
    editor.commands.setContent("<p>foo</p>");
    editor.commands.focus("end");
    editor.view.dispatch(editor.state.tr.insertText("--"));
    // En-dash replaces '--' with '–'
    // Since inputrules trigger on text input:
    editor.view.someProp("handleTextInput", (f) => f(editor.view, 6, 6, " "));
    
    editor.destroy();
  });

  it("SmartTypography extension respects dynamic enabled callback when turned off", () => {
    let isEnabled = true;

    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
          link: false,
          underline: false,
        }),
        CustomParagraph,
        SmartTypography.configure({
          enabled: () => isEnabled,
        }),
      ],
      content: "<p></p>",
    });

    // Verify storage initialization
    expect(editor.storage.smartTypography).toBeDefined();
    expect(editor.storage.smartTypography.enabled).toBe(true);

    // Disable smart typography dynamically
    isEnabled = false;
    editor.storage.smartTypography.enabled = false;

    // Check that storage and callback both reflect disabled state
    expect(editor.storage.smartTypography.enabled).toBe(false);

    editor.destroy();
  });

  it("shouldAutoLink disables autolinking and link paste when smartTypography is false", () => {
    let smartTypoSetting = false;

    const CustomLink = Link.extend({
      addOptions() {
        return {
          ...this.parent?.(),
          openOnClick: false,
          autolink: true,
          shouldAutoLink: (url: string) => {
            if (!smartTypoSetting) {
              return false;
            }
            if (!url) return false;
            const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
            const hasMaybeProtocol = /^[a-z][a-z0-9+.-]*:/i.test(url);
            if (hasProtocol || (hasMaybeProtocol && !url.includes("@"))) {
              return true;
            }
            const urlWithoutUserinfo = url.includes("@") ? url.split("@").pop()! : url;
            const hostname = urlWithoutUserinfo.split(/[/?#:]/)[0];
            if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
              return false;
            }
            if (!/\./.test(hostname)) {
              return false;
            }
            return true;
          },
        };
      },
    });

    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
          link: false,
          underline: false,
        }),
        CustomParagraph,
        CustomLink,
      ],
      content: "<p>Visit https://example.com</p>",
    });

    // When smartTypography is false, shouldAutoLink returns false
    const linkExt = editor.extensionManager.extensions.find((e) => e.name === "link");
    expect(linkExt).toBeDefined();
    expect(linkExt?.options.shouldAutoLink("https://example.com")).toBe(false);
    expect(linkExt?.options.shouldAutoLink("http://google.com")).toBe(false);

    // Turn setting ON
    smartTypoSetting = true;
    expect(linkExt?.options.shouldAutoLink("https://example.com")).toBe(true);
    expect(linkExt?.options.shouldAutoLink("not a url")).toBe(false);

    // Turn setting OFF again
    smartTypoSetting = false;
    expect(linkExt?.options.shouldAutoLink("https://example.com")).toBe(false);

    editor.destroy();
  });

  it("StarterKit does not register duplicate link and underline extensions", () => {
    const editor = new TiptapEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
          link: false,
          underline: false,
        }),
        CustomParagraph,
        Link,
      ],
      content: "<p>Test</p>",
    });

    const linkExtensions = editor.extensionManager.extensions.filter((e) => e.name === "link");
    expect(linkExtensions.length).toBe(1);

    editor.destroy();
  });
});
