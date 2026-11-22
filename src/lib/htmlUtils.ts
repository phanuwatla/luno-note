/**
 * Centralized HTML escaping utility for safe string interpolation into HTML templates.
 */
export function escapeHtml(raw: string, singleQuoteEntity: "&#39;" | "&#039;" = "&#39;"): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, singleQuoteEntity);
}
