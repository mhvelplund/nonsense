# Nx syllable CLI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or
> superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a pnpm-managed Nx TypeScript monorepo with one reusable syllable-analysis library and one CLI that reads
from a file or stdin and writes CSV or JSON to stdout or a file.

**Architecture:** Add Nx to the existing repository, generate one Node CLI app and one Node library, and keep
responsibilities split cleanly: the core library normalizes text, extracts syllables, aggregates counts, and exposes a
separate ranking/limit wrapper; the CLI owns argument parsing, input/output selection, CSV/JSON serialization, and
terminal-facing errors.

**Tech Stack:** Nx, pnpm, TypeScript, Node.js, `@nx/node`, Vitest, `hypher`, `hyphenation.en-us`

## Planned file structure

### Root workspace files

- `package.json` - workspace scripts and dependencies
- `pnpm-lock.yaml` - dependency lockfile
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - shared TypeScript settings
- `.gitignore` - generated artifacts and dependency directories
- `README.md` - setup and CLI usage notes

### CLI app

- `apps/syllables-cli/project.json` - Nx targets for build/test
- `apps/syllables-cli/src/main.ts` - thin Node entrypoint
- `apps/syllables-cli/src/lib/run-cli.ts` - orchestration layer for parsing, reading, analysis, formatting, and writing
- `apps/syllables-cli/src/lib/parse-cli-args.ts` - parse and validate CLI options
- `apps/syllables-cli/src/lib/read-input.ts` - resolve file vs stdin input
- `apps/syllables-cli/src/lib/serialize-csv.ts` - semicolon-separated CSV formatter with quoted syllable text
- `apps/syllables-cli/src/lib/serialize-json.ts` - JSON formatter for ranked entries
- `apps/syllables-cli/src/lib/write-output.ts` - stdout/file output helper
- `apps/syllables-cli/src/lib/run-main.ts` - entrypoint wrapper that reads stdin lazily and maps failures to stderr +
  exit code
- `apps/syllables-cli/src/lib/*.spec.ts` - focused CLI tests

### Core library

- `libs/syllables-core/project.json` - Nx targets for build/test
- `libs/syllables-core/src/index.ts` - public exports
- `libs/syllables-core/src/lib/types.ts` - shared types for counts, ranked entries, and sort options
- `libs/syllables-core/src/lib/tokenize-words.ts` - lowercase + alphabetic token extraction
- `libs/syllables-core/src/lib/hypher-syllable-extractor.ts` - `hypher` adapter
- `libs/syllables-core/src/lib/analyze-syllable-counts.ts` - unsorted syllable aggregation
- `libs/syllables-core/src/lib/rank-syllable-counts.ts` - canonical top-N selection plus output re-sorting
- `libs/syllables-core/src/lib/to-syllable-record.ts` - convert ranked entries back to `Record<string, number>`
- `libs/syllables-core/src/lib/*.spec.ts` - focused core-library tests

## Chunk 1: Workspace and core library

### Task 1: Bootstrap the Nx workspace in the existing repository

**Files:**

- Create: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `nx.json`, `tsconfig.base.json`
- Modify: `package.json`, `.gitignore`
- Create via generators: `apps/syllables-cli/project.json`, `apps/syllables-cli/src/main.ts`,
  `libs/syllables-core/project.json`, `libs/syllables-core/src/index.ts`
- Test: generated Vitest targets for `syllables-cli` and `syllables-core`

- [x] **Step 1: Install pnpm if it is missing and initialize git**

Run:

```bash
command -v pnpm >/dev/null || npm install -g pnpm
test -d .git || git init
```

Expected: `pnpm` is available in `PATH` and `.git/` exists.

- [x] **Step 2: Create a non-interactive package manifest and install the workspace toolchain**

Run:

```bash
test -f package.json || npm init -y
pnpm add -D nx @nx/node @nx/js typescript vitest @types/node
test -f pnpm-workspace.yaml || printf 'packages:\n  - apps/*\n  - libs/*\n' > pnpm-workspace.yaml
```

Expected: `package.json` exists, the root workspace dependencies are installed, and `pnpm-workspace.yaml` exists.

- [x] **Step 3: Initialize Nx in the existing repository**

Run:

```bash
pnpm exec nx init --interactive=false --nxCloud=false --plugins=@nx/node
```

Expected: Nx creates root workspace config such as `nx.json` and `tsconfig.base.json`.

Generator note: keep the generated Nx/Vitest project config files and repurpose the generated source entry files in
later tasks; only replace placeholder sample logic, not the project wiring.

- [x] **Step 4: Generate the CLI app and reusable library**

Run:

```bash
pnpm exec nx g @nx/node:application syllables-cli --useProjectJson=true --unitTestRunner=vitest --e2eTestRunner=none --linter=none --bundler=esbuild
pnpm exec nx g @nx/node:library syllables-core --importPath=@nonsense/syllables-core --useProjectJson=true --unitTestRunner=vitest --linter=none --strict=true
rm -f libs/syllables-core/src/lib/syllables-core.ts libs/syllables-core/src/lib/syllables-core.spec.ts
```

Expected: Nx reports generated projects named `syllables-cli` and `syllables-core`, and the placeholder library
implementation/spec files are removed so later tasks own the library file structure cleanly.

- [x] **Step 5: Install the runtime syllable dependencies**

Run:

```bash
pnpm add hypher hyphenation.en-us
```

Expected: the workspace has root config files plus generated app/library directories, and `hypher` dependencies are
present in `package.json`.

- [x] **Step 6: Verify the generated workspace before custom code**

