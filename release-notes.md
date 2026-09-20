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
