## Release Notes - Luno Note v1.5.0

### Overview
Luno Note version 1.5.0 is a major release transforming Luno AI into a **Dual Cloud & Local AI Workspace** powered by both Google Gemini and 100% offline **Ollama**, featuring one-click model setup, live token streaming, automatic quota/offline fallback, built-in Luno Note product knowledge with strict confidentiality guardrails, a unified **System-Wide Motion Design Engine**, and crucial editor typing & rename queue stability upgrades.

### Key Improvements & New Features

#### 1. 100% Offline Local AI via Ollama & One-Click Model Manager
- **Dual AI Provider Support**: Seamlessly switch between **Gemini (Cloud)** and **Ollama (Local)** right from the Luno AI chat composer dropdown or **Settings > AI Assistant**. Works across multi-turn Luno AI chat and all 10 inline Editor AI writing tools.
- **One-Click Ollama Installer & Daemon Manager**: Automatically detects local Ollama installations, downloads and silently installs the official Windows runtime on demand, and launches the background service without manual CLI commands.
- **Recommended Model Catalog & Queue**: Install starter models (`Qwen 2.5 1.5B/3B/7B`, `Gemma 3 1B/4B`, `Llama 3.2 3B`) with live layer-weighted progress bars, serialized download queueing, stall/network-interruption automatic resume retries, Cancel support, and one-click Uninstall.
- **Silent Model Warm-up**: Preloads the active Ollama model (`keep_alive: "15m"`) when entering Luno AI so your first message responds faster.

#### 2. Live Token Streaming, Stop Control & Gemini → Ollama Auto-Fallback
- **Live NDJSON Token Streaming**: Watch local Ollama answers stream word-by-word in real time (filtering `<think>` reasoning tags) and stop mid-generation anytime with the new **Stop** button.
- **Smart Auto-Fallback**: Optional **Auto-fallback to Ollama** toggle keeps Gemini as your default while seamlessly falling back to an installed local Ollama model whenever Gemini hits quota limits (`429`), drops offline, or encounters transient 5xx server failures—accompanied by a clear notification toast and `Fallback` badge.

#### 3. Built-in Luno Product Knowledge & Confidentiality Guardrails
- **On-Demand Feature Guidance**: Dynamic topic-matched Luno Note feature references help both Gemini and Ollama answer workflow, menu, and shortcut questions accurately without inflating general chat prompts.
- **Strict Security & SSRF Protections**: Blocks non-HTTP(S) schemes, embedded credentials, redirects, and cloud metadata endpoints (`169.254.169.254`, `*.internal`) on custom Ollama URLs, isolates `ollamaBaseUrl` from shared workspace settings, and guards against prompt-injection or internal implementation disclosure.

#### 4. Unified System-Wide Motion Engine & Tactile Micro-Interactions
- **Centralized Motion Tokens & Hooks (`src/lib/motion.ts`)**: Shared spring transitions, `useAnimationsEnabled()`, `getScrollBehavior()`, and GPU-composited animations across tabs, views, sidebars, trees, checkboxes, and switches.
- **Accessible Reduced Motion**: Turning off animations in **Settings > General** cleanly clamps UI transitions and smooth scrolling down to `0.001ms` / `auto` across every component.

