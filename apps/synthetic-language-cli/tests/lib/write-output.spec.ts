import { describe, expect, it, vi } from "vitest";

import { writeOutput } from "../../src/lib/write-output";

describe("writeOutput", () => {
  it("writes to stdout when no output path is provided", async () => {
    const stdout = { write: vi.fn() };

    await writeOutput({
      content: "Hello world\n",
      outputPath: undefined,
      stdout,
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("Hello world\n");
  });

  it("writes to a file when an output path is provided", async () => {
    const writeFile = vi.fn();

    await writeOutput({
      content: "Hello world\n",
      outputPath: "result.txt",
      stdout: { write: vi.fn() },
      writeFile,
    });

    expect(writeFile).toHaveBeenCalledWith(
      "result.txt",
      "Hello world\n",
      "utf8",
    );
  });
});