Run:

```bash
pnpm exec nx show projects
pnpm exec nx test syllables-core
pnpm exec nx test syllables-cli
pnpm exec nx build syllables-core
pnpm exec nx build syllables-cli
```

Expected: `nx show projects` lists `syllables-cli` and `syllables-core`; both generated test targets and both generated
build targets pass.

- [x] **Step 7: Commit the clean scaffold**

Run:

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json .gitignore apps libs
git commit -m "chore: bootstrap Nx workspace"
```

Expected: one scaffold commit with no application logic yet.

### Task 2: Define the unsorted core-analysis contract

**Files:**

- Create: `libs/syllables-core/src/lib/types.ts`, `libs/syllables-core/src/lib/analyze-syllable-counts.ts`,
  `libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts`
- Modify: `libs/syllables-core/src/index.ts`
- Test: `libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts`

- [x] **Step 1: Write the failing contract test for unsorted aggregation**

Create `libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { analyzeSyllableCounts } from "./analyze-syllable-counts";
import type { SyllableExtractor } from "./types";

const extractor: SyllableExtractor = (word) => {
  if (word === "syllable") return ["syl", "la", "ble"];
  if (word === "common") return ["com", "mon"];
  return [];
};

describe("analyzeSyllableCounts", () => {
  it("returns an unsorted syllable-count record", () => {
    expect(
      analyzeSyllableCounts("Syllable common syllable", extractor),
    ).toEqual({
      syl: 2,
      la: 2,
      ble: 2,
      com: 1,
      mon: 1,
    });
  });

  it("returns an empty record for empty input", () => {
    expect(analyzeSyllableCounts("", extractor)).toEqual({});
  });

  it("rethrows extractor failures instead of swallowing them", () => {
    const failingExtractor: SyllableExtractor = () => {
      throw new Error("extractor failed");
    };

    expect(() => analyzeSyllableCounts("syllable", failingExtractor)).toThrow(
      "extractor failed",
    );
  });
});
```

- [x] **Step 2: Run the test to verify the contract is missing**

Run:

```bash
pnpm exec nx test syllables-core
```

Expected: FAIL because `analyzeSyllableCounts` and `SyllableExtractor` do not exist yet.

- [x] **Step 3: Write the minimal core contract and implementation**

Create `libs/syllables-core/src/lib/types.ts`:

```ts
export type SyllableCounts = Record<string, number>;

export type SyllableExtractor = (word: string) => string[];
```

Create `libs/syllables-core/src/lib/analyze-syllable-counts.ts`:

```ts
import type { SyllableCounts, SyllableExtractor } from "./types";

export function analyzeSyllableCounts(
  text: string,
  extractSyllables: SyllableExtractor = () => [],
): SyllableCounts {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.reduce<SyllableCounts>((counts, word) => {
    for (const syllable of extractSyllables(word)) {
      counts[syllable] = (counts[syllable] ?? 0) + 1;
    }
    return counts;
  }, {});
}
```

Update `libs/syllables-core/src/index.ts`:

```ts
export * from "./lib/analyze-syllable-counts";
export * from "./lib/types";
```

- [x] **Step 4: Run the test to verify the new contract passes**

Run:

```bash
pnpm exec nx test syllables-core
```

Expected: PASS for the new aggregation test.

- [x] **Step 5: Commit the contract**

Run:

```bash
git add libs/syllables-core/src/index.ts libs/syllables-core/src/lib/types.ts libs/syllables-core/src/lib/analyze-syllable-counts.ts libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts
git commit -m "feat: add unsorted syllable aggregation contract"
```

### Task 3: Add normalization and the external syllable extractor

**Files:**

- Create: `libs/syllables-core/src/lib/tokenize-words.ts`, `libs/syllables-core/src/lib/tokenize-words.spec.ts`,
  `libs/syllables-core/src/lib/hypher-syllable-extractor.ts`,
  `libs/syllables-core/src/lib/hypher-syllable-extractor.spec.ts`
- Modify: `libs/syllables-core/src/index.ts`, `libs/syllables-core/src/lib/analyze-syllable-counts.ts`,
  `libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts`
- Test: `libs/syllables-core/src/lib/tokenize-words.spec.ts`,
  `libs/syllables-core/src/lib/hypher-syllable-extractor.spec.ts`,
  `libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts`

- [x] **Step 1: Write the failing tests for normalization and the `hypher` adapter**

Create `libs/syllables-core/src/lib/tokenize-words.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { tokenizeWords } from "./tokenize-words";

describe("tokenizeWords", () => {
  it("lowercases text and keeps alphabetic words only", () => {
    expect(tokenizeWords("Syllable, common 42!")).toEqual([
      "syllable",
      "common",
    ]);
  });
});
```

Create `libs/syllables-core/src/lib/hypher-syllable-extractor.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createHypherSyllableExtractor } from "./hypher-syllable-extractor";

describe("createHypherSyllableExtractor", () => {
  it("splits words using the English hyphenation patterns", () => {
    const extract = createHypherSyllableExtractor();

    expect(extract("syllable")).toEqual(["syl", "la", "ble"]);
    expect(extract("common")).toEqual(["com", "mon"]);
  });

  it("rethrows dependency initialization failures", () => {
    expect(() =>
      createHypherSyllableExtractor(() => {
        throw new Error("hypher init failed");
      }),
    ).toThrow("hypher init failed");
  });

  it("rethrows dependency failures so callers can surface them", () => {
    const extract = createHypherSyllableExtractor(() => ({
      hyphenate() {
        throw new Error("hypher failed");
      },
    }));

    expect(() => extract("syllable")).toThrow("hypher failed");
  });
});
```

Update `libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts` with:

```ts
it("returns an empty record when no words produce syllables", () => {
  expect(analyzeSyllableCounts("mystery tokens", () => [])).toEqual({});
});

