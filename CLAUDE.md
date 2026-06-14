# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A client-side React + TypeScript + Vite app for building and validating competitive Pokémon teams (Gen 9 formats). No backend — all data is bundled or read from `public/`, and team state persists to `localStorage` under `pokemon-team-builder-team`.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check then bundle (`tsc -b && vite build`); the `tsc -b` step will fail the build on any type error
- `npm run lint` — ESLint over the repo
- `npm run download:sprites` / `download:animated-sprites` / `download:item-sprites` — regenerate the sprite/item manifest JSON in `src/data/`. These are manual; the committed manifests are the source of truth at build time.

No test framework is configured.

## Code style

- TypeScript is strict with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` (see `tsconfig.app.json`). Unused imports/vars/params are build errors, not warnings — remove them or prefix params with `_`.
- `erasableSyntaxOnly` is on: import types with `import type { ... }`, since type-only syntax is stripped at build.
- Styling is Tailwind CSS v4 with no PostCSS and no config file — it's wired via `@tailwindcss/vite`. The theme (custom colors, Pokémon type colors, fonts) lives in the `@theme` block in `src/index.css`; use those tokens (e.g. `bg-surface`, `text-foreground`, type-color classes) rather than hardcoding hex values.
- ESLint only — there is no Prettier/Biome. Match surrounding formatting.

## Architecture

- `src/data/` — static data: `formats.ts` (hardcoded battle format definitions), `dex.ts` (`@pkmn/dex`/`@pkmn/data` access), and large generated sprite manifests.
- `src/engine/` — pure game-logic functions: validation, stat calc, type matchups, defensive/offensive coverage.
- `src/api/` — feature-facing wrappers over the engine and dex.
- `src/hooks/` — React state: `useTeam` is the central team store; also `useItems`, `useLearnableMoves`, `useListKeyboardNavigation`. No Redux/Zustand — local state + localStorage.
- `src/components/` — UI; `App.tsx` is the 3-column layout root.
- `src/types/` — shared types (`PokemonSet`, `Team`, `BattleFormat`, etc.).
- `src/showdown/import-export.ts` — Showdown team format serialization.

Adding a new battle format means editing `src/data/formats.ts`; format rules are enforced in `src/engine/validation.ts`.
