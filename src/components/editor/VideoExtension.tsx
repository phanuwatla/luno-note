import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import VideoNodeView from "@/components/editor/VideoNodeView";

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; title?: string; width?: number; textAlign?: string; "data-relative-src"?: string }) => ReturnType;
    };
  }
}

export const VideoExtension = Node.create<VideoOptions>({
  name: "video",
  group: "block",
  selectable: true,
  draggable: false,
  atom: true,
  defining: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src") || element.querySelector("source")?.getAttribute("src") || null,
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute("width") || element.style?.width;
          if (!w) return null;
          const parsed = parseInt(w, 10);
          return isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      textAlign: {
        default: "left",
        parseHTML: (element) => {
          const align = (
            element.style?.textAlign ||
            element.getAttribute("align") ||
            element.getAttribute("data-text-align") ||
            element.parentElement?.style?.textAlign ||
            ""
          ).toLowerCase();
          return ["left", "center", "right", "justify"].includes(align) ? align : "left";
        },
        renderHTML: (attributes) => {
          if (!attributes.textAlign || attributes.textAlign === "left") return {};
          return {
            style: `text-align: ${attributes.textAlign}`,
            "data-text-align": attributes.textAlign,
          };
        },
      },
      "data-relative-src": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-relative-src") || element.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes["data-relative-src"]) return {};
          return {
            "data-relative-src": attributes["data-relative-src"],
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title") || element.getAttribute("data-title") || null,
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return {
            title: attributes.title,
            "data-title": attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes({ controls: "true" }, this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default VideoExtension;