it("ignores words whose extractor returns no syllables", () => {
  const sparseExtractor: SyllableExtractor = (word) => {
    if (word === "syllable") return ["syl", "la", "ble"];
    return [];
  };

  expect(analyzeSyllableCounts("syllable mystery", sparseExtractor)).toEqual({
    syl: 1,
    la: 1,
    ble: 1,
  });
});
```

- [x] **Step 2: Run the tests to verify both helpers are still missing**

Run:

```bash
pnpm exec nx test syllables-core
```

Expected: FAIL because `tokenizeWords` and `createHypherSyllableExtractor` are not implemented yet.

- [x] **Step 3: Implement focused helpers and export them**

Create `libs/syllables-core/src/lib/tokenize-words.ts`:

```ts
export function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}
```

Create `libs/syllables-core/src/lib/hypher-syllable-extractor.ts`:

```ts
import Hypher from "hypher";
import english from "hyphenation.en-us";

export function createHypherSyllableExtractor(
  createEngine: () => Pick<Hypher, "hyphenate"> = () => new Hypher(english),
) {
  const engine = createEngine();
  return (word: string): string[] => engine.hyphenate(word);
}
```

Update `libs/syllables-core/src/lib/analyze-syllable-counts.ts`:

```ts
import { createHypherSyllableExtractor } from "./hypher-syllable-extractor";
import type { SyllableCounts, SyllableExtractor } from "./types";
import { tokenizeWords } from "./tokenize-words";

export function analyzeSyllableCounts(
  text: string,
  extractSyllables: SyllableExtractor = createHypherSyllableExtractor(),
): SyllableCounts {
  const words = tokenizeWords(text);
  return words.reduce<SyllableCounts>((counts, word) => {
    for (const syllable of extractSyllables(word)) {
      counts[syllable] = (counts[syllable] ?? 0) + 1;
    }
    return counts;
  }, {});
}
```

Do not catch adapter failures in `analyzeSyllableCounts`; let them propagate so the CLI can surface them once.

Update `libs/syllables-core/src/index.ts`:

```ts
export * from "./lib/analyze-syllable-counts";
export * from "./lib/hypher-syllable-extractor";
export * from "./lib/tokenize-words";
export * from "./lib/types";
```

- [x] **Step 4: Run the tests to verify normalization and extraction**

Run:

```bash
pnpm exec nx test syllables-core
```

Expected: PASS for tokenization, adapter, and the existing aggregation test.

- [x] **Step 5: Commit the extraction layer**

Run:

```bash
git add libs/syllables-core/src/index.ts libs/syllables-core/src/lib/analyze-syllable-counts.ts libs/syllables-core/src/lib/analyze-syllable-counts.spec.ts libs/syllables-core/src/lib/tokenize-words.ts libs/syllables-core/src/lib/tokenize-words.spec.ts libs/syllables-core/src/lib/hypher-syllable-extractor.ts libs/syllables-core/src/lib/hypher-syllable-extractor.spec.ts
git commit -m "feat: add syllable tokenization and hypher adapter"
```

### Task 4: Add ranking, configurable limits, and record projection

**Files:**

- Create: `libs/syllables-core/src/lib/rank-syllable-counts.ts`,
  `libs/syllables-core/src/lib/rank-syllable-counts.spec.ts`, `libs/syllables-core/src/lib/to-syllable-record.ts`,
  `libs/syllables-core/src/lib/to-syllable-record.spec.ts`
- Modify: `libs/syllables-core/src/lib/types.ts`, `libs/syllables-core/src/index.ts`
- Test: `libs/syllables-core/src/lib/rank-syllable-counts.spec.ts`,
  `libs/syllables-core/src/lib/to-syllable-record.spec.ts`

- [x] **Step 1: Write failing tests for ranking, top-N selection, and record projection**

Create `libs/syllables-core/src/lib/rank-syllable-counts.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { rankSyllableCounts } from "./rank-syllable-counts";

describe("rankSyllableCounts", () => {
  it("selects membership by count desc then syllable asc before applying output sort", () => {
    const ranked = rankSyllableCounts(
      { zz: 5, aa: 5, mm: 4 },
      {
        limit: 2,
        sort: [{ field: "syllable", direction: "asc" }],
      },
    );

    expect(ranked).toEqual([
      { syllable: "aa", count: 5 },
      { syllable: "zz", count: 5 },
    ]);
  });

  it("uses the canonical default order when no sort options are supplied", () => {
    expect(rankSyllableCounts({ zz: 2, aa: 2, mm: 1 }, { sort: [] })).toEqual([
      { syllable: "aa", count: 2 },
      { syllable: "zz", count: 2 },
      { syllable: "mm", count: 1 },
    ]);
  });

  it("returns an empty list for empty counts", () => {
    expect(rankSyllableCounts({}, { sort: [] })).toEqual([]);
  });

  it("defaults the limit to 100 when omitted", () => {
    const counts = Object.fromEntries(
      Array.from({ length: 101 }, (_, index) => [`s${index}`, 101 - index]),
    );

    expect(rankSyllableCounts(counts, { sort: [] })).toHaveLength(100);
  });

  it("rejects invalid limits", () => {
    expect(() => rankSyllableCounts({ aa: 1 }, { limit: 0, sort: [] })).toThrow(
      /limit must be at least 1/i,
    );
  });

  it("supports multi-key sorting with mixed directions", () => {
    const ranked = rankSyllableCounts(
      { aa: 2, zz: 2, mm: 1 },
      {
        limit: 3,
        sort: [
          { field: "count", direction: "asc" },
          { field: "syllable", direction: "desc" },
        ],
      },
    );

    expect(ranked).toEqual([
      { syllable: "mm", count: 1 },
      { syllable: "zz", count: 2 },
      { syllable: "aa", count: 2 },
    ]);
  });
});
```

Create `libs/syllables-core/src/lib/to-syllable-record.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { toSyllableRecord } from "./to-syllable-record";

