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
