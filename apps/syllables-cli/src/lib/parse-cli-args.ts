import type { SortSpec } from "@nonsense/syllables-core";

export interface CliOptions {
  inputPath?: string;
  outputPath?: string;
  format: "csv" | "json";
  header: boolean;
  limit: number;
  sort: SortSpec[];
}

function readFlagValue(flag: string, argv: string[], index: number): string {
  const next = argv[index + 1];
  if (!next || next.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }

  return next;
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
    if (!value.startsWith("-")) {
      if (options.inputPath) {
        throw new Error("Provide a single input file path.");
      }

      options.inputPath = value;
      continue;
    }

    if (!value.startsWith("--")) {
      throw new Error(`Unknown flag: ${value}`);
    }

    if (value === "--header") {
      options.header = true;
      continue;
    }

    if (value === "--format") {
      const next = readFlagValue(value, argv, index);
      if (next !== "csv" && next !== "json") {
        throw new Error("Invalid format.");
      }

      options.format = next;
      index += 1;
      continue;
    }

    if (value === "--output") {
      const next = readFlagValue(value, argv, index);
      options.outputPath = next;
      index += 1;
      continue;
    }

    if (value === "--limit") {
      const next = readFlagValue(value, argv, index);
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error("Invalid limit.");
      }

      options.limit = parsed;
      index += 1;
      continue;
    }

    if (value === "--sort") {
      const next = readFlagValue(value, argv, index);
      const parts = next.split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid sort direction.");
      }

      const [field, direction] = parts;
      if (field !== "count" && field !== "syllable") {
        throw new Error("Invalid sort field.");
      }

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