describe("toSyllableRecord", () => {
  it("projects ranked entries back into a record", () => {
    expect(
      toSyllableRecord([
        { syllable: "la", count: 2 },
        { syllable: "ble", count: 2 },
      ]),
    ).toEqual({
      la: 2,
      ble: 2,
    });
  });

  it("returns an empty record for empty ranked results", () => {
    expect(toSyllableRecord([])).toEqual({});
  });
});
```

- [x] **Step 2: Run the tests to verify the ranking API does not exist yet**

Run:

```bash
pnpm exec nx test syllables-core
```

Expected: FAIL because ranking types/helpers are still missing.

- [x] **Step 3: Implement the ranking wrapper and projection helper**

Update `libs/syllables-core/src/lib/types.ts`:

```ts
export type SyllableCounts = Record<string, number>;

export type SyllableExtractor = (word: string) => string[];

export type SortField = "count" | "syllable";
export type SortDirection = "asc" | "desc";

export interface SortSpec {
  field: SortField;
  direction: SortDirection;
}

export interface RankedSyllableEntry {
  syllable: string;
  count: number;
}
```

Create `libs/syllables-core/src/lib/rank-syllable-counts.ts`:

```ts
import type { RankedSyllableEntry, SortSpec, SyllableCounts } from "./types";

const CANONICAL_SORT: SortSpec[] = [
  { field: "count", direction: "desc" },
  { field: "syllable", direction: "asc" },
];

export function rankSyllableCounts(
  counts: SyllableCounts,
  options: { limit?: number; sort: SortSpec[] },
): RankedSyllableEntry[] {
  const limit = options.limit ?? 100;
  if (limit < 1) {
    throw new Error("Result limit must be at least 1.");
  }
  const entries = Object.entries(counts).map(([syllable, count]) => ({
    syllable,
    count,
  }));
  const selected = [...entries]
    .sort(buildComparator(CANONICAL_SORT))
    .slice(0, limit);
  const outputSort = options.sort.length > 0 ? options.sort : CANONICAL_SORT;
  return selected.sort(buildComparator(outputSort));
}

function buildComparator(sort: SortSpec[]) {
  return (left: RankedSyllableEntry, right: RankedSyllableEntry): number => {
    for (const rule of sort) {
      const factor = rule.direction === "asc" ? 1 : -1;
      const comparison =
        rule.field === "count"
          ? left.count - right.count
          : left.syllable.localeCompare(right.syllable);
      if (comparison !== 0) {
        return comparison * factor;
      }
    }
    return 0;
  };
}
```

Create `libs/syllables-core/src/lib/to-syllable-record.ts`:

```ts
import type { RankedSyllableEntry, SyllableCounts } from "./types";

export function toSyllableRecord(
  entries: RankedSyllableEntry[],
): SyllableCounts {
  return Object.fromEntries(
    entries.map(({ syllable, count }) => [syllable, count]),
  );
}
```

Update `libs/syllables-core/src/index.ts`:

```ts
export * from "./lib/analyze-syllable-counts";
export * from "./lib/hypher-syllable-extractor";
export * from "./lib/rank-syllable-counts";
export * from "./lib/tokenize-words";
export * from "./lib/to-syllable-record";
export * from "./lib/types";
```

Implementation note: keep the comparator logic private inside `rank-syllable-counts.ts`; do not add a separate public
utility unless a second caller appears.

- [x] **Step 4: Run the core-library tests again**

Run:

```bash
pnpm exec nx test syllables-core
pnpm exec nx build syllables-core
```

Expected: PASS for aggregation, tokenization, extraction, ranking, record-projection tests, and the `syllables-core`
build target.

- [x] **Step 5: Commit the finished core API**

Run:

```bash
git add libs/syllables-core/src/index.ts libs/syllables-core/src/lib/types.ts libs/syllables-core/src/lib/rank-syllable-counts.ts libs/syllables-core/src/lib/rank-syllable-counts.spec.ts libs/syllables-core/src/lib/to-syllable-record.ts libs/syllables-core/src/lib/to-syllable-record.spec.ts
git commit -m "feat: add ranking and projection helpers"
```

## Chunk 2: CLI behavior and integration

### Task 5: Parse CLI options and validate input-source rules

**Files:**

- Create: `apps/syllables-cli/src/lib/parse-cli-args.ts`, `apps/syllables-cli/src/lib/parse-cli-args.spec.ts`,
  `apps/syllables-cli/src/lib/read-input.ts`, `apps/syllables-cli/src/lib/read-input.spec.ts`
- Test: `apps/syllables-cli/src/lib/parse-cli-args.spec.ts`, `apps/syllables-cli/src/lib/read-input.spec.ts`

- [x] **Step 1: Write failing tests for option defaults and input validation**

Create `apps/syllables-cli/src/lib/parse-cli-args.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { parseCliArgs } from "./parse-cli-args";

