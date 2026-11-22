# Luno Note — Coding Convention

> **Purpose**: Practical coding standards for TypeScript, React, Localization, Error Handling, Testing, and Dependencies in Luno Note. Every contributor and AI agent MUST follow these conventions (`LN-TS-01`, `LN-I18N-01`, `LN-PERF-02`, `LN-TEST-01`).

---

## 1. File & Symbol Naming

| Kind | Convention | Examples in Luno Note |
| :--- | :--- | :--- |
| **React Components** | `PascalCase.tsx` | `NoteIcon.tsx`, `EmptyState.tsx`, `FloatingWindow.tsx`, `TableInteractiveOverlay.tsx` |
| **UI Primitives** | `kebab-case.tsx` (shadcn/Radix only) | `src/components/ui/alert-dialog.tsx`, `dialog.tsx`, `dropdown-menu.tsx` |
| **Hooks** | `useCamelCase.ts` | `useAppSettings.ts`, `useNotes.ts`, `useTabs.ts`, `useTranslation.ts` |
| **Utilities / Services** | `camelCase.ts` | `htmlUtils.ts`, `systemTabs.ts`, `iconRegistries.ts`, `dateTimeFormatter.ts`, `noteCrypto.ts` |
| **Test Files** | Co-located `<Target>.test.ts(x)` | `translations.test.ts`, `securityAndIntegrity.test.ts`, `WorkspaceMediaPickers.test.tsx` |
| **Constants** | `UPPER_SNAKE_CASE` | `APP_VERSION`, `SYSTEM_TAB_IDS`, `SAFE_CSS_COLOR_RE`, `DANGEROUS_EXTENSIONS` |
| **Custom DOM Events** | `luno:<domain>-<action>` (legacy `app:toggle-*` preserved) | `luno:open-settings`, `luno:open-help`, `luno:insert-audio`, `luno:insert-translation`, `luno:breadcrumb-mounted` |

---

## 2. Imports & Module Organization

1. **Path Alias**: Always use `@/` (mapped to `src/`) for cross-folder imports; use relative `./` only for sibling modules inside the same feature folder (e.g., `src/components/editor/`).
2. **Top-of-File Imports Only**: Never place `import` statements mid-file.
3. **No Wildcard Icon Imports (`LN-PERF-01`)**:
   - **Correct**: Import individual icons from `lucide-react` or register pack icons in `src/lib/iconRegistries.ts`.
   - **Forbidden**: `import * as LucideIcons from "lucide-react"`, `import * as TablerIcons from "@tabler/icons-react"`, `import * as PhosphorIcons from "@phosphor-icons/react"`.
4. **No Duplicate Imports**: Never declare duplicate imports from the same module (Vite/OXC rejects duplicate identifier declarations even if `tsc` tolerates identical declarations).

---

## 3. TypeScript & Electron IPC Typing (`LN-TS-01`)

1. **Strict `ElectronAPI` Contract**:
   - All Electron preload APIs MUST be declared explicitly in `src/vite-env.d.ts` (`interface ElectronAPI`).
   - Do NOT re-introduce `[key: string]: any` index signatures on `ElectronAPI`.
   - Access safely via `window.electronAPI?.methodName(...)` rather than `(window as any).electronAPI`.
2. **Avoid New `any`**:
   - Prefer explicit interfaces, `Record<string, unknown>`, or `unknown` with type narrowing in all new and refactored code.
3. **Translation Schema Safety**:
   - `src/translation/th.ts` is explicitly typed as `const th: TranslationSchema = { ... }` (where `TranslationSchema = typeof en`).
   - `useTranslation().t` accepts `TranslationKey | (string & {})` (`src/translation/translate.ts`), giving full IDE autocomplete for every dictionary key.

---

## 4. React Component & Hook Conventions (`LN-PERF-02`)

1. **Lazy State Initialization**:
   - Expensive `localStorage` reads or JSON parsing MUST be inside `useState(() => ...)` or lazy `useRef` initializers, never called unconditionally on every render (see `useTabs.ts`).
2. **Context Isolation**:
   - Use `useAppSettings()` for user preferences and theme settings.
   - Use `useKeyboardLanguage()` for live Thai/English keyboard layout detection — NEVER merge high-frequency typing state back into `AppSettingsContext`.
   - Use `useAppSettingsSafe()` inside shared primitives (`Dialog`, `NoteIcon`) that may render in isolated unit tests without an enclosing provider.
