# AGENTS.md

Guidance for autonomous coding agents working in this repository.

## Project Snapshot
- Stack: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Vitest 4.
- Package manager/runtime: Bun is preferred (`bun.lock` exists), but npm-compatible commands also work.
- Module system: ESM (`"type": "module"` in `package.json`).
- Path alias: `@/* -> src/*` (configured in `tsconfig*.json` and `vite.config.ts`).
- UI scaffolding: shadcn/ui config exists in `components.json`.

## Product Intent
- This app is an ARC Raiders loot keep/sell/recycle recommender.
- Core UX goal: help players identify an item decision in a few seconds, with name search as the highest-priority interaction.
- Filtering and sorting should support fast narrowing by recommendation category, rarity, and other useful loot attributes.
- Favor data shapes and UI flows that are optimized for client-side search/filter/sort over raw source fidelity.
- When making product decisions, prioritize clarity, scanability, and low-friction lookup over dense dashboards or overly decorative layouts.

## Source of Truth
- Build/test/lint scripts are defined in `package.json`.
- Type safety and strictness come from `tsconfig.app.json` and `tsconfig.node.json`.
- Lint rules come from `eslint.config.js`.
- If this file conflicts with code-level config, follow code-level config.

## Install and Setup
- Install deps: `bun install`
- Start dev server: `bun run dev`
- Production build: `bun run build`
- Preview built app: `bun run preview`
- npm fallback install: `npm install`
- npm fallback dev: `npm run dev`

## Lint, Typecheck, and Test Commands
- Lint and auto-fix: `bun run lint`
- App typecheck (no emit): `bunx tsc --noEmit`
- Full test suite (CI mode): `bun run test`
- Pre-commit quality gate (lint, typecheck, test together, very important to run after a task!): `bun run precommit`

## Running a Single Test (Important)
- Run one test file: `bunx vitest run src/path/to/file.test.ts`
- Run by name pattern: `bunx vitest run -t "renders header"`
- Run one file and one named test: `bunx vitest run src/path/to/file.test.ts -t "renders header"`
- Use watch mode during development: `bunx vitest src/path/to/file.test.ts`
- If you only know part of filename: `bunx vitest run src/**/loot*.test.ts`
- npm equivalent (single file): `npx vitest run src/path/to/file.test.ts`

## Build and Release Checks
- Before finishing a task, run: `bun run precommit`
- `precommit` currently performs:
  - `bun run lint`
  - `tsc --noEmit`
  - `bun run test`
- Treat failures as blocking unless user explicitly asks otherwise.

## Code Style: Current Repository Conventions

### Formatting
- Use 2-space indentation.
- Use double quotes for strings in TS/TSX.
- Omit semicolons unless required by syntax.
- Prefer trailing commas in multiline objects/arrays/params.
- Keep lines readable; split long JSX props across lines.

### Imports
- Group imports in this order:
  1) external packages,
  2) blank line,
  3) local imports (`@/` or `./`).
- Prefer alias imports (`@/...`) over deep relative imports when practical.
- Keep import lists minimal; remove unused imports immediately.
- Side-effect imports (like CSS) should stay explicit (e.g., `import "./index.css"`).

### TypeScript and Types
- Project is strict; do not weaken TS config to make code pass.
- Avoid `any`; prefer precise interfaces, type aliases, and generics.
- Use unions and narrowing for variant logic.
- Prefer `unknown` over `any` at boundaries, then narrow safely.
- Use non-null assertions (`!`) only when truly guaranteed (example exists in app mount).
- Keep exported types near the related feature when possible.

### React Conventions
- Use function components and named exports where useful.
- Keep components focused; extract repeated UI into small subcomponents.
- Follow hooks rules strictly (enforced by `eslint-plugin-react-hooks`).
- Preserve pure render logic; avoid side effects in render paths.
- For stateful logic, prefer clear event handlers over inline complex expressions.
- For loot browsing UI, keep search/filter/sort state easy to reason about and derive visible results from normalized source data.

### Naming
- Components: `PascalCase` (`LootCard.tsx`).
- Hooks: `useCamelCase` (`useLootFilters.ts`).
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for true constants.
- Types/interfaces: `PascalCase` (`LootItem`, `LootTier`).
- File names:
  - Components: `PascalCase.tsx`
  - Utilities/helpers: `camelCase.ts` or domain-based naming
  - Tests: `*.test.ts` / `*.test.tsx`

### Testing Guidelines (Vitest)
- Co-locate tests with source or place under a consistent `src/**/__tests__` layout.
- Test behavior, not implementation details.
- Name tests by user-observable outcome.
- Use `describe` blocks for feature grouping and `it/test` for scenarios.
- Keep tests deterministic; avoid time/network randomness unless mocked.
- Tests don't need to be 100% coverage, but every file and preferably every function should have at least one test.
- For loot data utilities, prefer tests around search/filter/sort behavior and normalization edge cases from the CSV source.

### Tailwind / CSS
- Tailwind v4 is enabled via `@import "tailwindcss"` in `src/index.css`.
- Prefer utility classes for local styling.
- Extract repeated class combinations into small reusable components.
- Keep global CSS minimal and intentional.

### shadcn/ui Components
- `components.json` is configured (`style: radix-vega`, `cssVariables: true`, aliases set to `@/components`, `@/components/ui`, `@/lib`, `@/hooks`).
- Prefer composing existing shadcn primitives before creating custom UI from scratch.
- Prefer using shadcn/ui components if you know one exists for the component you need, you are allowed to install them (if needed)
- Keep generated UI components in `src/components/ui` and feature-level wrappers in `src/components`.
- When adding components, preserve variant APIs (`variant`, `size`) and avoid breaking class/prop passthrough patterns.
- Use `@/lib/utils` helpers (for example `cn`) consistently for class merging when available.

## Lint Rules and Implications
- ESLint scans `**/*.{ts,tsx}`.
- Base extends:
  - `@eslint/js` recommended
  - `typescript-eslint` recommended
  - `react-hooks` flat recommended
  - `react-refresh` Vite preset
- Browser globals are enabled.
- `dist/` is ignored.
- Since lint runs with `--fix`, re-run lint after edits that affect style.

## Agent Workflow Recommendations
- Make minimal, scoped changes; avoid unrelated refactors.
- After edits, run targeted checks first, then full `bun run precommit`.
- If adding tests, prove they fail before fix and pass after fix when practical.
- Keep commits coherent: one logical change per commit.
- Avoid destructive git commands unless explicitly requested.
- Tests don't need to be 100% coverage, but every file and preferably every function should have at least one test.
- Code should be clean, modular and reusable.
- If you change loot ingestion or derived data, preserve fields needed for quick text search, category filtering, and stable sorting in the UI.