describe("parseCliArgs", () => {
  it("defaults to csv output, no header, and limit 100", () => {
    expect(parseCliArgs(["input.txt"])).toMatchObject({
      inputPath: "input.txt",
      format: "csv",
      header: false,
      limit: 100,
      sort: [],
    });
  });

  it("parses explicit format, header, and output flags", () => {
    expect(
      parseCliArgs([
        "input.txt",
        "--format",
        "json",
        "--header",
        "--output",
        "result.json",
      ]),
    ).toMatchObject({
      format: "json",
      header: true,
      outputPath: "result.json",
    });
  });

  it("parses repeated sort flags and explicit limits", () => {
    expect(
      parseCliArgs([
        "input.txt",
        "--limit",
        "250",
        "--sort",
        "count:desc",
        "--sort",
        "syllable:asc",
      ]),
    ).toMatchObject({
      limit: 250,
      sort: [
        { field: "count", direction: "desc" },
        { field: "syllable", direction: "asc" },
      ],
    });
  });

  it("rejects multiple positional files, invalid sort values, and unknown flags", () => {
    expect(() => parseCliArgs(["one.txt", "two.txt"])).toThrow(
      /single input file/i,
    );
    expect(() => parseCliArgs(["input.txt", "--format", "xml"])).toThrow(
      /invalid format/i,
    );
    expect(() => parseCliArgs(["input.txt", "--limit", "0"])).toThrow(/limit/i);
    expect(() => parseCliArgs(["input.txt", "--sort", "unknown:asc"])).toThrow(
      /invalid sort field/i,
    );
    expect(() =>
      parseCliArgs(["input.txt", "--sort", "count:sideways"]),
    ).toThrow(/invalid sort direction/i);
    expect(() => parseCliArgs(["input.txt", "--format"])).toThrow(
      /requires a value/i,
    );
    expect(() => parseCliArgs(["input.txt", "--output"])).toThrow(
      /requires a value/i,
    );
    expect(() => parseCliArgs(["input.txt", "--sort"])).toThrow(
      /requires a value/i,
    );
    expect(() => parseCliArgs(["input.txt", "--limit"])).toThrow(
      /requires a value/i,
    );
    expect(() => parseCliArgs(["input.txt", "--wat"])).toThrow(/unknown flag/i);
  });
});
```

Create `apps/syllables-cli/src/lib/read-input.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { resolveInputRequest } from "./read-input";

describe("resolveInputRequest", () => {
  it("chooses stdin when data is piped and no file path is provided", () => {
    expect(
      resolveInputRequest({
        inputPath: undefined,
        stdinIsTty: false,
      }),
    ).toEqual({ source: "stdin" });
  });

  it("rejects missing input", () => {
    expect(() =>
      resolveInputRequest({
        inputPath: undefined,
        stdinIsTty: true,
      }),
    ).toThrow(/provide a file path or pipe input/i);
  });

  it("rejects file input combined with piped stdin", () => {
    expect(() =>
      resolveInputRequest({
        inputPath: "input.txt",
        stdinIsTty: false,
      }),
    ).toThrow(/use either a file path or stdin/i);
  });
});
```

- [x] **Step 2: Run the CLI tests to verify the parser layer is missing**

Run:

```bash
pnpm exec nx test syllables-cli
```

Expected: FAIL because `parseCliArgs` and `resolveInputRequest` do not exist yet.

- [x] **Step 3: Implement argument parsing and input-source validation**

Create `apps/syllables-cli/src/lib/parse-cli-args.ts`:

```ts
import type { SortSpec } from "@nonsense/syllables-core";

export interface CliOptions {
  inputPath?: string;
  outputPath?: string;
  format: "csv" | "json";
  header: boolean;
  limit: number;
  sort: SortSpec[];
}

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    format: "csv",
    header: false,
    limit: 100,
    sort: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      if (options.inputPath)
        throw new Error("Provide a single input file path.");
      options.inputPath = value;
      continue;
    }

    if (value === "--header") {
      options.header = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next) throw new Error(`${value} requires a value.`);

    if (value === "--format") {
      if (next !== "csv" && next !== "json") throw new Error("Invalid format.");
      options.format = next;
      index += 1;
      continue;
    }

    if (value === "--output") {
      options.outputPath = next;
      index += 1;
      continue;
    }

    if (value === "--limit") {
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed < 1)
        throw new Error("Invalid limit.");
      options.limit = parsed;
      index += 1;
      continue;
    }

    if (value === "--sort") {
      const [field, direction] = next.split(":");
      if (field !== "count" && field !== "syllable")
        throw new Error("Invalid sort field.");
      if (direction !== "asc" && direction !== "desc") {
        throw new Error("Invalid sort direction.");
      }
      options.sort.push({ field, direction });
      index += 1;
      continue;
    }

    throw new Error(`Unknown flag: ${value}`);
  }

  return options;
}
```

Create `apps/syllables-cli/src/lib/read-input.ts` with:

```ts
export function resolveInputRequest(input: {
  inputPath?: string;
  stdinIsTty: boolean;
}): { source: "file"; path: string } | { source: "stdin" } {
  if (input.inputPath && !input.stdinIsTty) {
    throw new Error("Use either a file path or stdin, not both.");
  }
  if (input.inputPath) {
    return { source: "file", path: input.inputPath };
  }
  if (!input.stdinIsTty) {
    return { source: "stdin" };
  }
  throw new Error("Provide a file path or pipe input on stdin.");
}
```

- [x] **Step 4: Run the CLI tests again**

Run:

```bash
pnpm exec nx test syllables-cli
```

Expected: PASS for parser defaults and input-rule validation.

- [x] **Step 5: Commit the CLI parser layer**

Run:

```bash
git add apps/syllables-cli/src/lib/parse-cli-args.ts apps/syllables-cli/src/lib/parse-cli-args.spec.ts apps/syllables-cli/src/lib/read-input.ts apps/syllables-cli/src/lib/read-input.spec.ts
git commit -m "feat: add CLI argument parsing"
```

### Task 6: Add CSV/JSON serializers and output writing

**Files:**

- Create: `apps/syllables-cli/src/lib/serialize-csv.ts`, `apps/syllables-cli/src/lib/serialize-csv.spec.ts`,
  `apps/syllables-cli/src/lib/serialize-json.ts`, `apps/syllables-cli/src/lib/serialize-json.spec.ts`,
  `apps/syllables-cli/src/lib/write-output.ts`, `apps/syllables-cli/src/lib/write-output.spec.ts`
- Test: `apps/syllables-cli/src/lib/serialize-csv.spec.ts`, `apps/syllables-cli/src/lib/serialize-json.spec.ts`,
  `apps/syllables-cli/src/lib/write-output.spec.ts`

- [x] **Step 1: Write failing tests for serialization and output sinks**

Create `apps/syllables-cli/src/lib/serialize-csv.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { serializeCsv } from "./serialize-csv";

