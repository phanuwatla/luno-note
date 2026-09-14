## Release Notes - Luno Note v1.2.7

### Overview
Luno Note version 1.2.7 introduces a native OS-level Google OAuth completion tab closer, robust omni-channel image pasting with 8-tier fallback, synchronized attachment pre-resolution, and refined interface typography for update downloads.

### Key Improvements

#### Native OS-Level Google OAuth Completion Tab Closer
- **Guaranteed Browser Tab Closure**: Built-in native Windows helper executable (`closeTab.exe`) sends OS-level `Ctrl+W` (`VK_CONTROL` + `0x57`) via `SendInput` API, cleanly closing the loopback OAuth browser tab without being blocked by Chrome's `window.close()` security sandbox.
- **Visual Polish & Feedback**: Removed outline on button click, cleaned up sync state typography, and added live sync status polling.

#### Omni-Channel Image Pasting & Insertion Resiliency
- **Universal Clipboard & File Explorer Support**: Captures screenshots (`Win+Shift+S`), PrintScreen, browser image copies, and image files copied from Windows File Explorer (`Ctrl+C`).
- **8-Level Insertion Waterfall**: Resilient fallback handles cursor inside `H1` titles, code blocks, empty paragraphs, selection ranges, and container background padding.
- **Fast Synchronous Base64 to Blob**: Eliminates `TypeError: Failed to fetch` on large 2K/4K screenshot data URLs.
- **Synchronized Attachment Pre-Resolution**: Pre-checks workspace `attachments/` folder to prevent filename and path mismatch between editor and disk.

#### Interface Typography Improvement
- **UI Font for Update Downloads**: Replaced monospace styling with the application interface font on update download progress percentages in Settings and Help tabs.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.2.7.exe` below.
- **In-App Auto-Update**: Existing installations will detect version 1.2.7 via **Settings > Check for Updates** or automatic background check.
