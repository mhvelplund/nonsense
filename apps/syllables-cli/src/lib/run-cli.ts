import { promises as fs } from "node:fs";

import {
  analyzeSyllableCounts,
  createHypherSyllableExtractor,
  rankSyllableCounts,
} from "@mhvelplund/syllables-core";

import type { CliOptions } from "./parse-cli-args";
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

export async function runCli(
  options: CliOptions,
  deps: RunCliDeps,
): Promise<void> {
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
      "Could not read input file: " +
        (input.source === "file" ? input.path : "stdin"),
    );
  }

  let ranked;
  try {
    const counts = analyzeSyllableCounts(
      text,
      createHypherSyllableExtractor(options.language),
    );
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
      "Could not write output file: " + (options.outputPath ?? "stdout"),
    );
  }
}
