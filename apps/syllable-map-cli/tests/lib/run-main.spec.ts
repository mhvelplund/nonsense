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
        inputFormat: "csv",
        inputHeader: false,
        format: "csv",
        header: false,
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

  it("parses long-form options before delegating", async () => {
    const runCliImpl = vi.fn().mockResolvedValue(undefined);

    await runMain(
      [
        "--input-format",
        "json",
        "--format",
        "json",
        "-H",
        "-o",
        "result.json",
        "input.csv",
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
        inputPath: "input.csv",
        outputPath: "result.json",
        inputFormat: "json",
        inputHeader: false,
        format: "json",
        header: true,
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
    "Could not read input file: input.csv",
    "Could not write output file: result.csv",
    "Could not build syllable map: something went wrong",
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
        yield '"syl";3\n';
      })(),
    ) as NodeJS.ReadableStream & { isTTY?: boolean };
    stdin.isTTY = false;
    const runCliImpl = vi.fn().mockImplementation(async (_argv, deps) => {
      expect(consumed).toBe(true);
      expect(deps.stdinText).toBe('"syl";3\n');
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
        inputFormat: "csv",
        inputHeader: false,
        format: "csv",
        header: true,
      },
      {
        stdinIsTty: false,
        stdinText: '"syl";3\n',
        stdout: expect.any(Object),
        readFile: undefined,
        writeFile: undefined,
      },
    );
  });

  it("treats undefined isTTY as piped stdin when data is available", async () => {
    const stdin = Readable.from(['"syl";3\n']) as NodeJS.ReadableStream & {
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
        inputFormat: "csv",
        inputHeader: false,
        format: "csv",
        header: false,
      },
      {
        stdinIsTty: false,
        stdinText: '"syl";3\n',
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
