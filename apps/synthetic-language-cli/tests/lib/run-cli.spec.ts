import { afterEach, describe, expect, it, vi } from "vitest";

import type { CliOptions } from "../../src/lib/parse-cli-args";

const coreMocks = vi.hoisted(() => ({
  translateText: vi.fn(),
}));

vi.mock("@mhvelplund/synthetic-language-core", async () => {
  const actual = await vi.importActual<
    typeof import("@mhvelplund/synthetic-language-core")
  >("@mhvelplund/synthetic-language-core");

  coreMocks.translateText.mockImplementation(actual.translateText);

  return {
    ...actual,
    translateText: coreMocks.translateText,
  };
});

import { runCli } from "../../src/lib/run-cli";

const MAP_CSV = '"zog";"syl"\n"ba";"la"\n';
const MAP_JSON = JSON.stringify([
  { synthetic: "zog", source: "syl" },
  { synthetic: "ba", source: "la" },
]);

function createOptions(overrides: Partial<CliOptions> = {}): CliOptions {
  return {
    mapPath: "map.csv",
    direction: "to-synthetic",
    mapFormat: "csv",
    mapHeader: false,
    language: "en-us",
    ...overrides,
  };
}

describe("runCli", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads a CSV map and translates input text to stdout", async () => {
    coreMocks.translateText.mockReturnValueOnce("zog ba");
    const readFile = vi.fn().mockImplementation((path: string) => {
      if (path === "map.csv") return Promise.resolve(MAP_CSV);
      if (path === "input.txt") return Promise.resolve("syl la");
      return Promise.reject(new Error("unexpected path: " + path));
    });
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.txt" }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile,
      writeFile: vi.fn(),
    });

    expect(coreMocks.translateText).toHaveBeenCalledWith(
      "syl la",
      [
        { synthetic: "zog", source: "syl" },
        { synthetic: "ba", source: "la" },
      ],
      { direction: "to-synthetic", language: "en-us" },
    );
    expect(stdout.write).toHaveBeenCalledWith("zog ba");
  });

  it("reads a JSON map and translates to a file", async () => {
    coreMocks.translateText.mockReturnValueOnce("zog ba");
    const writeFile = vi.fn();
    const stdout = { write: vi.fn() };

    await runCli(
      createOptions({
        inputPath: "input.txt",
        mapPath: "map.json",
        mapFormat: "json",
        outputPath: "result.txt",
      }),
      {
        stdinIsTty: true,
        stdinText: "",
        stdout,
        readFile: vi.fn().mockImplementation((path: string) => {
          if (path === "map.json") return Promise.resolve(MAP_JSON);
          return Promise.resolve("syl la");
        }),
        writeFile,
      },
    );

    expect(writeFile).toHaveBeenCalledWith("result.txt", "zog ba", "utf8");
    expect(stdout.write).not.toHaveBeenCalled();
  });

  it("reads input from stdin when piped", async () => {
    coreMocks.translateText.mockReturnValueOnce("zog ba");
    const stdout = { write: vi.fn() };

    await runCli(createOptions(), {
      stdinIsTty: false,
      stdinText: "syl la",
      stdout,
      readFile: vi.fn().mockResolvedValue(MAP_CSV),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("zog ba");
  });

  it("supports from-synthetic direction", async () => {
    coreMocks.translateText.mockReturnValueOnce("syl la");
    const stdout = { write: vi.fn() };

    await runCli(
      createOptions({ inputPath: "input.txt", direction: "from-synthetic" }),
      {
        stdinIsTty: true,
        stdinText: "",
        stdout,
        readFile: vi.fn().mockResolvedValue(MAP_CSV),
        writeFile: vi.fn(),
      },
    );

    expect(coreMocks.translateText).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      { direction: "from-synthetic", language: "en-us" },
    );
  });

  it("uses --map-header to skip header row in CSV map", async () => {
    coreMocks.translateText.mockReturnValueOnce("zog");
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.txt", mapHeader: true }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockImplementation((path: string) => {
        if (path === "map.csv")
          return Promise.resolve('"synthetic";"source"\n"zog";"syl"\n');
        return Promise.resolve("syl");
      }),
      writeFile: vi.fn(),
    });

    expect(coreMocks.translateText).toHaveBeenCalledWith(
      "syl",
      [{ synthetic: "zog", source: "syl" }],
      expect.any(Object),
    );
  });

  it.each([
    {
      name: "missing input source",
      options: createOptions(),
      deps: { stdinIsTty: true, stdinText: "" },
      message: "Provide a file path or pipe input on stdin.",
    },
    {
      name: "file and stdin both provided",
      options: createOptions({ inputPath: "input.txt" }),
      deps: { stdinIsTty: false, stdinText: "syl la" },
      message: "Use either a file path or stdin, not both.",
    },
  ])("propagates $name error", async ({ options, deps, message }) => {
    await expect(
      runCli(options, {
        ...deps,
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockResolvedValue(MAP_CSV),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow(message);
  });

  it("normalizes map file read failures", async () => {
    await expect(
      runCli(createOptions({ inputPath: "input.txt" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockRejectedValue(new Error("boom")),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not read mapping file: map.csv");
  });

  it("normalizes map parse failures", async () => {
    await expect(
      runCli(createOptions({ inputPath: "input.txt" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockImplementation((path: string) => {
          if (path === "map.csv") return Promise.resolve("not-valid-csv\n");
          return Promise.resolve("syl la");
        }),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not parse mapping file:");
  });

  it("normalizes input file read failures", async () => {
    await expect(
      runCli(createOptions({ inputPath: "input.txt" }), {
        stdinIsTty: true,
        stdinText: "",
        stdout: { write: vi.fn() },
        readFile: vi.fn().mockImplementation((path: string) => {
          if (path === "map.csv") return Promise.resolve(MAP_CSV);
          return Promise.reject(new Error("boom"));
        }),
        writeFile: vi.fn(),
      }),
    ).rejects.toThrow("Could not read input file: input.txt");
  });

  it("normalizes output file write failures", async () => {
    coreMocks.translateText.mockReturnValueOnce("zog");

    await expect(
      runCli(
        createOptions({ inputPath: "input.txt", outputPath: "result.txt" }),
        {
          stdinIsTty: true,
          stdinText: "",
          stdout: { write: vi.fn() },
          readFile: vi.fn().mockResolvedValue(MAP_CSV),
          writeFile: vi.fn().mockRejectedValue(new Error("boom")),
        },
      ),
    ).rejects.toThrow("Could not write output file: result.txt");
  });

  it("passes through empty input unchanged", async () => {
    coreMocks.translateText.mockReturnValueOnce("");
    const stdout = { write: vi.fn() };

    await runCli(createOptions({ inputPath: "input.txt" }), {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue(MAP_CSV),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("");
  });
});
