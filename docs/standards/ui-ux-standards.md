# Luno Note — UI/UX Design Standards

> **Purpose**: Single reference for Luno Note's visual identity, design tokens, component conventions, overlay tiers, responsive layouts, and accessibility rules. Every UI change MUST preserve Luno Note's established design language (`LN-UI-01`).

---

## 1. Visual Identity & Brand Preservation

Luno Note's visual aesthetic is clean, calm, tactile, and desktop-native:

| Element | Luno Note Standard | Reference Files |
| :--- | :--- | :--- |
| **Dialogs & Floating Windows** | `rounded-2xl`, `border border-border/70`, `bg-card/95 backdrop-blur-md`, `shadow-xl` | [dialog.tsx](../../src/components/ui/dialog.tsx), [FloatingWindow.tsx](../../src/components/shared/FloatingWindow.tsx) |
| **Cards & Settings Groups** | `rounded-2xl border border-border/60 bg-card p-5 shadow-sm` | [SettingsTabView.tsx](../../src/components/SettingsTabView.tsx), [ShortcutsSection.tsx](../../src/components/shared/ShortcutsSection.tsx) |
| **Buttons, Inputs, Menus, Toasts** | `rounded-xl` (small icon buttons inside compact toolbars: `rounded-lg`, pill badges/minimized floating pills: `rounded-full`) | [button.tsx](../../src/components/ui/button.tsx), [input.tsx](../../src/components/ui/input.tsx), [toast.tsx](../../src/components/ui/toast.tsx) |
| **Input Focus Style** | Crisp primary border (`focus:border-primary`, `focus-visible:border-primary`), NO fuzzy outer ring glow on text fields | [input.tsx](../../src/components/ui/input.tsx), [textarea.tsx](../../src/components/ui/textarea.tsx) |
| **Toasts** | Neutral `bg-card` surface with `text-foreground` title; semantic color lives on the **status icon** (never solid red backgrounds for destructive toasts) | [toast.tsx](../../src/components/ui/toast.tsx), [toaster.tsx](../../src/components/ui/toaster.tsx) |
| **Destructive Actions** | `bg-destructive text-destructive-foreground hover:bg-destructive/90` (never hardcoded `bg-red-600`) | [alert-dialog.tsx](../../src/components/ui/alert-dialog.tsx) |
| **Accent Themes** | 19 built-in accent themes + Custom HSL accent, Light & Dark modes | [useAppSettings.ts](../../src/hooks/useAppSettings.ts), [index.css](../../src/index.css) |
| **Appearance Styles** | 7 styles: `default`, `minimal`, `glass`, `neumorphism`, `midnight`, `cyberpunk`, `catppuccin` | [index.css](../../src/index.css) |
| **Icon Packs** | 3 curated packs: `lucide`, `tabler`, `phosphor` via `getToolbarIcon()` & `<NoteIcon />` | [iconRegistries.ts](../../src/lib/iconRegistries.ts), [iconPacks.ts](../../src/lib/iconPacks.ts) |

---

## 2. Design Tokens & Tailwind CSS v3 Rules

