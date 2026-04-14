import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect } from "vitest";
import * as syntheticLanguageCore from "../src/index.js";

describe("synthetic-language-core", () => {
  it("exports the public API", () => {
    expect(syntheticLanguageCore).toMatchObject({
      buildSyllableMap: expect.any(Function),
      translateText: expect.any(Function),
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
