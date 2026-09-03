function isExternalUrl(url: string): boolean {
  return (
    /^(?:[a-z]+:)?\/\//i.test(url) ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("#")
  );
}

export async function rewriteCssAssets(
  cssText: string,
  resolveAssetUrl: (assetPath: string) => Promise<string | null> | string | null,
  resolveCssContent?: (assetPath: string) => Promise<string | null> | string | null
): Promise<string> {
  if (!cssText) return cssText;

  // 1. Resolve @import statements
  const importRegex = /@import\s+(?:url\(\s*['"]?([^'"()]+)['"]?\s*\)|['"]([^'"]+)['"])\s*;/g;
  let processedCss = cssText;
  let match: RegExpExecArray | null;

  // Find all @import matches
  const importMatches: Array<{ fullMatch: string; path: string }> = [];
  while ((match = importRegex.exec(cssText)) !== null) {
    const importPath = (match[1] || match[2] || "").trim();
    if (importPath && !isExternalUrl(importPath)) {
      importMatches.push({ fullMatch: match[0], path: importPath });
    }
  }

  for (const item of importMatches) {
    if (resolveCssContent) {
      try {
        const importedContent = await resolveCssContent(item.path);
        if (typeof importedContent === "string") {
          const nested = await rewriteCssAssets(importedContent, resolveAssetUrl, resolveCssContent);
          processedCss = processedCss.replace(item.fullMatch, `/* @import "${item.path}" */\n${nested}\n`);
          continue;
        }
      } catch (err) {
        console.warn("Failed resolving @import CSS:", item.path, err);
      }
    }
  }

  // 2. Resolve url(...) asset references
  const urlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  const urlMatches: Array<{ fullMatch: string; quote: string; path: string }> = [];
  while ((match = urlRegex.exec(processedCss)) !== null) {
    const quote = match[1] || "";
    const rawPath = (match[2] || "").trim();
    if (rawPath && !isExternalUrl(rawPath)) {
      urlMatches.push({ fullMatch: match[0], quote, path: rawPath });
    }
  }

  for (const item of urlMatches) {
    try {
      const resolved = await resolveAssetUrl(item.path);
      if (resolved) {
        processedCss = processedCss.replace(item.fullMatch, `url("${resolved}")`);
      }
    } catch (err) {
      console.warn("Failed resolving CSS asset url:", item.path, err);
    }
  }

  return processedCss;
}

export async function rewriteHtmlForPreview(
  html: string,
  resolveAssetUrl: (assetPath: string) => Promise<string | null> | string | null,
  resolveCssContent?: (assetPath: string) => Promise<string | null> | string | null
): Promise<string> {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 1. Resolve & inline <link rel="stylesheet">
  const linkElements = Array.from(doc.querySelectorAll("link[href]"));
  for (const link of linkElements) {
    const href = link.getAttribute("href");
    if (!href) continue;
    const trimmed = href.trim();
    if (isExternalUrl(trimmed)) continue;

    const rel = (link.getAttribute("rel") || "").toLowerCase();
    const isStylesheet = rel.includes("stylesheet") || trimmed.toLowerCase().endsWith(".css");

    if (isStylesheet && resolveCssContent) {
      try {
        const cssContent = await resolveCssContent(trimmed);
        if (typeof cssContent === "string") {
          const processedCss = await rewriteCssAssets(cssContent, resolveAssetUrl, resolveCssContent);
          const styleEl = doc.createElement("style");
          styleEl.setAttribute("data-source", trimmed);
          styleEl.textContent = processedCss;
          link.replaceWith(styleEl);
          continue;
        }
      } catch (err) {
        console.warn("Failed resolving stylesheet CSS content:", trimmed, err);
      }
    }

    // Fallback: Rewrite href attribute as data URL
    const resolved = await resolveAssetUrl(trimmed);
    if (resolved) {
      link.setAttribute("href", resolved);
    }
  }

  // 2. Process existing <style> tags for @import and url(...)
  const styleElements = Array.from(doc.querySelectorAll("style"));
  for (const style of styleElements) {
    const rawCss = style.textContent || "";
    if (rawCss) {
      const processed = await rewriteCssAssets(rawCss, resolveAssetUrl, resolveCssContent);
      style.textContent = processed;
    }
  }

  // 3. Rewrite asset attributes on standard HTML elements
  const rewriteAttribute = async (element: Element, attrName: string) => {
    const value = element.getAttribute(attrName);
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || isExternalUrl(trimmed)) return;

    const resolved = await resolveAssetUrl(trimmed);
    if (resolved) {
      element.setAttribute(attrName, resolved);
    }
  };

  const elements = Array.from(doc.querySelectorAll("img[src], script[src], source[src], a[href], video[src], audio[src], track[src], iframe[src]"));
  for (const element of elements) {
    const attr = element.tagName === "A" ? "href" : "src";
    await rewriteAttribute(element, attr);
  }

  return doc.documentElement.outerHTML;
}
