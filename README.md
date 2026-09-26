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

- <img src="./assets/icons/code.svg" width="16" height="16" align="center" /> **Real File Path & External Browser Launch**: The HTML preview address bar now displays workspace relative paths and `file:///` URLs, with an **Open in default browser** button and reliable, multi-tier clipboard copy.
- <img src="./assets/icons/sparkles.svg" width="16" height="16" align="center" /> **Comprehensive Tooltip Overhaul**: Replaced browser-native `title` attributes across the application with responsive, accessible Shadcn/Radix UI tooltips (Sidebar, TabBar, Breadcrumb, Panels, and Node Views).
- <img src="./assets/icons/palette.svg" width="16" height="16" align="center" /> **Configurable Slash Command (/) & Clean Placeholders**: Enable or disable Slash Commands in **Settings > Editor > Formatting Helpers**. When disabled, empty lines display a distraction-free placeholder without prompting for `/`.
- <img src="./assets/icons/video.svg" width="16" height="16" align="center" /> **Global Video Picture-in-Picture (PiP) & Media Pickers**: Floating cross-tab video playback, dedicated workspace video/image pickers with context menus, and native `luno-asset://` media caching in Electron.
- <img src="./assets/icons/file-text.svg" width="16" height="16" align="center" /> **High-Fidelity PDF & Document Exporting**: Print-to-PDF waits for web fonts, math formulas, and images to decode completely before printing, alongside DOCX document export generation.
- <img src="./assets/icons/refresh.svg" width="16" height="16" align="center" /> **Expanded Tip of the Day & Editing Polish**: New modern workflow tips, preserved multi-selection drag-and-drop in Sidebar, and guaranteed 1:1 blank line retention around headings.

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



