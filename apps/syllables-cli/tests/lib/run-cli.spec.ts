import { afterEach, describe, expect, it, vi } from "vitest";

import type { CliOptions } from "../../src/lib/parse-cli-args";

const coreMocks = vi.hoisted(() => ({
  analyzeSyllableCounts: vi.fn(),
}));

vi.mock("@nonsense/syllables-core", async () => {
  const actual = await vi.importActual<
    typeof import("@nonsense/syllables-core")
  >("@nonsense/syllables-core");

  coreMocks.analyzeSyllableCounts.mockImplementation(
    actual.analyzeSyllableCounts,
  );

  return {
    ...actual,
    analyzeSyllableCounts: coreMocks.analyzeSyllableCounts,
  };
});

import { runCli } from "../../src/lib/run-cli";

function createOptions(overrides: Partial<CliOptions> = {}): CliOptions {
  return {
    format: "csv",
    header: false,
    limit: 100,
    sort: [],
    language: "en-us",
    ...overrides,
  };
}

describe("runCli", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes default csv without a header for file input", async () => {
    const readFile = vi.fn().mockResolvedValue("Syllable common syllable");
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.txt" }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile,
      writeFile: vi.fn(),
    });

    expect(readFile).toHaveBeenCalledWith("input.txt", "utf8");
    expect(stdout.write).toHaveBeenCalledWith(
      '"ble";2\n"la";2\n"syl";2\n"com";1\n"mon";1\n',
    );
  });

  it("writes json to a file when explicitly requested", async () => {
    const writeFile = vi.fn();
    const stdout = { write: vi.fn() };

    await runCli(
      createOptions({
        inputPath: "input.txt",
        outputPath: "result.json",
        format: "json",
      }),
      {
        stdinIsTty: true,
        stdinText: "",
        stdout,
        readFile: vi.fn().mockResolvedValue("Syllable"),
        writeFile,
      },
    );

    expect(writeFile).toHaveBeenCalledWith(
      "result.json",
      JSON.stringify(
        [
          { syllable: "ble", count: 1 },
          { syllable: "la", count: 1 },
          { syllable: "syl", count: 1 },
        ],
        null,
        2,
      ) + "\n",
      "utf8",
    );
    expect(stdout.write).not.toHaveBeenCalled();
  });

  it("flows header, custom sorting, and limit through the cli path", async () => {
    const stdout = { write: vi.fn() };

    await runCli(
      createOptions({
        inputPath: "input.txt",
        header: true,
        limit: 4,
        sort: [
          { field: "count", direction: "asc" },
          { field: "syllable", direction: "desc" },
        ],
      }),
      {
        stdinIsTty: true,
        stdinText: "",
        stdout,
        readFile: vi.fn().mockResolvedValue("Syllable common syllable"),
        writeFile: vi.fn(),
      },
    );

    expect(stdout.write).toHaveBeenCalledWith(
      '"syllable";count\n"com";1\n"syl";2\n"la";2\n"ble";2\n',
    );
  });

  it.each([
    {
      name: "missing input source validation",
      options: createOptions(),
      deps: {
        stdinIsTty: true,
        stdinText: "",
      },
      message: "Provide a file path or pipe input on stdin.",
    },
    {
      name: "mixed file and stdin validation",
      options: createOptions({ inputPath: "input.txt" }),
      deps: {
        stdinIsTty: false,
        stdinText: "syllable",
      },
      message: "Use either a file path or stdin, not both.",
    },
  ])("propagates $name failures", async ({ options, deps, message }) => {
    await expect(
      runCli(options, {
        ...deps,
        stdout: { write: vi.fn() },
        readFile: vi.fn(),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow(message);
  });

  it("normalizes input file read failures", async () => {
    await expect(
      runCli(createOptions({ inputPath: "input.txt" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockRejectedValue(new Error("boom")),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not read input file: input.txt");
  });

  it("normalizes analysis failures", async () => {
    coreMocks.analyzeSyllableCounts.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await expect(
      runCli(createOptions({ inputPath: "input.txt" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockResolvedValue("Syllable"),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not analyze syllables.");
  });

  it("normalizes output file write failures", async () => {
    await expect(
      runCli(
        createOptions({
          inputPath: "input.txt",
          outputPath: "result.json",
        }),
        {
          stdinIsTty: true,
          stdinText: "",
          stdout: { write: vi.fn() },
          readFile: vi.fn().mockResolvedValue("Syllable"),
          writeFile: vi.fn().mockRejectedValue(new Error("boom")),
        },
      ),
    ).rejects.toThrow("Could not write output file: result.json");
  });

  it("succeeds with empty csv output when non-syllable noise produces no syllables", async () => {
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.txt" }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue("12345 !!!"),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("");
  });
});
