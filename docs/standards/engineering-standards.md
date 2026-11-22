# Luno Note — Engineering Standards

> **Scope**: Authoritative, long-term engineering standard for the **Luno Note** repository (`Electron` + `React 18` + `TypeScript` + `Vite` + `Tailwind CSS v3` + `Radix UI` + `TipTap v3` + `CodeMirror 6`).
> **Companion Documents**:
> - [UI/UX Design Standards](./ui-ux-standards.md)
> - [Coding Convention](./coding-convention.md)
> - [Architecture Guidelines](./architecture-guidelines.md)
> - Permanent AI Agent Skill: [`.agents/skills/luno-note-standards/SKILL.md`](../../.agents/skills/luno-note-standards/SKILL.md)

---

## Core Engineering Principles

1. **Consistency First** — Every feature, modal, icon, shortcut, and translation must follow one shared system pattern.
2. **Preserve Existing Design** — Protect Luno Note's established visual identity (`rounded-2xl` containers, `rounded-xl` controls, crisp primary input borders, neutral-card colored-icon toasts, themes, and icon packs).
3. **Reuse Before Rebuild** — Follow `Inspect → Compare → Reuse → Adapt → Extend → Create` before adding any new UI primitive or helper.
4. **Architecture Over Shortcuts** — Fix root causes (context isolation, pane switchboard unification, root-hosted floating widgets) instead of adding local workarounds.
5. **One Standard, One Approach** — One HTML escaper, one tab classifier, one note icon resolver, one modal shell per intent, one translation mechanism.
6. **Evidence-Based Decisions** — Verify references, tests, types, and bundles before removing or changing shared abstractions.
7. **Backward Compatibility** — Never break existing user notes (`.md`), `.luno/*` metadata, PIN v1/v2 encrypted notes, or persisted `localStorage` settings.

---

## Master Rulebook (20 Standards)

