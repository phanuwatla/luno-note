# Luno Note

<div align="center">

<img src="electron/icon.ico" alt="Luno Note" width="160" height="160" />

### Modern, High-Performance Note-Taking Application

[![Version](https://img.shields.io/badge/version-1.2.7-26A295.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note/releases/tag/v1.2.7)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Desktop%20%7C%20Web-06B6D4.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note)
[![Release](https://img.shields.io/badge/release-v1.2.7-14B8A6.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note/releases/latest)
[![Tests](https://img.shields.io/badge/tests-passing-10B981.svg?labelColor=64748B)](https://github.com/phanuwatla/luno-note)
[![License](https://img.shields.io/badge/license-MIT-0EA5E9.svg?labelColor=64748B)](LICENSE)

Luno Note is a robust, lightweight, and modern note-taking application engineered for productivity, structured thinking, and knowledge management. It integrates rich-text and Markdown editing, an intelligent Gemini AI assistant with voice dictation capabilities, hierarchical folder organization, visual version history with split-diff comparison, and automated desktop release updates.

[Download Version 1.2.7](https://github.com/phanuwatla/luno-note/releases/latest) | [Key Features](#key-features) | [What Is New in Version 1.2.7](#what-is-new-in-version-127) | [Automatic Updates](#in-app-automatic-updates) | [Development](#development)

</div>

---

## What Is New in Version 1.2.7

- <img src="./assets/icons/cloud.svg" width="16" height="16" align="center" /> **Native OS-Level Google OAuth Tab Closer**: Automated completion tab closing powered by a native Windows helper executable (`electron/closeTab.exe`) utilizing `SendInput` API, bypassing Chrome's restrictive tab-close security sandbox and refocusing Luno Note seamlessly.
- <img src="./assets/icons/file-text.svg" width="16" height="16" align="center" /> **Omni-Channel Image Pasting & Explorer File Support**: Full clipboard image support handling screenshots (`Win+Shift+S`), PrintScreen, browser image copies, and image files copied from Windows File Explorer (`Ctrl+C`).
- <img src="./assets/icons/shield-check.svg" width="16" height="16" align="center" /> **Multi-Layer Editor Insertion Fallback**: 8-tier insertion waterfall guaranteeing reliable image placement even when selection is positioned inside title headings (`H1`), code blocks, empty paragraphs, or container background padding.
- <img src="./assets/icons/paperclip.svg" width="16" height="16" align="center" /> **Synchronized Attachment Pre-Resolution**: Pre-calculates unique attachment filenames against the workspace `attachments/` directory before document insertion, ensuring zero path mismatch.
- <img src="./assets/icons/palette.svg" width="16" height="16" align="center" /> **Refined UI Typography**: Replaced monospace styling on in-app update download progress percentages with the standard interface font for visual consistency.

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
- <img src="./assets/icons/palette.svg" width="16" height="16" align="center" /> **Customization and Visual Themes**: Select from Dark, Light, Sepia, and Minimal themes, with configurable typography, sizing, and icon sets (Lucide, Tabler, Phosphor).
- <img src="./assets/icons/refresh.svg" width="16" height="16" align="center" /> **Automated Desktop Updates**: Background update detection and one-click installation on Windows via GitHub Releases.

---

## Installation and Downloads

### Windows Installer (x64)

Download the production installer directly from [GitHub Releases](https://github.com/phanuwatla/luno-note/releases/latest):

| Package | Description | Link |
| :--- | :--- | :--- |
| **`luno-note-setup-1.2.7.exe`** | Automated Windows installer with differential update support | [![Download v1.2.7](https://img.shields.io/badge/Download-v1.2.7-26A295?style=flat-square&logo=windows&logoColor=white)](https://github.com/phanuwatla/luno-note/releases/download/v1.2.7/luno-note-setup-1.2.7.exe) |

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



