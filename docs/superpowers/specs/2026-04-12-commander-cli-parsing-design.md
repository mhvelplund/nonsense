# Commander-based CLI parsing for syllables-cli

## Problem

Replace the homemade argument parser in `apps/syllables-cli/src/lib/parse-cli-args.ts` with `commander.js`.

The rework should stop treating parsing as a pure helper concern and instead let the CLI entry layer own framework-driven behavior such as help output, usage failures, and exits.

## Goals

- Use `commander` as the source of truth for the CLI schema.
- Move parse ownership to the CLI entry boundary where process-facing behavior already lives.
- Preserve the downstream `CliOptions` shape used by the application logic.
- Add short aliases for the existing long-form options.
- Parse argv once and avoid re-parsing in downstream helpers.

## Non-goals

- Changing the output contract for CSV or JSON results.
- Changing input-source rules beyond how usage and validation messages are surfaced.
- Adding unrelated CLI features beyond standard commander help behavior and short aliases.

## Recommended approach

Promote command construction and argv parsing to the entry layer.

1. `run-main.ts` should create and parse the command because it already owns stderr and exit-code behavior.
2. `parse-cli-args.ts` should become a command-schema module that defines commander options plus the normalization logic that converts parsed values into `CliOptions`.
3. `run-cli.ts` should receive parsed `CliOptions` instead of raw argv so business logic stays isolated from commander.
4. `read-input.ts` should stop re-parsing argv and instead consume already-resolved input information.

This makes commander responsible for help, usage failures, unknown options, and too many positional arguments in the place where those behaviors naturally belong.

## Alternatives considered

### Keep commander local to `parse-cli-args.ts`

This would reduce the number of touched files, but it would leave process-oriented parse behavior inside a helper that is currently used like a pure function. That mismatch becomes awkward once commander is allowed to write output and exit.

### Preserve the current throw-only parser contract

This would make testing easier, but it would blunt the point of adopting commander defaults and keep the design half-manual.

## Command model

The command should support one optional positional input path plus the following options:

- `-f, --format <format>` where `<format>` must be `csv` or `json`
- `-H, --header`
- `-o, --output <path>`
- `-l, --limit <number>`
- `-s, --sort <field:direction>` and the option may be repeated

The command should continue to support the existing long-form flags so the migration is additive rather than breaking.

## Normalized app contract

Successful parsing should still produce the same application-facing shape:

```ts
interface CliOptions {
  inputPath?: string;
  outputPath?: string;
  format: "csv" | "json";
  header: boolean;
  limit: number;
  sort: SortSpec[];
}
```

Defaults should stay:

- `format: "csv"`
- `header: false`
- `limit: 100`
- `sort: []`

## Validation model

Commander should own general CLI validation and messaging for:

- help output
- unknown options
- missing option arguments
- invalid option choices
- too many positional arguments

Project-specific normalization should remain explicit:

- `--limit` must parse to an integer greater than or equal to `1`
- each `--sort` value must parse to exactly `field:direction`
- allowed sort fields remain `count` and `syllable`
- allowed sort directions remain `asc` and `desc`

Those validations should plug into commander option parsers or argument processors so failures surface through commander rather than the old handwritten error strings.

## File-level changes

### `apps/syllables-cli/src/lib/parse-cli-args.ts`

- Replace the manual argv loop.
- Export commander-backed command configuration and normalized option extraction helpers.
- Keep the `CliOptions` type here unless a clearer shared location emerges during implementation.

### `apps/syllables-cli/src/lib/run-main.ts`

- Parse argv before invoking `runCli`.
- Detect `stdinIsTty` before parsing, but defer reading stdin text until after parsing succeeds.
- Let commander handle help and parse failures at this layer.
- Configure commander to write through the injected `stdout` and `stderr` streams already accepted by `run-main.ts`.
- Preserve the existing `setExitCode` seam so entry-layer tests can still assert exit behavior without relying on real process termination.
- Pass parsed `CliOptions` and existing I/O dependencies downward.

### `apps/syllables-cli/src/lib/run-cli.ts`

- Change the entry signature to accept parsed `CliOptions` instead of raw argv.
- Keep file reading, analysis, serialization, and output writing behavior unchanged.

### `apps/syllables-cli/src/lib/read-input.ts`

- Remove or refactor `resolveCliInputRequest()` so it no longer re-parses argv.
- Keep `resolveInputRequest()` focused on reconciling `inputPath` with stdin state.

## Testing strategy

### Unit tests

Keep focused unit tests for successful normalization:

- defaults
- long-form options
- short aliases
- repeated `--sort`
- mixed long and short usage

### Entry-layer tests

Move parse-failure assertions to tests that exercise the entry boundary where commander owns output and exit behavior:

- `-h/--help`
- unknown options
- missing option arguments
- invalid format choice
- invalid `limit`
- invalid `sort`
- too many positional arguments

These tests should continue to use the existing injected stream and exit-code seams rather than depending on subprocess-only assertions.

### Read-input tests

Update tests that currently depend on `resolveCliInputRequest()` so they consume resolved input data rather than raw argv.

## Dependency change

Add `commander` as a runtime dependency for the workspace.

## Expected outcome

After the migration, the CLI should keep the same downstream behavior for reading input, analyzing text, and formatting results, while using commander-native parsing, help text, and error handling at the process boundary.

## Review status

Approved in conversation and ready for implementation planning.
