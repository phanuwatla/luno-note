# Luno Note

<div align="center">

![Luno Note](electron/icon.ico)

### Modern, Fast, and Feature-Rich Note-Taking Application

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/phanuwatla/luno-note/releases/tag/v1.2.1)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Desktop%20%7C%20Web-lightgrey.svg)](https://github.com/phanuwatla/luno-note)
[![Release](https://img.shields.io/github/v/release/phanuwatla/luno-note?color=brightgreen)](https://github.com/phanuwatla/luno-note/releases/latest)
[![Tests](https://img.shields.io/badge/tests-passing-success.svg)](https://github.com/phanuwatla/luno-note)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

*Luno Note is a powerful, lightweight, and modern note-taking application designed for productivity, focus, and seamless knowledge management. Featuring rich-text and Markdown editing, an integrated Gemini AI assistant with voice dictation, folder hierarchy, visual version history with split diffs, and automated desktop updates.*

[Download Latest Version (v1.2.1)](https://github.com/phanuwatla/luno-note/releases/latest) • [Features](#-features) • [What's New in v1.2.1](#-whats-new-in-v121) • [Auto-Update](#-in-app-auto-update) • [Development](#-development)

</div>

---

## 🌟 What's New in v1.2.1

- 🎙️ **Gemini-Powered Voice Dictation & Speech-to-Text**: Dictate notes or talk directly to Luno AI with multimodal Gemini audio transcription. Includes intelligent silence/hallucination filtering, automatic timestamp stripping, and native microphone permission management in Desktop Electron.
- 🎨 **Enhanced Custom Icon Integration**: Custom note emoji and file icons are now consistently rendered across Quick Switcher, sidebar file tree, Luno AI workspace browser, and attached file chips.
- 🔄 **Real-Time Workspace Folder Sync**: Synchronize folder expansion and collapse states seamlessly across all workspace views and sidebar trees.
- 🔑 **Updated Cloud & OAuth Configuration**: Improved Google Drive credentials and environment variable handling for production builds.
- 🛡️ **Polished Error Handling & Testing**: Comprehensive unit tests for workspace trees and AI views, with intelligent fallback and model auto-discovery.

---

## 🚀 Features

- **📝 Rich-Text & Markdown Editing**: Create notes effortlessly with support for headings, lists, tables, checklists, task items, and code blocks with syntax highlighting.
- **🤖 Integrated Luno AI Assistant**: Context-aware AI assistant with note attachments, voice dictation, automated summarization, language translation, and writing improvements.
- **📂 Workspaces & Folder Hierarchy**: Organize notes with multi-level nested folders, workspace management, and quick workspace switching.
- **🏷️ Smart Tags & Quick Switcher**: Organize across folders with tags and jump to any note instantly using the Quick Switcher (`Ctrl+P` / `Cmd+P`).
- **📎 Media & Audio Attachments**: Attach images, documents, and audio clips with an integrated audio player and image compression.
- **🕒 Version History & Split Diff**: Inspect revisions with side-by-side and unified diff viewers, and restore snapshots with one click.
- **👁️ Live Note Preview**: Switch instantly between editing mode and full-rendered Markdown preview.
- **📋 Built-in Template Library**: Ready-to-use templates for meeting minutes, daily journals, project planning, sprint retrospectives, Cornell notes, and OKRs in both English and Thai.
- **🎨 Customization & Themes**: Choose from Dark, Light, Sepia, and Minimal themes, along with customizable fonts, font sizes, and icon packs (Lucide, Tabler, Phosphor).
- **🔄 Auto-Update Ready**: Seamless desktop updates on Windows via GitHub Releases.

---

## 📥 Download & Installation

### Windows Installer (x64)

Download the latest installer from [GitHub Releases](https://github.com/phanuwatla/luno-note/releases/latest):

| File | Description | Download |
| :--- | :--- | :--- |
| **`luno-note-setup-1.2.1.exe`** | Automatic installer for Windows (supports background auto-update) | [Download v1.2.1](https://github.com/phanuwatla/luno-note/releases/download/v1.2.1/luno-note-setup-1.2.1.exe) |

> **Updating from an existing desktop installation:** If you already have Luno Note installed, go to **Settings > Check for Updates** to automatically download and install v1.2.1 without downloading the installer manually.

---

## 🔄 In-App Auto-Update

Luno Note Desktop includes built-in automated updates powered by `electron-updater`:
1. The app automatically checks GitHub Releases for new updates in the background (or manually via **Settings > Check for Updates**).
2. When an update is detected, it is downloaded automatically in the background.
3. Once downloaded, a **"Restart & Install"** notification prompts you to apply the update seamlessly without data loss.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/) / [Tauri](https://tauri.app/)
- **Editor Engine**: [TipTap](https://tiptap.dev/) Core + Extensions (CodeBlockLowlight, Tables, TaskItems, Image, Link)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (Text & Audio Multimodal)
- **Icons**: Lucide Icons, Tabler Icons, Phosphor Icons
- **Testing**: [Vitest](https://vitest.dev/) + Testing Library

---

## 💻 Development

### Prerequisites
- Node.js (v20 or higher recommended)
- npm or bun

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/phanuwatla/luno-note.git
cd luno-note

# Install dependencies
npm install

# Run Web Development Server (Vite)
npm run dev

# Run Electron Desktop in Development Mode
npm run electron:dev

# Run Unit Tests
npm test

# Build Web Application
npm run build

# Build Windows Desktop Installer
npm run electron:build
```

---

## 📄 License & Credits

Copyright © 2026 [phanuwatla](https://github.com/phanuwatla). All rights reserved.  
Made with ❤️ by phanuwatla for productive thinkers and note-takers.