### 1. `LN-UI-01` — Existing UI as Reference & Visual Identity Preservation
- **Rule Name**: Existing UI as Reference & Design Consistency
- **Purpose**: Ensure all new and modified interfaces match Luno Note's visual language and theme/appearance styles.
- **Requirements**:
  - Inspect existing reference screens (`HomeView`, `SettingsTabView`, `FavoritesTabView`, `TrashView`) before building new UI.
  - Use semantic CSS variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`) instead of hardcoded light/dark colors.
  - Keep `rounded-2xl` on dialogs, floating windows, and major cards; `rounded-xl` on buttons, inputs, menus, and toasts.
  - Use `<EmptyState />` from `@/components/shared/EmptyState` for empty lists, grids, and panels.
  - Use `<PageLoader />` from `@/components/shared/PageLoader` for full-view, tab, and media loading states so they match the application startup loader.
- **Rationale**: Luno Note supports 19 accent themes, custom accents, Light/Dark modes, and 7 appearance styles (`default`, `minimal`, `glass`, `neumorphism`, `midnight`, `cyberpunk`, `catppuccin`). Hardcoded colors break themes and contrast.
- **Correct Example**:
  ```tsx
  <EmptyState
    icon={<Star />}
    title={t("favorites.noFavoriteNotesYet")}
    description={t("favorites.clickTheStarIconOn")}
  />
  ```
- **Incorrect Example**:
  ```tsx
  <div className="bg-white text-gray-800 rounded-[14px] p-7">No items</div>
  ```
- **Allowed Exceptions**: Syntax highlighting tokens, brand logos (e.g., Google Drive icon), and status icon accents (`text-emerald-500`, `text-amber-500`, `text-destructive`) on neutral `bg-card` containers.
- **Enforcement Scope**: All files under `src/components/**` and `src/pages/**`.

---

### 2. `LN-TW-01` — Tailwind CSS v3 Class Validity & Theme Scoping
- **Rule Name**: Strict Tailwind v3 Utility Validity & Dark-Mode Scoping
- **Purpose**: Prevent silent uncompiled CSS classes and light-mode contrast regressions.
- **Requirements**:
  - Use valid Tailwind CSS v3.4 utilities only (`bg-primary/[0.08]`, `bg-primary/[0.12]`, `bg-primary/[0.18]`, `shadow-sm`, `rounded-sm`, `z-20`, `py-0.5`).
  - Never use Tailwind v4-only classes (`shadow-2xs`, `shadow-xs`, `rounded-xs`) or unconfigured opacity steps (`/8`, `/12`, `/18`) without bracket syntax.
  - Never apply dark surface overrides in `src/index.css` to light-mode selectors (`[data-style="midnight"]` without `.dark`).
  - Never override `.rounded-full` or `[role="switch"]` border-radius inside appearance-style `button` rules.
- **Rationale**: Invalid Tailwind v3 utilities emit zero CSS rules silently, causing broken hover states, missing shadows, and broken z-index stacking.
- **Correct Example**:
  ```tsx
  className="bg-primary/[0.12] hover:bg-primary/[0.18] shadow-sm rounded-sm"
  ```
- **Incorrect Example**:
  ```tsx
  className="bg-primary/12 hover:bg-primary/18 shadow-2xs rounded-xs z-15"
  ```
- **Allowed Exceptions**: None.
- **Enforcement Scope**: All `.tsx`, `.ts`, and `.css` files (`src/index.css`, `tailwind.config.ts`).

---

### 3. `LN-MDL-01` — Modal, Dialog, Lightbox & Floating Window Standardization
- **Rule Name**: Intent-Based Overlay & Dialog Tiering
- **Purpose**: Standardize width, focus/keyboard behavior, scrollability, and visual framing across all overlays.
- **Requirements**:
  - **Destructive / binary confirmations** MUST use `<AlertDialog>` (`src/components/ui/alert-dialog.tsx`) with `sm:max-w-md` and destructive action styled with `bg-destructive text-destructive-foreground hover:bg-destructive/90`.
  - **Forms, pickers, and informational dialogs** MUST use `<Dialog>` (`src/components/ui/dialog.tsx`) with `rounded-2xl`, `w-[calc(100vw-2rem)] sm:w-full`, and tier max-width (`sm:max-w-md`, `sm:max-w-lg`, or `sm:max-w-2xl`). Never put `overflow-hidden` on `DialogContent` in a way that blocks mobile vertical scrolling.
  - **Full-screen media previews** MUST use `<MediaLightbox>` (`src/components/shared/MediaLightbox.tsx`).
  - **Draggable utility widgets** MUST use `<FloatingWindow>` (`src/components/shared/FloatingWindow.tsx`) with `dragControls` restricted to the header/grip bar and z-index strictly within `40..49`.
  - Pressing `Enter` inside `<AlertDialog>` when focus is on `<AlertDialogCancel>` MUST activate Cancel, never the destructive action.
- **Rationale**: Eliminates modal size/padding drift, prevents accidental deletion on Enter, and guarantees dialogs always stack above floating widgets.
- **Correct Example**:
  ```tsx
  <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t("settings.disconnectModalTitle")}</AlertDialogTitle>
        <AlertDialogDescription>{t("settings.disconnectModalDesc")}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirm}>
          {t("settings.disconnect")}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```
- **Incorrect Example**:
  ```tsx
  <Dialog open={open}>
    <DialogContent className="overflow-hidden">
      <button className="bg-red-600 text-white" onClick={handleDelete}>Delete</button>
    </DialogContent>
  </Dialog>
  ```
- **Allowed Exceptions**: Specialized rich pickers (e.g., `IconPickerDialog`, `QrCodeDialog`) may use `sm:max-w-lg` or `sm:max-w-2xl` with internal scrollable regions.
- **Enforcement Scope**: All modals, dialogs, popovers, lightboxes, and floating windows.

---

### 4. `LN-ZIDX-01` — Unified 7-Tier Z-Index Scale
- **Rule Name**: Strict 7-Tier Stacking Hierarchy
- **Purpose**: Eliminate z-index arms races (`z-[9999]`) where floating widgets cover modals or tooltips hide under menus.
- **Requirements**:
  - Use ONLY the defined 7 tiers (defined as CSS variables in `src/index.css`):
    1. Sticky / Pane headers: `z-10` (`--z-sticky: 10`)
    2. Sidebar / Drawer / Window chrome: `z-30` (`--z-chrome: 30`)
    3. Floating utility windows & PiP: `z-40`..`z-[49]` (`--z-floating: 40`)
    4. Modal & Lightbox overlays: `z-50` (`--z-modal: 50`)
    5. Popovers, Selects, Dropdowns & Context Menus (must work inside Modals): `z-[60]` (`--z-popover: 60`)
    6. Tooltips & Markdown floating tooltips: `z-[70]` (`--z-tooltip: 70`)
    7. Toasts & Critical notifications: `z-[80]` (`--z-toast: 80`)
    8. Fullscreen native video overlay: `z-[90]` (`--z-fullscreen: 90`)
- **Rationale**: Guarantees predictable layering (e.g., Select dropdown inside a Dialog at `z-[60] > z-50`; Dialog always above FloatingCalculator at `z-50 > z-[41..44]`).
- **Correct Example**: `className="z-[60]"` on `PopoverContent`, `z-[70]` on `TooltipContent`, `z-[80]` on `ToastViewport`.
- **Incorrect Example**: `className="z-[9999]"` or `zIndex: 10000` or `z-50` on a floating utility tool.
- **Allowed Exceptions**: None.
- **Enforcement Scope**: All positioned/portal UI components and `src/index.css`.

---

### 5. `LN-REUSE-01` — Reuse Before Rebuild & Single Source of Truth
- **Rule Name**: Shared Primitives & Utilities First
- **Purpose**: Prevent copy-paste divergence across views and features.
- **Requirements**:
  - Reuse existing shared primitives before authoring custom markup:
    - Note icons: `<NoteIcon />` (`src/components/shared/NoteIcon.tsx`)
    - Empty states: `<EmptyState />` (`src/components/shared/EmptyState.tsx`)
    - Full-screen media lightbox: `<MediaLightbox />` (`src/components/shared/MediaLightbox.tsx`)
    - Floating draggable windows: `<FloatingWindow />` (`src/components/shared/FloatingWindow.tsx`)
    - AI Markdown code-copy & floating tooltips: `useMarkdownCodeCopyTooltip` + `<MarkdownFloatingTooltip />` (`src/components/shared/useMarkdownCodeCopyTooltip.tsx`)
    - Custom square checkbox: `<EditorCheckbox />` (`src/components/shared/EditorCheckbox.tsx`)
    - Workspace media picker dialog shell: `<WorkspaceMediaPickerShell />` (`src/components/editor/WorkspaceMediaPickerShell.tsx`)
    - Shortcuts & About cards: `<ShortcutsSection />`, `<AboutUpdateCard />`
    - Note collection sort/filter/view helpers: `src/components/shared/NoteCollectionPrimitives.tsx`
    - HTML escaping: `escapeHtml` (`src/lib/htmlUtils.ts`)
    - System/virtual tab checks: `isSystemTab`, `isWebViewerTab`, `isVirtualTab`, `isVirtualTabId` (`src/lib/systemTabs.ts`)
    - File size formatting: `formatFileSize` (`src/lib/fileIconUtils.ts`)
    - Date/time formatting: `src/lib/dateTimeFormatter.ts`
- **Rationale**: Prior audit found 8 duplicated `NoteIcon` functions, 5 `escapeHtml` copies, 4 `formatFileSize` copies, and image-filter drift (`.bmp`/`.avif`) between `FavoritesTabView` and `TagsTabView`.
- **Correct Example**: `import { NoteIcon } from "@/components/shared/NoteIcon";`
- **Incorrect Example**: Writing a local `function renderNoteIcon(note)` inside a new tab view.
- **Allowed Exceptions**: Feature-specific visual decorations that cannot be expressed cleanly via optional props on the shared component (prefer extending props first).
- **Enforcement Scope**: All new features and refactors in `src/`.

---

### 6. `LN-ARCH-01` — Modular File Structure & Clean Component Boundaries
- **Rule Name**: Clear Layering & Targeted Decomposition
- **Purpose**: Keep UI primitives, shared domain components, feature modules, hooks, and utilities cleanly separated.
- **Requirements**:
  - `src/components/ui/`: Pure Radix/shadcn design primitives ONLY (no app-specific domain logic).
  - `src/components/shared/`: Reusable Luno Note domain components shared by 2+ features.
  - `src/components/editor/`: Editor-specific node views, extensions (`extensions/`), slash catalog (`slashItems.tsx`), serialization (`turndownService.ts`), table overlay (`TableInteractiveOverlay.tsx`), and media pickers.
  - `src/hooks/`: React state & side-effect hooks (no heavy UI rendering).
  - `src/lib/`: Pure TypeScript business logic, storage, crypto, formatting, and API clients.
  - Never duplicate multi-view switchboards across split/single panes — use `renderPaneViews(pane)` in `src/pages/Index.tsx`.
- **Rationale**: Keeps large areas like `Editor.tsx` and `Index.tsx` maintainable and prevents feature drift between Split View and Single Pane modes.
- **Correct Example**: Adding a new TipTap extension in `src/components/editor/extensions/` and registering it in `Editor.tsx`.
- **Incorrect Example**: Adding 500 lines of a new extension or duplicate split-pane JSX directly into `Editor.tsx` or `Index.tsx`.
- **Allowed Exceptions**: Small component-private helpers (<40 lines) tightly coupled to one component's state.
- **Enforcement Scope**: Entire `src/` directory.

---

### 7. `LN-ARCH-02` — Root-Hosted Global Floating Overlays & Single Providers
- **Rule Name**: Single-Instance Global Overlays & Providers
- **Purpose**: Prevent duplicate widgets in Split View, state loss on tab switch, and redundant provider nesting.
- **Requirements**:
  - Mount `<TooltipProvider>` ONCE at the root in `src/App.tsx` (do not wrap individual components in nested `<TooltipProvider>`s).
  - Mount cross-tab floating overlays ONCE in `src/pages/Index.tsx` (`<GlobalVideoPip />`, `<FloatingWidgetsHost />`).
  - Communicate from editor panes to root-hosted overlays via typed `CustomEvent`s (`app:toggle-*`, `luno:insert-translation`, `luno:insert-audio`) carrying `paneId` when targeting a specific pane.
- **Rationale**: Hosting floating tools inside `Editor.tsx` caused duplicate instances in Split View and destroyed active timers/recordings when switching tabs.
- **Correct Example**: Dispatching `window.dispatchEvent(new CustomEvent("app:toggle-calculator"))` from `Editor.tsx`.
- **Incorrect Example**: Mounting `<FloatingCalculator />` inside `Editor.tsx`.
- **Allowed Exceptions**: Standalone unit tests that render a single component in isolation without `<App />` may wrap the test harness in `<TooltipProvider>`.
- **Enforcement Scope**: `src/App.tsx`, `src/pages/Index.tsx`, `src/components/**`.

---

### 8. `LN-PERF-01` — Bundle Discipline, Curated Icon Imports & Lazy Heavy Assets
- **Rule Name**: Zero Wildcard Icon Pack Imports, Lazy UMD Assets & Clean Dependencies
- **Purpose**: Keep production builds fast, bundles lean, startup instantaneous, and Vitest startup rapid.
- **Requirements**:
  - NEVER use wildcard imports (`import * as LucideIcons from "lucide-react"`, `@tabler/icons-react`, `@phosphor-icons/react`).
  - Register all icon pack entries as explicit named imports in `src/lib/iconRegistries.ts` and reference them via `src/lib/iconPacks.ts`.
  - NEVER eagerly inject large UMD/browser scripts (such as `mammoth.browser.min.js`) on application boot in `src/main.tsx` or `index.html`; lazy-load them on demand when the feature is invoked (`ensureMammothLoaded()` in `src/lib/docxUtils.ts`).
  - Remove unused npm dependencies promptly and never leave dead chunks in `vite.config.ts`.
- **Rationale**: Wildcard imports of 3 icon libraries forced Vite/Vitest to load ~13,550 modules (~8.3 MB of icon chunks), and eager loading of `mammoth.browser.min.js` added 647 KB of JS parse/compile overhead on every boot even when `.docx` import was never used.
- **Correct Example**: Adding a named icon import to `src/lib/iconRegistries.ts` and lazy-loading `mammoth.browser.min.js` inside `docxToHtml()`.
- **Incorrect Example**: `import * as PhosphorIcons from "@phosphor-icons/react";` or injecting `<script src="mammoth.browser.min.js">` unconditionally in `src/main.tsx`.
- **Allowed Exceptions**: None.
- **Enforcement Scope**: `src/main.tsx`, `src/lib/docxUtils.ts`, `src/lib/iconRegistries.ts`, `src/lib/iconPacks.ts`, `package.json`, `vite.config.ts`.

---

### 9. `LN-PERF-02` — React Hook, Context & Demand-Driven Canvas Hygiene
- **Rule Name**: Lazy Initializers, Isolated High-Frequency Contexts, Demand-Driven Animation Loops & Non-Blocking IPC I/O
- **Purpose**: Eliminate avoidable re-renders, idle CPU/GPU spin-loops, main-process event-loop stalls, and effect listener churn.
- **Requirements**:
  - Wrap expensive `localStorage` / parsing initializers in lazy `useState(() => ...)` or `useRef` initializers (never call `loadSavedTabs()` directly on every render).
  - Keep high-frequency ephemeral state (such as `keyboardLanguage`) in its own isolated context (`KeyboardLanguageContext` via `useKeyboardLanguage()`) rather than inside `AppSettingsContext`.
  - Continuous `requestAnimationFrame` canvas views (such as `RelationsView.tsx`) MUST be demand-driven: pause when hidden in background tabs (`width <= 0 || height <= 0 || document.hidden`) or when physics/camera/hover animations converge, cache `getComputedStyle(document.documentElement)` lookups via `MutationObserver`, and reuse module-scoped `Intl.Segmenter` singletons (`src/lib/graphUtils.ts`).
  - Electron `ipcMain.handle` file operations (`read-file-*`, `write-file-*`, `delete-file-or-folder`, `read-directory-files`, `rename-file-or-folder`, `copy-file-or-folder`) MUST use non-blocking `fs.promises.*` instead of synchronous `fs.*Sync`.
  - Never subscribe `window` / store listeners inside `useEffect(..., [state])` when `[]` is appropriate (e.g., `use-toast.ts`).
  - Never trigger duplicate initial data loads on mount (`useNotes.ts`).
- **Rationale**: Putting `keyboardLanguage` in `AppSettingsContext` re-rendered the entire component tree on every single keystroke, and an always-on 60–144 FPS `requestAnimationFrame` loop in `RelationsView` consumed CPU/GPU continuously even when hidden in a background tab.
- **Correct Example**: `const { keyboardLanguage } = useKeyboardLanguage();` and sleeping the canvas `requestAnimationFrame` loop when `!hasActiveMotion`.
- **Incorrect Example**: Unconditional `requestAnimationFrame(render)` with per-frame `getComputedStyle(document.documentElement)` and `new Intl.Segmenter()`.
- **Allowed Exceptions**: Effects that genuinely need to re-bind when a specific prop/ID changes (document clearly).
- **Enforcement Scope**: All hooks in `src/hooks/**`, canvas views (`src/components/RelationsView.tsx`, `src/lib/graphUtils.ts`), and `electron/main.js`.

---

### 10. `LN-I18N-01` — Complete Localization via Translation Dictionaries
- **Rule Name**: Single Localization Source (`en.ts` & `th.ts`)
- **Purpose**: Guarantee 100% consistent English and Thai UI without mixed-language regressions.
- **Requirements**:
  - All user-facing UI text MUST come from `src/translation/en.ts` and `src/translation/th.ts` via `useTranslation().t(...)` in React components or `translate(lang, key, vars)` (`src/translation/translate.ts`) in non-React utilities.
  - NEVER write inline `isTh ? "ไทย" : "EN"` or `settings.language === "th" ? ... : ...` ternaries for UI copy.
  - NEVER add dead unreachable `t("existing.key") || "fallback"` fallbacks (`t()` always resolves valid keys from `en.ts`/`th.ts`).
  - Both `en.ts` and `th.ts` MUST have identical keys, zero empty strings, zero duplicate keys, and identical `{placeholder}` tokens (enforced automatically by `src/translation/translations.test.ts`).
  - Format all user-facing dates and times via `src/lib/dateTimeFormatter.ts` (never ad-hoc `toLocaleDateString` / `toLocaleTimeString`).
- **Rationale**: Prevents Thai messages leaking into English mode, English labels stuck in Thai mode, and dead fallback clutter (1,329 removed).
- **Correct Example**: `toast({ title: t("codeBlock.copiedToClipboard"), description: t("codeBlock.copiedDesc") });`
- **Incorrect Example**: `<span>{isTh ? "คัดลอกแล้ว" : "Copied"}</span>` or `t("common.cancel") || "Cancel"`
- **Allowed Exceptions**: Long-form bilingual data/content modules explicitly allowlisted in `translations.test.ts` (`templates.ts`, `templateDefinitions.ts`, `tips.ts`, `welcomeNote.ts`, `WhatsNewView.tsx` release notes, `slashItems.tsx` search keywords, `thaiKeyboardMapper.ts`, `spellChecker.ts`, `wrongLanguageDetector.ts`, `iconPacks.ts` auto-folder keywords, `geminiApi.ts` prompts, `inkoPdfBridge.ts` Inko locale), the native language selector label `"ภาษาไทย"`, OS speech-voice name matching, and single-char Kedmanee hotkey literals.
- **Enforcement Scope**: Enforced automatically in CI/Vitest by `src/translation/translations.test.ts`.

---

### 11. `LN-SEC-01` — Electron Main-Process & IPC Security Boundary
- **Rule Name**: Symlink-Aware Workspace Confinement, OAuth CSRF Defense, Print/Webview Isolation & Secret Protection
- **Purpose**: Protect users' local files and OAuth credentials from path traversal, symlink/junction escapes, unapproved workspace promotion, OAuth Login CSRF, and arbitrary file execution.
- **Requirements**:
  - All Electron filesystem IPC handlers (`read-file-*`, `write-file-*`, `delete-file-or-folder`, `rename-file-or-folder`, `copy-file-or-folder`, `create-workspace-folder`, `read-directory-files`) and `luno-asset://` MUST validate paths through `isPathAllowedForIpc()` against active/recent workspaces and `userApprovedPaths`.
  - `isPathInsideRoot()` MUST validate both lexical (`path.resolve`) and real filesystem paths (`resolveExistingRealPath` via `fs.realpathSync.native`), and `scanWorkspaceTree` / `read-directory-files` MUST skip symbolic links (`isSymbolicLink()`).
  - `isCriticalSystemPath()` MUST block OS roots, `os.homedir()`, sensitive credential directories (`.ssh`, `.gnupg`, `.aws`, `.azure`, `.kube`, `.docker`, `.npmrc`, `.netrc`), Windows `WINDIR`/`ProgramFiles`/`APPDATA`/`LOCALAPPDATA` (except `luno-preview` in Temp), and POSIX `/etc`, `/var`, `/usr`, `/bin`, `/sbin`, `/System`, `/Library`, `/proc`, `/sys`, `/dev`.
  - Workspace promotion handlers (`set-saved-workspace`, `read-workspace-tree`, `open-workspace-in-new-window`, `create-new-workspace`) MUST verify `isAllowedWorkspaceRoot()`, and `create-new-workspace` MUST strip path traversal (`path.basename`) from `workspaceName`.
  - `google-oauth-login` MUST enforce both PKCE (`code_challenge`) and cryptographic `state` CSRF verification (`queryState === oauthState`), sanitize loopback HTML interpolations, and include `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`.
  - Hidden `BrowserWindow`s (`print-content`, `export-pdf`) MUST enable `sandbox: true`, deny `setWindowOpenHandler`, and prevent `will-navigate`. `<webview>` `will-navigate` MUST block `javascript:`/`vbscript:` and unauthorized `file://` URLs.
  - `write-clipboard-image` MUST validate `^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$` before constructing HTML clipboard markup.
  - Never set `bypassCSP: true` on custom protocols.
  - Persist OAuth tokens (`gdrive-auth.json`) encrypted via Electron `safeStorage` (with read-only backward-compatible plaintext migration).
  - Block dangerous executables/scripts (`.exe`, `.bat`, `.cmd`, `.ps1`, `.vbs`, `.js`, `.lnk`, `.url`, `.py`, `.chm`, `.iso`, `.vhd`, `.inf`, `.scf`, `.dll`, etc.) in `open-path`.
  - Keep `contextIsolation: true` and `nodeIntegration: false` on all BrowserWindows.
- **Rationale**: Prevents compromised web content or malicious notes from escaping workspace confinement via symlinks, promoting sensitive user folders to workspace roots, or executing scripts in hidden print windows.
- **Correct Example**: Checking `if (!isPathAllowedForIpc(targetPath)) return "";` with symlink-aware `isPathInsideRoot` before `await fs.promises.readFile(targetPath, "utf8")`.
- **Incorrect Example**: Lexical-only path checks or accepting arbitrary `folderPath` in `read-workspace-tree` without `isAllowedWorkspaceRoot()`.
- **Allowed Exceptions**: Paths explicitly chosen by the user through Electron native `dialog.showOpenDialog` / `dialog.showSaveDialog` (registered in `userApprovedPaths`).
- **Enforcement Scope**: `electron/main.js` and `electron/preload.js`.

---

### 12. `LN-SEC-02` — Renderer XSS, Crypto, API Keys & Privacy Hygiene
- **Rule Name**: Fail-Closed Sanitization Across Imports/Exports, Safe Crypto & Private-by-Default Cloud Sync
- **Purpose**: Eliminate XSS vectors, iframe sandbox escapes, DoS vectors, and accidental data leaks in renderer code.
- **Requirements**:
  - `sanitizeHtml` (`src/lib/sanitizeHtml.ts`) MUST fail closed (`return ""`), never fail open (`return rawHtml`).
  - Always sanitize dynamic SVG/HTML strings (`dangerouslySetInnerHTML`), imported external documents (`docxToHtml` in `src/lib/docxUtils.ts`), and export templates (`generatePdfHtml`, `generateDocHtml`) via `sanitizeHtml()`.
  - Validate CSS colors (`SAFE_CSS_COLOR_RE` / `getPrimaryColor`), clamp numeric SVG parameters (`clampNumericOption` in `src/lib/qrCode.ts`), strip CSS-breaking characters from `editorFontFamily`, and sanitize `@font-face` rules (`escapeCssSingleQuoted`, `sanitizeFontDataUrl`).
  - In `WebViewerView.tsx`, block `javascript:`/`vbscript:` URLs in `normalizeUrl`, disallow arbitrary user-typed `file:` URLs unless `isLocalPreview`, and omit `allow-same-origin` from the fallback `<iframe>` `sandbox` attribute whenever loading `data:`, `blob:`, or `file:` URLs.
  - Never write locked/encrypted note plaintext into `localStorage` recovery backups (`if (!note.isLocked)`).
  - Never include `userName`, `geminiApiKey`, or `googleDriveClientId` in workspace `.luno/settings.json` or Google Drive metadata sync (`sanitizeWorkspaceSettingsPayload`).
  - Never pass API keys in URL query parameters (`?key=...`); send via request header (`x-goog-api-key`).
  - Never automatically grant `anyone: reader` public permissions on uploaded Google Drive attachments; sharing must be explicit user action only.
  - Clamp PBKDF2 iteration counts parsed from untrusted encrypted envelopes (`100_000..2_000_000`).
- **Rationale**: Prevents XSS via `.docx` imports, PDF/DOC exports, QR/font payloads, prevents iframe sandbox escape on `data:`/`blob:` URLs, prevents API key leaks in logs/proxies, and protects private attachments on Google Drive.
- **Correct Example**: `return sanitizeHtml(html || "");` in `docxToHtml` and `dangerouslySetInnerHTML={{ __html: sanitizeHtml(svg) }}`.
- **Incorrect Example**: Returning raw `mammoth.convertToHtml` output or enabling `allow-scripts allow-same-origin` on a `data:`/`blob:` iframe.
- **Allowed Exceptions**: None.
- **Enforcement Scope**: All `src/lib/**`, `src/hooks/**`, and `src/components/**` security-sensitive code; verified by `src/lib/securityAndIntegrity.test.ts`.

---

### 13. `LN-DATA-01` — Storage Key Separation & Non-Destructive Persistence
- **Rule Name**: Namespaced Storage Keys & Non-Destructive Sidecars
- **Purpose**: Prevent silent data corruption or key collisions across localStorage and workspace files.
- **Requirements**:
  - Prefix every `localStorage` key uniquely by feature (`luno-pdf-annotations:*` vs `luno-pdf-bookmarks:*`, `notes-app-*`, `luno_backup_*`).
  - Verify storage key transformations with unit tests (`securityAndIntegrity.test.ts`).
  - Never overwrite or mutate original binary/PDF files silently; store annotations in `.luno/pdf-annotations/` sidecars.
  - Preserve file extensions on rename operations (`renameDriveFile` must not force `.md` onto `.css`/`.js`/`.pdf`).
- **Rationale**: A single prefix mismatch (`/^luno-pdf-sidecar:/` vs `luno-pdf-annotations:`) previously caused bookmark saves to overwrite entire PDF annotation JSON payloads.
- **Correct Example**: `k.replace(/^luno-pdf-annotations:/, "luno-pdf-bookmarks:")` verified by round-trip unit test.
- **Incorrect Example**: Sharing or mutating storage keys without prefix verification.
- **Allowed Exceptions**: Intentional migration helpers that read legacy keys and write to canonical keys.
- **Enforcement Scope**: `src/lib/**` storage modules and `src/hooks/**`.

---

### 14. `LN-A11Y-01` — Keyboard Focus Visibility & Semantic Landmarks
- **Rule Name**: Accessible `:focus-visible`, Semantics & Screen-Reader Labels
- **Purpose**: Ensure keyboard users and assistive tech can navigate Luno Note cleanly without visual clutter for mouse clicks.
- **Requirements**:
  - Never strip `:focus-visible` outlines globally (`outline: none !important` on `:focus`). Suppress outlines only on `:focus:not(:focus-visible)` and provide clear `:focus-visible` rings (`2px solid hsl(var(--primary) / 0.6)`).
  - Every icon-only button MUST have a localized `aria-label` or `<span className="sr-only">`.
  - Settings/Help layouts and pages MUST use semantic landmarks (`<nav>`, `<main>`).
  - `<EditorCheckbox>` MUST expose `role="checkbox"`, `aria-checked`, and `focus-visible` ring.
- **Rationale**: Preserves clean mouse UI while meeting WCAG keyboard navigation expectations.
- **Correct Example**: `button:focus:not(:focus-visible) { outline: none; } button:focus-visible { outline: 2px solid hsl(var(--primary) / 0.6); }`
- **Incorrect Example**: `aside button:focus { outline: none !important; }`
- **Allowed Exceptions**: Editor ProseMirror root where the text caret indicates focus.
- **Enforcement Scope**: `src/index.css` and all interactive components.

---

### 15. `LN-KBD-01` — Scoped, Non-Conflicting Keyboard Shortcuts
- **Rule Name**: Single-Owner, Context-Aware Keyboard Shortcuts
- **Purpose**: Eliminate double-toggle no-ops, Split View cross-pane misfires, and shortcuts hijacking text inputs.
- **Requirements**:
  - Every global shortcut has ONE owner (`Index.tsx` owns `Ctrl+N`, `Ctrl+O`, `Ctrl+W`, `Ctrl+Tab`, `Ctrl+\`, `Ctrl+,`, `Ctrl+Shift+L`, `Ctrl+Shift+A`, `Ctrl+Shift+C`, `Ctrl+Shift+T`).
  - `Ctrl+K` defers to Editor's Link Dialog when focused inside `.ProseMirror`, and opens Quick Search elsewhere.
  - `Ctrl+Shift+L` (Fix Language) is owned globally by `Index.tsx` + `src/lib/fixLanguageSystem.ts` (and Electron OS-wide `globalShortcut` via `electron/systemFixLanguage.js`), delegating to focused TipTap/CodeMirror editors via `luno:fix-language` and falling back to any focused `<input>`, `<textarea>`, `contentEditable`, `<webview>`, or same-origin `<iframe>`.
  - Editor formatting shortcuts MUST gate on `editor.isFocused`.
  - `Ctrl+S` in `Editor.tsx` MUST gate on the active pane (`data-editor-pane`).
  - Floating tool keydown handlers (e.g., `FloatingCalculator`) MUST return early when focus is in an `<input>`, `<textarea>`, `<select>`, or `[contenteditable]`.
  - Keep `ShortcutsSection.tsx` (`src/components/shared/ShortcutsSection.tsx`) synchronized with actual registered shortcuts.
- **Rationale**: Duplicate `Ctrl+Shift+C` / `Ctrl+Shift+T` handlers previously toggled Calculator/Clock twice (making the shortcut appear broken), and `FloatingCalculator` stole digit keys from note editing.
- **Correct Example**: Checking `if (target.closest("input, textarea, select, [contenteditable='true']")) return;` in floating widget listeners.
- **Incorrect Example**: Registering `Ctrl+Shift+C` in both `Index.tsx` and `Editor.tsx`.
- **Allowed Exceptions**: `Escape` inside an open modal/lightbox intentionally overrides background focus.
- **Enforcement Scope**: `src/pages/Index.tsx`, `src/components/Editor.tsx`, `src/components/Floating*.tsx`.

---

### 16. `LN-RWD-01` — Responsive Behavior Across Desktop & Narrow Viewports
- **Rule Name**: Adaptive Layouts & Safe Mobile Modals
- **Purpose**: Ensure Luno Note remains usable on narrow/split windows (`<768px`) as well as wide desktop monitors.
- **Requirements**:
  - Two-column tab views (`SettingsTabView`, `HelpTabView`) MUST collapse from `md:flex-row` sidebars into a horizontal scrollable category bar below `md` (`<768px`).
  - All dialogs MUST use `w-[calc(100vw-2rem)] sm:w-full` and `max-h-[90vh] overflow-y-auto` (or an explicit internal scroll body with `max-h-[85vh]`) so actions never clip off-screen.
  - Footer buttons MUST have `gap-2` when stacked vertically on mobile.
- **Rationale**: Fixed `w-64` sidebars previously crushed content panes on narrow split panes or compact viewports.
- **Correct Example**: `className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden"`
- **Incorrect Example**: `className="flex h-full"` with a non-collapsing `w-64 shrink-0` sidebar.
- **Allowed Exceptions**: Desktop-only native titlebar controls (hidden on mobile).
- **Enforcement Scope**: All tab views, pages, and dialogs.

---

### 17. `LN-TS-01` — Strict Interface Contracts & Typed Electron Bridge
- **Rule Name**: Typed IPC Bridge & Progressive Type Safety
- **Purpose**: Catch IPC signature mismatches and state bugs at compile time.
- **Requirements**:
  - Declare EVERY `window.electronAPI` method and event listener in `src/vite-env.d.ts` (`interface ElectronAPI`) whenever adding/changing handlers in `electron/preload.js`.
  - Never add `[key: string]: any` back to `ElectronAPI`.
  - Avoid introducing new `any` types in new or refactored code; prefer `unknown` with type guards or explicit interfaces.
  - Type `th.ts` explicitly as `const th: TranslationSchema = { ... }` so missing keys fail `tsc --noEmit` immediately.
- **Rationale**: Previously `ElectronAPI` had `[key: string]: any`, hiding typos and wrong IPC argument shapes.
- **Correct Example**: `const res = await window.electronAPI?.getSavedWorkspace();`
- **Incorrect Example**: `const api = (window as any).electronAPI; api.unknownMethod();`
- **Allowed Exceptions**: Interop boundaries with untyped TipTap/ProseMirror plugin internals where upstream types omit properties (narrow locally).
- **Enforcement Scope**: `src/vite-env.d.ts`, `src/translation/th.ts`, and all new/modified `.ts`/`.tsx` files.

---

### 18. `LN-ROUT-01` — Single-Shell Workspace Routing
- **Rule Name**: Tab-First HashRouter Architecture
- **Purpose**: Maintain one consistent workspace experience without stale parallel pages.
- **Requirements**:
  - The main workspace lives at `/` (`Index.tsx`).
  - Legacy deep routes (`#/settings`, `#/help`) redirect via `RedirectToMainTab` in `src/App.tsx` to `/` and dispatch `luno:open-settings` / `luno:open-help`.
  - Internal navigation MUST use React Router `<Link>` (never raw `<a href="/">` which breaks `HashRouter` under Electron `file://`).
- **Rationale**: Separate standalone `pages/Settings.tsx` and `pages/Help.tsx` drifted visually and broke Electron navigation.
- **Correct Example**: `<Link to="/">...</Link>` in `NotFound.tsx`.
- **Incorrect Example**: `<a href="/">Return to Home</a>` under `HashRouter`.
- **Allowed Exceptions**: External URLs opened via `openExternalUrl()` or `onOpenWebTab()`.
- **Enforcement Scope**: `src/App.tsx`, `src/pages/**`.

---

### 19. `LN-TEST-01` — Verification & Regression Guard Discipline
- **Rule Name**: Mandatory Pre-Merge Verification & Non-Hardcoded Tests
- **Purpose**: Guarantee every change compiles, passes lint checks cleanly, passes all unit tests, and builds cleanly.
- **Requirements**:
  - Never hardcode current app version numbers in tests when testing "newer version available" (compute relative to `APP_VERSION`, as fixed in `AppUpdateToastItem.test.tsx`).
  - Run `npx tsc --noEmit`, `npm test`, `npm run build`, and `node --check electron/main.js` before declaring work complete.
  - Add targeted regression tests for every bug fix, security fix, or shared utility added.
  - Keep `src/translation/translations.test.ts` green (parity, placeholders, no inline Thai ternaries).
- **Rationale**: Prevents regressions like `AppUpdateToastItem.test.tsx` breaking every time `APP_VERSION` bumps.
- **Correct Example**: `const NEXT_VERSION = bumpPatch(APP_VERSION);`
- **Incorrect Example**: `const NEXT_VERSION = "1.4.0";`
- **Allowed Exceptions**: Snapshot/migration tests explicitly verifying a historical envelope format (e.g. `v1` vs `v2`).
- **Enforcement Scope**: All `*.test.ts` / `*.test.tsx` files and CI/local verification.

---

### 20. `LN-BC-01` — Backward Compatibility & Zero Data Loss
- **Rule Name**: Non-Breaking User Vault, Settings & Crypto Compatibility
- **Purpose**: Guarantee seamless upgrades for existing Luno Note users.
- **Requirements**:
  - Keep `.md` note files standard, clean Markdown compatible with Obsidian/plain-text editors.
  - Keep reading legacy plaintext `gdrive-auth.json` seamlessly while migrating writes to `safeStorage`.
  - Keep supporting both v1 and v2 PIN encrypted note envelopes in `src/lib/noteCrypto.ts`.
  - Preserve existing `localStorage` preference keys and exported symbol compatibility when decomposing large modules (`Editor.tsx` re-exports extracted extensions/helpers).
  - Never modify user note vaults outside repository scope.
- **Rationale**: User notes are long-lived personal knowledge bases; breaking file formats or persisted settings destroys user trust.
- **Correct Example**: Extracting `createTurndownService` to `src/components/editor/turndownService.ts` and re-exporting it from `src/components/Editor.tsx`.
- **Incorrect Example**: Renaming `notes-app-settings` key in `localStorage` without migrating existing user settings.
- **Allowed Exceptions**: Explicit breaking migrations with automated backward-reading fallback approved by the maintainer.
- **Enforcement Scope**: All persistence, crypto, workspace I/O, and exported module APIs.
