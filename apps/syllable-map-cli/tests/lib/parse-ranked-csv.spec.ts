import { describe, expect, it } from "vitest";

import { parseRankedCsv } from "../../src/lib/parse-ranked-csv";

describe("parseRankedCsv", () => {
  it("parses rows without a header", () => {
    const input = '"syl";3\n"la";2\n"ble";1\n';
    expect(parseRankedCsv(input, { header: false })).toEqual([
      { syllable: "syl", count: 3 },
      { syllable: "la", count: 2 },
      { syllable: "ble", count: 1 },
    ]);
  });

  it("skips the header row when header is true", () => {
    const input = '"syllable";count\n"syl";3\n"la";2\n';
    expect(parseRankedCsv(input, { header: true })).toEqual([
      { syllable: "syl", count: 3 },
      { syllable: "la", count: 2 },
    ]);
  });

  it("handles an empty input", () => {
    expect(parseRankedCsv("", { header: false })).toEqual([]);
    expect(parseRankedCsv("", { header: true })).toEqual([]);
  });

  it("handles a header-only input", () => {
    expect(parseRankedCsv('"syllable";count\n', { header: true })).toEqual([]);
  });

  it("throws on an invalid row", () => {
    expect(() =>
      parseRankedCsv("not-a-valid-row\n", { header: false }),
    ).toThrow("Invalid ranked CSV row at line 1");
  });

  it("unescapes doubled quotes in the syllable field", () => {
    const input = '"syl""ble";2\n';
    expect(parseRankedCsv(input, { header: false })).toEqual([
      { syllable: 'syl"ble', count: 2 },
    ]);
  });

  it("handles CRLF line endings", () => {
    const input = '"syl";3\r\n"la";2\r\n';
    expect(parseRankedCsv(input, { header: false })).toEqual([
      { syllable: "syl", count: 3 },
      { syllable: "la", count: 2 },
    ]);
  });
});
