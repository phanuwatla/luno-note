// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent, screen } from "@testing-library/react";
import { AppSettingsProvider, useAppSettings } from "@/hooks/useAppSettings";
import {
  LUNO_INSTANT_TRANSITION,
  LUNO_SPRING_SNAPPY,
  areAnimationsEnabled,
  getScrollBehavior,
  resolveTransition,
  useAnimationsEnabled,
} from "./motion";

function MotionHarness() {
  const { settings, updateSetting } = useAppSettings();
  const enabled = useAnimationsEnabled();

  return (
    <div>
      <span data-testid="motion-state">{enabled ? "on" : "off"}</span>
      <span data-testid="scroll-behavior">{getScrollBehavior(enabled)}</span>
      <button
        type="button"
        onClick={() => updateSetting("enableAnimations", settings.enableAnimations === false)}
      >
        toggle
      </button>
    </div>
  );
}

describe("System-Wide Motion Utilities & Animation Settings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-animations");
    document.documentElement.classList.remove("reduce-motion");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-animations");
    document.documentElement.classList.remove("reduce-motion");
  });

  it("detects animations enabled by default and disabled via DOM flags", () => {
    expect(areAnimationsEnabled()).toBe(true);
    expect(getScrollBehavior()).toBe("smooth");

    document.documentElement.setAttribute("data-animations", "false");
    expect(areAnimationsEnabled()).toBe(false);
    expect(getScrollBehavior()).toBe("auto");

    document.documentElement.setAttribute("data-animations", "true");
    expect(areAnimationsEnabled()).toBe(true);

    document.documentElement.classList.add("reduce-motion");
    expect(areAnimationsEnabled()).toBe(false);
    expect(getScrollBehavior()).toBe("auto");
  });

  it("resolves transitions to instant duration 0 when animations are disabled", () => {
    expect(resolveTransition(LUNO_SPRING_SNAPPY, true)).toEqual(LUNO_SPRING_SNAPPY);
    expect(resolveTransition(LUNO_SPRING_SNAPPY, false)).toEqual(LUNO_INSTANT_TRANSITION);
    expect(getScrollBehavior(false)).toBe("auto");
    expect(getScrollBehavior(true)).toBe("smooth");
  });

  it("safely resolves outside AppSettingsProvider using DOM state", () => {
    function StandaloneHarness() {
      const enabled = useAnimationsEnabled();
      return <span data-testid="standalone">{enabled ? "on" : "off"}</span>;
    }

    document.documentElement.setAttribute("data-animations", "false");
    render(<StandaloneHarness />);
    expect(screen.getByTestId("standalone").textContent).toBe("off");
  });

  it("syncs useAnimationsEnabled, data-animations, and .reduce-motion with AppSettingsProvider", async () => {
    render(
      <AppSettingsProvider>
        <MotionHarness />
      </AppSettingsProvider>
    );

    expect(screen.getByTestId("motion-state").textContent).toBe("on");
    expect(screen.getByTestId("scroll-behavior").textContent).toBe("smooth");
    expect(document.documentElement.getAttribute("data-animations")).toBe("true");
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByText("toggle"));
    });

    expect(screen.getByTestId("motion-state").textContent).toBe("off");
    expect(screen.getByTestId("scroll-behavior").textContent).toBe("auto");
    expect(document.documentElement.getAttribute("data-animations")).toBe("false");
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(true);
  });
});
