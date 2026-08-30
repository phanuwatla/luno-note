import { describe, it, expect } from "vitest";
import { TIPS, getRandomTipIndex, getNextTipIndex } from "./tips";

describe("tips utility", () => {
  it("contains valid tips with both th and en descriptions and categories", () => {
    expect(TIPS.length).toBeGreaterThan(20);

    for (const tip of TIPS) {
      expect(tip.id).toBeTruthy();
      expect(tip.category).toBeTruthy();
      expect(tip.th.trim().length).toBeGreaterThan(5);
      expect(tip.en.trim().length).toBeGreaterThan(5);
    }
  });

  it("returns a valid random tip index within bounds", () => {
    const randomIndex = getRandomTipIndex();
    expect(randomIndex).toBeGreaterThanOrEqual(0);
    expect(randomIndex).toBeLessThan(TIPS.length);
  });

  it("cycles to the next tip index correctly with wrap-around", () => {
    expect(getNextTipIndex(0)).toBe(1);
    expect(getNextTipIndex(TIPS.length - 1)).toBe(0);
  });
});
