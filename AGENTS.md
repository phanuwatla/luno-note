# Luno Note — Repository Agent Instructions

All contributors and AI agents working in this repository **MUST** follow the Luno Note Engineering, UI/UX, Coding, and Architecture Standards:

1. **Activate & Follow the Repository Skill**: Read and strictly enforce [`.agents/skills/luno-note-standards/SKILL.md`](.agents/skills/luno-note-standards/SKILL.md) before designing, implementing, refactoring, or reviewing any change.
2. **Consult Authoritative Standards Docs**:
   - [Engineering Standards](docs/standards/engineering-standards.md) (`LN-UI-01`..`LN-BC-01`)
   - [UI/UX Design Standards](docs/standards/ui-ux-standards.md)
   - [Coding Convention](docs/standards/coding-convention.md)
   - [Architecture Guidelines](docs/standards/architecture-guidelines.md)
3. **Non-Negotiable Rules**:
   - Reuse before rebuild (`src/components/shared/`, `src/components/ui/`, `src/lib/`).
   - Valid Tailwind CSS v3.4 classes only; strictly obey the 7-tier Z-index scale (`z-10`..`z-[90]`).
   - 100% localized UI in both `src/translation/en.ts` and `src/translation/th.ts` (zero inline `isTh?` ternaries, zero dead `t() || ...` fallbacks).
   - Never use wildcard imports on icon packs (`lucide-react`, `@tabler/icons-react`, `@phosphor-icons/react`); register icons in `src/lib/iconRegistries.ts`.
   - Maintain Electron workspace confinement (`isPathAllowedForIpc`), typed `ElectronAPI` (`src/vite-env.d.ts`), and backward compatibility with existing user vaults, settings, and PIN v1/v2 notes.
   - Verify every task with `npx tsc --noEmit`, `npm test`, and `npm run build` before delivery.
