import { CommanderError } from "commander";

import { parseCliArgs } from "./parse-cli-args";
import { runCli, type RunCliDeps } from "./run-cli";

async function readStdin(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: string[] = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }

  return chunks.join("");
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
  const setExitCode =
    input.setExitCode ?? ((code: number) => (process.exitCode = code));

  try {
    const stdinIsTty = input.stdin.isTTY === true;
    const options = parseCliArgs(argv, {
      stdout: input.stdout,
      stderr: input.stderr,
    });
    const stdinText = stdinIsTty ? "" : await readStdin(input.stdin);

    await (input.runCliImpl ?? runCli)(options, {
      stdinIsTty,
      stdinText,
      stdout: input.stdout,
      readFile: input.readFile,
      writeFile: input.writeFile,
    });
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.exitCode !== 0) {
        setExitCode(error.exitCode);
      }
      return;
    }

    input.stderr.write(
      (error instanceof Error ? error.message : String(error)) + "\n",
    );
    setExitCode(1);
  }
}
