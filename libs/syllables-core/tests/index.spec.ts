import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect } from "vitest";
import * as syllablesCore from "../src/index.js";

describe("syllables-core", () => {
  it("exports the public API", () => {
    expect(syllablesCore).toMatchObject({
      analyzeSyllableCounts: expect.any(Function),
      createHypherSyllableExtractor: expect.any(Function),
      tokenizeWords: expect.any(Function),
    });
  });

  it("declares a CommonJS export for nodenext consumers", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../package.json"), "utf-8"),
    ) as {
      exports: { ".": { require?: string } };
    };

    expect(pkg.exports["."].require).toBe("./dist/index.js");
  });
});
