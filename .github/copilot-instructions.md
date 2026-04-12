# Copilot Instructions

## Build, test, and lint commands

- Install dependencies with `pnpm install`.
- Build the library with `pnpm exec nx build syllables-core`.
- Build the installable CLI artifact with `pnpm exec nx run syllables-cli:prune`. Use this target before testing `npm install ./apps/syllables-cli/dist` or changing README/release packaging instructions.
- Run all CLI tests with `pnpm exec nx test syllables-cli`.
- Run one CLI spec with `cd apps/syllables-cli && pnpm exec vitest run src/lib/run-cli.spec.ts`.
- Run all library tests with `pnpm exec nx test syllables-core`.
- Run one library spec with `cd libs/syllables-core && pnpm exec vitest run src/lib/analyze-syllable-counts.spec.ts`.
- Typecheck with `pnpm exec nx typecheck syllables-cli` or `pnpm exec nx typecheck syllables-core`. `syllables-core:typecheck` is currently failing at baseline because `tsconfig.spec.json` does not include imported source files.
- There is no Nx lint target in this repo. The only checked-in lint/format automation is `pre-commit run --all-files`.

## High-level architecture

- This is a pnpm/Nx monorepo with two projects: `apps/syllables-cli` and `libs/syllables-core`.
- `libs/syllables-core` is the reusable analysis library. `tokenizeWords()` lowercases input and keeps `[a-z]+` tokens, `createHypherSyllableExtractor()` wraps `hypher` with `hyphenation.en-us`, `analyzeSyllableCounts()` aggregates syllable frequencies, and `rankSyllableCounts()` applies the canonical sort/limit behavior exposed through `src/index.ts`.
- `apps/syllables-cli` is a thin Node adapter around the library. `src/main.ts` only wires process streams, `run-main.ts` reads stdin and converts thrown errors into stderr output plus exit code `1`, and `run-cli.ts` owns argument parsing, file/stdin input selection, calling the core library, serializing output, and writing to stdout or a file.
- The CLI build is intentionally unbundled CommonJS output. `syllables-cli:build` preserves a workspace-style tree under `apps/syllables-cli/dist`, `add-shebang` only touches `dist/main.js`, and `prune-lockfile` plus `copy-workspace-modules` make the dist directory installable.
- `apps/syllables-cli/src/packaging.spec.ts` validates the built dist artifact, not the source tree. Treat packaging as an integration workflow, not just a unit-tested code path.

## Key conventions

- Do not edit committed `dist/**` files directly. Make source changes under `apps/**/src` or `libs/**/src`, then regenerate outputs with Nx targets.
- For packaging work, always start with `pnpm exec nx run syllables-cli:prune`. The local install flow depends on the generated `dist/package.json`, shebang, pruned lockfile, and copied workspace modules.
- Tests are colocated as `*.spec.ts` beside the source they cover. When you only need one spec, run Vitest from the project directory instead of the whole Nx target.
- Preserve the CLI output contract: CSV is the default format, CSV headers are opt-in via `--header`, CSV rows use `;` and always quote the syllable column, JSON output is pretty-printed with a trailing newline, and `--limit` defaults to `100`.
- Keep error handling explicit at the CLI boundary. Helpers throw typed or plain `Error`s; `run-main.ts` is the place that translates failures into stderr output and a non-zero exit code.
