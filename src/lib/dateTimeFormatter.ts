/**
 * Centralized Date & Time Formatter honoring user settings:
 * - dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY"
 * - timeFormat: "24h" | "12h"
 * - startWeekOn: "monday" | "sunday"
 */

export function parseDate(val: Date | number | string): Date {
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatDate(
  dateInput: Date | number | string,
  format: string = "YYYY-MM-DD",
  _language?: string
): string {
  const d = parseDate(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
    default:
      return `${year}-${month}-${day}`;
  }
}

export function formatTime(
  dateInput: Date | number | string,
  timeFormat: string = "24h",
  language: string = "en",
  showSeconds: boolean = false
): string {
  const d = parseDate(dateInput);
  const is12h = timeFormat === "12h";
  const locale = language === "th" ? "th-TH" : "en-US";

  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: is12h,
  });
}

export function formatDateTime(
  dateInput: Date | number | string,
  dateFormat: string = "YYYY-MM-DD",
  timeFormat: string = "24h",
  language: string = "en"
): string {
  const datePart = formatDate(dateInput, dateFormat, language);
  const timePart = formatTime(dateInput, timeFormat, language);
  return `${datePart} ${timePart}`;
}

export function formatRelativeDateTime(
  dateInput: Date | number | string,
  dateFormat: string = "YYYY-MM-DD",
  timeFormat: string = "24h",
  language: string = "en"
): string {
  const date = parseDate(dateInput);
  const now = new Date();
  const isTh = language === "th";

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = formatTime(date, timeFormat, language);

  if (isToday) {
    return `${isTh ? "วันนี้" : "Today"} ${timeStr}`;
  }
  if (isYesterday) {
    return `${isTh ? "เมื่อวาน" : "Yesterday"} ${timeStr}`;
  }

  const datePart = formatDate(date, dateFormat, language);
  return `${datePart} ${timeStr}`;
}

export function getWeekStartsOn(startWeekOn: string = "monday"): 0 | 1 {
  return startWeekOn === "sunday" ? 0 : 1;
}

/**
 * Formats date safely for file names (replacing slashes / with dashes -)
 */
export function formatDateForFileName(
  dateInput: Date | number | string,
  format: string = "YYYY-MM-DD"
): string {
  const d = parseDate(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}-${month}-${year}`;
    case "MM/DD/YYYY":
      return `${month}-${day}-${year}`;
    case "YYYY-MM-DD":
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Formats time safely for file names (replacing colons : with dots .)
 */
export function formatTimeForFileName(
  dateInput: Date | number | string,
  timeFormat: string = "24h"
): string {
  const d = parseDate(dateInput);
  const hours24 = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  if (timeFormat === "12h") {
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}.${minutes} ${period}`;
  }
  const hours = String(hours24).padStart(2, "0");
  return `${hours}.${minutes}`;
}

/**
 * Returns the placeholder token for the current date format in file names
 * e.g. "YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY"
 */
export function getDatePatternLabel(format: string = "YYYY-MM-DD"): string {
  switch (format) {
    case "DD/MM/YYYY":
      return "DD-MM-YYYY";
    case "MM/DD/YYYY":
      return "MM-DD-YYYY";
    case "YYYY-MM-DD":
    default:
      return "YYYY-MM-DD";
  }
}


