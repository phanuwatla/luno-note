import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@tabler/icons-react")) return "tabler-icons";
            if (id.includes("@phosphor-icons/react")) return "phosphor-icons";
            if (id.includes("lucide-react")) return "lucide-icons";
            if (id.includes("@tiptap") || id.includes("prosemirror")) return "tiptap";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("@radix-ui")) return "radix-ui";
            if (id.includes("framer-motion")) return "framer-motion";
            if (id.includes("pdfjs-dist")) return "pdfjs";
            if (id.includes("lowlight") || id.includes("highlight.js")) return "highlight";
            if (id.includes("mammoth")) return "mammoth";
            return "vendor";
          }
        },
      },
    },
  },
}));

