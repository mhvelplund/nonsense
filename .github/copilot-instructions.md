# Copilot Instructions

## Build, test, and lint commands

- Install dependencies with `pnpm install`.
- Build libraries with `pnpm exec nx build syllables-core` or `pnpm exec nx build synthetic-language-core`.
- Build installable CLI artifacts with `pnpm exec nx run <cli>:prune` (e.g., `syllables-cli:prune`, `syllable-map-cli:prune`, `synthetic-language-cli:prune`). Use the `prune` target before testing packaged entrypoints or changing README packaging examples.
- Build all CLI artifacts at once with `pnpm exec nx run-many -t prune`.
- Run all tests for a project with `pnpm exec nx test <project>` (e.g., `syllables-cli`, `syllables-core`).
- Run one spec file with `cd apps/<project> && pnpm exec vitest run src/lib/<spec>.spec.ts` or `cd libs/<project> && pnpm exec vitest run src/lib/<spec>.spec.ts`.
- Run a packaging spec with `pnpm exec nx run <project>:prune` first, then `cd apps/<project> && pnpm exec vitest run tests/packaging.spec.ts`.
- Typecheck with `pnpm exec nx typecheck <project>` (e.g., `syllables-cli`, `synthetic-language-core`).
- There is no Nx lint target in this repo. The only checked-in lint/format automation is `pre-commit run --all-files`.

## High-level architecture

This is a pnpm/Nx monorepo with five projects:

**Libraries:**

- `libs/syllables-core` is the syllable analysis library. `tokenizeWords()` lowercases input and keeps `[a-z]+` tokens, `createHypherSyllableExtractor()` wraps `hypher` with `hyphenation.en-us`, `analyzeSyllableCounts()` aggregates syllable frequencies, and `rankSyllableCounts()` applies the canonical sort/limit behavior exposed through `src/index.ts`.
- `libs/synthetic-language-core` provides synthetic language mapping and translation. It exports `buildSyllableMap()` for creating syllable substitution maps, `parseMapCsv()`/`parseMapJson()` and `serializeMapCsv()`/`serializeMapJson()` for CSV/JSON I/O, `translateText()` for applying substitutions, and the `MappingRecord` type for syllable pairs.

**CLIs:**

- `apps/syllables-cli` reads text input (file or stdin), analyzes syllable frequencies via `syllables-core`, and outputs ranked CSV or JSON. `src/main.ts` wires process streams, `run-main.ts` reads stdin and converts thrown errors into stderr output plus exit code `1`, and `run-cli.ts` owns argument parsing, file/stdin input selection, calling the core library, serializing output, and writing to stdout or a file.
- `apps/syllable-map-cli` reads ranked syllable input (CSV or JSON), builds a syllable substitution map via `synthetic-language-core`, and outputs the mapping in CSV or JSON. `run-cli.ts` handles parsing ranked input, building the map, serializing the output, and writing to stdout or a file.
- `apps/synthetic-language-cli` reads a mapping file and translates text to or from a synthetic language using `synthetic-language-core`. `run-cli.ts` parses the mapping file, reads input text, calls `translateText()`, and writes translated output to stdout or a file.

**CLI packaging:**

- All CLI builds are intentionally unbundled CommonJS output. Each `<cli>:build` preserves a workspace-style tree under `apps/<cli>/dist`, `add-shebang` only touches `dist/main.js`, and `prune-lockfile` plus `copy-workspace-modules` make the dist directory installable.
- Each CLI has a `tests/packaging.spec.ts` that validates the built dist artifact (not the source tree). Packaging specs enforce README examples and verify that only `dist/main.js` carries a shebang. Treat packaging as an integration workflow, not just a unit-tested code path.

## Key conventions

- Do not edit committed `dist/**` files directly. Make source changes under `apps/**/src` or `libs/**/src`, then regenerate outputs with Nx targets.
- For packaging work, always start with the relevant `pnpm exec nx run <cli>:prune` target. The packaged CLI entrypoints depend on the generated `dist/package.json`, shebang, pruned lockfile, and copied workspace modules.
- Tests are colocated as `*.spec.ts` beside the source they cover. When you only need one spec, run Vitest from the project directory instead of the whole Nx target.
- Preserve the CLI output contract: CSV is the default format, CSV headers are opt-in via `--header`, CSV rows use `;` and always quote the syllable column (for `syllables-cli`) or both columns (for `syllable-map-cli`), JSON output is pretty-printed with a trailing newline, and `--limit` defaults to `100` (for `syllables-cli`).
- Keep error handling explicit at the CLI boundary. Helpers throw typed or plain `Error`s; `run-main.ts` in each CLI is the place that translates failures into stderr output and a non-zero exit code.
- The workspace uses `customConditions: ["nx-syllables"]` in `tsconfig.base.json` for conditional package.json exports. This is a workspace-wide TypeScript configuration requirement.
