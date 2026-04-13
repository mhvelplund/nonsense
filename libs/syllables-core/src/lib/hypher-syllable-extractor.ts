import Hypher from "hypher";
import danish from "hyphenation.da";
import english from "hyphenation.en-us";

export type SupportedLanguage = "en-us" | "da";

const patterns: Record<SupportedLanguage, unknown> = {
  "en-us": english,
  da: danish,
};

export function createHypherSyllableExtractor(
  language: SupportedLanguage = "en-us",
  createEngine?: () => Pick<Hypher, "hyphenate">,
) {
  const engine = createEngine ? createEngine() : new Hypher(patterns[language]);
  return (word: string): string[] => engine.hyphenate(word);
}
