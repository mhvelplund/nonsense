# Nx monorepo with syllable-analysis CLI

## Problem

Create a greenfield TypeScript monorepo managed with Nx and pnpm. The initial workspace should contain one CLI tool that analyzes text and produces the most common syllables with occurrence counts. The number of returned syllables must be configurable and default to 100. The analysis must also be reusable by other TypeScript applications as a `Record<string, number>`.

## Goals

- Start with a clean Nx monorepo that can grow to include more tools later.
- Keep the reusable analysis logic separate from CLI-specific file and terminal concerns.
- Support syllable detection through a proven external library in the first version rather than a custom heuristic or custom-maintained dictionary.
- Let the CLI read input from either a file argument or stdin.
- Let the CLI write output to stdout by default or to a specified file.
- Support CSV output with and without a header row, plus JSON output.
- Default the CLI output to CSV without a header when no format flags are supplied.
- Support deterministic multi-key sorting using syllable text and/or occurrence count in ascending or descending order.

## Non-goals

- Multi-language syllable analysis in the first version.
- A plugin system for analyzers or formatters.
- Multiple CLI tools in the initial scaffold.
- Over-decomposing the workspace into many small libraries before there is evidence they are needed.

## Recommended approach

Use a two-project Nx workspace:

1. `apps/syllables-cli` for argument parsing, input/output handling, and user-facing errors.
2. `libs/syllables-core` for analysis, reusable typed exports, and separate sorting helpers.

This keeps the first tool small while preserving a clean boundary for future applications that want to reuse the analysis logic without shell-oriented concerns.

## Alternatives considered

### Single app-only project

This is the fastest possible start, but it couples analysis logic to CLI concerns and makes future reuse harder once the monorepo expands.

### More heavily decomposed workspace

This could split analysis, sorting, and formatting into multiple libraries from day one. It is flexible, but it adds ceremony and maintenance overhead before the project has earned that complexity.

## Workspace shape

```text
apps/
  syllables-cli/
libs/
  syllables-core/
docs/
  superpowers/
    specs/
```

### `apps/syllables-cli`

Responsibilities:

- Parse CLI arguments and validate combinations.
- Read text from a positional input file or stdin.
- Call the reusable library with raw text plus analysis, limit, and sort options.
- Serialize results as CSV or JSON.
- Write to stdout by default or to a specified output file.
- Surface clear user-facing failures and exit with a non-zero code.

### `libs/syllables-core`

Responsibilities:

- Normalize incoming text before analysis.
- Use an external syllable-analysis library to derive syllable sequences.
- Count syllable frequencies.
- Return an unsorted aggregate result as the base API.
- Expose separate helpers that apply deterministic multi-key sorting and result limiting.
- Expose reusable return shapes, including a `Record<string, number>`.

Suggested internal modules:

- text normalization
- syllable extraction adapter
- frequency aggregation
- sorting and limiting helpers
- output shaping

These can start as a small number of focused files and be split further only if the code grows.

Normalization rules for the first version:

- lowercase all text before token analysis
- extract alphabetic word tokens only
- ignore numbers, symbols, and punctuation as standalone tokens
- treat repeated whitespace as insignificant

Dependency-selection criteria for the syllable adapter:

- published npm package with current Node.js compatibility
- English-oriented syllable splitting
- permissive license suitable for application use
- usable from TypeScript without bespoke build steps

Adapter behavior:

- words that produce no syllables are ignored
- dependency initialization or runtime failures abort the analysis and surface an explicit error to the CLI

## Data flow

1. CLI receives input from a file argument or stdin.
2. CLI resolves output mode, sort options, result limit, and output target.
3. CLI reads text and passes raw content into `syllables-core`.
4. Library normalizes text, derives syllables through the external dependency, and counts frequencies into an unsorted aggregate result.
5. CLI or a thin library wrapper passes that aggregate result into dedicated sorting/limiting helpers.
6. Library returns structured ranked entries plus a `Record<string, number>` projection.
7. CLI serializes those results as CSV or JSON and writes them to stdout or an output file.

## Public API design

The reusable API should be text-first rather than file-path-based.

Expected library capabilities:

- analyze a raw string
- return an unsorted aggregate syllable result
- return a `Record<string, number>` representation
- expose a wrapper that sorts and limits aggregate results for the CLI

The CLI remains responsible for file reading and shell interaction.

