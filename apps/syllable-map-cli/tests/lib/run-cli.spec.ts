import { afterEach, describe, expect, it, vi } from "vitest";

import type { CliOptions } from "../../src/lib/parse-cli-args";

const coreMocks = vi.hoisted(() => ({
  buildSyllableMap: vi.fn(),
}));

vi.mock("@mhvelplund/synthetic-language-core", async () => {
  const actual = await vi.importActual<
    typeof import("@mhvelplund/synthetic-language-core")
  >("@mhvelplund/synthetic-language-core");

  coreMocks.buildSyllableMap.mockImplementation(actual.buildSyllableMap);

  return {
    ...actual,
    buildSyllableMap: coreMocks.buildSyllableMap,
  };
});

import { runCli } from "../../src/lib/run-cli";

function createOptions(overrides: Partial<CliOptions> = {}): CliOptions {
  return {
    inputFormat: "csv",
    inputHeader: false,
    format: "csv",
    header: false,
    ...overrides,
  };
}

describe("runCli", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads a CSV file and writes a CSV mapping to stdout", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => [
      { synthetic: "zog", source: "syl" },
      { synthetic: "ba", source: "la" },
    ]);
    const readFile = vi.fn().mockResolvedValue('"syl";3\n"la";2\n');
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.csv" }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile,
      writeFile: vi.fn(),
    });

    expect(readFile).toHaveBeenCalledWith("input.csv", "utf8");
    expect(stdout.write).toHaveBeenCalledWith('"zog";"syl"\n"ba";"la"\n');
  });

  it("reads a JSON file and writes a JSON mapping to a file", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => [
      { synthetic: "zog", source: "syl" },
    ]);
    const writeFile = vi.fn();
    const stdout = { write: vi.fn() };

    await runCli(
      createOptions({
        inputPath: "input.json",
        outputPath: "result.json",
        inputFormat: "json",
        format: "json",
      }),
      {
        stdinIsTty: true,
        stdinText: "",
        stdout,
        readFile: vi
          .fn()
          .mockResolvedValue(JSON.stringify([{ syllable: "syl", count: 3 }])),
        writeFile,
      },
    );

    expect(writeFile).toHaveBeenCalledWith(
      "result.json",
      JSON.stringify([{ synthetic: "zog", source: "syl" }], null, 2) + "\n",
      "utf8",
    );
    expect(stdout.write).not.toHaveBeenCalled();
  });

  it("includes CSV output header when --header is set", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => [
      { synthetic: "zog", source: "syl" },
    ]);
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.csv", header: true }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue('"syl";3\n'),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith(
      '"synthetic";"source"\n"zog";"syl"\n',
    );
  });

  it("skips CSV input header when --input-header is set", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce((_entries: unknown) => [
      { synthetic: "zog", source: "syl" },
    ]);
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.csv", inputHeader: true }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue('"syllable";count\n"syl";3\n'),
      writeFile: vi.fn(),
    });

    expect(coreMocks.buildSyllableMap).toHaveBeenCalledWith([
      { syllable: "syl", count: 3 },
    ]);
    expect(stdout.write).toHaveBeenCalledWith('"zog";"syl"\n');
  });

  it("reads from stdin when piped", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => [
      { synthetic: "zog", source: "syl" },
    ]);
    const stdout = { write: vi.fn() };

    await runCli(createOptions(), {
      stdinIsTty: false,
      stdinText: '"syl";3\n',
      stdout,
      readFile: vi.fn(),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith('"zog";"syl"\n');
  });

  it.each([
    {
      name: "missing input source validation",
      options: createOptions(),
      deps: { stdinIsTty: true, stdinText: "" },
      message: "Provide a file path or pipe input on stdin.",
    },
    {
      name: "mixed file and stdin validation",
      options: createOptions({ inputPath: "input.csv" }),
      deps: { stdinIsTty: false, stdinText: '"syl";3\n' },
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
      runCli(createOptions({ inputPath: "input.csv" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockRejectedValue(new Error("boom")),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not read input file: input.csv");
  });

  it("normalizes map build failures", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => {
      throw new Error("collision");
    });

    await expect(
      runCli(createOptions({ inputPath: "input.csv" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockResolvedValue('"syl";3\n'),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not build syllable map: collision");
  });

  it("normalizes CSV parse failures as input parse failures", async () => {
    await expect(
      runCli(createOptions({ inputPath: "input.csv" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockResolvedValue("not-valid-csv\n"),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not parse ranked input:");
  });

  it("normalizes output file write failures", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => [
      { synthetic: "zog", source: "syl" },
    ]);

    await expect(
      runCli(
        createOptions({ inputPath: "input.csv", outputPath: "result.csv" }),
        {
          stdinIsTty: true,
          stdinText: "",
          stdout: { write: vi.fn() },
          readFile: vi.fn().mockResolvedValue('"syl";3\n'),
          writeFile: vi.fn().mockRejectedValue(new Error("boom")),
        },
      ),
    ).rejects.toThrow("Could not write output file: result.csv");
  });

  it("succeeds with empty csv output for empty input", async () => {
    coreMocks.buildSyllableMap.mockImplementationOnce(() => []);
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.csv" }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue(""),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("");
  });
});
