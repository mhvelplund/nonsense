import { promises as fs } from "node:fs";

import {
  buildSyllableMap,
  serializeMapCsv,
  serializeMapJson,
} from "@nonsense/synthetic-language-core";

import type { CliOptions } from "./parse-cli-args";
import { resolveInputRequest } from "./read-input";
import { parseRankedCsv } from "./parse-ranked-csv";
import { parseRankedJson } from "./parse-ranked-json";
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

  let entries;
  try {
    entries =
      options.inputFormat === "json"
        ? parseRankedJson(text)
        : parseRankedCsv(text, { header: options.inputHeader });
  } catch (e) {
    throw new Error(
      "Could not parse ranked input: " +
        (e instanceof Error ? e.message : String(e)),
    );
  }

  let mapping;
  try {
    mapping = buildSyllableMap(entries);
  } catch (e) {
    throw new Error(
      "Could not build syllable map: " +
        (e instanceof Error ? e.message : String(e)),
    );
  }

  const content =
    options.format === "json"
      ? serializeMapJson(mapping)
      : serializeMapCsv(mapping, { header: options.header });

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
