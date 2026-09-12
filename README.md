# Luno Note

<div align="center">

![Luno Note](electron/icon.ico)

### Modern, High-Performance Note-Taking Application

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/phanuwatla/luno-note/releases/tag/v1.2.1)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Desktop%20%7C%20Web-lightgrey.svg)](https://github.com/phanuwatla/luno-note)
[![Release](https://img.shields.io/github/v/release/phanuwatla/luno-note?color=brightgreen)](https://github.com/phanuwatla/luno-note/releases/latest)
[![Tests](https://img.shields.io/badge/tests-passing-success.svg)](https://github.com/phanuwatla/luno-note)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Luno Note is a robust, lightweight, and modern note-taking application engineered for productivity, structured thinking, and knowledge management. It integrates rich-text and Markdown editing, an intelligent Gemini AI assistant with voice dictation capabilities, hierarchical folder organization, visual version history with split-diff comparison, and automated desktop release updates.

[Download Version 1.2.1](https://github.com/phanuwatla/luno-note/releases/latest) | [Key Features](#key-features) | [What Is New in Version 1.2.1](#what-is-new-in-version-121) | [Automatic Updates](#in-app-automatic-updates) | [Development](#development)

</div>

---

## What Is New in Version 1.2.1

- **Gemini-Powered Voice Dictation and Transcription**: Dictate notes or communicate directly with Luno AI via multimodal audio transcription powered by the Google Gemini API. Includes automated silence filtering, hallucination prevention, timestamp cleanup, and native microphone access management in the desktop environment.
- **Unified Custom Icon Rendering**: Custom note emoji and file icons are now consistently rendered across Quick Switcher, sidebar hierarchy trees, workspace navigation panels, and file attachment chips.
- **Real-Time Workspace Folder Synchronization**: Folder expansion and collapse states remain synchronized across all active navigation views.
- **Enhanced Cloud Integration and Authentication**: Improved Google Drive OAuth configuration and environment variable resolution for production deployments.
- **Expanded Test Coverage and Reliability**: Additional automated unit tests for workspace trees and AI views, with intelligent fallback models and comprehensive verification.

---

## Key Features

- **Rich-Text and Markdown Editing**: Full formatting support including headings, lists, tables, checklists, task items, and code blocks with syntax highlighting.
- **Integrated Luno AI Assistant**: Context-aware artificial intelligence assistant supporting note attachments, voice dictation, automated summarization, language translation, and editing refinements.
- **Hierarchical Workspaces and Folders**: Multi-level folder structuring with workspace separation and quick workspace switching.
- **Tags and Quick Switcher**: Organize content using tags and jump directly to any document with the keyboard-driven Quick Switcher (`Ctrl+P` / `Cmd+P`).
- **Media and Audio Attachments**: Attach images, documents, and audio recordings with an integrated audio player and client-side image compression.
- **Version History and Split-Diff Comparison**: Review granular revisions with side-by-side and unified diff viewers, and restore snapshots with one click.
- **Live Note Preview**: Seamlessly toggle between direct editor view and fully rendered Markdown presentation.
- **Built-in Template Library**: Comprehensive collection of structured templates for meeting minutes, daily journals, project planning, sprint retrospectives, Cornell notes, and OKRs.
- **Customization and Visual Themes**: Select from Dark, Light, Sepia, and Minimal themes, with configurable typography, sizing, and icon sets (Lucide, Tabler, Phosphor).
- **Automated Desktop Updates**: Background update detection and one-click installation on Windows via GitHub Releases.

---

## Installation and Downloads

### Windows Installer (x64)

Download the production installer directly from [GitHub Releases](https://github.com/phanuwatla/luno-note/releases/latest):

| Package | Description | Link |
| :--- | :--- | :--- |
| **`luno-note-setup-1.2.1.exe`** | Automated Windows installer with differential update support | [Download v1.2.1](https://github.com/phanuwatla/luno-note/releases/download/v1.2.1/luno-note-setup-1.2.1.exe) |

> **Existing Installations**: Users running an earlier version can apply this update automatically by navigating to **Settings > Check for Updates** without manual re-installation.

---

## In-App Automatic Updates

Luno Note Desktop includes integrated update distribution powered by `electron-updater`:
1. The application checks GitHub Releases for new published versions automatically on startup or manually through **Settings > Check for Updates**.
2. When a newer version is published, the package is downloaded in the background.
3. Once the download completes, a prompt offers to **Restart & Install**, applying the update without data loss.

---

## Architecture and Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/), [Vite](https://vite.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/) and [Tauri](https://tauri.app/)
- **Rich-Text Engine**: [TipTap](https://tiptap.dev/) Core with Extensions (CodeBlockLowlight, Tables, TaskItems, Image, Link)
- **Styling and UI Components**: [Tailwind CSS](https://tailwindcss.com/) and [Radix UI](https://www.radix-ui.com/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (Multimodal Audio and Text)
- **Icon Libraries**: Lucide Icons, Tabler Icons, Phosphor Icons
- **Testing Framework**: [Vitest](https://vitest.dev/) with Testing Library

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



