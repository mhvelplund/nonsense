import type { RankedSyllableEntry, SortSpec, SyllableCounts } from "./types";

const CANONICAL_SORT: SortSpec[] = [
  { field: "count", direction: "desc" },
  { field: "syllable", direction: "asc" },
];

export function rankSyllableCounts(
  counts: SyllableCounts,
  options: { limit?: number; sort: SortSpec[] },
): RankedSyllableEntry[] {
  const limit = options.limit ?? 100;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Result limit must be a positive integer.");
  }

  const entries = Object.entries(counts).map(([syllable, count]) => ({
    syllable,
    count,
  }));
  const selected = [...entries]
    .sort(buildComparator(CANONICAL_SORT))
    .slice(0, limit);
  const outputSort = options.sort.length > 0 ? options.sort : CANONICAL_SORT;

  return selected.sort(buildComparator(outputSort));
}

function buildComparator(sort: SortSpec[]) {
  return (left: RankedSyllableEntry, right: RankedSyllableEntry): number => {
    for (const rule of sort) {
      const factor = rule.direction === "asc" ? 1 : -1;
      const comparison =
        rule.field === "count"
          ? left.count - right.count
          : left.syllable.localeCompare(right.syllable);

      if (comparison !== 0) {
        return comparison * factor;
      }
    }

    return 0;
  };
}
