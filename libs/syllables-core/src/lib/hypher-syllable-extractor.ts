type HypherEngine = {
  hyphenate(word: string): string[];
};

export function createHypherSyllableExtractor(
  createEngine: () => HypherEngine = () => {
    const Hypher = require("hypher") as new (patterns: unknown) => HypherEngine;
    const english: unknown = require("hyphenation.en-us");
    return new Hypher(english);
  },
) {
  const engine = createEngine();
  return (word: string): string[] => engine.hyphenate(word);
}
