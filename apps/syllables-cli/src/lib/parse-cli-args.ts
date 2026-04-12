import { Command, InvalidArgumentError, Option } from "commander";

import type { SortSpec } from "@nonsense/syllables-core";

export interface CliOptions {
  inputPath?: string;
  outputPath?: string;
  format: "csv" | "json";
  header: boolean;
  limit: number;
  sort: SortSpec[];
}

interface CommandOptions {
  format?: "csv" | "json";
  header?: boolean;
  output?: string;
  limit?: number;
  sort?: SortSpec[];
}

interface CommandOutput {
  stdout: { write(content: string): void };
  stderr: { write(content: string): void };
}

function parseLimit(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError("limit must be a positive integer");
  }

  return parsed;
}

function parseSort(value: string): SortSpec {
  const parts = value.split(":");
  if (parts.length !== 2) {
    throw new InvalidArgumentError("sort must use field:direction");
  }

  const [field, direction] = parts;
  if (field !== "count" && field !== "syllable") {
    throw new InvalidArgumentError("sort field must be count or syllable");
  }

  if (direction !== "asc" && direction !== "desc") {
    throw new InvalidArgumentError("sort direction must be asc or desc");
  }

  return { field, direction };
}

export function createCliCommand(output?: CommandOutput): Command {
  const command = new Command()
    .name("syllables-cli")
    .argument("[inputPath]")
    .addOption(
      new Option("-f, --format <format>", "output format")
        .choices(["csv", "json"])
        .default("csv"),
    )
    .option("-H, --header", "include CSV header row")
    .option("-o, --output <path>", "write output to a file")
    .option(
      "-l, --limit <number>",
      "maximum number of rows to emit",
      parseLimit,
      100,
    )
    .option(
      "-s, --sort <field:direction>",
      "sort output by count or syllable in asc or desc order",
      (value: string, previous: SortSpec[] = []) => [
        ...previous,
        parseSort(value),
      ],
      [],
    )
    .showHelpAfterError()
    .exitOverride();

  if (output) {
    command.configureOutput({
      writeOut: (content) => output.stdout.write(content),
      writeErr: (content) => output.stderr.write(content),
    });
  }

  return command;
}

export function parseCliArgs(
  argv: string[],
  output?: CommandOutput,
): CliOptions {
  const command = createCliCommand(output);
  command.parse(argv, { from: "user" });

  const options = command.opts<CommandOptions>();
  const inputPath = command.processedArgs[0] as string | undefined;

  return {
    inputPath,
    outputPath: options.output,
    format: options.format ?? "csv",
    header: options.header ?? false,
    limit: options.limit ?? 100,
    sort: options.sort ?? [],
  };
}
