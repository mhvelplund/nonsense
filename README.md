# Nonsense
<!-- cspell: disable -->
Nonsense is a package for making synthetic languages and translating text to and from those languages. It's not proper
languages, simple syllable search and replace.

## Setup

Install [`mise-en-place`](https://mise.jdx.dev/) and then run these commands:

```bash
mise trust
mise install
pnpm install
nx run-many -t prune
```

This sets up the monorepo and builds installable CLI artifacts:

* [`syllables-cli`](./apps/syllables-cli/): Counts syllable frequencies in text input and outputs a ranked list.
* [`syllable-map-cli`](./apps/syllable-map-cli/): Builds a syllable substitution map from a ranked syllable list (e.g.
  the output of `syllables-cli`).
* [`synthetic-language-cli`](./apps/synthetic-language-cli/): Translates text to or from a synthetic language using a
  syllable substitution map (e.g. the output of `syllable-map-cli`).

## Usage

Run the packaged CLIs directly using Node:

```shell
# Analyze syllable frequencies
node ./apps/syllables-cli/dist/main.js input.txt

# Build a syllable substitution map from ranked syllables
node ./apps/syllable-map-cli/dist/main.js ranked.csv

# Translate text to or from a synthetic language
node ./apps/synthetic-language-cli/dist/main.js --map map.csv --direction to-synthetic input.txt
```

This example shows how to generate a complete synthetic language and translate text:

```shell
unzip examples/english.zip -d examples/
node ./apps/syllables-cli/dist/main.js -l 50000 examples/english.txt | \
  node ./apps/syllable-map-cli/dist/main.js ranked.csv > examples/zorkish.language-map
node ./apps/synthetic-language-cli/dist/main.js --map examples/zorkish.language-map --direction to-synthetic examples/the-verdict.txt > examples/zorked.txt
node ./apps/synthetic-language-cli/dist/main.js --map examples/zorkish.language-map --direction from-synthetic examples/zorked.txt > examples/unzorked.txt
```

As a casual `diff examples/the-verdict.txt examples/unzorked.txt` will show, it's not perfect:

```diff
163c163
< And, in answer to a question I put half-mechanically--"Begin again?" he flashed out. "When the one thing that brings me anywhere near him is that I knew enough to leave off?"
---
> And, in answer to a question I put half-fopticocally--"Levoh again?" he ntithiv out. "When the one thing that kginvx me anywhere near him is that I knew ijouvc to leave off?"
165c165
< He stood up and laid his hand on my shoulder with a laugh. "Only the irony of it is that I _am_ still painting--since Grindle's doing it for me! The Strouds stand alone, and happen once--but there's no exterminating our kind of art."
---
> He stood up and laid his hand on my shoulder with a laugh. "Only the osoqu of it is that I _am_ still painting--nefra Pfohkni's doing it for me! The Strouds stand alone, and happen uxra--but there's no exterminating our kind of art."
```

Some random words are mangled, and names are almost always mangled. But as they say, "it's good enough for government
work".
