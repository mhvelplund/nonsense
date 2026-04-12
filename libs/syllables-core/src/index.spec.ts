import { expect } from "vitest";
import * as syllablesCore from "./index.js";

describe("syllables-core", () => {
  it("exports analyzeSyllableCounts", () => {
    expect(syllablesCore).toMatchObject({
      analyzeSyllableCounts: expect.any(Function),
    });
  });
});
