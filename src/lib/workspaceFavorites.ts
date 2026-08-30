/**
 * Utility for persisting non-Markdown and workspace favorites in .luno/favorites.json
 * Enables full portability across different computers, sync services (Google Drive, Git, USB), and platforms.
 */

export interface WorkspaceFavoritesData {
  version: number;
  favorites: string[]; // List of relative file paths, e.g. ["images/photo.png", "doc.html", "data.txt"]
}

export async function saveWorkspaceFavorites(
  rootDirHandle: FileSystemDirectoryHandle | null,
  favoriteRelativePaths: string[]
): Promise<void> {
  const data: WorkspaceFavoritesData = {
    version: 1,
    favorites: Array.from(new Set(favoriteRelativePaths.filter(Boolean))).sort(),
  };
  const jsonStr = JSON.stringify(data, null, 2);

  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/favorites.json`;
        await electronAPI.writeFileContent({ fullPath, content: jsonStr });
        return;
      }
    } catch (err) {
      console.warn("Failed to write .luno/favorites.json in Electron", err);
    }
  }

  if (!rootDirHandle) return;

  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: true });
    const fileHandle = await metaDir.getFileHandle("favorites.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonStr);
    await writable.close();
  } catch (err) {
    console.warn("Failed to write .luno/favorites.json", err);
  }
}

export async function loadWorkspaceFavorites(
  rootDirHandle: FileSystemDirectoryHandle | null
): Promise<string[]> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = `${saved.folderPath}/.luno/favorites.json`;
        const content = await electronAPI.readFileContent(fullPath);
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed?.favorites)) {
            return parsed.favorites;
          }
        }
      }
    } catch {
      // file might not exist yet
    }
  }

  if (!rootDirHandle) return [];

  try {
    const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: false });
    const fileHandle = await metaDir.getFileHandle("favorites.json", { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.favorites)) {
      return parsed.favorites;
    }
  } catch {
    // not present
  }

  return [];
}