#### 5. Editor Typing Stability, Spell-Check Polish & File Rename Hardening
- **Zero Cursor Jumps in Headings**: Preserved `WidgetType` DOM identity inside collapsible H1–H6 headings and added an inline typing fast-path so rapid typing never resets cursor position.
- **Deferred Active-Word Spell Underlines**: Defers spell-check red underlines on the active word being typed until moving away or blurring, while integrating Hunspell checks into Wrong-Language detection so valid English words never trigger false Thai suggestions.
- **Hardened Concurrent File Renames**: Added slash normalization (`/` vs `\`), synchronous state tracking against disk watcher races, queued rename serialization, and async stale guards on H1 auto-renames.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.5.0.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.4.1

### Overview
Luno Note version 1.4.1 delivers a major system capability with the new **System Fix Language** (system-wide Thai/English mistyping converter), multimodal **AI Vision image attachments** in Luno AI, an interactive **Table Management Overlay**, enhanced **Media Players with Hover Volume Control**, and repository-wide **Architecture & Engineering Standards Hardening** ensuring high performance, security, and full localization.

### Key Improvements & New Features

#### 1. System-wide Thai/English Mistyping Fixer (System Fix Language)
- **Universal Layout Conversion**: Instantly convert mistyped text between Thai (Kedmanee) and English (QWERTY) layouts across any active application or inside Luno Note with a global shortcut.
- **Native Background Helper (`LunoFixLang.exe`)**: High-performance, lightweight native Windows helper running in the background for zero-latency cross-application text conversion.
- **Intelligent Dictionary Heuristics**: Bundled Thai dictionary verification and heuristic scoring preventing accidental conversion of intended words.
- **Desktop System Tray & Settings Integration**: Dedicated settings under Settings > General with auto-start configuration, status indicators, and conflict notifications.

#### 2. Multimodal AI Vision & Image Attachments in Luno AI
- **Image Input in AI Chat**: Attach and upload images directly to the Luno AI assistant chat panel for instant visual question answering, diagram explanation, math formulas, and OCR reading.
- **Gemini Multimodal Processing**: Powered by Google Gemini multimodal models with automatic image compression, base64 payload preparation, and thumbnail preview controls.

#### 3. Interactive Table Controls & Column/Row Manager
- **TableInteractiveOverlay**: Intuitive overlay controls attached to TipTap tables in the editor surface.
- **Effortless Row & Column Operations**: Insert, delete, and reorder rows and columns, toggle header rows, and merge cells in a single click without menu diving.

#### 4. Media Player Polish & Sleek Hover Volume Slider
- **VolumeHoverSlider**: Smooth, accessible hover volume control for embedded audio and video players.
- **WorkspaceMediaPickerShell**: Standardized modal shell for browsing and selecting workspace media files.

#### 5. System Architecture, Security & Standards Hardening
- **Strict Path Confinement (`LN-SEC-01`)**: Symlink-aware and junction-safe IPC path confinement (`isPathAllowedForIpc`) preventing directory traversal and access to sensitive OS locations.
- **Credential Encryption**: Google Drive OAuth tokens and sensitive credentials stored with Electron `safeStorage`.
- **Pure Radix UI Foundation**: Pruned obsolete UI components down to 15 standard Radix UI primitives.
- **Tree-Shaken Icon Registries**: Migrated all icon packs (Lucide, Tabler, Phosphor) to explicit registries, eliminating wildcard bundle bloat.
- **Pure Electron Streamlining**: Safely purged legacy Tauri build remnants and dependencies, standardizing on a clean Electron desktop runtime.
- **100% Dictionary-Driven Localization (`LN-I18N-01`)**: Completely verified translation keys across English and Thai with zero inline UI ternaries.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.4.1.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.4.0

### Overview
Luno Note version 1.4.0 is a major milestone release introducing an interactive in-app PDF editor and vector annotation suite (Inko Viewer), a high-performance CodeMirror 6 code editor engine with vertical indentation guides, collapsible heading folding (Heading Toggle) for structured writing, dual view modes (List & Card View) in Favorites and Tags, native JavaScript file support, and machine-isolated workspace settings for seamless multi-device portability.

### Key Improvements & New Features

#### 1. Interactive Inko PDF Editor & Vector Annotations
- **Complete In-App PDF Annotation Suite**: Full integrated Inko viewer featuring pen, highlighter, geometric shapes (rectangle, circle, line, arrow), text boxes, eraser, and laser pointer.
- **Non-Destructive Sidecar Architecture**: All drawings, shapes, and notes are saved separately in a lightweight sidecar format (`.luno-pdf`), guaranteeing the original base PDF remains completely untouched and pristine.
- **Smart Unsaved Changes Protection**: Automatic dirty detection and friendly confirmation dialog when closing tabs, closing other tabs, closing tabs to the right, closing all tabs, or exiting the application with unsaved PDF changes (Save / Discard / Cancel).
- **Flexible Export Capabilities**: Export as Flattened PDF (baked-in vector drawings and annotations) or original PDF with form data.
- **Reading Ergonomics**: Integrated in-PDF search with highlight navigation, zoom controls, thumbnail drawer, and page bookmarking.

#### 2. Advanced Code Editor Powered by CodeMirror 6
- **Next-Generation Code Engine**: Upgraded HTML, CSS, and JavaScript (.js, .mjs, .cjs) editing to CodeMirror 6 for lightning-fast responsiveness and syntax accuracy.
- **Visual Indentation Guide Lines**: Added subtle vertical indentation lines with customizable toggle in Settings > General (`showCodeIndentGuides`).
- **Interactive Color Widgets & Picker**: Automatic color badge previews directly alongside hexadecimal color codes, with click-to-edit color picker.
- **Integrated Search and Replace**: Floating find and replace panel with instant match counter, case sensitivity options, and keyboard shortcuts.
- **Code Folding & Wide-Line Scrolling**: Built-in fold gutters for blocks and functions, coupled with smooth horizontal document-width scrolling.

#### 3. Collapsible Headings & Document Sections (Heading Toggle)
- **Interactive Chevron Toggles**: Fold and collapse any section under H1–H6 headings directly in the note editor, keeping large documents clean and scannable.
- **Title Protection**: Document title (first H1) remains permanently unfolded for clean navigation.
- **Per-Note Persistence**: Remembers folded heading states per note across tab switches and application restarts.
- **Global Preference Setting**: Toggle heading fold arrows on or off via Settings > General (`toggleHeading`).

#### 4. Dual View Modes for Favorites & Tags (List & Card Views)
- **Flexible Presentation**: Seamlessly switch between compact List View and visual Card Grid View in both Favorites and Tags tab views.
- **Visual Harmony**: Automatically pulls custom note and folder icons and colors to match the sidebar tree view.
- **Persistent View Preference**: Preserves preferred view mode across application restarts.

#### 5. Native JavaScript Support & Clean Workspace Portability
- **Extended File Format Handling**: Native file creation, scanning, and editing for JavaScript files (`.js`, `.mjs`, `.cjs`) alongside Markdown, HTML, CSS, and Plain Text.
- **Machine-Isolated User Settings**: Personal user profile names (`userName`) are cleanly segregated from workspace configurations (`.luno/settings.json`), preventing profile overwrite when sharing or synchronizing workspaces across multiple devices.
- **Comprehensive Version History**: Automatic snapshots and diff previews across all supported file types, with automatic snapshot renaming on file rename and disk cleanup on note deletion.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.4.0.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.3.5

### Overview
Luno Note version 1.3.5 introduces an upgraded high-fidelity Markdown and code highlighting engine for Luno AI assistant, proactive security delegation for sensitive external services, streamlined process footprint optimization, and profile ergonomics.

### Key Improvements & New Features

#### 1. High-Fidelity Markdown & Code Syntax Highlighting in Luno AI
- **Multi-Language Code Highlighting**: AI assistant responses now format code blocks using the `lowlight` engine across JavaScript, TypeScript, Python, HTML, CSS, Bash, SQL, JSON, YAML, and more.
- **Language Headers & One-Click Copy**: Polished header bars display recognized programming language badges with one-click copy buttons and animated tooltip confirmations.
- **Optional Code Line Numbers**: Integrated setting honoring `showCodeLineNumbers` within AI chat code blocks.
- **Rich Document Elements**: Complete rendering support for tables, blockquotes, inline highlights (`==highlight==`), task lists, and accent headings (`accentHeadings`).
- **Independent Copy Actions**: Separated copy prompt vs copy response buttons with dedicated accessibility labels.

#### 2. Sensitive URL Delegation & External Browser Security
- **Proactive URL Interception**: Embedded webviewer automatically detects authentication portals, cloud consoles, and API key management interfaces (Google AI Studio, Google Cloud Console, Google Drive, OpenAI, Anthropic, Groq, OpenRouter, HuggingFace tokens).
- **Default Browser Redirection**: Delegates sensitive navigations safely to the host operating system's default browser via `shell.openExternal`, protecting users from bot detection blocks and credential compromise.
- **Bilingual Toast Notifications**: Displays informative toast messages guiding users when external delegation occurs.

#### 3. Streamlined Architecture & Native Process Cleanup
- **Zero Binary Bloat**: Replaced external PowerShell watchers and background binaries with pure JavaScript logic.
- **Cleaner Packaging**: Removed `asarUnpack` from build configuration, producing smaller and more secure distribution packages.
- **Enhanced Windows Installer**: Configured explicit desktop shortcuts, start menu shortcuts, and `asInvoker` execution level in the NSIS installer.

#### 4. Settings & Ergonomic Polish
- **Reset to Default User**: Added an inline button next to User Name in Settings > System/Other to quickly restore the host system username.
- **Unified Highlighter**: Synchronized syntax highlighter instances between TipTap editor and AI Assistant for optimal memory usage.
- **Editor Footnote Polish**: Refined footnote insert dialog button styling and hover interactions in note editor.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.3.5.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.3.4

### Overview
Luno Note version 1.3.4 delivers precision improvements to the in-app auto-update distribution system with semantic version validation, introduces a clean single-tab What's New launch experience on upgrades, and enhances editor ergonomics with context-aware cursor behavior and margin click protection.

### Key Improvements & New Features

#### 1. Semver Auto-Updater Precision & Retry Support
- **Semantic Version Verification**: Integrated a strict semver comparator (`isNewerVersion`) across both Electron main process and renderer store. Prevents false-positive update notifications when running the current or newer release.
- **Background Event Suppression**: Silences `update-available` events when remote versions do not exceed the installed version.
- **Intelligent Toast Behavior**: Prevents duplicate toasts during manual update checks in Settings, ensuring a clean and unobtrusive notification experience.
- **One-Click Retry**: Added localized **Retry** / **ลองใหม่** button to update notifications when download or checking errors occur due to network interruptions.

#### 2. Clean Single-Tab What's New on Version Upgrade
- **Distraction-Free Launch**: On first startup following a software update, cluttered session tabs are cleanly reset to present exclusively the What's New view as a single tab.
- **Safe Persistence**: Records seen version markers reliably so regular startup tab preferences resume naturally on subsequent launches.

#### 3. Context-Aware Cursor & Margin Click Precision
- **Margin Click Protection**: Outer scroll container around the note canvas now displays `cursor: default` and prevents accidental document-end jumps (`focus('end')`) when clicking outside note content.
- **Explicit Text Cursors**: Guaranteed `cursor: text` across editing elements including paragraphs, headings, lists, tables, and blockquotes.
- **Reading View Refinement**: Defaults to arrow pointer in reading view while preserving interactive pointer cursors for links, buttons, and task checkboxes.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.3.4.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.3.3

### Overview
Luno Note version 1.3.3 introduces an integrated Web Browser hub with a dedicated right-side drawer, visual media nodes in the Relations Knowledge Graph, accidental exit confirmation, an onboarding Welcome guide for new workspaces, real-time auto-update download progress indicators, accessible task checkboxes, and typing performance optimizations.

### Key Improvements & New Features

#### 1. Integrated Web Browser Hub & Right Drawer
- **Dedicated Navigation Drawer**: Seamlessly browse documentation, references, and websites alongside your notes without switching applications.
- **Chronological History & Fast Search**: Group browsing history intuitively into Today, Yesterday, and Earlier sections, complete with instant keyword search and item removal.
- **Bookmarks Management**: Save and organize favorite web pages with persistent storage and single-click access.
- **Full Privacy Data Clearing**: Securely wipe web cookies, HTTP cache, localStorage, and site data through Electron IPC.
- **Page Zoom Controls & Address Bar Actions**: Easily zoom in, zoom out, or reset to 100%, with integrated address bar shortcuts.
- **One-Click Note Insertion**: Quickly copy any visited URL as formatted Markdown or insert links directly into active notes through an intuitive note selector dialog with automatic favicon detection.

#### 2. Relations Graph Media Nodes Visualization
- **Visual Media Nodes**: Force-directed Knowledge Graph now displays media attachment nodes (images, video, audio) alongside markdown notes.
- **Interactive Media Filter**: Seamlessly toggle media node visibility (`showMedia` / `hideMedia`) to focus strictly on note relationships or explore complete multimedia connections.
- **Distinct Media Styling**: Customized visual badges, colors, and icons distinguish media assets from note nodes at a glance.

#### 3. Accidental Exit Confirmation & Safety Shield
- **Configurable Exit Confirmation**: Added `confirmBeforeExit` setting in **Settings > System/Other** (default: enabled).
- **Interactive Close Prompt**: Prompts for confirmation when closing the window to prevent accidental data loss or interruptions while actively editing.

#### 4. Real-Time Auto-Update Download Progress
- **Interactive Progress Bar**: Live download progress percentage indicator with interface typography directly within the toast notification.
- **Instant Restart Action**: One-click **Update & Restart** button immediately applies downloaded releases.

#### 5. Onboarding Welcome Guide for New Workspaces
- **Starter Welcome Note**: Optional generation of a comprehensive `Welcome.md` guide when creating a new workspace.
- **Practical Walkthrough**: Highlights formatting shortcuts, multimedia features, task management, and knowledge graph capabilities to get started immediately.

#### 6. Accessible Task Checkboxes & High-Speed Typing
- **Accessible Editor Checkboxes**: Dedicated `EditorCheckbox` component providing accessible, tactile, and responsive task item interactions.
- **Typing Latency Optimization**: Streamlined editor state updates eliminating input latency during rapid note taking.
- **Modularized Architecture**: Extracted reusable template definitions and typography helpers into clean, maintainable modules.
- **Security Hardening**: Enforced dangerous file extension restrictions preventing arbitrary script/binary execution in external shell handlers.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.3.3.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.3.2

### Overview
Luno Note version 1.3.2 introduces direct workspace path and browser navigation in the HTML Viewer, a comprehensive application-wide tooltip system migration, a configurable Slash Command (`/`) setting with clean dynamic placeholders, a global Picture-in-Picture (PiP) video player, high-fidelity PDF and Word (DOCX) export pipelines, and modernized tips and editing polish.

### Key Improvements & New Features

#### 1. HTML & Web Preview Navigation
- **Real File Path & Protocol Display**: The preview address bar displays relative workspace paths and `file:///` URLs instead of abstract preview identifiers.
- **Open in Default Browser**: Seamlessly launch the rendered HTML document in the operating system's default web browser with a single click.
- **True Clipboard Copy**: Resolved clipboard copying with robust multi-tiered fallback (`navigator.clipboard` and `document.execCommand`), ensuring paths are copied reliably across all desktop and browser environments.
- **Live Sync & Editing Persistence**: Automatic reload and state retention when editing workspace HTML documents.

#### 2. Comprehensive Tooltip System Overhaul
- **Modern UI Tooltips**: Fully replaced legacy browser `title` attributes with accessible, responsive Shadcn/Radix UI tooltips across the application.
- **Everywhere Navigation**: Polished tooltips for Sidebar file tree, TabBar actions, Breadcrumbs, Relations View graph controls, Trash actions, and Settings panels.
- **Clean Labeling**: Eliminated redundant dual-labels, ensuring singular, high-clarity tooltip hints for all icon buttons.

#### 3. Configurable Slash Command (/) & Clean Dynamic Placeholders
- **Slash Command Toggle**: Added `enableSlashCommand` setting under **Settings > Editor > Formatting Helpers** (default: enabled).
- **Distraction-Free Placeholders**: When Slash Commands are disabled, empty lines display a clean "Start writing here..." / "เริ่มเขียนข้อความที่นี่..." placeholder without prompting to use `/`.
- **Search Prompt Suppression**: When typing `/` while slash commands are disabled, the "Type to search..." placeholder is gracefully suppressed.
- **Polished Toggle List Headers**: Standardized toggle list title placeholders to clean, localized labels.

#### 4. Global Picture-in-Picture (PiP) & Media Enhancements
- **Cross-Tab Video PiP**: Floating Picture-in-Picture player lets you continue watching videos while writing or switching tabs.
- **Native `luno-asset://` Protocol**: High-performance local media streaming and caching in Electron for secure offline playback.
- **Workspace Media Pickers**: Dedicated dialogs for picking workspace videos and images with media context menus.
- **WebM Classifier**: Intelligent header detection distinguishing audio-only and video WebM containers.

#### 5. High-Fidelity PDF & Document Export
- **Resource-Synchronized Print-to-PDF**: Electron PDF export waits for web fonts, images (`img.decode()`), and math formulas to finish loading before rendering, eliminating blank images or un-styled fonts.
- **Rich Document Generation**: Robust DOCX document generation preserving document formatting.

#### 6. Productivity & Workflow Polish
- **Updated Tip of the Day**: Expanded and modernized tips library providing valuable shortcuts, markdown tricks, and feature guides.
- **Sidebar Multi-Drag**: Preserved multi-item selections during folder drag-and-drop operations in the sidebar.
- **Heading Line Spacing Preservation**: Guaranteed 1:1 blank line retention around headings across tab switches and saves.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.3.2.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.3.1

### Overview
Luno Note version 1.3.1 delivers major security enhancements, native video embedding, in-place QR Code editing, an anchored floating footnote popover, and an interactive in-app What's New release notes hub.

### Key Improvements & New Features

#### 1. Embedded Video Playback & Multimedia Support
- **Native Video Player**: Seamlessly embed and play MP4, WebM, and local video attachments directly inside the note editor.
- **Offline & Desktop Asset Resolution**: High-performance local caching (`videoLocalCache`) with Electron workspace integration and blob URL conversion.
- **Customizable Alignment & Sizing**: Control video alignment (left, center, right, justify) and responsive width constraints with a sleek player wrapper.

#### 2. In-Place QR Code Editing & Auto Detection
- **Direct Editor Modification**: Hover over any embedded QR code in a note to edit text content, foreground/background colors, and error correction levels without re-creating from scratch.
- **Automatic Content Recognition**: Scans and decodes existing QR codes automatically upon clicking the edit button, preserving existing layout and dimensions.

#### 3. Major Security Overhaul & Anti-Brute Force Protection
- **OWASP-Recommended PBKDF2 (600,000 Iterations)**: Upgraded cryptographic key derivation with 600,000 iterations of PBKDF2-HMAC-SHA256 and unique salts, rendering offline dictionary attacks computationally unfeasible.
- **Progressive Anti-Brute Force Lockout**: Escalating lockout cooldowns (3s -> 30s -> 120s) protect against automated PIN guessing. Lockout timers remain strictly enforced across tab switching and session reloads.
- **Multi-Format Text File Protection**: Full AES-GCM encryption support extended beyond Markdown to `.txt`, `.html`, and `.css` workspace files.
- **Distraction-Free Locked Note Mode**: Sensitive toolbar controls, action buttons, and autosave indicators remain concealed until unlocked.
- **Encrypted Trash Protection**: Locked notes moved to Trash retain full ciphertext security and never leak unencrypted contents.

#### 4. Interactive Floating Footnote Popover
- **Anchored Quick Insertion**: Minimalist floating popover anchored directly at the cursor insertion point to add or edit footnote references without losing focus.
- **Keyboard-Driven Workflow**: Press `Enter` to commit footnote reference, or `Escape` to cancel.

#### 5. Interactive What's New Hub
- **Dedicated Release View**: Accessible anytime from **Settings > About Luno** or **Help > About Luno** by clicking on the version number.
- **First-Run Automatic Showcase**: Automatically presents release highlights when opening a newly updated version for the first time.

#### 6. Version History & Split-Diff Enhancements
- **Synchronized Scrolling**: Dual-pane comparison viewer with lockstep scroll synchronization for side-by-side review.
- **Accurate Metrics**: Line-by-line diff summarization, word counts, and character statistics across Markdown, Plain Text, HTML, and CSS.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.3.1.exe` below.
- **In-App Auto-Update**: Existing desktop installations update automatically via **Settings > Check for Updates**.

---

## Release Notes - Luno Note v1.3.0

### Overview
Luno Note version 1.3.0 is a major feature update delivering an interactive Knowledge Graph (Relations View), full Workspace Custom Font management with runtime registration, an integrated QR Code generator, dynamic Custom Accent Color theming, a sleek VS Code-style Compact Activity Bar layout, redesigned Luno AI search and history synchronization, and workspace persistence across app updates.

### Key Improvements & New Features

#### 1. Interactive Knowledge Graph (Relations View)
- **Visual Note Network**: Dynamic canvas-based force-directed node-link graph visualizing relationships, bi-directional links, and cross-references across all notes.
- **Universal Link Extraction**: Automatically parses Wikilinks (`[[Target]]`, `[[Target|Alias]]`), standard Markdown links (`[text](target.md)`), and HTML `data-wikilink` references.
- **Interactive Physics & Navigation**: Smooth force-directed simulation with draggable nodes, zoom/pan controls, connection highlighting on hover, and one-click navigation to notes.
- **Filtering & Search**: Live in-graph search filter, tag-based filtering popover, and toggle between connected clusters and orphan documents.
- **Intelligent Typography**: Multi-line label wrapping with word-breaking support for both Thai and English.

#### 2. Workspace Custom Font Management
- **Local Font Installation**: Upload local `.ttf`, `.otf`, `.woff`, and `.woff2` font files directly into the workspace.
- **Cross-Platform Storage**: Automatically saves fonts to `.luno/fonts/` with metadata in `.luno/fonts.json` (supported across Electron desktop and Web File System API) with IndexedDB fallback.
- **Runtime Registration**: Dynamic CSS `@font-face` and browser `FontFace` API registration with immediate UI rendering.
- **Full Font Picker Integration**: Custom fonts appear in App Font, Editor Font, and the Editor Toolbar font dropdown.
- **Management UI**: Dedicated settings panel to preview, rename, and delete workspace custom fonts.

#### 3. Integrated QR Code Generator
- **ISO/IEC 18004 Standard**: High-resolution vector SVG and PNG QR Code generation for arbitrary text and URLs.
- **Color Customization**: Customizable foreground and background colors with transparency support and palette presets.
- **Configurable Error Correction**: Selectable ECC levels (L, M, Q, H) for optimal scannability.
- **Direct Editor Workflow**: One-click copy PNG image to clipboard, download as image file, or insert directly into note editor at current cursor position.

#### 4. Custom Accent Color Theming
- **User-Defined Accents**: New "Custom" theme option with a hex color input and curated accent palette selector.
- **Dynamic HSL Palette Calculation**: Real-time computation and injection of CSS variables (`--primary`, `--accent`, `--ring`, `--sidebar-primary`, etc.).
- **Adaptive Branding**: Dynamic SVG filter updates the application logo and document favicon to match the chosen accent color.

#### 5. Compact Activity Bar Layout (VS Code Style)
- **Streamlined Workflow**: Optional modern layout with a slim 52px Activity Bar on the far left.
- **Collapsible Explorer**: Independent collapsible Workspace Explorer panel for maximum screen real estate.
- **Quick Navigation**: Instant switching between Notes, Favorites, Tags, Relations, Luno AI, Trash, and Settings.

#### 6. Luno AI History Panel Redesign & Search
- **Thread Search**: Search filter input for past AI conversation threads with keyboard shortcut focus.
- **Drawer & Tab Synchronization**: Unified state management and smooth toggling between the sidebar drawer and full tab view.

#### 7. Workspace Persistence Across Updates
- **Seamless App Upgrades**: Electron main process now preserves the user's active workspace folder across updates, verifying local disk existence before opening.

#### 8. Plain-Text Snippet Extraction
- **Clean Previews**: Advanced sanitizer stripping YAML frontmatter, Markdown syntax, wikilinks, image tags, and HTML entities for card previews and search snippets.

### Installation and Updates
- **Windows (x64)**: Download `luno-note-setup-1.3.0.exe` below.
- **In-App Auto-Update**: Existing installations can update directly via **Settings > Check for Updates** or automatic background check.
