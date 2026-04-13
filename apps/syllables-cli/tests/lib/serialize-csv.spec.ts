import { describe, expect, it } from "vitest";

import { serializeCsv } from "../../src/lib/serialize-csv";

describe("serializeCsv", () => {
  it("defaults to semicolon-separated rows with quoted syllables", () => {
    expect(
      serializeCsv([{ syllable: "la", count: 2 }], { header: false }),
    ).toBe('"la";2\n');
  });

  it("escapes embedded quotes in syllables", () => {
    expect(
      serializeCsv([{ syllable: 'a"b', count: 1 }], { header: false }),
    ).toBe('"a""b";1\n');
  });

  it("adds the quoted header row when requested", () => {
    expect(serializeCsv([{ syllable: "la", count: 2 }], { header: true })).toBe(
      '"syllable";count\n"la";2\n',
    );
  });

  it("preserves the empty-output contract", () => {
    expect(serializeCsv([], { header: false })).toBe("");
    expect(serializeCsv([], { header: true })).toBe('"syllable";count\n');
  });
});
