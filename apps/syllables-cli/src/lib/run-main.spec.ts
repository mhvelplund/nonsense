import { Readable } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import { runMain } from "./run-main";

describe("runMain", () => {
  it("reads stdin lazily when stdin is a tty", async () => {
    const runCliImpl = vi.fn().mockResolvedValue(undefined);
    const stdin = {
      isTTY: true,
      [Symbol.asyncIterator]() {
        throw new Error("stdin should not be read");
      },
    } as unknown as NodeJS.ReadableStream & { isTTY?: boolean };

    await runMain([], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith([], {
      stdinIsTty: true,
      stdinText: "",
      stdout: expect.any(Object),
      readFile: undefined,
      writeFile: undefined,
    });
  });

  it.each([
    "Provide a file path or pipe input on stdin.",
    "Could not read input file: input.txt",
    "Could not write output file: result.json",
    "Could not analyze syllables.",
  ])(
    "writes %s to stderr and exits with code 1 on failure",
    async (message) => {
      const stderr = { write: vi.fn() };
      const setExitCode = vi.fn();

      await runMain([], {
        stdin: { isTTY: true } as NodeJS.ReadableStream & { isTTY?: boolean },
        stdout: { write: vi.fn() },
        stderr,
        runCliImpl: vi.fn().mockRejectedValue(new Error(message)),
        setExitCode,
      });

      expect(stderr.write).toHaveBeenCalledWith(message + "\n");
      expect(setExitCode).toHaveBeenCalledWith(1);
    },
  );

  it("reads piped stdin before delegating to runCli", async () => {
    let consumed = false;
    const stdin = Readable.from(
      (async function* () {
        consumed = true;
        yield "syllable";
      })(),
    ) as NodeJS.ReadableStream & { isTTY?: boolean };
    stdin.isTTY = false;
    const runCliImpl = vi.fn().mockImplementation(async (_argv, deps) => {
      expect(consumed).toBe(true);
      expect(deps.stdinText).toBe("syllable");
    });

    await runMain(["--header"], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith(["--header"], {
      stdinIsTty: false,
      stdinText: "syllable",
      stdout: expect.any(Object),
      readFile: undefined,
      writeFile: undefined,
    });
  });
});
