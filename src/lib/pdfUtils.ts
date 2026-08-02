// Utility for reading PDF files using PDF.js (pdfjs-dist).
// Uses dynamic imports so the library and worker are only loaded when needed,
// keeping test environments and initial bundle unaffected.

let workerConfigured = false;

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export async function pdfToHtml(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  if (!workerConfigured) {
    const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
    workerConfigured = true;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  let html = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    let line = "";
    const lines: string[] = [];

    for (const item of textContent.items) {
      if (!("str" in item)) continue; // Skip TextMarkedContent
      const textItem = item as { str: string; hasEOL: boolean };
      line += textItem.str;
      if (textItem.hasEOL) {
        lines.push(line);
        line = "";
      }
    }
    if (line.trim()) lines.push(line);

    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed) {
        html += `<p>${escapeHtml(trimmed)}</p>`;
      }
    }

    if (pageNum < pdf.numPages) {
      html += '<hr style="page-break-after: always;" />';
    }
  }

  await loadingTask.destroy();

  return html || "<p></p>";
}
