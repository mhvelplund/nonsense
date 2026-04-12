import Hypher from "hypher";
import english from "hyphenation.en-us";

export function createHypherSyllableExtractor(
  createEngine: () => Pick<Hypher, "hyphenate"> = () => new Hypher(english),
) {
  const engine = createEngine();
  return (word: string): string[] => engine.hyphenate(word);
}
