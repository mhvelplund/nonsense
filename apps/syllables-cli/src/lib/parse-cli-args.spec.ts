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

  it("accepts explicit long-form options and an input path", () => {
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

  it("accepts short aliases for the supported options", () => {
    expect(
      parseCliArgs([
        "-f",
        "json",
        "-H",
        "-o",
        "report.json",
        "-l",
        "4",
        "-s",
        "count:asc",
        "-s",
        "syllable:desc",
        "input.txt",
      ]),
    ).toEqual({
      inputPath: "input.txt",
      outputPath: "report.json",
      format: "json",
      header: true,
      limit: 4,
      sort: [
        { field: "count", direction: "asc" },
        { field: "syllable", direction: "desc" },
      ],
    });
  });
});
