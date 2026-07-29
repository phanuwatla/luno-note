export async function rewriteHtmlForPreview(html: string, resolveAssetUrl: (assetPath: string) => Promise<string | null> | string | null) {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const rewriteAttribute = async (element: Element, attrName: string) => {
    const value = element.getAttribute(attrName);
    if (!value) return;

    const trimmed = value.trim();
    if (!trimmed) return;

    const isExternal = /^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") || trimmed.startsWith("#");
    if (isExternal) return;

    if (trimmed.startsWith("/")) return;

    const resolved = await resolveAssetUrl(trimmed);
    if (resolved) {
      element.setAttribute(attrName, resolved);
    }
  };

  const elements = Array.from(doc.querySelectorAll("img[src], script[src], link[href], source[src], a[href]"));
  for (const element of elements) {
    const attr = element.tagName === "A" ? "href" : element.tagName === "LINK" ? "href" : "src";
    await rewriteAttribute(element, attr);
  }

  return doc.documentElement.outerHTML;
}