The primary exported shapes should be:

```ts
type SortField = 'count' | 'syllable';
type SortDirection = 'asc' | 'desc';

interface SortSpec {
  field: SortField;
  direction: SortDirection;
}

interface RankedSyllableEntry {
  syllable: string;
  count: number;
}

type SyllableCounts = Record<string, number>;
```

The core API should expose:

1. a base analysis function that accepts raw text and returns unsorted `SyllableCounts`
2. a sorting wrapper that accepts `SyllableCounts`, sort instructions, and a result limit, then returns ranked `RankedSyllableEntry[]`
3. a projection helper that converts the limited ranked results back into `Record<string, number>`

## CLI behavior

The initial CLI should support:

- input from a positional file argument
- input from stdin for piped workflows
- optional output format selection for `csv` or `json`
- optional CSV header row control
- default stdout output
- optional `--output <file>` for file output
- optional `--limit <n>` for the number of returned syllables, defaulting to `100`
- repeatable sort instructions so ordering can be composed from count and syllable text in either direction

Input-source rules:

- If a positional file argument is provided, stdin must not also be used as an input source.
- If stdin is piped and no file argument is provided, stdin is the input source.
- If neither a file argument nor piped stdin is present, the command fails with a usage error.
- Multiple positional input files are not supported in the first version.

Output contracts:

- If no `--format` is supplied, the CLI defaults to CSV.
- CSV rows use the column order `syllable;count`.
- CSV always quotes the syllable text field, for example `\"la\";42`.
- When `--header` is set, CSV begins with `\"syllable\";count`.
- JSON output is a sorted array of objects shaped as `{ \"syllable\": string, \"count\": number }`.
- The reusable `Record<string, number>` remains part of the TypeScript API, not the CLI JSON contract.
- If no `--sort` options are supplied, output uses the default order `count:desc`, then `syllable:asc`.
- If `--header` is not supplied, CSV output omits the header row.

Expected examples:

- `tool input.txt --format csv`
- `tool input.txt --format csv --header --output result.csv`
- `cat input.txt | tool --format json`
- `cat input.txt | tool --sort count:desc --sort syllable:asc`
- `tool input.txt --limit 250`

## Sorting model

Sorting must be deterministic and composable. The system should support multi-key ordering based on:

- syllable text
- occurrence count

Each key should allow ascending or descending order. When multiple sort keys are provided, they are applied in the specified order.

Result selection and ordering rules:

1. Determine aggregate counts for all discovered syllables.
2. Select the top `n` syllables using the canonical ranking `count:desc`, then `syllable:asc`, where `n` defaults to `100`.
3. Apply the requested output sort order to those selected entries.

This keeps the membership of the limited result set stable and deterministic even when the display order changes.

## Error handling

Failures should be explicit and surfaced close to their source:

- missing input source
- conflicting input modes when stdin and file arguments are used incorrectly
- unreadable input file
- unwritable output path
- invalid result limit
- invalid sort field or sort direction
- failures from the external syllable dependency
- empty input or input that produces no syllables

The library should not silently swallow validation or analysis errors. The CLI should convert known failures into clear terminal messages and non-zero exit codes.

If the input is empty or no syllables are produced, that is a successful run with an empty result set:

- CSV with `--header` prints only `"syllable";count`
- CSV without `--header` prints nothing
- JSON prints `[]`
- the TypeScript `Record<string, number>` projection is `{}`

## Testing strategy

### `libs/syllables-core`

Cover:

- text normalization behavior
- integration with the external syllable dependency
- frequency counting
- unsorted aggregate result generation
- configurable limiting with a default of 100
- multi-key sorting
- `Record<string, number>` generation

### `apps/syllables-cli`

Cover:

- argument parsing
- file input vs stdin selection
- stdout vs output-file behavior
- default CSV-without-header behavior
- CSV header toggling
- semicolon-separated CSV output with quoted syllable text
- JSON serialization
- `--limit` parsing and validation
- end-to-end output snapshots for representative commands

## Implementation notes

- Start with the two-project workspace and keep the library API narrow.
- Preserve Unix-friendly behavior by treating stdout as the default output sink.
- Keep file I/O out of the reusable library.
- Prefer existing Nx generators and ecosystem packages over hand-rolled scaffolding.

## Review status

Design approved in conversation, updated per user review, and ready for spec review.
