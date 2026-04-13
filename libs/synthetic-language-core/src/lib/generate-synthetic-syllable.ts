export type Rng = () => number;

const VOWELS = ["a", "e", "i", "o", "u", "y"];
const CONSONANTS = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .filter((c) => !VOWELS.includes(c));

export const VOWEL_POOL_SIZE = VOWELS.length;
export const CONSONANT_POOL_SIZE = CONSONANTS.length;

export function isVowel(ch: string): boolean {
  return VOWELS.includes(ch);
}

export function generateSyntheticSyllable(
  source: string,
  rng: Rng = Math.random,
): string {
  return source
    .split("")
    .map((ch) => {
      const pool = isVowel(ch) ? VOWELS : CONSONANTS;
      return pool[Math.floor(rng() * pool.length)];
    })
    .join("");
}
