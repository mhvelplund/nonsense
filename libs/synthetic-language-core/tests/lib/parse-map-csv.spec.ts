import { describe, expect, it } from "vitest";
import { parseMapCsv } from "../../src/lib/parse-map-csv";

describe("parseMapCsv", () => {
  it("parses CSV rows without a header", () => {
    const input = '"hello";"hola"\n"world";"mundo"\n';
    expect(parseMapCsv(input, { header: false })).toEqual([
      { synthetic: "hello", source: "hola" },
      { synthetic: "world", source: "mundo" },
    ]);
  });

  it("skips the header row when header option is true", () => {
    const input = '"synthetic";"source"\n"hello";"hola"\n';
    expect(parseMapCsv(input, { header: true })).toEqual([
      { synthetic: "hello", source: "hola" },
    ]);
  });

  it("unescapes doubled quotes in quoted fields", () => {
    const input = '"say ""hi""";"say ""hello"""\n';
    expect(parseMapCsv(input, { header: false })).toEqual([
      { synthetic: 'say "hi"', source: 'say "hello"' },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseMapCsv("", { header: false })).toEqual([]);
    expect(parseMapCsv("", { header: true })).toEqual([]);
  });

  it("returns an empty array for header-only input", () => {
    expect(parseMapCsv('"synthetic";"source"\n', { header: true })).toEqual([]);
  });

  it("throws on a row with the wrong number of fields", () => {
    const input = '"only-one-field"\n';
    expect(() => parseMapCsv(input, { header: false })).toThrow(
      /Invalid CSV row/,
    );
  });

  it("throws on a row with unquoted fields", () => {
    const input = "hello;world\n";
    expect(() => parseMapCsv(input, { header: false })).toThrow(
      /Invalid CSV row/,
    );
  });

  it("parses CRLF-terminated rows without a header", () => {
    const input = '"hello";"hola"\r\n"world";"mundo"\r\n';
    expect(parseMapCsv(input, { header: false })).toEqual([
      { synthetic: "hello", source: "hola" },
      { synthetic: "world", source: "mundo" },
    ]);
  });

  it("skips a CRLF-terminated header row when header option is true", () => {
    const input = '"synthetic";"source"\r\n"hello";"hola"\r\n';
    expect(parseMapCsv(input, { header: true })).toEqual([
      { synthetic: "hello", source: "hola" },
    ]);
  });
});
