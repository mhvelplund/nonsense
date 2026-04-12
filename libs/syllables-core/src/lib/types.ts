export type SyllableCounts = Record<string, number>;

export type SyllableExtractor = (word: string) => string[];

export type SortField = "count" | "syllable";
export type SortDirection = "asc" | "desc";

export interface SortSpec {
  field: SortField;
  direction: SortDirection;
}

export interface RankedSyllableEntry {
  syllable: string;
  count: number;
}
