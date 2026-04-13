export type Rng = () => number;

const VOWELS = ["a", "e", "i", "o", "u", "y"];
const CONSONANTS = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .filter((c) => !VOWELS.includes(c));

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
