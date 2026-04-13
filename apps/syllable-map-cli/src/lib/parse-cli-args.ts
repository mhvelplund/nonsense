import { Command, Option } from "commander";

export interface CliOptions {
  inputPath?: string;
  outputPath?: string;
  inputFormat: "csv" | "json";
  inputHeader: boolean;
  format: "csv" | "json";
  header: boolean;
}

interface CommandOptions {
  inputFormat?: "csv" | "json";
  inputHeader?: boolean;
  format?: "csv" | "json";
  header?: boolean;
  output?: string;
}

interface CommandOutput {
  stdout: { write(content: string): void };
  stderr: { write(content: string): void };
}

export function createCliCommand(output?: CommandOutput): Command {
  const command = new Command()
    .name("syllable-map-cli")
    .argument("[inputPath]")
    .addOption(
      new Option("--input-format <format>", "input format")
        .choices(["csv", "json"])
        .default("csv"),
    )
    .option("--input-header", "CSV input has a header row")
    .addOption(
      new Option("-f, --format <format>", "output format")
        .choices(["csv", "json"])
        .default("csv"),
    )
    .option("-H, --header", "include CSV header row in output")
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
    inputPath,
    outputPath: options.output,
    inputFormat: options.inputFormat ?? "csv",
    inputHeader: options.inputHeader ?? false,
    format: options.format ?? "csv",
    header: options.header ?? false,
  };
}
