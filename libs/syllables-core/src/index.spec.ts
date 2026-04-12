import { expect } from "vitest";
import * as syllablesCore from "./index.js";

describe("syllables-core", () => {
  it("exports the public API", () => {
    expect(syllablesCore).toMatchObject({
      analyzeSyllableCounts: expect.any(Function),
      createHypherSyllableExtractor: expect.any(Function),
      tokenizeWords: expect.any(Function),
    });
  });
});
