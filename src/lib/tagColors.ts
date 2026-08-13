import type { AppTheme } from "@/hooks/useAppSettings";

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const THEME_PALETTES: Record<AppTheme, string[]> = {
  emerald: [
    "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/25",
    "bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30",
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    "bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30",
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/30",
  ],
  blue: [
    "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/25",
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    "bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border-indigo-600/30",
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    "bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-600/30",
  ],
  violet: [
    "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/25",
    "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
    "bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border-indigo-600/30",
    "bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-600/30",
    "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
    "bg-violet-600/15 text-violet-700 dark:text-violet-300 border-violet-600/30",
  ],
  rose: [
    "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/25",
    "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/30",
    "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
    "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
    "bg-rose-600/15 text-rose-700 dark:text-rose-300 border-rose-600/30",
  ],
  orange: [
    "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/25",
    "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    "bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/30",
    "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    "bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30",
  ],
  slate: [
    "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/25",
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/30",
  ],
};

export function getTagColorClass(
  tag: string,
  theme: AppTheme = "emerald",
  _index?: number,
  style: "multicolor" | "accent" = "multicolor"
): string {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.emerald;
  if (style === "accent") {
    return palette[0];
  }
  const cleanTag = (tag || "").trim().toLowerCase();
  const colorIndex = getHash(cleanTag) % palette.length;
  return palette[colorIndex];
}
