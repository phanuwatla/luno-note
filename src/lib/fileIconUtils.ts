import { Note } from "@/hooks/useNotes";

/**
 * Returns the toolbar icon map key corresponding to a file's extension or type.
 */
export function getDefaultFileIconKey(fileName?: string, fileType?: string, contentFormat?: string): string {
  if (fileType === "image") return "fileImage";
  if (fileType === "web-viewer") return "globe";

  const name = (fileName || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";

  // 1. Image
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "tif", "avif", "heic", "heif", "raw"].includes(ext)) {
    return "fileImage";
  }

  // 2. Video
  if (["mp4", "mkv", "webm", "avi", "mov", "wmv", "flv", "m4v", "3gp", "ogv", "m2ts", "mts", "mpg", "mpeg"].includes(ext)) {
    return "fileVideo";
  }

  // 3. Audio
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "aiff", "opus", "mid", "midi"].includes(ext)) {
    return "fileAudio";
  }

  // 4. Archive / Compressed
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz", "iso", "dmg", "pkg", "deb", "rpm"].includes(ext) || fileType === "zip") {
    return "fileZip";
  }

  // 5. Spreadsheets / Tables
  if (["xlsx", "xls", "csv", "tsv", "ods", "numbers"].includes(ext)) {
    return "fileSpreadsheet";
  }

  // 6. PDF
  if (ext === "pdf") {
    return "filePdf";
  }

  // 7. Code / Markup / Styles / Scripts
  if (
    [
      "html", "htm", "css", "scss", "sass", "less", "js", "jsx", "ts", "tsx", "mjs", "cjs",
      "json", "json5", "xml", "yaml", "yml", "toml", "py", "java", "c", "cpp", "cc", "cxx",
      "h", "hpp", "cs", "go", "rs", "php", "rb", "sh", "bash", "zsh", "bat", "cmd", "ps1",
      "sql", "graphql", "gql", "vue", "svelte", "dart", "swift", "kt", "kts", "lua", "r",
      "wasm", "env", "ini", "conf", "config", "dockerfile", "makefile"
    ].includes(ext) ||
    contentFormat === "html" ||
    contentFormat === "css" ||
    contentFormat === "code"
  ) {
    return "fileCode";
  }

  // 8. Markdown / Plain Text
  if (["md", "markdown", "txt", "log", "text", "rtf"].includes(ext) || contentFormat === "markdown" || contentFormat === "plain") {
    return "fileText";
  }

  // 9. If explicitly binary without recognized extension
  if (fileType === "binary") {
    return "file";
  }

  // Default fallback for general notes/text
  return "fileText";
}

/**
 * Helper to get default file icon key from a Note object.
 */
export function getNoteDefaultIconKey(note: Pick<Note, "fileName" | "fileType" | "contentFormat">): string {
  return getDefaultFileIconKey(note.fileName, note.fileType, note.contentFormat);
}

export type FileCategory = "markdown" | "text" | "code" | "image" | "audio" | "video" | "binary";