3. **Effect, Canvas & Startup Hygiene**:
   - Always clean up `window.addEventListener`, `setInterval`, `setTimeout`, `MutationObserver`, and `URL.createObjectURL` handles on unmount.
   - Continuous `requestAnimationFrame` canvas animations (e.g., `RelationsView.tsx`) MUST sleep when hidden (`width <= 0 || height <= 0 || document.hidden`) or when physics/camera/hover motion converges, cache `getComputedStyle(document.documentElement)` lookups via `MutationObserver`, and reuse module-scoped `Intl.Segmenter` instances (`src/lib/graphUtils.ts`).
   - Lazy-load heavy optional browser bundles (such as `mammoth.browser.min.js` in `src/lib/docxUtils.ts`) on demand rather than injecting them eagerly on application boot in `src/main.tsx`.
   - Use non-blocking `fs.promises.*` inside async Electron `ipcMain.handle` file I/O handlers so disk operations never block the main-process UI thread.
   - Never depend an event subscription `useEffect` on rapidly changing `state` when `[]` is sufficient (see `use-toast.ts`).
   - Never wrap components in redundant nested `<TooltipProvider>`s; rely on the root `<TooltipProvider>` in `src/App.tsx`.
4. **Prop Stability & Re-Exports**:
   - When extracting code from large components (e.g., `Editor.tsx`), re-export public symbols to preserve backward compatibility with existing consumers and tests.

---

## 5. Localization Convention (`LN-I18N-01`)

1. **React Components**: Always call `const { t } = useTranslation();` and reference keys from `src/translation/en.ts` and `src/translation/th.ts`.
2. **Non-React Utilities / Services**: Use `translate(lang, key, vars)` + `getActiveAppLanguage()` from `src/translation/translate.ts`.
3. **No Inline Language Ternaries**: Never write `isTh ? "ไทย" : "EN"` or `settings.language === "th" ? ... : ...` for UI labels (enforced by `src/translation/translations.test.ts`).
4. **No Dead Fallbacks**: Never write `t("common.cancel") || "Cancel"`. Every key in `en.ts` and `th.ts` is verified non-empty by unit tests.
5. **Interpolation Placeholders**: Use `{name}` placeholders identically in both `en.ts` and `th.ts` (placeholder parity is enforced by `translations.test.ts`).
6. **Date & Time Formatting**: Always format user-facing dates/times via `src/lib/dateTimeFormatter.ts` (`formatDate`, `formatTime`, `formatRelativeDateTime`, `formatDateForFileName`) so user `dateFormat` / `timeFormat` preferences apply everywhere.

---

## 6. Error Handling & Logging

1. **Never Fail Open on Security Operations**:
   - Sanitization (`sanitizeHtml.ts`), encryption (`noteCrypto.ts`), and path validation (`electron/main.js`) MUST fail closed on error.
2. **No Silent Empty `catch {}` Without Rationale**:
   - When intentionally ignoring non-critical browser/storage errors (e.g. `localStorage` unavailable in private mode or malformed URI decoding), add a brief comment explaining why (`catch { /* ignore storage quota errors */ }`).
   - For user-triggered actions (save, export, sync, import, delete), log with `console.warn`/`console.error` AND surface a localized destructive toast or error dialog.
3. **No Debug `console.log` in Production Code**:
   - Remove temporary debugging statements and hardcoded test strings before committing.

---

## 7. Testing & Dependency Discipline (`LN-TEST-01`)

1. **No Hardcoded App Versions in Tests**:
   - Compute future test versions dynamically relative to `APP_VERSION` (see `src/components/AppUpdateToastItem.test.tsx`).
2. **Required Test Coverage for Changes**:
   - Any security/storage fix → add regression test in `src/lib/securityAndIntegrity.test.ts` (or co-located module test).
   - Any new translation key → verified automatically by `src/translation/translations.test.ts`.
   - Any shared UI component or picker change → run co-located component tests (`showFileIcons.test.tsx`, `FavoritesAndTagsViewMode.test.tsx`, `WorkspaceMediaPickers.test.tsx`, `Editor.*.test.tsx`).
3. **Dependencies**:
   - Only add dependencies when existing packages (`lucide-react`, `@radix-ui/*`, `framer-motion`, `dompurify`, `jszip`, `marked`, `turndown`, `qrcode`) cannot solve the requirement cleanly.
   - Keep `@types/*` strictly in `devDependencies`.
   - Never commit alternate lockfiles (`bun.lock`, `yarn.lock`); Luno Note standardizes on `npm` (`package-lock.json`).
