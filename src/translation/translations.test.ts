import { describe, it, expect } from "vitest";
import en from "./en";
import th from "./th";
import fs from "fs";
import path from "path";
import { APP_THEMES, APPEARANCE_STYLE_OPTIONS, FONT_OPTIONS } from "@/hooks/useAppSettings";
import {
  ICON_PACK_OPTIONS,
  LUCIDE_ICON_CATEGORIES,
  TABLER_ICON_CATEGORIES,
  PHOSPHOR_ICON_CATEGORIES,
} from "@/lib/iconPacks";

function flattenKeys(obj: Record<string, any>, prefix = ""): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = flattenKeys(v, fullKey);
      for (const nk of nested) keys.add(nk);
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const enKeys = flattenKeys(en);
const thKeys = flattenKeys(th);

describe("Translation Dictionary Integrity", () => {
  it("en and th have no missing keys between each other", () => {
    const missingInTh = [...enKeys].filter((k) => !thKeys.has(k));
    const missingInEn = [...thKeys].filter((k) => !enKeys.has(k));

    expect(missingInTh, `Keys in EN but missing in TH: ${missingInTh.join(", ")}`).toEqual([]);
    expect(missingInEn, `Keys in TH but missing in EN: ${missingInEn.join(", ")}`).toEqual([]);
  });

  it("has no empty strings in en or th dictionaries", () => {
    function findEmpty(obj: Record<string, any>, prefix = ""): string[] {
      const empties: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          empties.push(...findEmpty(v, fullKey));
        } else if (v === "" || v === undefined || v === null) {
          empties.push(fullKey);
        }
      }
      return empties;
    }

    expect(findEmpty(en)).toEqual([]);
    expect(findEmpty(th)).toEqual([]);
  });

  it("contains all theme translation keys for APP_THEMES", () => {
    for (const theme of APP_THEMES) {
      const themeKey = `theme${theme.id.charAt(0).toUpperCase()}${theme.id.slice(1)}`;
      const fullKey = `settings.${themeKey}`;
      expect(enKeys.has(fullKey), `Missing EN theme key: ${fullKey}`).toBe(true);
      expect(thKeys.has(fullKey), `Missing TH theme key: ${fullKey}`).toBe(true);
    }
  });

  it("contains all font nameKey values", () => {
    for (const font of FONT_OPTIONS) {
      expect(enKeys.has(font.nameKey), `Missing EN font key: ${font.nameKey}`).toBe(true);
      expect(thKeys.has(font.nameKey), `Missing TH font key: ${font.nameKey}`).toBe(true);
    }
  });

  it("contains all appearance style nameKey and descKey values", () => {
    for (const style of APPEARANCE_STYLE_OPTIONS) {
      expect(enKeys.has(style.nameKey), `Missing EN style nameKey: ${style.nameKey}`).toBe(true);
      expect(thKeys.has(style.nameKey), `Missing TH style nameKey: ${style.nameKey}`).toBe(true);
      expect(enKeys.has(style.descKey), `Missing EN style descKey: ${style.descKey}`).toBe(true);
      expect(thKeys.has(style.descKey), `Missing TH style descKey: ${style.descKey}`).toBe(true);
    }
  });

  it("contains all icon category and icon pack keys", () => {
    const allCategories = [
      ...LUCIDE_ICON_CATEGORIES,
      ...TABLER_ICON_CATEGORIES,
      ...PHOSPHOR_ICON_CATEGORIES,
    ];
    for (const cat of allCategories) {
      expect(enKeys.has(cat.nameKey), `Missing EN icon category: ${cat.nameKey}`).toBe(true);
      expect(thKeys.has(cat.nameKey), `Missing TH icon category: ${cat.nameKey}`).toBe(true);
    }
    for (const pack of ICON_PACK_OPTIONS) {
      expect(enKeys.has(pack.nameKey), `Missing EN icon pack: ${pack.nameKey}`).toBe(true);
      expect(thKeys.has(pack.nameKey), `Missing TH icon pack: ${pack.nameKey}`).toBe(true);
      expect(enKeys.has(pack.descKey), `Missing EN icon pack: ${pack.descKey}`).toBe(true);
      expect(thKeys.has(pack.descKey), `Missing TH icon pack: ${pack.descKey}`).toBe(true);
    }
  });

  it("all literal t('...') calls across source code exist in translation dictionaries", () => {
    function getAllSourceFiles(dir: string): string[] {
      const files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
            files.push(...getAllSourceFiles(full));
          }
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          files.push(full);
        }
      }
      return files;
    }

    const srcDir = path.resolve(__dirname, "..");
    const allFiles = getAllSourceFiles(srcDir);
    const tCallRegex = /\bt\(\s*["']([^"'\n\r]+)["']\s*[,)]/g;

    const missingInEn: { key: string; file: string }[] = [];
    const missingInTh: { key: string; file: string }[] = [];

    for (const file of allFiles) {
      if (file.includes(path.join("src", "translation"))) continue;
      const content = fs.readFileSync(file, "utf-8");
      let match: RegExpExecArray | null;
      while ((match = tCallRegex.exec(content)) !== null) {
        const key = match[1].trim();
        if (!key || key.includes("${")) continue;

        if (!enKeys.has(key)) {
          missingInEn.push({ key, file: path.relative(srcDir, file) });
        }
        if (!thKeys.has(key)) {
          missingInTh.push({ key, file: path.relative(srcDir, file) });
        }
      }
    }

    expect(
      missingInEn,
      `Keys called with t(...) but missing in EN: ${JSON.stringify(missingInEn, null, 2)}`
    ).toEqual([]);
    expect(
      missingInTh,
      `Keys called with t(...) but missing in TH: ${JSON.stringify(missingInTh, null, 2)}`
    ).toEqual([]);
  });
});
