import { describe, expect, it } from "vitest";

import { toSyllableRecord } from "./to-syllable-record";

describe("toSyllableRecord", () => {
  it("projects ranked entries back into a record", () => {
    expect(
      toSyllableRecord([
        { syllable: "la", count: 2 },
        { syllable: "ble", count: 2 },
      ]),
    ).toEqual({
      la: 2,
      ble: 2,
    });
  });

  it("returns an empty record for empty ranked results", () => {
    expect(toSyllableRecord([])).toEqual({});
  });
});
