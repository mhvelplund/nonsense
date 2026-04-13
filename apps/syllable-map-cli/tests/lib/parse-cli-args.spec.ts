import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/lib/parse-cli-args";

describe("parseCliArgs", () => {
  it("uses csv defaults with no header and csv input format", () => {
    expect(parseCliArgs([])).toEqual({
      inputFormat: "csv",
      inputHeader: false,
      format: "csv",
      header: false,
    });
  });

  it("accepts explicit long-form options and an input path", () => {
    expect(
      parseCliArgs([
        "--input-format",
        "json",
        "--format",
        "json",
        "--header",
        "--output",
        "report.json",
        "input.csv",
      ]),
    ).toEqual({
      inputPath: "input.csv",
      outputPath: "report.json",
      inputFormat: "json",
      inputHeader: false,
      format: "json",
      header: true,
    });
  });

  it("accepts --input-header for CSV input with header row", () => {
    expect(parseCliArgs(["--input-header"])).toEqual({
      inputFormat: "csv",
      inputHeader: true,
      format: "csv",
      header: false,
    });
  });

  it("accepts short aliases for output format and output path", () => {
    expect(
      parseCliArgs(["-f", "json", "-H", "-o", "result.json", "input.csv"]),
    ).toEqual({
      inputPath: "input.csv",
      outputPath: "result.json",
      inputFormat: "csv",
      inputHeader: false,
      format: "json",
      header: true,
    });
  });
});
