import { Extension, Mark, mergeAttributes, markInputRule, markPasteRule } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    underline: {
      setUnderline: () => ReturnType;
      toggleUnderline: () => ReturnType;
      unsetUnderline: () => ReturnType;
    };
    highlight: {
      setHighlight: () => ReturnType;
      toggleHighlight: () => ReturnType;
      unsetHighlight: () => ReturnType;
    };
    superscript: {
      setSuperscript: () => ReturnType;
      toggleSuperscript: () => ReturnType;
      unsetSuperscript: () => ReturnType;
    };
    subscript: {
      setSubscript: () => ReturnType;
      toggleSubscript: () => ReturnType;
      unsetSubscript: () => ReturnType;
    };
    textColor: {
      setColor: (color: string) => ReturnType;
      unsetColor: () => ReturnType;
    };
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    textAlign: {
      setTextAlign: (alignment: string) => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}


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
        getAttrs: (element) => {
          const el = element as HTMLElement;
          if (el.classList?.contains("luno-highlight")) return {};
          if (el.style?.backgroundColor && el.style.backgroundColor !== "transparent" && el.style.backgroundColor !== "inherit") return {};
          return false;
        },
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

  addInputRules() {
    return [
      markInputRule({
        find: /(?:^|[^=])(==(?!\s+)([^=\r\n]+)(?<!\s)==)$/,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: /(?:^|[^=])(==(?!\s+)([^=\r\n]+)(?<!\s)==)/g,
        type: this.type,
      }),
    ];
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
      "Mod-Shift-.": () => this.editor.commands.toggleSuperscript(),
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
      "Mod-Shift-,": () => this.editor.commands.toggleSubscript(),
    };
  },
});

export const Kbd = Mark.create({
  name: "kbd",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: "kbd" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["kbd", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

export const TextColor = Mark.create({
  name: "textColor",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style?.color || element.getAttribute("data-color") || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return {
            style: `color: ${attributes.color}`,
            "data-color": attributes.color,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "color",
        getAttrs: (value) => (typeof value === "string" && value ? { color: value } : false),
      },
      {
        tag: "span[data-color]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const color = el.getAttribute("data-color") || el.style?.color;
          return color ? { color } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setColor:
        (color: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { color }),
      unsetColor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export const FontFamily = Mark.create({
  name: "fontFamily",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => {
          const val = element.style?.fontFamily || element.getAttribute("data-font-family");
          return val ? val.replace(/"/g, "'") : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {};
          const cleanFont = String(attributes.fontFamily).replace(/"/g, "'");
          return {
            style: `font-family: ${cleanFont}`,
            "data-font-family": cleanFont,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "font-family",
        getAttrs: (value) => (typeof value === "string" && value ? { fontFamily: value.replace(/"/g, "'") } : false),
      },
      {
        tag: "span[data-font-family]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const fontFamily = el.getAttribute("data-font-family") || el.style?.fontFamily;
          return fontFamily ? { fontFamily: fontFamily.replace(/"/g, "'") } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { fontFamily }),
      unsetFontFamily:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export const FontSize = Mark.create({
  name: "fontSize",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style?.fontSize || element.getAttribute("data-font-size") || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return {
            style: `font-size: ${attributes.fontSize}`,
            "data-font-size": attributes.fontSize,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "font-size",
        getAttrs: (value) => (typeof value === "string" && value ? { fontSize: value } : false),
      },
      {
        tag: "span[data-font-size]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const fontSize = el.getAttribute("data-font-size") || el.style?.fontSize;
          return fontSize ? { fontSize } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { fontSize }),
      unsetFontSize:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export interface TextAlignOptions {
  types: string[];
  alignments: string[];
  defaultAlignment: string;
}

export const TextAlign = Extension.create<TextAlignOptions>({
  name: "textAlign",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: "left",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const align = (element.style?.textAlign || element.getAttribute("align") || "").toLowerCase();
              return this.options.alignments.includes(align) ? align : this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign || attributes.textAlign === this.options.defaultAlignment) {
                return {};
              }
              return {
                style: `text-align: ${attributes.textAlign}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment: string) =>
        ({ commands }) => {
          if (!this.options.alignments.includes(alignment)) {
            return false;
          }
          return this.options.types.some((type) =>
            commands.updateAttributes(type, { textAlign: alignment })
          );
        },
      unsetTextAlign:
        () =>
        ({ commands }) => {
          return this.options.types.some((type) =>
            commands.resetAttributes(type, "textAlign")
          );
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-l": () => this.editor.commands.setTextAlign("left"),
      "Mod-Shift-L": () => this.editor.commands.setTextAlign("left"),
      "Mod-Shift-e": () => this.editor.commands.setTextAlign("center"),
      "Mod-Shift-E": () => this.editor.commands.setTextAlign("center"),
      "Mod-Shift-r": () => this.editor.commands.setTextAlign("right"),
      "Mod-Shift-R": () => this.editor.commands.setTextAlign("right"),
      "Mod-Shift-j": () => this.editor.commands.setTextAlign("justify"),
      "Mod-Shift-J": () => this.editor.commands.setTextAlign("justify"),
    };
  },
});


