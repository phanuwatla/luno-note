---
name: luno-note-standards
description: >-
  Enforces Luno Note's system-wide engineering, UI/UX, architecture, localization,
  security, and component reuse standards. Activate whenever designing, creating,
  modifying, refactoring, or reviewing any feature, UI component, modal, hook,
  Electron IPC handler, translation key, or test in the Luno Note repository.
---

# Luno Note — Engineering & Design Standards Skill

Use this skill as the mandatory operating guide for all work in **Luno Note** (`e:\luno-note`).
For full rule details and examples, read the authoritative documents in `docs/standards/`:
- [Engineering Standards (`LN-UI-01`..`LN-BC-01`)](../../../docs/standards/engineering-standards.md)
- [UI/UX Design Standards](../../../docs/standards/ui-ux-standards.md)
- [Coding Convention](../../../docs/standards/coding-convention.md)
- [Architecture Guidelines](../../../docs/standards/architecture-guidelines.md)

---

## A. UI/UX Preservation Rules (`LN-UI-01`, `LN-TW-01`, `LN-MDL-01`, `LN-ZIDX-01`)

1. **Inspect Reference UI First**: Before building or editing any view, inspect existing Luno Note reference screens (`HomeView`, `SettingsTabView`, `FavoritesTabView`, `TrashView`, `WorkspaceMediaPickerShell`). Preserve Luno Note's visual identity rather than inventing a different style.
2. **Design Tokens & Visual Signatures**:
   - Use semantic CSS variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`) — never hardcoded light/dark palette colors for surfaces or text.
   - Keep `rounded-2xl` on dialogs, floating windows, and settings cards; `rounded-xl` on buttons, inputs, menus, and toasts; `rounded-full` on pills.
   - Keep crisp input borders (`focus:border-primary`, no fuzzy ring glow).
   - Keep toasts neutral (`bg-card` + `text-foreground` title) with semantic status color on the **icon** only.
   - Use `bg-destructive text-destructive-foreground hover:bg-destructive/90` for destructive actions (never hardcoded `bg-red-600`).
3. **Tailwind CSS v3.4 Validity Only**:
   - NEVER use Tailwind v4 classes (`shadow-2xs`, `shadow-xs`, `rounded-xs`) or unbracketed custom opacity steps (`/8`, `/12`, `/18`). Use `shadow-sm`, `rounded-sm`, `bg-primary/[0.08]`, `bg-primary/[0.12]`, `bg-primary/[0.18]`, `z-20`, `py-0.5`.
   - In `src/index.css`, scope dark overrides for `midnight` / `cyberpunk` strictly under `.dark[data-style="..."]`, and never clobber `.rounded-full` or `[role="switch"]` border-radius.
4. **Overlay Tiers & Strict 7-Tier Z-Index Scale**:
   - Confirmation / destructive prompts → `<AlertDialog>` (`sm:max-w-md`, safe Enter behavior).
   - Forms / pickers / info modals → `<Dialog>` (`w-[calc(100vw-2rem)] sm:w-full`, `rounded-2xl`, scrollable on small viewports — never blocking `overflow-hidden`).
   - Full-screen image/video previews → `<MediaLightbox>`.
   - Draggable tool windows → `<FloatingWindow>` (header-scoped `dragControls`, `z-index` clamped `40..49`, hosted globally in `FloatingWidgetsHost`).
   - Strictly follow the Z-index scale: Sticky `z-10..20` < Chrome `z-30` < Floating `z-40..49` < Modal/Lightbox `z-50` < Popover/Select/Dropdown/ContextMenu `z-[60]` < Tooltip `z-[70]` < Toast `z-[80]` < Fullscreen Video `z-[90]`. NEVER use `z-[9999]`.
5. **Responsive & Accessible**:
   - Two-column views (`SettingsTabView`, `HelpTabView`) collapse to `flex-col md:flex-row` with semantic `<nav>` / `<main>`.
   - Never suppress `:focus-visible` globally; suppress focus outline only on `:focus:not(:focus-visible)`.
   - Every icon-only button needs a localized `aria-label` or `sr-only` text.

---

## B. Coding Standards (`LN-TS-01`, `LN-PERF-01`, `LN-PERF-02`, `LN-SEC-01`, `LN-SEC-02`)

1. **Strict Electron IPC Contract & Symlink-Aware Confinement**:
   - Every IPC handler in `electron/main.js` touching the filesystem MUST check `isPathAllowedForIpc()`, which validates both lexical and real filesystem paths (`resolveExistingRealPath` via `fs.realpathSync.native`) to block `../` traversal and symlink/Windows junction escapes, and blocks sensitive system/credential paths (`isCriticalSystemPath`: `.ssh`, `.gnupg`, `.aws`, `.azure`, `.kube`, `AppData`, `/etc`, `/var`, `/usr`, etc.).
   - Workspace root promotion handlers (`set-saved-workspace`, `read-workspace-tree`, `open-workspace-in-new-window`, `create-new-workspace`) MUST verify `isAllowedWorkspaceRoot()`, and `scanWorkspaceTree` / `read-directory-files` MUST skip symbolic links (`isSymbolicLink()`).
   - Every `ipcMain.handle` file I/O handler MUST use non-blocking `fs.promises.*` so main-process event loops never freeze during auto-save or media loads.
   - Every method exposed in `electron/preload.js` MUST be declared in `src/vite-env.d.ts` (`interface ElectronAPI`) — NEVER add `[key: string]: any` or `(window as any).electronAPI` / `Record<string, Function>`.
2. **Zero Wildcard Icon Imports & On-Demand Heavy Asset Loading**:
   - NEVER use `import * as ...` on `lucide-react`, `@tabler/icons-react`, or `@phosphor-icons/react`. Register pack icons via explicit named imports in `src/lib/iconRegistries.ts`.
   - NEVER eagerly inject large UMD/browser scripts (such as `mammoth.browser.min.js`) at application startup in `src/main.tsx` or `index.html`; lazy-load them on demand when the feature is invoked (`ensureMammothLoaded()` in `src/lib/docxUtils.ts`).
3. **React & Canvas Performance Hygiene**:
   - Wrap expensive initializers in lazy `useState(() => ...)` / `useRef`.
   - Keep `keyboardLanguage` isolated in `KeyboardLanguageContext` (`useKeyboardLanguage()`); never put high-frequency typing state into `AppSettingsContext`.
   - Continuous `requestAnimationFrame` canvas loops (such as `RelationsView.tsx`) MUST be demand-driven: pause when hidden in background tabs (`width <= 0 || height <= 0 || document.hidden`) or when physics/camera/hover animations converge, cache `getComputedStyle(document.documentElement)` lookups via `MutationObserver`, and reuse module-scoped `Intl.Segmenter` singletons (`src/lib/graphUtils.ts`).
   - Do not mount nested `<TooltipProvider>` wrappers (root `src/App.tsx` owns the single `<TooltipProvider>`).
4. **Security & Data Integrity (International Standard)**:
   - `sanitizeHtml` fails closed (`return ""`). Always sanitize HTML from external document imports (`docxToHtml`), PDF/Print/DOC export generators (`generatePdfHtml`, `generateDocHtml`), and dynamic SVG/HTML strings (`dangerouslySetInnerHTML`). Validate dynamic SVG colors (`SAFE_CSS_COLOR_RE`), clamp numeric SVG dimensions (`clampNumericOption`), and sanitize custom `@font-face` rules.
   - OAuth 2.0 loopback flows (`google-oauth-login`) MUST enforce both PKCE (`code_challenge`) and cryptographic `state` CSRF verification (`queryState === oauthState`), sanitize loopback HTML parameters, and emit `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
   - Hidden `BrowserWindow`s (`print-content`, `export-pdf`) MUST enable `sandbox: true`, deny `setWindowOpenHandler`, and block `will-navigate`. `<webview>` and fallback `<iframe>`s must block `javascript:`/`vbscript:`, verify `file://` targets with `isPathAllowedForIpc`, and omit `allow-same-origin` on `data:`/`blob:`/`file:` iframe sandboxes.
   - Validate clipboard image payloads (`^data:image\/[a-z0-9.+-]+;base64,...`) in `write-clipboard-image` before constructing HTML clipboard markup.
   - Never store locked note plaintext in `localStorage` recovery backups (`if (!note.isLocked)`).
   - Never persist `userName`, `geminiApiKey`, or `googleDriveClientId` in `.luno/settings.json` or Drive sync.
   - Send Gemini API keys via `x-goog-api-key` header (never URL `?key=`).
   - Never auto-share uploaded Google Drive attachments (`anyone: reader`).
   - Keep PDF annotation keys (`luno-pdf-annotations:*`) and bookmark keys (`luno-pdf-bookmarks:*`) strictly disjoint.
