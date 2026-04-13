import { describe, expect, it } from "vitest";

import { parseRankedJson } from "../../src/lib/parse-ranked-json";

describe("parseRankedJson", () => {
  it("parses a valid array of ranked entries", () => {
    const input = JSON.stringify([
      { syllable: "syl", count: 3 },
      { syllable: "la", count: 2 },
    ]);
    expect(parseRankedJson(input)).toEqual([
      { syllable: "syl", count: 3 },
      { syllable: "la", count: 2 },
    ]);
  });

  it("parses an empty array", () => {
    expect(parseRankedJson("[]")).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseRankedJson("{not json}")).toThrow("Invalid JSON");
  });

  it("throws when the root is not an array", () => {
    expect(() => parseRankedJson('{"syllable":"a","count":1}')).toThrow(
      "Invalid ranked JSON: expected an array",
    );
  });

  it("throws when an entry is missing the syllable field", () => {
    expect(() => parseRankedJson('[{"count":1}]')).toThrow(
      "Invalid ranked entry (index 0)",
    );
  });

  it("throws when an entry has a non-integer count", () => {
    expect(() => parseRankedJson('[{"syllable":"la","count":1.5}]')).toThrow(
      "Invalid ranked entry (index 0)",
    );
  });

  it("throws when an entry has a negative count", () => {
    expect(() => parseRankedJson('[{"syllable":"la","count":-1}]')).toThrow(
      "Invalid ranked entry (index 0)",
    );
  });
});
