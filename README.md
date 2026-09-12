# Luno Note

<div align="center">

![Luno Note](electron/icon.ico)

### Modern, Fast, and Feature-Rich Note-Taking Application

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/phanuwatla/luno-note/releases/tag/v1.2.0)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Desktop%20%7C%20Web-lightgrey.svg)](https://github.com/phanuwatla/luno-note)
[![Release](https://img.shields.io/github/v/release/phanuwatla/luno-note?color=brightgreen)](https://github.com/phanuwatla/luno-note/releases/latest)
[![Tests](https://img.shields.io/badge/tests-passing-success.svg)](https://github.com/phanuwatla/luno-note)

*Luno Note เป็นแอปพลิเคชันจดบันทึกที่ทรงพลัง รวดเร็ว และออกแบบมาเพื่อเสริมประสิทธิภาพการทำงาน มีฟังก์ชันครบครันทั้งโหมด Markdown, WYSIWYG, ระบบ Template, ประวัติเวอร์ชัน, ระบบไฟล์แนบ และรองรับการอัปเดตอัตโนมัติบนเดสก์ท็อป*

[Download Latest Version (v1.2.0)](https://github.com/phanuwatla/luno-note/releases/latest) • [Features](#-features) • [What's New in v1.2.0](#-whats-new-in-v120) • [Development](#-development)

</div>

---

## 🌟 What's New in v1.2.0

- 👁️ **Live Note Editor Preview**: สลับดูตัวอย่างบันทึก (Preview Mode) ได้อย่างรวดเร็ว พร้อมแสดงผลจัดเต็มทั้ง Markdown, ภาพ, ตาราง และโค้ด
- 🔄 **Visual Version History Split Diff**: ตรวจสอบและเปรียบเทียบความแตกต่างของบันทึกแต่ละเวอร์ชันได้อย่างชัดเจน ทั้งแบบ Side-by-Side และ Unified Diff พร้อมกู้คืนเวอร์ชันที่ต้องการได้ทันที
- 📋 **Expanded Template Library**: เพิ่มคลังเทมเพลตมาตรฐานหลากหลายประเภท (บันทึกการประชุม, บันทึกประจำวัน, วางแผนโปรเจกต์, Sprint Retrospective, บันทึกสรุป Cornell, Book Review, OKRs ฯลฯ) พร้อมระบบสองภาษา (ไทย / อังกฤษ)
- 🎵 **Integrated Audio Player**: รองรับไฟล์เสียงแนบ (Audio Attachments) พร้อมตัวเล่นเสียงในตัว สามารถควบคุมการเล่นและเลื่อนแถบเวลาได้สะดวก
- 🛡️ **HTML Sanitization & Security**: เพิ่มระบบกรองและทำความสะอาดเนื้อหา HTML ป้องกันการแทรกสคริปต์ที่ไม่พึงประสงค์
- 🎨 **Enhanced UI & Accessibility**: ปรับแต่ง Context Menu, Dropdown Menu, Menubar, แถบ Sidebar, ป้ายกำกับแท็ก (Tags) และถังขยะ (Trash) ให้ลื่นไหลและสวยงามยิ่งขึ้น
- 🌐 **100% Translation Parity**: รองรับภาษาไทยและภาษาอังกฤษอย่างสมบูรณ์แบบ ผ่านการทดสอบครอบคลุมทุกคีย์คำศัพท์

---

## 🚀 Features

- **📝 Rich-Text & Markdown Editing**: สร้างบันทึกได้อย่างอิสระ รองรับทั้ง Heading, ลิสต์รายการ, ตาราง, Task Item เช็คลิสต์ และ Code Block พร้อมเน้นไวยากรณ์ (Syntax Highlighting)
- **📂 Workspaces & Folder Hierarchy**: จัดหมวดหมู่บันทึกด้วยระบบโฟลเดอร์หลายระดับ และสลับ Workspace ได้ตามต้องการ
- **🏷️ Smart Tags & Favorites**: ติดแท็กเพื่อจัดกลุ่มบันทึกข้ามโฟลเดอร์ พร้อมระบบค้นหาแบบละเอียดและเมนูรายการโปรด (Favorites)
- **📎 Media & Attachments**: แนบรูปภาพ ไฟล์ และคลิปเสียง พร้อมระบบบีบอัดภาพเพื่อประหยัดพื้นที่
- **🕒 Version History**: บันทึกประวัติการแก้ไขอัตโนมัติ ไม่ต้องกังวลเรื่องข้อมูลสูญหาย
- **🎨 Customization & Themes**: ปรับแต่งธีมสี (Dark / Light / Sepia / Minimal), รูปแบบฟอนต์ และขนาดตัวอักษรได้อิสระ
- **🔄 Auto-Update Ready**: มีระบบตรวจสอบและติดตั้งอัปเดตอัตโนมัติบนเดสก์ท็อป ไม่พลาดฟีเจอร์ใหม่

---

## 📥 Download & Installation

### Windows Installer (x64)

ดาวน์โหลดไฟล์ติดตั้งเวอร์ชันล่าสุดได้จาก [GitHub Releases](https://github.com/phanuwatla/luno-note/releases/latest):

| ไฟล์ | รายละเอียด | ดาวน์โหลด |
| :--- | :--- | :--- |
| **`luno-note-setup-1.2.0.exe`** | ตัวติดตั้งอัตโนมัติสำหรับ Windows (รองรับ Auto-Update) | [Download](https://github.com/phanuwatla/luno-note/releases/download/v1.2.0/luno-note-setup-1.2.0.exe) |

> **หมายเหตุสำหรับการอัปเดต:** ผู้ใช้ที่ติดตั้งแอปพลิเคชันเดสก์ท็อปอยู่แล้ว สามารถเปิด **Settings > Check for Updates** เพื่อดาวน์โหลดและติดตั้งเวอร์ชัน 1.2.0 ได้ทันทีโดยไม่ต้องดาวน์โหลดใหม่ด้วยตนเอง

---

## 🔄 In-App Auto-Update

Luno Note เดสก์ท็อปมาพร้อมกับระบบอัปเดตอัตโนมัติ (`electron-updater`):
1. แอปจะตรวจหาเวอร์ชันใหม่จาก GitHub Releases โดยอัตโนมัติ หรือกดตรวจหาได้จากหน้า **Settings**
2. เมื่อพบเวอร์ชันใหม่ ระบบจะดาวน์โหลดไฟล์ตัวอัปเดตในเบื้องหลัง
3. เมื่อดาวน์โหลดเสร็จสมบูรณ์ จะมีปุ่ม **"Restart & Install"** ให้ผู้ใช้คลิกเพื่อเริ่มใช้งานเวอร์ชันใหม่ได้ทันที

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/) / [Tauri](https://tauri.app/)
- **Editor**: [TipTap](https://tiptap.dev/) Core + Extensions (CodeBlockLowlight, Tables, TaskItems, Image, Link)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
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

# Run Tests
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