export function getFileCategory(
  note?: { fileName?: string; fileType?: string; contentFormat?: string; content?: string } | null
): FileCategory {
  if (!note) return "markdown";
  if (note.fileType === "image") return "image";
  if (note.fileType === "binary") return "binary";

  const name = (note.fileName || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";

  // 1. Image
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "tif", "avif", "heic", "heif", "raw"].includes(ext)) {
    return "image";
  }
  if (note.content?.startsWith("data:image/")) {
    return "image";
  }

  // 2. Video
  if (["mp4", "mkv", "avi", "mov", "wmv", "flv", "m4v", "3gp", "ogv", "m2ts", "mts", "mpg", "mpeg"].includes(ext)) {
    return "video";
  }

  // 3. Audio
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "aiff", "opus", "mid", "midi"].includes(ext)) {
    return "audio";
  }
  if (ext === "webm") {
    // webm can be audio or video; voice notes recorded in app are .webm
    return "audio";
  }
  if (note.content?.startsWith("data:audio/")) {
    return "audio";
  }

  // 4. Archive / Binary / PDF / Office documents
  if (
    [
      "zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz", "iso", "dmg", "pkg", "deb", "rpm",
      "pdf", "exe", "bin", "apk", "docx", "doc", "xlsx", "xls", "pptx", "ppt"
    ].includes(ext)
  ) {
    return "binary";
  }

  // 5. Code
  if (
    [
      "html", "htm", "css", "scss", "sass", "less", "js", "jsx", "ts", "tsx", "mjs", "cjs",
      "json", "json5", "xml", "yaml", "yml", "toml", "py", "java", "c", "cpp", "cc", "cxx",
      "h", "hpp", "cs", "go", "rs", "php", "rb", "sh", "bash", "zsh", "bat", "cmd", "ps1",
      "sql", "graphql", "gql", "vue", "svelte", "dart", "swift", "kt", "kts", "lua", "r",
      "wasm", "env", "ini", "conf", "config", "dockerfile", "makefile"
    ].includes(ext) ||
    note.contentFormat === "html" ||
    note.contentFormat === "css"
  ) {
    return "code";
  }

  // 6. Plain text
  if (["txt", "log", "text", "rtf"].includes(ext) || note.contentFormat === "plain") {
    return "text";
  }

  // 7. Default markdown
  return "markdown";
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes) || bytes < 0) return "";
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getFileFormatLabel(
  note?: { fileName?: string; fileType?: string; contentFormat?: string } | null,
  lang: string = "en"
): string {
  if (!note) return "";
  const name = (note.fileName || "").toLowerCase();
  const isTh = lang === "th";

  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "JPEG Image";
  if (name.endsWith(".png")) return "PNG Image";
  if (name.endsWith(".webp")) return "WebP Image";
  if (name.endsWith(".svg")) return "SVG Vector";
  if (name.endsWith(".gif")) return "GIF Animation";
  if (name.endsWith(".bmp")) return "BMP Image";
  if (name.endsWith(".ico")) return "ICO Icon";
  if (name.endsWith(".avif")) return "AVIF Image";
  if (note.fileType === "image") return isTh ? "รูปภาพ" : "Image";

  if (name.endsWith(".zip")) return "ZIP Archive";
  if (name.endsWith(".rar")) return "RAR Archive";
  if (name.endsWith(".7z")) return "7-Zip Archive";
  if (name.endsWith(".tar") || name.endsWith(".gz") || name.endsWith(".bz2")) return "Archive";
  if (name.endsWith(".pdf")) return "PDF Document";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "Word Document";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "Excel Spreadsheet";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "PowerPoint Presentation";
  if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".ogg") || name.endsWith(".m4a") || name.endsWith(".flac")) return "Audio File";
  if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov") || name.endsWith(".avi")) return "Video File";
  if (note.fileType === "binary") return isTh ? "ไฟล์ไบนารี" : "Binary File";

  if (note.contentFormat === "html" || name.endsWith(".html") || name.endsWith(".htm")) return "HTML";
  if (note.contentFormat === "css" || name.endsWith(".css")) return "CSS";
  if (name.endsWith(".js") || name.endsWith(".mjs") || name.endsWith(".cjs")) return "JavaScript";
  if (name.endsWith(".jsx")) return "React JSX";
  if (name.endsWith(".ts")) return "TypeScript";
  if (name.endsWith(".tsx")) return "React TSX";
  if (name.endsWith(".json")) return "JSON";
  if (name.endsWith(".py")) return "Python";
  if (name.endsWith(".rs")) return "Rust";
  if (name.endsWith(".go")) return "Go";
  if (name.endsWith(".java")) return "Java";
  if (name.endsWith(".c") || name.endsWith(".h")) return "C";
  if (name.endsWith(".cpp") || name.endsWith(".hpp")) return "C++";
  if (name.endsWith(".cs")) return "C#";
  if (name.endsWith(".php")) return "PHP";
  if (name.endsWith(".swift")) return "Swift";
  if (name.endsWith(".kt")) return "Kotlin";
  if (name.endsWith(".sql")) return "SQL";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "YAML";
  if (name.endsWith(".xml")) return "XML";
  if (name.endsWith(".sh") || name.endsWith(".bash") || name.endsWith(".zsh")) return "Shell";

  if (name.endsWith(".txt") || note.contentFormat === "plain") return isTh ? "ข้อความธรรมดา" : "Plain Text";
  return isTh ? "มาร์กดาวน์" : "Markdown";
}

