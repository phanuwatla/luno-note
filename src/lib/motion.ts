import { useAppSettingsSafe } from "@/hooks/useAppSettings";
import type { Transition, Variants } from "framer-motion";

/**
 * Shared Luno Note motion design tokens and Framer Motion presets.
 * All motion primitives stay composited (`transform`, `opacity`) and
 * respect the global `settings.enableAnimations` preference.
 */
export const LUNO_EASE = [0.16, 1, 0.3, 1] as const;

export const LUNO_EASE_SPRING_BACK = [0.34, 1.56, 0.64, 1] as const;

export const LUNO_SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};

export const LUNO_SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
};

export const LUNO_TRANSITION_FAST: Transition = {
  duration: 0.14,
  ease: LUNO_EASE,
};

export const LUNO_TRANSITION_BASE: Transition = {
  duration: 0.2,
  ease: LUNO_EASE,
};

export const LUNO_TRANSITION_PANEL: Transition = {
  duration: 0.22,
  ease: LUNO_EASE,
};

export const LUNO_INSTANT_TRANSITION: Transition = {
  duration: 0,
};

/** Variants for sub-sections and tab bodies switching inside views or panels. */
export const lunoFadeSlideUpVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: LUNO_TRANSITION_BASE,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: LUNO_TRANSITION_FAST,
  },
};

/** Variants for card items inside grids. */
export const lunoCardVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: LUNO_TRANSITION_BASE,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: LUNO_TRANSITION_FAST,
  },
};

/** Variants for compact floating banners, toolbars, and selection bars. */
export const lunoBarSlideVariants: Variants = {
  initial: { opacity: 0, y: -6, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: LUNO_TRANSITION_FAST,
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.985,
    transition: { duration: 0.12, ease: LUNO_EASE },
  },
};

/**
 * Reads the current global animation setting safely from the DOM for
 * imperative browser actions (such as smooth scrolling or canvas loops)
 * or components running outside `AppSettingsProvider`.
 */
export function areAnimationsEnabled(): boolean {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  if (root.getAttribute("data-animations") === "false") return false;
  if (root.classList.contains("reduce-motion")) return false;
  return true;
}

/**
 * React hook returning whether Luno Note animations are currently enabled.
 * Safely defaults to `true` when rendered in isolation outside `AppSettingsProvider`.
 */
export function useAnimationsEnabled(): boolean {
  const ctx = useAppSettingsSafe();
  if (ctx?.settings) {
    return ctx.settings.enableAnimations !== false;
  }
  return areAnimationsEnabled();
}

/**
 * Returns `"smooth"` when animations are enabled or `"auto"` when reduced motion
 * is active, so imperative `scrollTo` / `scrollIntoView` calls always respect `enableAnimations`.
 */
export function getScrollBehavior(enabled?: boolean): ScrollBehavior {
  const isEnabled = enabled === undefined ? areAnimationsEnabled() : enabled;
  return isEnabled ? "smooth" : "auto";
}

/**
 * Resolves the appropriate Framer Motion transition given `animationsEnabled`.
 */
export function resolveTransition(
  transition: Transition,
  animationsEnabled: boolean,
): Transition {
  return animationsEnabled ? transition : LUNO_INSTANT_TRANSITION;
}
