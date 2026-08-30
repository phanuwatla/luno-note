import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeDateTime,
  getWeekStartsOn,
  formatDateForFileName,
  formatTimeForFileName,
} from "./dateTimeFormatter";

describe("dateTimeFormatter", () => {
  const fixedDate = new Date(2026, 7, 1, 13, 45, 0); // 2026-08-01 13:45:00

  it("formats date in YYYY-MM-DD format", () => {
    expect(formatDate(fixedDate, "YYYY-MM-DD")).toBe("2026-08-01");
  });

  it("formats date in DD/MM/YYYY format", () => {
    expect(formatDate(fixedDate, "DD/MM/YYYY")).toBe("01/08/2026");
  });

  it("formats date in MM/DD/YYYY format", () => {
    expect(formatDate(fixedDate, "MM/DD/YYYY")).toBe("08/01/2026");
  });

  it("formats time in 24h format", () => {
    const res = formatTime(fixedDate, "24h", "en");
    expect(res).toContain("13:45");
  });

  it("formats time in 12h format", () => {
    const res = formatTime(fixedDate, "12h", "en");
    expect(res).toMatch(/1:45\s*PM/i);
  });

  it("formats datetime respecting both date and time format", () => {
    const res = formatDateTime(fixedDate, "DD/MM/YYYY", "24h", "en");
    expect(res).toContain("01/08/2026");
    expect(res).toContain("13:45");
  });

  it("returns correct week start day", () => {
    expect(getWeekStartsOn("monday")).toBe(1);
    expect(getWeekStartsOn("sunday")).toBe(0);
  });

  it("formats date for file name without illegal slashes", () => {
    expect(formatDateForFileName(fixedDate, "YYYY-MM-DD")).toBe("2026-08-01");
    expect(formatDateForFileName(fixedDate, "DD/MM/YYYY")).toBe("01-08-2026");
    expect(formatDateForFileName(fixedDate, "MM/DD/YYYY")).toBe("08-01-2026");
  });

  it("formats time for file name without illegal colons", () => {
    expect(formatTimeForFileName(fixedDate, "24h")).toBe("13.45");
    expect(formatTimeForFileName(fixedDate, "12h")).toBe("1.45 PM");
  });
});