describe("serializeCsv", () => {
  it("defaults to semicolon-separated rows with quoted syllables", () => {
    expect(
      serializeCsv([{ syllable: "la", count: 2 }], { header: false }),
    ).toBe('"la";2\n');
  });

  it("adds the quoted header row when requested", () => {
    expect(serializeCsv([{ syllable: "la", count: 2 }], { header: true })).toBe(
      '"syllable";count\n"la";2\n',
    );
  });

  it("preserves the empty-output contract", () => {
    expect(serializeCsv([], { header: false })).toBe("");
    expect(serializeCsv([], { header: true })).toBe('"syllable";count\n');
  });
});
```

Create `apps/syllables-cli/src/lib/serialize-json.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

import { serializeJson } from "./serialize-json";

describe("serializeJson", () => {
  it("serializes ranked entries as a JSON array", () => {
    expect(
      serializeJson([
        { syllable: "la", count: 2 },
        { syllable: "ble", count: 2 },
      ]),
    ).toBe(
      '[\n  {\n    "syllable": "la",\n    "count": 2\n  },\n  {\n    "syllable": "ble",\n    "count": 2\n  }\n]\n',
    );
  });

  it("serializes empty results as an empty JSON array", () => {
    expect(serializeJson([])).toBe("[]\n");
  });
});
```

Create `apps/syllables-cli/src/lib/write-output.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { writeOutput } from "./write-output";

