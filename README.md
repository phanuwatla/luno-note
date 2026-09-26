# Luno Note

<div align="center">

<img src="electron/icon.ico" alt="Luno Note" width="160" height="160" />

### Modern, High-Performance Note-Taking Application

[![Version](https://img.shields.io/badge/version-1.3.2-26A295.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note/releases/tag/v1.3.2)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Desktop%20%7C%20Web-06B6D4.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note)
[![Release](https://img.shields.io/badge/release-v1.3.2-14B8A6.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note/releases/latest)
[![Tests](https://img.shields.io/badge/tests-passing-10B981.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note)
[![License](https://img.shields.io/badge/license-MIT-0EA5E9.svg?labelColor=64748B)](LICENSE)

Luno Note is a robust, lightweight, and modern note-taking application engineered for productivity, structured thinking, and knowledge management. It integrates rich-text and Markdown editing, an intelligent Gemini AI assistant with voice dictation capabilities, hierarchical folder organization, visual version history with split-diff comparison, and automated desktop release updates.

[Download Version 1.3.2](https://github.com/phanuwatla/luno-note/releases/latest) | [Key Features](#key-features) | [What Is New in Version 1.3.2](#what-is-new-in-version-132) | [Automatic Updates](#in-app-automatic-updates) | [Development](#development)

</div>

---

## What Is New in Version 1.3.2

- <img src="./assets/icons/code.svg" width="16" height="16" align="center" /> **Real File Path & External Browser Launch**: The HTML preview address bar now displays actual relative workspace paths and `file:///` URLs. Includes a dedicated **Open in default browser** button to view rendered pages externally and a robust multi-tiered clipboard copy action with fallback.
- <img src="./assets/icons/sparkles.svg" width="16" height="16" align="center" /> **Comprehensive Tooltip System Overhaul**: Completely migrated away from browser-native `title` attributes to modern, accessible, and responsive Shadcn/Radix UI tooltips across the Sidebar, TabBar, Breadcrumb, Node Views, Relations View, and Settings panels, eliminating dual-label artifacts.
- <img src="./assets/icons/palette.svg" width="16" height="16" align="center" /> **Configurable Slash Command (/) & Clean Placeholders**: Added `enableSlashCommand` setting in **Settings > Editor > Formatting Helpers**. When disabled, empty lines display a distraction-free placeholder without prompting for `/`, and search popups are cleanly suppressed.
- <img src="./assets/icons/video.svg" width="16" height="16" align="center" /> **Global Video Picture-in-Picture (PiP) & Media Pickers**: Keep watching videos across tabs with a floating Picture-in-Picture (PiP) player. Includes dedicated Workspace Video and Image picker dialogs with context menus and a high-performance `luno-asset://` protocol in Electron for fast offline streaming.
- <img src="./assets/icons/file-text.svg" width="16" height="16" align="center" /> **High-Fidelity PDF & Word (DOCX) Exporting**: Upgraded Print-to-PDF pipeline that synchronizes and awaits web fonts, high-resolution images (`img.decode()`), and math formulas before rendering, paired with a rich DOCX export generator.
- <img src="./assets/icons/shield-check.svg" width="16" height="16" align="center" /> **Smart WebM Audio/Video Classification**: Intelligent container header inspection distinguishes audio-only from video WebM files to automatically render the appropriate audio player or video canvas.
- <img src="./assets/icons/refresh.svg" width="16" height="16" align="center" /> **Productivity Polish & Editing Precision**: Preserves multi-selection state during drag-and-drop operations in the Sidebar, guarantees 1:1 blank line and paragraph spacing retention around headings and blockquotes across tab switching, and adds an expanded modern Tip of the Day library.

---

## Key Features

- <img src="./assets/icons/file-text.svg" width="16" height="16" align="center" /> **Rich-Text and Markdown Editing**: Full formatting support including headings, lists, tables, checklists, task items, and code blocks with syntax highlighting.
- <img src="./assets/icons/sparkles.svg" width="16" height="16" align="center" /> **Integrated Luno AI Assistant**: Context-aware artificial intelligence assistant supporting note attachments, voice dictation, automated summarization, language translation, and editing refinements.
- <img src="./assets/icons/folders.svg" width="16" height="16" align="center" /> **Hierarchical Workspaces and Folders**: Multi-level folder structuring with workspace separation and quick workspace switching.
- <img src="./assets/icons/tags.svg" width="16" height="16" align="center" /> **Tags and Quick Switcher**: Organize content using tags and jump directly to any document with the keyboard-driven Quick Switcher (`Ctrl+P` / `Cmd+P`).
- <img src="./assets/icons/paperclip.svg" width="16" height="16" align="center" /> **Media and Audio Attachments**: Attach images, documents, and audio recordings with an integrated audio player and client-side image compression.
- <img src="./assets/icons/history.svg" width="16" height="16" align="center" /> **Version History and Split-Diff Comparison**: Review granular revisions with side-by-side and unified diff viewers, and restore snapshots with one click.
- <img src="./assets/icons/eye.svg" width="16" height="16" align="center" /> **Live Note Preview**: Seamlessly toggle between direct editor view and fully rendered Markdown presentation.
- <img src="./assets/icons/template.svg" width="16" height="16" align="center" /> **Built-in Template Library**: Comprehensive collection of structured templates for meeting minutes, daily journals, project planning, sprint retrospectives, Cornell notes, and OKRs.
- <img src="./assets/icons/palette.svg" width="16" height="16" align="center" /> **Customization and Visual Themes**: Select from Dark, Light, Sepia, Minimal, and Custom themes, with configurable typography, sizing, and icon sets (Lucide, Tabler, Phosphor).
- <img src="./assets/icons/refresh.svg" width="16" height="16" align="center" /> **Automated Desktop Updates**: Background update detection and one-click installation on Windows via GitHub Releases.

---

## Installation and Downloads

### Windows Installer (x64)

Download the production installer directly from [GitHub Releases](https://github.com/phanuwatla/luno-note/releases/latest):

| Package | Description | Link |
| :--- | :--- | :--- |
| **`luno-note-setup-1.3.2.exe`** | Automated Windows installer with differential update support | [![Download v1.3.2](https://img.shields.io/badge/Download-v1.3.2-26A295?style=flat-square&logo=windows&logoColor=white)](https://github.com/phanuwatla/luno-note/releases/download/v1.3.2/luno-note-setup-1.3.2.exe) |

<img src="./assets/callout-note.svg" alt="Note: Users running an earlier desktop installation can apply this update automatically by navigating to Settings > Check for Updates without manual re-installation." width="100%" />

---

## In-App Automatic Updates

Luno Note Desktop includes integrated update distribution powered by `electron-updater`:
1. The application checks GitHub Releases for new published versions automatically on startup or manually through **Settings > Check for Updates**.
2. When a newer version is published, the package is downloaded in the background.
3. Once the download completes, a prompt offers to **Restart & Install**, applying the update without data loss.

---

## Architecture and Technology Stack

- <img src="./assets/icons/code.svg" width="16" height="16" align="center" /> **Frontend Framework**: [React 19](https://react.dev/), [Vite](https://vite.dev/), [TypeScript](https://www.typescriptlang.org/)
- <img src="./assets/icons/device-desktop.svg" width="16" height="16" align="center" /> **Desktop Runtime**: [Electron](https://www.electronjs.org/) and [Tauri](https://tauri.app/)
- <img src="./assets/icons/file-text.svg" width="16" height="16" align="center" /> **Rich-Text Engine**: [TipTap](https://tiptap.dev/) Core with Extensions (CodeBlockLowlight, Tables, TaskItems, Image, Link)
- <img src="./assets/icons/palette.svg" width="16" height="16" align="center" /> **Styling and UI Components**: [Tailwind CSS](https://tailwindcss.com/) and [Radix UI](https://www.radix-ui.com/)
- <img src="./assets/icons/sparkles.svg" width="16" height="16" align="center" /> **AI Integration**: [Google Gemini API](https://ai.google.dev/) (Multimodal Audio and Text)
- <img src="./assets/icons/shield-check.svg" width="16" height="16" align="center" /> **Testing Framework**: [Vitest](https://vitest.dev/) with Testing Library

---

## Development

### Prerequisites
- Node.js (version 20 or higher recommended)
- npm or bun

### Local Environment Setup
```bash
# Clone repository
git clone https://github.com/phanuwatla/luno-note.git
cd luno-note

# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Start Electron desktop in development mode
npm run electron:dev

# Execute automated test suites
npm test

# Build production web application bundle
npm run build

# Package Windows desktop installer
npm run electron:build
```

---

## License and Copyright

Copyright © 2026 [phanuwatla](https://github.com/phanuwatla). All rights reserved.  
Distributed under the MIT License.



