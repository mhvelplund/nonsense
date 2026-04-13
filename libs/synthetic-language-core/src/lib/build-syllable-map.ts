import type { RankedSyllableEntry } from "@nonsense/syllables-core";

import type { MappingRecord } from "./types";
import { letterPoolForChar, type Rng } from "./generate-synthetic-syllable";

function countCombinations(pools: readonly (readonly string[])[]): number {
  return pools.reduce((total, pool) => total * pool.length, 1);
}

function syntheticFromIndex(
  pools: readonly (readonly string[])[],
  index: number,
): string {
  const chars = new Array<string>(pools.length);
  let remaining = index;

  for (let i = pools.length - 1; i >= 0; i--) {
    const pool = pools[i];
    chars[i] = pool[remaining % pool.length];
    remaining = Math.floor(remaining / pool.length);
  }

  return chars.join("");
}

export function buildSyllableMap(
  entries: RankedSyllableEntry[],
  rng: Rng = Math.random,
): MappingRecord[] {
  const used = new Set<string>();
  return entries.map(({ syllable }) => {
    const pools = syllable.split("").map((ch) => letterPoolForChar(ch));
    const combinations = countCombinations(pools);
    const start = Math.floor(rng() * combinations);

    for (let offset = 0; offset < combinations; offset++) {
      const candidate = syntheticFromIndex(
        pools,
        (start + offset) % combinations,
      );
      if (!used.has(candidate)) {
        used.add(candidate);
        return { synthetic: candidate, source: syllable };
      }
    }

    throw new Error(`No unique synthetic syllable remaining for "${syllable}"`);
  });
}
