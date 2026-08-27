import { Mark, mergeAttributes } from "@tiptap/core";

export const Underline = Mark.create({
  name: "underline",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { tag: "u" },
      {
        style: "text-decoration",
        getAttrs: (value) => (typeof value === "string" && value.includes("underline") ? {} : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setUnderline: () => ({ commands }) => commands.setMark(this.name),
      toggleUnderline: () => ({ commands }) => commands.toggleMark(this.name),
      unsetUnderline: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleUnderline(),
      "Mod-U": () => this.editor.commands.toggleUnderline(),
    };
  },
});

export const Highlight = Mark.create({
  name: "highlight",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "luno-highlight",
      },
    };
  },

  parseHTML() {
    return [
      { tag: "mark" },
      {
        tag: "span",
        getAttrs: (element) => (element as HTMLElement).classList?.contains("luno-highlight") ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHighlight: () => ({ commands }) => commands.setMark(this.name),
      toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name),
      unsetHighlight: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
      "Mod-Shift-H": () => this.editor.commands.toggleHighlight(),
    };
  },
});
