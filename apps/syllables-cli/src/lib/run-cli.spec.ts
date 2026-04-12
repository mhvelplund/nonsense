import { describe, expect, it, vi } from "vitest";

import { runCli } from "./run-cli";

describe("runCli", () => {
  it("writes default csv without a header for file input", async () => {
    const readFile = vi.fn().mockResolvedValue("Syllable common syllable");
    const stdout = { write: vi.fn() };

    await runCli(["input.txt"], {
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

    await runCli(["--format", "json", "--output", "result.json", "input.txt"], {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue("Syllable"),
      writeFile,
    });

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
      [
        "--header",
        "--limit",
        "4",
        "--sort",
        "count:asc",
        "--sort",
        "syllable:desc",
        "input.txt",
      ],
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

  it("succeeds with empty csv output when analysis produces no syllables", async () => {
    const stdout = { write: vi.fn() };

    await runCli(["input.txt"], {
      stdinIsTty: true,
      stdinText: "",
      stdout,
      readFile: vi.fn().mockResolvedValue(""),
      writeFile: vi.fn(),
    });

    expect(stdout.write).toHaveBeenCalledWith("");
  });
});
