// Utility for reading and writing docx files using mammoth (browser UMD)
// Assumes <script src="/mammoth.browser.min.js"></script> is loaded in index.html

export async function docxToHtml(file: File): Promise<string> {
  const win = window as unknown as { mammoth?: { convertToHtml: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> } };
  const mammoth = win.mammoth;
  if (!mammoth) throw new Error("Mammoth.js (browser) is not loaded");
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  return html;
}

// TODO: Implement htmlToDocx if needed (for export)