describe("writeOutput", () => {
  it("writes to stdout when no output path is provided", async () => {
    const stdout = { write: vi.fn() };

    await writeOutput({
      content: '"la";2\n',
      outputPath: undefined,
      stdout,
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith('"la";2\n');
  });

  it("writes to a file when an output path is provided", async () => {
    const writeFile = vi.fn();

    await writeOutput({
      content: '"la";2\n',
      outputPath: "result.csv",
      stdout: { write: vi.fn() },
      writeFile,
    });

    expect(writeFile).toHaveBeenCalledWith("result.csv", '"la";2\n', "utf8");
  });
});
```

- [x] **Step 2: Run the CLI tests to verify the serializer layer is missing**

Run:

```bash
pnpm exec nx test syllables-cli
```

Expected: FAIL because the serializer/output helpers do not exist yet.

- [x] **Step 3: Implement deterministic serializers and the output sink helper**

Create `apps/syllables-cli/src/lib/serialize-csv.ts`:

```ts
import type { RankedSyllableEntry } from "@nonsense/syllables-core";

export function serializeCsv(
  entries: RankedSyllableEntry[],
  options: { header: boolean },
): string {
  const rows = entries.map(
    ({ syllable, count }) => `"${syllable.replaceAll('"', '""')}";${count}`,
  );
  if (options.header) rows.unshift('"syllable";count');
  return rows.length === 0
    ? options.header
      ? '"syllable";count\n'
      : ""
    : `${rows.join("\n")}\n`;
}
```

Create `apps/syllables-cli/src/lib/serialize-json.ts`:

```ts
import type { RankedSyllableEntry } from "@nonsense/syllables-core";

export function serializeJson(entries: RankedSyllableEntry[]): string {
  return `${JSON.stringify(entries, null, 2)}\n`;
}
```

Create `apps/syllables-cli/src/lib/write-output.ts`:

```ts
import { promises as fs } from "node:fs";

export async function writeOutput(input: {
  content: string;
  outputPath?: string;
  stdout: { write(content: string): void };
  writeFile?: typeof fs.writeFile;
}) {
  const writeFile = input.writeFile ?? fs.writeFile;
  if (input.outputPath) {
    await writeFile(input.outputPath, input.content, "utf8");
    return;
  }
  input.stdout.write(input.content);
}
```

- [x] **Step 4: Run the CLI tests again**

Run:

```bash
pnpm exec nx test syllables-cli
```

Expected: PASS for CSV formatting, JSON formatting, and output-sink tests.

- [x] **Step 5: Commit the formatter layer**

Run:

```bash
git add apps/syllables-cli/src/lib/serialize-csv.ts apps/syllables-cli/src/lib/serialize-csv.spec.ts apps/syllables-cli/src/lib/serialize-json.ts apps/syllables-cli/src/lib/serialize-json.spec.ts apps/syllables-cli/src/lib/write-output.ts apps/syllables-cli/src/lib/write-output.spec.ts
git commit -m "feat: add CLI output formatters"
```

### Task 7: Wire the CLI runner to the reusable core library

**Files:**

- Create: `apps/syllables-cli/src/lib/run-cli.ts`, `apps/syllables-cli/src/lib/run-cli.spec.ts`,
  `apps/syllables-cli/src/lib/run-main.ts`, `apps/syllables-cli/src/lib/run-main.spec.ts`
- Modify: `apps/syllables-cli/src/main.ts`
- Test: `apps/syllables-cli/src/lib/run-cli.spec.ts`, `apps/syllables-cli/src/lib/run-main.spec.ts`

- [x] **Step 1: Write the failing orchestration tests**

Create `apps/syllables-cli/src/lib/run-cli.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { runCli } from "./run-cli";

describe("runCli", () => {
  it("writes default CSV-without-header output for file input", async () => {
    const stdout = { write: vi.fn() };

    await runCli(["input.txt"], {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue("syllable common syllable"),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith(
      '"ble";2\n"la";2\n"syl";2\n"com";1\n"mon";1\n',
    );
  });

  it("writes JSON to a file when explicitly requested", async () => {
    const writeFile = vi.fn();

    await runCli(["input.txt", "--format", "json", "--output", "result.json"], {
      stdinIsTty: true,
      stdinText: "",
      stdout: { write: vi.fn() },
      readFile: vi.fn().mockResolvedValue("syllable common syllable"),
      writeFile,
    });

    expect(writeFile).toHaveBeenCalledWith(
      "result.json",
      expect.stringContaining('"syllable": "ble"'),
      "utf8",
    );
  });

  it("wires header, custom sorting, and limit through the full CLI flow", async () => {
    const stdout = { write: vi.fn() };

    await runCli(
      ["input.txt", "--header", "--limit", "2", "--sort", "syllable:asc"],
      {
        stdinIsTty: true,
        stdinText: "",
        stdout,
        readFile: vi.fn().mockResolvedValue("syllable common syllable"),
        writeFile: vi.fn(),
      },
    );

    expect(stdout.write).toHaveBeenCalledWith(
      '"syllable";count\n"ble";2\n"la";2\n',
    );
  });

  it("treats no-syllable input as a successful empty CSV result", async () => {
    const stdout = { write: vi.fn() };

    await runCli(["input.txt"], {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue("12345 !!!"),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("");
  });
});
```

Create `apps/syllables-cli/src/lib/run-main.spec.ts`:

```ts
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";

import { runMain } from "./run-main";

describe("runMain", () => {
  it("reads stdin lazily only when stdin is piped", async () => {
    const stdin = { isTTY: true } as NodeJS.ReadableStream & {
      isTTY?: boolean;
    };
    const runCliImpl = vi.fn().mockResolvedValue(undefined);

    await runMain(["input.txt"], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith(
      ["input.txt"],
      expect.objectContaining({ stdinIsTty: true, stdinText: "" }),
    );
  });

  it.each([
    "Provide a file path or pipe input on stdin.",
    "Could not read input file: input.txt",
    "Could not write output file: result.json",
    "Could not analyze syllables.",
  ])("prints %s to stderr and sets exit code 1 on failure", async (message) => {
    const stderr = { write: vi.fn() };
    const setExitCode = vi.fn();

    await runMain([], {
      stdin: { isTTY: true } as NodeJS.ReadableStream & { isTTY?: boolean },
      stdout: { write: vi.fn() },
      stderr,
      runCliImpl: vi.fn().mockRejectedValue(new Error(message)),
      setExitCode,
    });

    expect(stderr.write).toHaveBeenCalledWith(`${message}\n`);
    expect(setExitCode).toHaveBeenCalledWith(1);
  });

  it("reads piped stdin before delegating to runCli", async () => {
    const stdin = Readable.from([
      "syllable common syllable",
    ]) as NodeJS.ReadableStream & {
      isTTY?: boolean;
    };
    stdin.isTTY = false;
    const runCliImpl = vi.fn().mockResolvedValue(undefined);

    await runMain([], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        stdinIsTty: false,
        stdinText: "syllable common syllable",
      }),
    );
  });
});
```

- [x] **Step 2: Run the CLI tests to verify the orchestration layer is still missing**

Run:

```bash
pnpm exec nx test syllables-cli
```

Expected: FAIL because `runCli` does not exist yet.

- [x] **Step 3: Implement the runner and keep `main.ts` thin**

Create `apps/syllables-cli/src/lib/run-cli.ts`:

```ts
import { promises as fs } from "node:fs";

import {
  analyzeSyllableCounts,
  createHypherSyllableExtractor,
  rankSyllableCounts,
} from "@nonsense/syllables-core";

import { parseCliArgs } from "./parse-cli-args";
import { resolveInputRequest } from "./read-input";
import { serializeCsv } from "./serialize-csv";
import { serializeJson } from "./serialize-json";
import { writeOutput } from "./write-output";

export interface RunCliDeps {
  stdinIsTty: boolean;
  stdinText: string;
  stdout: { write(content: string): void };
  readFile?: typeof fs.readFile;
  writeFile?: typeof fs.writeFile;
}

export async function runCli(argv: string[], deps: RunCliDeps): Promise<void> {
  const options = parseCliArgs(argv);
  const input = resolveInputRequest({
    inputPath: options.inputPath,
    stdinIsTty: deps.stdinIsTty,
  });

  let text: string;
  try {
    text =
      input.source === "file"
        ? await (deps.readFile ?? fs.readFile)(input.path, "utf8")
        : deps.stdinText;
  } catch {
    throw new Error(
      `Could not read input file: ${input.source === "file" ? input.path : "stdin"}`,
    );
  }

  let ranked;
  try {
    const counts = analyzeSyllableCounts(text, createHypherSyllableExtractor());
    ranked = rankSyllableCounts(counts, {
      limit: options.limit,
      sort: options.sort,
    });
  } catch {
    throw new Error("Could not analyze syllables.");
  }

  const content =
    options.format === "json"
      ? serializeJson(ranked)
      : serializeCsv(ranked, { header: options.header });

  try {
    await writeOutput({
      content,
      outputPath: options.outputPath,
      stdout: deps.stdout,
      writeFile: deps.writeFile,
    });
  } catch {
    throw new Error(
      `Could not write output file: ${options.outputPath ?? "stdout"}`,
    );
  }
}
```

Error contract: `runCli` should throw validation and I/O errors to its caller; it must not write to `stderr` directly.

Create `apps/syllables-cli/src/lib/run-main.ts`:

```ts
import { runCli, type RunCliDeps } from "./run-cli";

async function readStdin(stream: NodeJS.ReadableStream): Promise<string> {
  return new Response(stream as unknown as BodyInit).text();
}

export async function runMain(
  argv: string[],
  input: {
    stdin: NodeJS.ReadableStream & { isTTY?: boolean };
    stdout: RunCliDeps["stdout"];
    stderr: { write(content: string): void };
    readFile?: RunCliDeps["readFile"];
    writeFile?: RunCliDeps["writeFile"];
    runCliImpl?: typeof runCli;
    setExitCode?: (code: number) => void;
  },
) {
  try {
    const stdinIsTty = input.stdin.isTTY ?? true;
    const stdinText = stdinIsTty ? "" : await readStdin(input.stdin);

    await (input.runCliImpl ?? runCli)(argv, {
      stdinIsTty,
      stdinText,
      stdout: input.stdout,
      readFile: input.readFile,
      writeFile: input.writeFile,
    });
  } catch (error) {
    input.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    (input.setExitCode ?? ((code) => (process.exitCode = code)))(1);
  }
}
```

Update `apps/syllables-cli/src/main.ts`:

```ts
import { runMain } from "./lib/run-main";

await runMain(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
  setExitCode: (code) => {
    process.exitCode = code;
  },
});
```

Implementation note: keep `runCli` testable by injecting `readFile`, `writeFile`, `stdout`, and the raw stdin text
instead of reading global process state inside the helper; keep `runMain` responsible for lazy stdin reads plus
stderr/exit-code handling.

- [x] **Step 4: Run the CLI test target after wiring everything together**

Run:

```bash
pnpm exec nx test syllables-cli
```

Expected: PASS for parser, input resolution, serialization, and end-to-end runner behavior.

- [x] **Step 5: Commit the runnable CLI**

Run:

```bash
git add apps/syllables-cli/src/main.ts apps/syllables-cli/src/lib/run-cli.ts apps/syllables-cli/src/lib/run-cli.spec.ts apps/syllables-cli/src/lib/run-main.ts apps/syllables-cli/src/lib/run-main.spec.ts
git commit -m "feat: wire syllable analysis CLI"
```

### Task 8: Add usage docs and run the final workspace verification

**Files:**

- Create: `README.md`
- Modify: `package.json` (only if a convenient root script is missing)
- Test: full workspace verification commands

- [x] **Step 1: Write the usage documentation**

Create `README.md` with:

```md
# nonsense

## Setup

```bash
pnpm install
```

## Run the CLI

```bash
pnpm exec nx build syllables-cli
node dist/apps/syllables-cli/main.js input.txt
cat input.txt | node dist/apps/syllables-cli/main.js
node dist/apps/syllables-cli/main.js input.txt --format json --output result.json
```
```

Document the default behavior explicitly:

- default format is CSV
- default CSV omits the header row
- CSV uses semicolons and always quotes the syllable text column
- `--limit` defaults to `100`

- [x] **Step 2: Run the complete verification suite**

Run:

```bash
pnpm exec nx test syllables-core
pnpm exec nx test syllables-cli
pnpm exec nx build syllables-core
pnpm exec nx build syllables-cli
```

Expected: all tests and both builds pass.

- [x] **Step 3: Smoke-test the CLI from both supported input modes**

Run:

```bash
printf 'syllable common syllable\n' > ./tmp-syllables-input.txt
node dist/apps/syllables-cli/main.js ./tmp-syllables-input.txt
cat ./tmp-syllables-input.txt | node dist/apps/syllables-cli/main.js --format json
rm -f ./tmp-syllables-input.txt
```

Expected:

- first command prints semicolon-separated CSV with no header, for example:

```text
"ble";2
"la";2
"syl";2
"com";1
"mon";1
```

- second command prints a JSON array of ranked `{ syllable, count }` entries, for example:

```json
[
  { "syllable": "ble", "count": 2 },
  { "syllable": "la", "count": 2 }
]
```

- [x] **Step 4: Commit the docs and final polish**

Run:

```bash
git add README.md package.json
git commit -m "docs: add setup and CLI usage notes"
```
