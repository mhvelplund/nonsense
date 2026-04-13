import { promises as fs } from "node:fs";

import {
  parseMapCsv,
  parseMapJson,
  translateText,
} from "@nonsense/synthetic-language-core";

import type { CliOptions } from "./parse-cli-args";
import { resolveInputRequest } from "./read-input";
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
  let mapText: string;
  try {
    mapText = await (deps.readFile ?? fs.readFile)(options.mapPath, "utf8");
  } catch {
    throw new Error("Could not read mapping file: " + options.mapPath);
  }

  let mapping;
  try {
    mapping =
      options.mapFormat === "json"
        ? parseMapJson(mapText)
        : parseMapCsv(mapText, { header: options.mapHeader });
  } catch (e) {
    throw new Error(
      "Could not parse mapping file: " +
        (e instanceof Error ? e.message : String(e)),
    );
  }

  const input = resolveInputRequest({
    inputPath: options.inputPath,
    stdinIsTty: deps.stdinIsTty,
  });

  let inputText: string;
  try {
    inputText =
      input.source === "file"
        ? await (deps.readFile ?? fs.readFile)(input.path, "utf8")
        : deps.stdinText;
  } catch {
    throw new Error(
      "Could not read input file: " +
        (input.source === "file" ? input.path : "stdin"),
    );
  }

  const translated = translateText(inputText, mapping, {
    direction: options.direction,
    language: options.language,
  });

  try {
    await writeOutput({
      content: translated,
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
