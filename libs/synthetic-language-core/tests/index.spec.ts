import { expect } from "vitest";
import * as syntheticLanguageCore from "../src/index.js";

describe("synthetic-language-core", () => {
  it("exports the public API", () => {
    expect(syntheticLanguageCore).toMatchObject({
      buildSyllableMap: expect.any(Function),
      translateText: expect.any(Function),
    });
  });
});