5. **Keyboard Shortcuts (`LN-KBD-01`)**:
   - Every global shortcut has a single owner (`Index.tsx`); gate editor shortcuts on `editor.isFocused` and `Ctrl+S` on active pane; ignore floating tool keydown events when focus is inside editable inputs.

---

## C. Localization Standards (`LN-I18N-01`)

1. **100% Dictionary-Driven UI**:
   - React components use `const { t } = useTranslation();`.
   - Non-React helpers/services use `translate(lang, key, vars)` + `getActiveAppLanguage()` from `src/translation/translate.ts`.
   - Add every new key to BOTH `src/translation/en.ts` and `src/translation/th.ts` (`th: TranslationSchema`) with identical `{placeholder}` tokens.
2. **Forbidden Patterns** (enforced automatically by `src/translation/translations.test.ts`):
   - NO inline `isTh ? "ไทย" : "EN"` or `language === "th" ? ... : ...` ternaries in UI components.
   - NO dead `t("existing.key") || "Fallback"` fallbacks.
   - NO hardcoded Thai or English user-facing strings in toasts, aria-labels, tooltips, or modals.
   - NO ad-hoc `toLocaleDateString` / `toLocaleTimeString` — use `src/lib/dateTimeFormatter.ts`.

---

## D. Component Reusability Rules (`LN-REUSE-01`)

