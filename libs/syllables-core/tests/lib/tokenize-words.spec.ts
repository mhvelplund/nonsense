import { describe, expect, it } from "vitest";

import { tokenizeWords } from "../../src/lib/tokenize-words";

describe("tokenizeWords", () => {
  it("lowercases text and keeps alphabetic words only", () => {
    expect(tokenizeWords("Syllable, common 42!")).toEqual([
      "syllable",
      "common",
    ]);
  });
});
