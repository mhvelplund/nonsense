import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/lib/parse-cli-args";

const REQUIRED = ["--map", "map.csv", "--direction", "to-synthetic"];

describe("parseCliArgs", () => {
  it("parses required options with csv defaults", () => {
    expect(parseCliArgs(REQUIRED)).toEqual({
      mapPath: "map.csv",
      direction: "to-synthetic",
      mapFormat: "csv",
      mapHeader: false,
      language: "en-us",
    });
  });

  it("accepts --direction from-synthetic", () => {
    expect(
      parseCliArgs(["--map", "map.csv", "--direction", "from-synthetic"]),
    ).toEqual({
      mapPath: "map.csv",
      direction: "from-synthetic",
      mapFormat: "csv",
      mapHeader: false,
      language: "en-us",
    });
  });

  it("accepts --map-format json", () => {
    expect(parseCliArgs([...REQUIRED, "--map-format", "json"])).toMatchObject({
      mapFormat: "json",
    });
  });

  it("accepts --map-header flag", () => {
    expect(parseCliArgs([...REQUIRED, "--map-header"])).toMatchObject({
      mapHeader: true,
    });
  });

  it("accepts -L / --language da", () => {
    expect(parseCliArgs([...REQUIRED, "-L", "da"])).toMatchObject({
      language: "da",
    });
    expect(parseCliArgs([...REQUIRED, "--language", "da"])).toMatchObject({
      language: "da",
    });
  });

  it("accepts -o / --output path", () => {
    expect(parseCliArgs([...REQUIRED, "-o", "result.txt"])).toMatchObject({
      outputPath: "result.txt",
    });
    expect(parseCliArgs([...REQUIRED, "--output", "result.txt"])).toMatchObject(
      { outputPath: "result.txt" },
    );
  });

  it("accepts a positional input path", () => {
    expect(parseCliArgs([...REQUIRED, "input.txt"])).toMatchObject({
      inputPath: "input.txt",
    });
  });

  it("throws a CommanderError when --direction is missing", () => {
    expect(() => parseCliArgs(["--map", "map.csv"])).toThrow();
  });

  it("throws a CommanderError when --map is missing", () => {
    expect(() => parseCliArgs(["--direction", "to-synthetic"])).toThrow();
  });
});