Follow this mandatory decision workflow before creating any file or helper:
**`Inspect → Compare → Reuse → Adapt → Extend → Create`**

Always check and reuse these canonical shared modules first:
- **UI Primitives** (`src/components/ui/`): 15 pure Radix primitives (`alert-dialog`, `button`, `context-menu`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `slider`, `switch`, `textarea`, `toast`, `toaster`, `tooltip`).
- **Shared Domain Components** (`src/components/shared/`):
  - `NoteIcon` — file/system/custom/locked icons respecting `showFileIcons` & `iconPack`
  - `EmptyState` — consistent empty views across tabs & panels
  - `PageLoader` — standardized startup-style page/view loading state across views, Suspense fallbacks, and media loaders
  - `MediaLightbox` — accessible full-screen media preview overlay
  - `FloatingWindow` & `FloatingWidgetsHost` — draggable floating tool shell & root singleton host
  - `useMarkdownCodeCopyTooltip` & `MarkdownFloatingTooltip` — AI markdown code copy & tooltips
  - `ShortcutsSection` & `AboutUpdateCard` — shared Settings/Help cards
  - `NoteCollectionPrimitives` — shared sort/filter/badge/view-mode hooks & helpers
  - `EditorCheckbox` — accessible task-style checkbox
- **Editor Shared Modules** (`src/components/editor/`): `WorkspaceMediaPickerShell`, `TableInteractiveOverlay`, `slashItems.tsx`, `turndownService.ts`, `extensions/editorExtensions.ts`.
- **Shared Utilities** (`src/lib/`): `htmlUtils.ts` (`escapeHtml`), `systemTabs.ts` (`isSystemTab`, `isWebViewerTab`, `isVirtualTab`), `fileIconUtils.ts` (`formatFileSize`), `dateTimeFormatter.ts`, `fixLanguageSystem.ts` (`triggerInAppFixLanguage`, `FIX_LANGUAGE_EVENT`).

---

## E. Feature Development Workflow

1. **Audit & Reuse**: Search `src/components/shared/`, `src/components/ui/`, `src/components/editor/`, and `src/lib/` before writing new code.
2. **Integrate Properly**:
   - New system tab → register in `src/lib/systemTabs.ts`, `src/components/shared/NoteIcon.tsx`, and `renderPaneViews()` in `src/pages/Index.tsx` (never duplicate across split/single panes).
   - New floating utility → wrap with `<FloatingWindow>` and register inside `FloatingWidgetsHost.tsx`.
   - New Electron IPC → add path confinement in `electron/main.js`, expose in `electron/preload.js`, type in `src/vite-env.d.ts`.
   - Preserve Breadcrumb portal IDs (`#breadcrumb-save-status-${paneId}`, `#breadcrumb-editor-actions-${paneId}`) and `luno:breadcrumb-mounted` events.
3. **Preserve Backward Compatibility (`LN-BC-01`)**: Never break `.md` format, `.luno/*`, PIN v1/v2 envelopes, or existing `localStorage` keys.
4. **Write Focused Tests**: Never hardcode `APP_VERSION` in update tests; add regression tests for bug/security fixes.

---

## F. Mandatory Pre-Delivery Enforcement Checklist

Before finishing ANY code task in Luno Note, verify every item:
- [ ] Reused existing `shared/` / `ui/` / `lib/` primitives where applicable (no copy-paste duplication).
- [ ] All Tailwind classes are valid v3.4 utilities; Z-index strictly follows the 7-tier scale; overlays match their intent tier (`AlertDialog` vs `Dialog` vs `MediaLightbox` vs `FloatingWindow`).
- [ ] All UI text exists in BOTH `src/translation/en.ts` and `src/translation/th.ts` with matching `{placeholders}`, zero inline `isTh?` ternaries, and zero dead `t() || ...` fallbacks.
- [ ] No wildcard icon imports (`import * as ...`), no new `ElectronAPI` `any`/`Function` casts, no leaked secrets/locked-note backups.
- [ ] All verification gates executed and passing:
  - `npx tsc --noEmit` (Exit 0)
  - `npm test` (100% passing, including `translations.test.ts` & `securityAndIntegrity.test.ts`)
  - `npm run build` (Exit 0)
  - `node --check electron/main.js` & `node --check electron/preload.js` (when Electron files changed)

---

## G. Skill Maintenance & Evolution Rules

Update this skill and `docs/standards/*` in the same PR/commit whenever:
- A new shared primitive is added to `src/components/shared/` or `src/lib/`.
- A new system tab, CustomEvent, Z-index tier, or Electron IPC security boundary is introduced.
- A recurring bug pattern is discovered that warrants a new rule ID (`LN-*`) or automated test guard.
Keep `SKILL.md` concise and actionable; place deep rationale and extended tables in `docs/standards/*`.
