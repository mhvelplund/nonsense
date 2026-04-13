import { describe, expect, it, vi } from "vitest";

import { writeOutput } from "../../src/lib/write-output";

describe("writeOutput", () => {
  it("writes to stdout when no output path is provided", async () => {
    const stdout = { write: vi.fn() };

    await writeOutput({
      content: '"la";2\n',
      outputPath: undefined,
      stdout,
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith('"la";2\n');
  });

  it("writes to a file when an output path is provided", async () => {
    const writeFile = vi.fn();

    await writeOutput({
      content: '"la";2\n',
      outputPath: "result.csv",
      stdout: { write: vi.fn() },
      writeFile,
    });

    expect(writeFile).toHaveBeenCalledWith("result.csv", '"la";2\n', "utf8");
  });
});