### Semantic Color Tokens (defined in `src/index.css`)
Always use semantic tokens instead of hardcoded Tailwind palette shades for surfaces, text, and borders:
- Surfaces: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-muted/60`, `bg-accent`
- Text: `text-foreground`, `text-card-foreground`, `text-popover-foreground`, `text-muted-foreground`, `text-primary`, `text-primary-foreground`, `text-destructive`, `text-destructive-foreground`
- Borders: `border-border`, `border-border/60`, `border-input`, `border-primary`

### Tailwind CSS v3.4 Validity (`LN-TW-01`)
Luno Note uses **Tailwind CSS v3.4.17**. The following rules are mandatory:
- Use bracket syntax for non-default opacity steps: `bg-primary/[0.08]`, `bg-primary/[0.12]`, `bg-primary/[0.18]` (NEVER `/8`, `/12`, `/18`).
- Use `shadow-sm` (NEVER Tailwind v4 `shadow-2xs` or `shadow-xs`).
- Use `rounded-sm` (NEVER Tailwind v4 `rounded-xs`).
- Use `py-0.5` (NEVER `py-0.2`) and `z-20` (NEVER `z-15`).
- In `src/index.css`, scope dark background overrides for `midnight` / `cyberpunk` strictly under `.dark[data-style="..."]` so light mode contrast is never broken.
- Never override `.rounded-full` or `[role="switch"]` border-radius inside appearance-style button rules.

---

## 3. Unified 7-Tier Z-Index Scale (`LN-ZIDX-01`)

Defined as CSS variables in `src/index.css` (`:root`) and applied consistently across all primitives and components:

| Tier | Token | Tailwind Class | Usage |
| :---: | :--- | :--- | :--- |
| **1** | `--z-sticky: 10` | `z-10` / `z-20` | Sticky headers, editor toolbar, table overlay controls |
| **2** | `--z-chrome: 30` | `z-30` | WindowControls, mobile sidebar drawer, right panels |
| **3** | `--z-floating: 40` | `z-40`..`z-[49]` | `FloatingWindow` widgets (Calculator, Clock, Translator, Audio Recorder), `GlobalVideoPip` |
| **4** | `--z-modal: 50` | `z-50` | `Dialog`, `AlertDialog`, `MediaLightbox`, `PinLockModal` |
| **5** | `--z-popover: 60` | `z-[60]` | `Popover`, `DropdownMenu`, `ContextMenu`, `Select` (works cleanly inside `z-50` Modals) |
| **6** | `--z-tooltip: 70` | `z-[70]` | `Tooltip`, `MarkdownFloatingTooltip` |
| **7** | `--z-toast: 80` | `z-[80]` | `ToastViewport` |
| **8** | `--z-fullscreen: 90` | `z-[90]` | Full-screen `VideoPlayer` overlay |

**Forbidden**: Arbitrary high values such as `z-[99]`, `z-[999]`, `z-[9999]`, or placing floating widgets at `z-50`.

---

## 4. Modal, Dialog & Overlay Tiers (`LN-MDL-01`)

Choose the exact overlay primitive matching the user intent:

| Intent | Component | Width / Layout | Keyboard & Dismiss | Footer & Button Order |
| :--- | :--- | :--- | :--- | :--- |
| **Confirmation / Destructive** | `<AlertDialog>` (`ui/alert-dialog.tsx`) | `w-[calc(100vw-2rem)] sm:w-full sm:max-w-md rounded-2xl p-6` | `Esc` cancels; `Enter` triggers focused Cancel safely, or Action when focus is not on Cancel | Right-aligned `gap-2`: `<AlertDialogCancel>` left, `<AlertDialogAction>` right (`bg-destructive text-destructive-foreground hover:bg-destructive/90` for destructive) |
| **Form / Input / Media Picker** | `<Dialog>` (`ui/dialog.tsx`) | `w-[calc(100vw-2rem)] sm:w-full sm:max-w-md` (or `sm:max-w-lg` for complex pickers), `max-h-[90vh] overflow-y-auto`, `rounded-2xl p-6` | `Esc` closes; `Enter` submits primary footer button unless in textarea/button; localized close button (`sr-only`) | Right-aligned `gap-2`: Outline Cancel left, Primary Submit right |
| **Rich Tool Dialog** (QR, Icons) | `<Dialog>` (`ui/dialog.tsx`) | `sm:max-w-lg` or `sm:max-w-2xl`, internal scrollable body, no blocking outer `overflow-hidden` | Same as Form Dialog | Consistent `DialogFooter` with `Button` primitives |
| **Full-Screen Media Preview** | `<MediaLightbox>` (`shared/MediaLightbox.tsx`) | Full viewport `bg-black/85 backdrop-blur-md`, media constrained `max-w-[92vw] max-h-[88vh]` | `Esc` and backdrop click close; top-right close button with tooltip | Optional caption footer |
| **Draggable Floating Tool** | `<FloatingWindow>` (`shared/FloatingWindow.tsx`) | Minimized `rounded-full` pill / Expanded `rounded-2xl` (`w-[240px]` or `w-[320px]`), staggered defaults (`right: 6%/12%/18%/24%`) | `dragControls` scoped strictly to header/grip; `zIndex` clamped `40..49`; preserves offset on minimize/expand | Tool-specific interior |

---

## 5. Standardized UI Building Blocks

1. **Buttons** (`src/components/ui/button.tsx`): Always use `<Button variant="default|outline|ghost|destructive|secondary">` in modals, forms, and action bars instead of raw styled `<button>` elements.
2. **Inputs** (`src/components/ui/input.tsx`, `textarea.tsx`): Crisp border transitions (`focus:border-primary`), consistent padding, height (`h-9` / `h-10`), and `rounded-xl`.
3. **Empty States** (`src/components/shared/EmptyState.tsx`): Use `<EmptyState icon={...} title={...} description={...} action={...} variant="default|compact" />` in all list/grid/panel empty states.
4. **Note Icons** (`src/components/shared/NoteIcon.tsx`): Always render file/system/custom/locked icons through `<NoteIcon />` so `showFileIcons`, custom colors, lock icons, and the active icon pack stay 100% synchronized.
5. **Checkboxes** (`src/components/shared/EditorCheckbox.tsx`): Use `<EditorCheckbox />` for task-style checkboxes in `Sidebar` and `TrashView` (inherits `currentColor`, includes `focus-visible` ring and `aria-checked`).
6. **Toasts** (`src/components/ui/toast.tsx`): Keep neutral `bg-card` background and `text-foreground` title text; communicate success/warning/error visually via the leading icon (`AppUpdateToastItem.test.tsx` guards this behavior).

---

## 6. Responsive & Accessibility Standards (`LN-RWD-01`, `LN-A11Y-01`)

- **Breakpoints**: Standard Tailwind breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`).
- **Two-Column Views**: `SettingsTabView` and `HelpTabView` use `flex-col md:flex-row` — horizontal scrollable `<nav>` strip below `md`, `w-60 shrink-0` sidebar on `md+`, and `<main>` for the active section panel.
- **Keyboard Focus**: Never remove `:focus-visible` outlines. Mouse clicks stay clean via `:focus:not(:focus-visible) { outline: none; }`, while keyboard Tab navigation shows a clear primary outline (`outline: 2px solid hsl(var(--primary) / 0.6)`).
- **Icon-Only Controls**: Every icon-only button requires a localized `aria-label` (or `<span className="sr-only">`) and, where helpful, a `<Tooltip>` (relying on the single root `<TooltipProvider>` in `App.tsx`).
- **Typography**: Respect `--app-font-family` and `--editor-font-family` CSS variables; use `tabular-nums` on timers, clocks, calculator displays, and counters.
