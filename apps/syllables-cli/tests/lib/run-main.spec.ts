import { Readable } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import { runMain } from "../../src/lib/run-main";

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

    expect(runCliImpl).toHaveBeenCalledWith(
      {
        format: "csv",
        header: false,
        limit: 100,
        sort: [],
      },
      {
        stdinIsTty: true,
        stdinText: "",
        stdout: expect.any(Object),
        readFile: undefined,
        writeFile: undefined,
      },
    );
  });

  it("parses short aliases and repeated sort options before delegating", async () => {
    const runCliImpl = vi.fn().mockResolvedValue(undefined);

    await runMain(
      [
        "-f",
        "json",
        "-H",
        "-o",
        "result.json",
        "-l",
        "4",
        "-s",
        "count:asc",
        "-s",
        "syllable:desc",
        "input.txt",
      ],
      {
        stdin: { isTTY: true } as NodeJS.ReadableStream & { isTTY?: boolean },
        stdout: { write: vi.fn() },
        stderr: { write: vi.fn() },
        runCliImpl,
        setExitCode: vi.fn(),
      },
    );

    expect(runCliImpl).toHaveBeenCalledWith(
      {
        inputPath: "input.txt",
        outputPath: "result.json",
        format: "json",
        header: true,
        limit: 4,
        sort: [
          { field: "count", direction: "asc" },
          { field: "syllable", direction: "desc" },
        ],
      },
      {
        stdinIsTty: true,
        stdinText: "",
        stdout: expect.any(Object),
        readFile: undefined,
        writeFile: undefined,
      },
    );
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

    expect(runCliImpl).toHaveBeenCalledWith(
      {
        format: "csv",
        header: true,
        limit: 100,
        sort: [],
      },
      {
        stdinIsTty: false,
        stdinText: "syllable",
        stdout: expect.any(Object),
        readFile: undefined,
        writeFile: undefined,
      },
    );
  });

  it("treats undefined isTTY as piped stdin when data is available", async () => {
    const stdin = Readable.from(["syllable"]) as NodeJS.ReadableStream & {
      isTTY?: boolean;
    };
    const runCliImpl = vi.fn();

    await runMain([], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith(
      {
        format: "csv",
        header: false,
        limit: 100,
        sort: [],
      },
      {
        stdinIsTty: false,
        stdinText: "syllable",
        stdout: expect.any(Object),
        readFile: undefined,
        writeFile: undefined,
      },
    );
  });

  it("prints help without reading piped stdin or calling runCli", async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const runCliImpl = vi.fn();
    const stdin = {
      isTTY: false,
      [Symbol.asyncIterator]() {
        throw new Error("stdin should not be read");
      },
    } as unknown as NodeJS.ReadableStream & { isTTY?: boolean };

    await runMain(["--help"], {
      stdin,
      stdout,
      stderr,
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalled();
    expect(stderr.write).not.toHaveBeenCalled();
    expect(runCliImpl).not.toHaveBeenCalled();
  });

  it("writes commander parse failures to stderr and exits with code 1", async () => {
    const stderr = { write: vi.fn() };
    const setExitCode = vi.fn();
    const runCliImpl = vi.fn();

    await runMain(["--wat"], {
      stdin: { isTTY: true } as NodeJS.ReadableStream & { isTTY?: boolean },
      stdout: { write: vi.fn() },
      stderr,
      runCliImpl,
      setExitCode,
    });

    expect(stderr.write).toHaveBeenCalled();
    expect(setExitCode).toHaveBeenCalledWith(1);
    expect(runCliImpl).not.toHaveBeenCalled();
  });
});
