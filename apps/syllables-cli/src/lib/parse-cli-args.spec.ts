import { describe, expect, it } from "vitest";

import { parseCliArgs } from "./parse-cli-args";

describe("parseCliArgs", () => {
  it("uses csv defaults with no header and a limit of 100", () => {
    expect(parseCliArgs([])).toEqual({
      format: "csv",
      header: false,
      limit: 100,
      sort: [],
    });
  });

  it("accepts explicit format, header, output, and input path options", () => {
    expect(
      parseCliArgs([
        "--format",
        "json",
        "--header",
        "--output",
        "report.json",
        "input.txt",
      ]),
    ).toEqual({
      inputPath: "input.txt",
      outputPath: "report.json",
      format: "json",
      header: true,
      limit: 100,
      sort: [],
    });
  });

  it("collects repeated sort flags and an explicit limit", () => {
    expect(
      parseCliArgs([
        "--sort",
        "count:desc",
        "--sort",
        "syllable:asc",
        "--limit",
        "25",
      ]),
    ).toEqual({
      format: "csv",
      header: false,
      limit: 25,
      sort: [
        { field: "count", direction: "desc" },
        { field: "syllable", direction: "asc" },
      ],
    });
  });

  it("rejects multiple positional input paths", () => {
    expect(() => parseCliArgs(["first.txt", "second.txt"])).toThrow(
      "Provide a single input file path.",
    );
  });

  it("rejects an invalid format", () => {
    expect(() => parseCliArgs(["--format", "yaml"])).toThrow("Invalid format.");
  });

  it("rejects an invalid limit", () => {
    expect(() => parseCliArgs(["--limit", "0"])).toThrow("Invalid limit.");
  });

  it("rejects an invalid sort field", () => {
    expect(() => parseCliArgs(["--sort", "rank:asc"])).toThrow(
      "Invalid sort field.",
    );
  });

  it("rejects an invalid sort direction", () => {
    expect(() => parseCliArgs(["--sort", "count:up"])).toThrow(
      "Invalid sort direction.",
    );
  });

  it("rejects malformed sort values with extra segments", () => {
    expect(() => parseCliArgs(["--sort", "count:desc:extra"])).toThrow(
      "Invalid sort direction.",
    );
  });

  it.each(["--format", "--output", "--limit", "--sort"])(
    "rejects missing values for %s",
    (flag) => {
      expect(() => parseCliArgs([flag])).toThrow(`${flag} requires a value.`);
    },
  );

  it.each([
    ["--format", "--output"],
    ["--output", "--header"],
    ["--limit", "--sort"],
    ["--sort", "--format"],
  ])("rejects another flag as a missing value for %s", (flag, nextFlag) => {
    expect(() => parseCliArgs([flag, nextFlag])).toThrow(
      `${flag} requires a value.`,
    );
  });

  it("rejects unknown flags", () => {
    expect(() => parseCliArgs(["--wat"])).toThrow("Unknown flag: --wat");
  });

  it("rejects unknown single-dash flags", () => {
    expect(() => parseCliArgs(["-h"])).toThrow("Unknown flag: -h");
  });

  it.each([
    ["--format", "-h"],
    ["--output", "-h"],
    ["--limit", "-h"],
    ["--sort", "-h"],
  ])("rejects single-dash flags as missing values for %s", (flag, nextFlag) => {
    expect(() => parseCliArgs([flag, nextFlag])).toThrow(
      `${flag} requires a value.`,
    );
  });
});
