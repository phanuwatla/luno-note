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

export const Superscript = Mark.create({
  name: "superscript",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: "sup" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setSuperscript: () => ({ commands }) => commands.setMark(this.name),
      toggleSuperscript: () => ({ commands }) => commands.toggleMark(this.name),
      unsetSuperscript: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-.": () => this.editor.commands.toggleSuperscript(),
    };
  },
});

export const Subscript = Mark.create({
  name: "subscript",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: "sub" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setSubscript: () => ({ commands }) => commands.setMark(this.name),
      toggleSubscript: () => ({ commands }) => commands.toggleMark(this.name),
      unsetSubscript: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-,": () => this.editor.commands.toggleSubscript(),
    };
  },
});
