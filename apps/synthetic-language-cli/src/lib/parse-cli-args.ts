import { Command, Option } from "commander";
import type {
  SupportedLanguage,
  TranslationDirection,
} from "@nonsense/synthetic-language-core";

export type MapFormat = "csv" | "json";

export interface CliOptions {
  mapPath: string;
  direction: TranslationDirection;
  mapFormat: MapFormat;
  mapHeader: boolean;
  language: SupportedLanguage;
  inputPath?: string;
  outputPath?: string;
}

interface CommandOptions {
  map?: string;
  direction?: TranslationDirection;
  mapFormat?: MapFormat;
  mapHeader?: boolean;
  language?: SupportedLanguage;
  output?: string;
}

interface CommandOutput {
  stdout: { write(content: string): void };
  stderr: { write(content: string): void };
}

export function createCliCommand(output?: CommandOutput): Command {
  const command = new Command()
    .name("synthetic-language-cli")
    .argument("[inputPath]")
    .requiredOption("--map <path>", "path to the mapping file")
    .addOption(
      new Option("--direction <direction>", "translation direction")
        .choices(["to-synthetic", "from-synthetic"])
        .makeOptionMandatory(),
    )
    .addOption(
      new Option("--map-format <format>", "mapping file format")
        .choices(["csv", "json"])
        .default("csv"),
    )
    .option("--map-header", "CSV mapping file has a header row")
    .addOption(
      new Option("-L, --language <language>", "hyphenation language")
        .choices(["en-us", "da"])
        .default("en-us"),
    )
    .option("-o, --output <path>", "write output to a file")
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
    mapPath: options.map ?? "",
    direction: options.direction!,
    mapFormat: options.mapFormat ?? "csv",
    mapHeader: options.mapHeader ?? false,
    language: options.language ?? "en-us",
    inputPath,
    outputPath: options.output,
  };
}
