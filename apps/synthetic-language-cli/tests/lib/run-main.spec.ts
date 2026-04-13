import { Readable } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import { runMain } from "../../src/lib/run-main";

const REQUIRED_ARGV = [
  "--map",
  "map.csv",
  "--direction",
  "to-synthetic",
] as const;

describe("runMain", () => {
  it("reads stdin lazily when stdin is a tty", async () => {
    const runCliImpl = vi.fn().mockResolvedValue(undefined);
    const stdin = {
      isTTY: true,
      [Symbol.asyncIterator]() {
        throw new Error("stdin should not be read");
      },
    } as unknown as NodeJS.ReadableStream & { isTTY?: boolean };

    await runMain([...REQUIRED_ARGV], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith(
      {
        mapPath: "map.csv",
        direction: "to-synthetic",
        mapFormat: "csv",
        mapHeader: false,
        language: "en-us",
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

  it("parses all options before delegating", async () => {
    const runCliImpl = vi.fn().mockResolvedValue(undefined);

    await runMain(
      [
        "--map",
        "map.json",
        "--direction",
        "from-synthetic",
        "--map-format",
        "json",
        "--map-header",
        "-L",
        "da",
        "-o",
        "result.txt",
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
        mapPath: "map.json",
        direction: "from-synthetic",
        mapFormat: "json",
        mapHeader: true,
        language: "da",
        inputPath: "input.txt",
        outputPath: "result.txt",
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
    "Could not read mapping file: map.csv",
    "Could not read input file: input.txt",
    "Could not write output file: result.txt",
    "Could not parse mapping file: Invalid CSV row",
  ])(
    "writes %s to stderr and exits with code 1 on failure",
    async (message) => {
      const stderr = { write: vi.fn() };
      const setExitCode = vi.fn();

      await runMain([...REQUIRED_ARGV], {
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
        yield "hello world\n";
      })(),
    ) as NodeJS.ReadableStream & { isTTY?: boolean };
    stdin.isTTY = false;
    const runCliImpl = vi.fn().mockImplementation(async (_argv, deps) => {
      expect(consumed).toBe(true);
      expect(deps.stdinText).toBe("hello world\n");
    });

    await runMain([...REQUIRED_ARGV], {
      stdin,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      runCliImpl,
      setExitCode: vi.fn(),
    });

    expect(runCliImpl).toHaveBeenCalledWith(
      {
        mapPath: "map.csv",
        direction: "to-synthetic",
        mapFormat: "csv",
        mapHeader: false,
        language: "en-us",
      },
      {
        stdinIsTty: false,
        stdinText: "hello world\n",
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
