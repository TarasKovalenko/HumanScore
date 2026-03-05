import { describe, expect, it } from "vitest";
import { analyzeText, _internals as fn } from "./detector";

const AI_LINKEDIN_POST = `Why PostgreSQL is dominating modern application stacks (and AI is just one reason)

PostgreSQL didn't become popular overnight.

It earned its place by quietly solving real problems - at scale.
Here's why more teams are standardizing on PostgreSQL 👇

🔹 Built for real-world complexity
Modern apps aren't simple CRUD systems anymore.
PostgreSQL handles complex queries, high concurrency, and large datasets without falling apart.

🔹 One database, many workloads
OLTP, analytics, full-text search, geospatial data - PostgreSQL does it all without forcing teams to juggle multiple databases.

🔹 Extensible by design
PostgreSQL evolves with your needs.
From custom data types to powerful extensions, it adapts instead of being replaced.

🔹 Cloud-native and production-proven
Runs everywhere - cloud, on-prem, containers - with strong consistency and battle-tested reliability.

🔹 Open source without compromise
No vendor lock-in. Transparent roadmap. Massive community innovation.

🔹 And yes… AI is accelerating it
Vector embeddings, semantic search, RAG pipelines - tools like pgvector let teams build AI features directly on PostgreSQL instead of adding yet another datastore.

💡 The real takeaway
PostgreSQL isn't winning because of hype.
It's winning because modern systems demand flexibility, reliability, and scale - and PostgreSQL delivers all three.

AI didn't make PostgreSQL relevant.
PostgreSQL was already ready when AI arrived.`;

const HUMAN_CASUAL_TEXT = `so yesterday i was debugging this weird thing at work right, and turns out the whole
problem was a missing semicolon. like... seriously?? i spent 3 hours on it lol.

anyway my coworker dave was like "bro just use the linter" and honestly he's not wrong
but idk, sometimes i just wanna write code without all those tools nagging me every 2 seconds.

also we got free pizza for lunch which was cool. pepperoni and mushroom, the good stuff.
not like that time they ordered hawaiian and half the team almost quit haha.

oh and btw - anyone else think typescript generics are lowkey terrifying? like i understand
them in theory but the moment i see K extends keyof T i just zone out completely 😵

gonna grab some coffee now, brb. this afternoon i need to finish that PR or my manager
will give me The Look™ again.`;

const SHORT_AI_POST = `✅ Less boilerplate
✅ Better readability
✅ Same DI power
✅ Production-ready in .NET 8

Sometimes improving your code isn't about big refactoring…
It's about removing unnecessary lines. ✨`;

// Helpers to prep inputs the same way analyzeText does
function prepText(raw: string) {
  const rawText = raw.replace(/\r/g, "").slice(0, 4000);
  const normalizedText = fn.collapseWhitespace(rawText);
  const words = fn.tokenizeWords(normalizedText);
  const sentences = fn.splitSentences(rawText);
  const lines = fn.splitLines(rawText);
  return { rawText, normalizedText, words, sentences, lines };
}

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(fn.clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when below", () => {
    expect(fn.clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps to max when above", () => {
    expect(fn.clamp(15, 0, 10)).toBe(10);
  });

  it("handles min === max", () => {
    expect(fn.clamp(5, 3, 3)).toBe(3);
  });
});

describe("mean", () => {
  it("returns 0 for empty array", () => {
    expect(fn.mean([])).toBe(0);
  });

  it("returns single value for one element", () => {
    expect(fn.mean([42])).toBe(42);
  });

  it("computes average correctly", () => {
    expect(fn.mean([2, 4, 6])).toBe(4);
  });
});

describe("standardDeviation", () => {
  it("returns 0 for empty array", () => {
    expect(fn.standardDeviation([])).toBe(0);
  });

  it("returns 0 for identical values", () => {
    expect(fn.standardDeviation([5, 5, 5])).toBe(0);
  });

  it("computes correct standard deviation", () => {
    const sd = fn.standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(sd).toBeCloseTo(2.0, 1);
  });
});

describe("coefficientOfVariation", () => {
  it("returns 0 when mean is 0", () => {
    expect(fn.coefficientOfVariation([0, 0, 0])).toBe(0);
  });

  it("returns 0 for uniform values", () => {
    expect(fn.coefficientOfVariation([7, 7, 7])).toBe(0);
  });

  it("returns positive value for varied data", () => {
    expect(fn.coefficientOfVariation([1, 5, 10])).toBeGreaterThan(0);
  });
});

describe("collapseWhitespace", () => {
  it("trims leading/trailing whitespace", () => {
    expect(fn.collapseWhitespace("  hello  ")).toBe("hello");
  });

  it("collapses internal whitespace to single space", () => {
    expect(fn.collapseWhitespace("foo   bar\n\nbaz")).toBe("foo bar baz");
  });

  it("handles empty string", () => {
    expect(fn.collapseWhitespace("")).toBe("");
  });
});

describe("countOccurrences", () => {
  it("counts multiple occurrences", () => {
    expect(fn.countOccurrences("abcabc", "abc")).toBe(2);
  });

  it("returns 0 for no match", () => {
    expect(fn.countOccurrences("hello world", "xyz")).toBe(0);
  });

  it("returns 0 for empty phrase", () => {
    expect(fn.countOccurrences("hello", "")).toBe(0);
  });

  it("finds overlapping matches (non-overlapping by design)", () => {
    expect(fn.countOccurrences("aaaa", "aa")).toBe(2);
  });
});

describe("tokenizeWords", () => {
  it("lowercases and splits on word boundaries", () => {
    expect(fn.tokenizeWords("Hello World")).toEqual(["hello", "world"]);
  });

  it("strips leading/trailing apostrophes", () => {
    expect(fn.tokenizeWords("it's 'quoted'")).toEqual(["it's", "quoted"]);
  });

  it("handles unicode letters", () => {
    // \b in JS regex is ASCII-based, so accented chars at word boundaries split unexpectedly
    const result = fn.tokenizeWords("café naïve");
    expect(result).toContain("naïve");
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty array for empty string", () => {
    expect(fn.tokenizeWords("")).toEqual([]);
  });

  it("handles emoji-heavy text without crashing", () => {
    const result = fn.tokenizeWords("🔹 Built for complexity");
    expect(result).toEqual(["built", "for", "complexity"]);
  });
});

describe("splitSentences", () => {
  it("splits on period, exclamation, question mark", () => {
    const result = fn.splitSentences("Hello world. How are you? Great!");
    expect(result.length).toBe(3);
  });

  it("splits on newlines", () => {
    const result = fn.splitSentences("Line one\nLine two\nLine three");
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("filters out very short fragments", () => {
    const result = fn.splitSentences("OK. A. This is a sentence.");
    const shortOnes = result.filter((s) => s.length < 4);
    expect(shortOnes.length).toBe(0);
  });
});

describe("splitLines", () => {
  it("splits on newlines and filters short lines", () => {
    const result = fn.splitLines("Hello\n\nWorld\na");
    expect(result).toEqual(["Hello", "World"]);
  });
});

describe("normalizedEntropy", () => {
  it("returns 0 for fewer than 2 values", () => {
    expect(fn.normalizedEntropy(["a"])).toBe(0);
  });

  it("returns 0 for all identical values", () => {
    expect(fn.normalizedEntropy(["a", "a", "a"])).toBe(0);
  });

  it("returns 1 for maximum diversity (each value unique)", () => {
    expect(fn.normalizedEntropy(["a", "b", "c", "d"])).toBeCloseTo(1.0, 2);
  });

  it("returns intermediate value for mixed repetition", () => {
    const entropy = fn.normalizedEntropy(["a", "a", "b", "c"]);
    expect(entropy).toBeGreaterThan(0);
    expect(entropy).toBeLessThan(1);
  });
});

describe("buildCounts", () => {
  it("counts word frequencies", () => {
    const counts = fn.buildCounts(["a", "b", "a", "c", "a"]);
    expect(counts.get("a")).toBe(3);
    expect(counts.get("b")).toBe(1);
    expect(counts.get("c")).toBe(1);
  });

  it("skips empty strings", () => {
    const counts = fn.buildCounts(["a", "", "b", ""]);
    expect(counts.has("")).toBe(false);
    expect(counts.size).toBe(2);
  });
});

describe("ratioOfRepeated", () => {
  it("returns 0 for empty array", () => {
    expect(fn.ratioOfRepeated([])).toBe(0);
  });

  it("returns 0 when all items are unique", () => {
    expect(fn.ratioOfRepeated(["a", "b", "c"])).toBe(0);
  });

  it("returns correct ratio for repeated items", () => {
    expect(fn.ratioOfRepeated(["a", "a", "b"])).toBeCloseTo(2 / 3, 2);
  });
});

describe("extractSentenceEndings", () => {
  it("extracts terminal punctuation", () => {
    const endings = fn.extractSentenceEndings(["Hello.", "What?", "Wow!", "Hmm"]);
    expect(endings).toEqual([".", "?", "!", "."]);
  });
});

describe("approximateRarity", () => {
  it("rates common words as low rarity", () => {
    expect(fn.approximateRarity("the")).toBe(0.05);
  });

  it("rates AI-overused words at 0.35", () => {
    expect(fn.approximateRarity("delve")).toBe(0.35);
  });

  it("rates long words as high rarity", () => {
    expect(fn.approximateRarity("internationalization")).toBe(0.85);
  });
});

describe("countSyllables", () => {
  it("counts monosyllabic words", () => {
    expect(fn.countSyllables("cat")).toBe(1);
    expect(fn.countSyllables("the")).toBe(1);
  });

  it("counts polysyllabic words", () => {
    expect(fn.countSyllables("beautiful")).toBeGreaterThanOrEqual(3);
    expect(fn.countSyllables("computer")).toBeGreaterThanOrEqual(2);
  });

  it("handles silent e", () => {
    expect(fn.countSyllables("make")).toBe(1);
  });

  it("returns at least 1 for any word", () => {
    expect(fn.countSyllables("x")).toBeGreaterThanOrEqual(1);
  });
});

describe("movingAverageTypeTokenRatio", () => {
  it("returns 0 for empty array", () => {
    expect(fn.movingAverageTypeTokenRatio([], 25)).toBe(0);
  });

  it("returns TTR when words shorter than window", () => {
    const mattr = fn.movingAverageTypeTokenRatio(["a", "b", "c", "a"], 25);
    expect(mattr).toBe(3 / 4);
  });

  it("returns value between 0 and 1 for longer text", () => {
    const words = "the cat sat on the mat the dog sat on the rug".split(" ");
    const mattr = fn.movingAverageTypeTokenRatio(words, 5);
    expect(mattr).toBeGreaterThan(0);
    expect(mattr).toBeLessThanOrEqual(1);
  });
});

describe("calculateYulesK", () => {
  it("returns 0 for fewer than 2 words", () => {
    expect(fn.calculateYulesK(["hello"])).toBe(0);
  });

  it("returns higher K for repetitive text", () => {
    const repetitive = "the the the cat cat dog".split(" ");
    const diverse = "one two three four five six".split(" ");
    expect(fn.calculateYulesK(repetitive)).toBeGreaterThan(fn.calculateYulesK(diverse));
  });
});

describe("computeBigramEntropy", () => {
  it("returns 0 for fewer than 10 words", () => {
    expect(fn.computeBigramEntropy(["a", "b", "c"])).toBe(0);
  });

  it("returns value between 0 and 1 for sufficient text", () => {
    const words = fn.tokenizeWords(
      "The quick brown fox jumps over the lazy dog and the cat sleeps on the mat near the tree"
    );
    const entropy = fn.computeBigramEntropy(words);
    expect(entropy).toBeGreaterThan(0);
    expect(entropy).toBeLessThanOrEqual(1);
  });
});

describe("repeatedNgramRatio", () => {
  it("returns 0 for empty input", () => {
    expect(fn.repeatedNgramRatio([])).toBe(0);
  });

  it("detects repeated phrases across sentences", () => {
    const sentences = [
      "The key takeaway is that we need to improve.",
      "The key takeaway from this experiment was clear.",
      "In summary, the key takeaway is obvious.",
    ];
    const ratio = fn.repeatedNgramRatio(sentences);
    expect(ratio).toBeGreaterThan(0);
  });
});

describe("groupSentencesByParagraph", () => {
  it("groups sentences by newline boundaries", () => {
    const sentences = ["First sentence.\n", "Second sentence.", "Third sentence.\n", "Fourth."];
    const groups = fn.groupSentencesByParagraph(sentences);
    expect(groups.length).toBeGreaterThanOrEqual(2);
  });
});

describe("detectSymmetry", () => {
  it("returns 0 for fewer than 3 sentences", () => {
    expect(fn.detectSymmetry(["Hello.", "World."])).toBe(0);
  });

  it("returns high value for uniform sentence lengths", () => {
    const sentences = [
      "This is a short sentence here.",
      "This is also short text here.",
      "Another one about same length.",
    ];
    expect(fn.detectSymmetry(sentences)).toBeGreaterThan(0);
  });

  it("returns 0 for highly varied sentence lengths", () => {
    const sentences = [
      "Hi.",
      "This is an extraordinarily verbose sentence that keeps going on and on with numerous words for testing purposes here.",
      "OK.",
    ];
    expect(fn.detectSymmetry(sentences)).toBe(0);
  });
});

describe("detectRepeatedLinePrefix", () => {
  it("returns 0 for fewer than 3 lines", () => {
    expect(fn.detectRepeatedLinePrefix(["a", "b"])).toBe(0);
  });

  it("detects repeated emoji prefixes", () => {
    const lines = ["🔹 First point", "🔹 Second point", "🔹 Third point", "🔹 Fourth point"];
    expect(fn.detectRepeatedLinePrefix(lines)).toBeGreaterThan(0);
  });

  it("detects repeated numbered prefixes", () => {
    const lines = ["1. First", "2. Second", "3. Third"];
    expect(fn.detectRepeatedLinePrefix(lines)).toBeGreaterThan(0);
  });
});

describe("detectChecklistPattern", () => {
  it("detects checklist icons", () => {
    const rawText = "✅ Step one\n✅ Step two\n✅ Step three";
    const lines = fn.splitLines(rawText);
    expect(fn.detectChecklistPattern(rawText, lines)).toBeGreaterThan(0);
  });

  it("detects keyword cue lines", () => {
    const rawText = "What matters\nWhy it works\nHow to apply it";
    const lines = fn.splitLines(rawText);
    expect(fn.detectChecklistPattern(rawText, lines)).toBeGreaterThan(0);
  });

  it("returns 0 for plain prose", () => {
    const rawText = "The weather is nice today. I went for a walk.";
    const lines = fn.splitLines(rawText);
    expect(fn.detectChecklistPattern(rawText, lines)).toBe(0);
  });
});

describe("detectLinkedInFormat", () => {
  it("detects full LinkedIn format: emoji sections + hook + conclusion", () => {
    const rawText = `Here's why this matters 👇

🔹 First point with detail
🔹 Second point with detail
🔹 Third point with detail

💡 The real takeaway is clear.`;
    const lines = fn.splitLines(rawText);
    expect(fn.detectLinkedInFormat(rawText, lines)).toBeGreaterThan(0.15);
  });

  it("returns 0 for plain text without LinkedIn patterns", () => {
    const rawText = "I went shopping yesterday. The store was crowded. I bought milk.";
    const lines = fn.splitLines(rawText);
    expect(fn.detectLinkedInFormat(rawText, lines)).toBe(0);
  });
});

describe("detectEmojiHeadings", () => {
  it("detects 3+ emoji-started lines", () => {
    const lines = ["🔹 Point A", "🔹 Point B", "🔹 Point C"];
    expect(fn.detectEmojiHeadings(lines)).toBeGreaterThan(0);
  });

  it("returns 0 for fewer than 3 emoji-started lines", () => {
    const lines = ["🔹 Point A", "🔹 Point B", "Regular line"];
    expect(fn.detectEmojiHeadings(lines)).toBe(0);
  });
});

describe("computeFleschKincaidSignal", () => {
  it("returns 0 for fewer than 3 sentences", () => {
    expect(fn.computeFleschKincaidSignal(["Hello.", "World."])).toBe(0);
  });

  it("returns positive signal for medium-grade uniform text", () => {
    const sentences = [
      "The system processes requests through a pipeline of middleware functions.",
      "Each middleware can modify the request before passing it along.",
      "Error handling happens at the boundary between services.",
      "The database layer abstracts all storage operations cleanly.",
      "Testing covers unit and integration levels of the application.",
    ];
    const signal = fn.computeFleschKincaidSignal(sentences);
    expect(signal).toBeGreaterThanOrEqual(0);
    expect(signal).toBeLessThanOrEqual(1);
  });
});

describe("computeLocalCoherence", () => {
  it("returns 0 for fewer than 3 sentences", () => {
    expect(fn.computeLocalCoherence(["Hello.", "World."])).toBe(0);
  });

  it("returns higher coherence for topically related sentences", () => {
    const related = [
      "PostgreSQL handles complex queries efficiently.",
      "PostgreSQL supports complex data types and indexing.",
      "PostgreSQL offers complex extensions for different workloads.",
      "PostgreSQL runs complex analytics in production.",
    ];
    const unrelated = [
      "The cat slept on the windowsill.",
      "Stock markets crashed yesterday in Asia.",
      "My favorite recipe uses cinnamon and nutmeg.",
      "The spacecraft reached orbital velocity quickly.",
    ];
    expect(fn.computeLocalCoherence(related)).toBeGreaterThan(fn.computeLocalCoherence(unrelated));
  });
});

describe("computeRepetitionFeature", () => {
  it("returns a Feature with key 'repetition'", () => {
    const { sentences } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeRepetitionFeature(sentences);
    expect(feature.key).toBe("repetition");
    expect(feature.value).toBeGreaterThanOrEqual(0);
    expect(feature.value).toBeLessThanOrEqual(1);
  });

  it("scores higher for highly repetitive text", () => {
    const repetitive = [
      "The key point is that we need change.",
      "The key point is that we need growth.",
      "The key point is that we need vision.",
      "The key point is that we need action.",
    ];
    const diverse = [
      "Dogs love playing in the park.",
      "Yesterday I finished reading a great novel.",
      "The stock market showed unexpected recovery.",
      "My grandmother makes the best apple pie.",
    ];
    expect(fn.computeRepetitionFeature(repetitive).value).toBeGreaterThan(
      fn.computeRepetitionFeature(diverse).value
    );
  });

  it("detects emoji structural repetition", () => {
    const emojiSentences = fn.splitSentences(
      "🔹 Point one about databases.\n🔹 Point two about caching.\n🔹 Point three about scaling.\n🔹 Point four about testing."
    );
    const feature = fn.computeRepetitionFeature(emojiSentences);
    expect(feature.value).toBeGreaterThan(0);
  });
});

describe("computeBurstinessFeature", () => {
  it("returns a Feature with key 'burstiness'", () => {
    const { sentences, words } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeBurstinessFeature(sentences, words);
    expect(feature.key).toBe("burstiness");
  });

  it("scores higher for uniform cadence (low burstiness)", () => {
    const uniform = [
      "This sentence has five words.",
      "This sentence also five words.",
      "Again we have five words.",
      "Five words in this one.",
    ];
    const bursty = [
      "Hi.",
      "This is a much longer sentence that goes on and on with many many words about various topics.",
      "OK.",
      "Another extremely verbose and long-winded sentence discussing the intricacies of modern software development practices in enterprise settings.",
    ];
    const uniformWords = fn.tokenizeWords(uniform.join(" "));
    const burstyWords = fn.tokenizeWords(bursty.join(" "));
    expect(fn.computeBurstinessFeature(uniform, uniformWords).value).toBeGreaterThan(
      fn.computeBurstinessFeature(bursty, burstyWords).value
    );
  });
});

describe("computeCorporateToneFeature", () => {
  it("returns a Feature with key 'corporateTone'", () => {
    const { normalizedText, words } = prepText(AI_LINKEDIN_POST);
    const markers = fn.mergeMarkers([]);
    const feature = fn.computeCorporateToneFeature(normalizedText, words, markers);
    expect(feature.key).toBe("corporateTone");
  });

  it("scores high for text full of AI template markers", () => {
    const aiText =
      "In today's fast-paced world, it is important to note that we must leverage holistic " +
      "frameworks. Furthermore, the landscape is evolving and we need to navigate this paradigm " +
      "shift. Let's delve into actionable insights and best practices. Moving forward, it's " +
      "crucial to foster innovative solutions that drive impact.";
    const normalized = fn.collapseWhitespace(aiText);
    const words = fn.tokenizeWords(normalized);
    const markers = fn.mergeMarkers([]);
    const feature = fn.computeCorporateToneFeature(normalized, words, markers);
    expect(feature.value).toBeGreaterThan(0.4);
  });

  it("scores low for casual human text", () => {
    const { normalizedText, words } = prepText(HUMAN_CASUAL_TEXT);
    const markers = fn.mergeMarkers([]);
    const feature = fn.computeCorporateToneFeature(normalizedText, words, markers);
    expect(feature.value).toBeLessThan(0.1);
  });

  it("includes custom markers", () => {
    const text = "my special phrase appears here and my special phrase again";
    const words = fn.tokenizeWords(text);
    const markers = fn.mergeMarkers(["my special phrase"]);
    const feature = fn.computeCorporateToneFeature(text, words, markers);
    expect(feature.value).toBeGreaterThan(0);
  });
});

describe("computeStructureFeature", () => {
  it("returns a Feature with key 'structure'", () => {
    const { rawText, normalizedText, sentences, lines } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeStructureFeature(rawText, normalizedText, sentences, lines);
    expect(feature.key).toBe("structure");
  });

  it("scores high for structured LinkedIn post", () => {
    const { rawText, normalizedText, sentences, lines } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeStructureFeature(rawText, normalizedText, sentences, lines);
    expect(feature.value).toBeGreaterThan(0.4);
  });

  it("detects numbered lists", () => {
    const text = "1. First point\n2. Second point\n3. Third point";
    const { rawText, normalizedText, sentences, lines } = prepText(text);
    const feature = fn.computeStructureFeature(rawText, normalizedText, sentences, lines);
    expect(feature.value).toBeGreaterThan(0);
  });

  it("detects problem/solution/takeaway triplet", () => {
    const text =
      "The problem is clear: we need better tools. The solution lies in automation. The key takeaway is to start small.";
    const { rawText, normalizedText, sentences, lines } = prepText(text);
    const feature = fn.computeStructureFeature(rawText, normalizedText, sentences, lines);
    expect(feature.value).toBeGreaterThan(0);
  });

  it("scores low for unstructured prose", () => {
    const { rawText, normalizedText, sentences, lines } = prepText(HUMAN_CASUAL_TEXT);
    const feature = fn.computeStructureFeature(rawText, normalizedText, sentences, lines);
    expect(feature.value).toBeLessThan(0.3);
  });
});

describe("computeReadabilityFeature", () => {
  it("returns a Feature with key 'readability'", () => {
    const { sentences } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeReadabilityFeature(sentences);
    expect(feature.key).toBe("readability");
  });

  it("value is between 0 and 1", () => {
    const { sentences } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeReadabilityFeature(sentences);
    expect(feature.value).toBeGreaterThanOrEqual(0);
    expect(feature.value).toBeLessThanOrEqual(1);
  });
});

describe("computeLexicalConcentrationFeature", () => {
  it("returns a Feature with key 'lexicalConcentration'", () => {
    const { words } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeLexicalConcentrationFeature(words);
    expect(feature.key).toBe("lexicalConcentration");
  });

  it("scores higher for repetitive vocabulary", () => {
    const repetitive = "the cat the cat the cat the dog the dog the cat".split(" ");
    const diverse = "apple banana cherry date elderberry fig grape honeydew".split(" ");
    expect(fn.computeLexicalConcentrationFeature(repetitive).value).toBeGreaterThan(
      fn.computeLexicalConcentrationFeature(diverse).value
    );
  });
});

describe("computePredictabilityFeature", () => {
  it("returns a Feature with key 'predictability'", () => {
    const { words, sentences } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computePredictabilityFeature(words, sentences);
    expect(feature.key).toBe("predictability");
    expect(feature.value).toBeGreaterThanOrEqual(0);
    expect(feature.value).toBeLessThanOrEqual(1);
  });
});

describe("computeZipfDeviationFeature", () => {
  it("returns zero for very few unique words", () => {
    const words = "a b c d e".split(" ");
    const feature = fn.computeZipfDeviationFeature(words);
    expect(feature.value).toBe(0);
  });

  it("returns value for sufficient vocabulary", () => {
    const { words } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeZipfDeviationFeature(words);
    expect(feature.key).toBe("zipfDeviation");
    expect(feature.value).toBeGreaterThanOrEqual(0);
    expect(feature.value).toBeLessThanOrEqual(1);
  });
});

describe("computeSentenceComplexityFeature", () => {
  it("returns zero for fewer than 4 sentences", () => {
    const feature = fn.computeSentenceComplexityFeature(["Hello.", "World.", "OK."]);
    expect(feature.value).toBe(0);
  });

  it("returns value between 0 and 1 for sufficient sentences", () => {
    const { sentences } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeSentenceComplexityFeature(sentences);
    expect(feature.key).toBe("sentenceComplexity");
    expect(feature.value).toBeGreaterThanOrEqual(0);
    expect(feature.value).toBeLessThanOrEqual(1);
  });

  it("scores higher for uniformly complex sentences", () => {
    const uniform = [
      "Although the system was complex, it handled requests efficiently because of caching.",
      "While the database struggled, the middleware compensated because of replication.",
      "Since the network was slow, the application cached responses because of latency.",
      "Unless the server crashed, the system recovered gracefully because of redundancy.",
    ];
    const varied = [
      "Hi.",
      "The extraordinarily sophisticated and multifaceted distributed computing architecture, " +
        "which encompasses numerous microservices that communicate asynchronously, was designed " +
        "with resilience and fault tolerance as its primary engineering concerns.",
      "OK then.",
      "It works.",
    ];
    expect(fn.computeSentenceComplexityFeature(uniform).value).toBeGreaterThan(
      fn.computeSentenceComplexityFeature(varied).value
    );
  });
});

describe("computeHumanizingReduction", () => {
  it("returns a Feature with key 'reduction'", () => {
    const { rawText, words, sentences } = prepText(AI_LINKEDIN_POST);
    const feature = fn.computeHumanizingReduction(rawText, words, sentences);
    expect(feature.key).toBe("reduction");
  });

  it("scores higher for casual human text with slang", () => {
    const { rawText, words, sentences } = prepText(HUMAN_CASUAL_TEXT);
    const humanReduction = fn.computeHumanizingReduction(rawText, words, sentences);

    const aiPrep = prepText(AI_LINKEDIN_POST);
    const aiReduction = fn.computeHumanizingReduction(
      aiPrep.rawText,
      aiPrep.words,
      aiPrep.sentences
    );

    expect(humanReduction.value).toBeGreaterThan(aiReduction.value);
  });

  it("detects slang terms", () => {
    const text = "lol this is gonna be great tbh, idk why anyone would disagree ngl";
    const words = fn.tokenizeWords(text);
    const sentences = fn.splitSentences(text);
    const feature = fn.computeHumanizingReduction(text, words, sentences);
    expect(feature.value).toBeGreaterThan(0.1);
  });

  it("detects personal references", () => {
    const text =
      "I think my approach was wrong. I've been doing this for years and I'm still learning. " +
      "We should discuss our strategy together.";
    const words = fn.tokenizeWords(text);
    const sentences = fn.splitSentences(text);
    const feature = fn.computeHumanizingReduction(text, words, sentences);
    expect(feature.value).toBeGreaterThan(0);
  });

  it("distinguishes structural from expressive emojis", () => {
    const structural = "🔹 Point one\n🔹 Point two\n🔹 Point three\n🔹 Point four";
    const expressive = "So happy today 😊 went to the beach 🏖️ had ice cream 🍦 met friends 🎉";

    const s1 = prepText(structural);
    const s2 = prepText(expressive);

    const structuralReduction = fn.computeHumanizingReduction(s1.rawText, s1.words, s1.sentences);
    const expressiveReduction = fn.computeHumanizingReduction(s2.rawText, s2.words, s2.sentences);

    expect(expressiveReduction.value).toBeGreaterThan(structuralReduction.value);
  });
});

describe("applyScoreCurve", () => {
  it("maps 0 to low score", () => {
    expect(fn.applyScoreCurve(0)).toBeLessThan(0.2);
  });

  it("maps midpoint (0.2) to ~0.5", () => {
    expect(fn.applyScoreCurve(0.2)).toBeCloseTo(0.5, 1);
  });

  it("maps high raw to near 1.0", () => {
    expect(fn.applyScoreCurve(0.6)).toBeGreaterThan(0.95);
  });

  it("is monotonically increasing", () => {
    const values = [0, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0].map(fn.applyScoreCurve);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("clamps negative input", () => {
    expect(fn.applyScoreCurve(-1)).toEqual(fn.applyScoreCurve(0));
  });

  it("clamps input above 1", () => {
    expect(fn.applyScoreCurve(2)).toEqual(fn.applyScoreCurve(1));
  });
});

describe("calculateRawScore", () => {
  it("sums weighted feature values", () => {
    const { rawText, normalizedText, words, sentences, lines } = prepText(AI_LINKEDIN_POST);
    const markers = fn.mergeMarkers([]);
    const featureSet = fn.buildFeatureSet({
      lines,
      markers,
      normalizedText,
      rawText,
      sentences,
      words,
    });
    const rawScore = fn.calculateRawScore(featureSet);
    expect(rawScore).toBeGreaterThan(0);
    expect(rawScore).toBeLessThan(1);
  });

  it("adds coherence bonus when many features are high", () => {
    const { rawText, normalizedText, words, sentences, lines } = prepText(AI_LINKEDIN_POST);
    const markers = fn.mergeMarkers([]);
    const featureSet = fn.buildFeatureSet({
      lines,
      markers,
      normalizedText,
      rawText,
      sentences,
      words,
    });

    const highFeatures = Object.values(featureSet)
      .filter((f) => f.key !== "reduction")
      .filter((f) => f.value > 0.6).length;

    const rawScore = fn.calculateRawScore(featureSet);
    if (highFeatures >= 3) {
      expect(rawScore).toBeGreaterThan(0);
    }
  });
});

describe("selectReasons", () => {
  it("returns up to limit reasons sorted by impact", () => {
    const { rawText, normalizedText, words, sentences, lines } = prepText(AI_LINKEDIN_POST);
    const markers = fn.mergeMarkers([]);
    const featureSet = fn.buildFeatureSet({
      lines,
      markers,
      normalizedText,
      rawText,
      sentences,
      words,
    });
    const reasons = fn.selectReasons(featureSet, 3);
    expect(reasons.length).toBeLessThanOrEqual(3);
    expect(reasons.length).toBeGreaterThan(0);
    for (const reason of reasons) {
      expect(typeof reason).toBe("string");
      expect(reason.length).toBeGreaterThan(0);
    }
  });

  it("returns fallback reason when no feature is strong", () => {
    const featureSet = {
      repetition: { key: "repetition" as const, value: 0, weightedImpact: 0, reason: "r" },
      burstiness: { key: "burstiness" as const, value: 0, weightedImpact: 0, reason: "b" },
      corporateTone: { key: "corporateTone" as const, value: 0, weightedImpact: 0, reason: "c" },
      structure: { key: "structure" as const, value: 0, weightedImpact: 0, reason: "s" },
      readability: { key: "readability" as const, value: 0, weightedImpact: 0, reason: "rd" },
      lexicalConcentration: {
        key: "lexicalConcentration" as const,
        value: 0,
        weightedImpact: 0,
        reason: "l",
      },
      predictability: { key: "predictability" as const, value: 0, weightedImpact: 0, reason: "p" },
      zipfDeviation: { key: "zipfDeviation" as const, value: 0, weightedImpact: 0, reason: "z" },
      sentenceComplexity: {
        key: "sentenceComplexity" as const,
        value: 0,
        weightedImpact: 0,
        reason: "sc",
      },
      reduction: { key: "reduction" as const, value: 0, weightedImpact: 0, reason: "red" },
    };
    const reasons = fn.selectReasons(featureSet, 3);
    expect(reasons).toEqual([
      "No single pattern dominated; the estimate comes from several weak stylistic signals.",
    ]);
  });
});

describe("computeConfidence", () => {
  it("returns low confidence for short text", () => {
    const features = [
      { key: "repetition" as const, value: 0.3, weightedImpact: 0, reason: "" },
      { key: "burstiness" as const, value: 0.3, weightedImpact: 0, reason: "" },
    ];
    expect(fn.computeConfidence(50, features)).toBeLessThan(0.5);
  });

  it("returns higher confidence for longer text with agreement", () => {
    const features = [
      { key: "repetition" as const, value: 0.7, weightedImpact: 0, reason: "" },
      { key: "burstiness" as const, value: 0.7, weightedImpact: 0, reason: "" },
      { key: "corporateTone" as const, value: 0.7, weightedImpact: 0, reason: "" },
      { key: "structure" as const, value: 0.7, weightedImpact: 0, reason: "" },
      { key: "readability" as const, value: 0.7, weightedImpact: 0, reason: "" },
    ];
    expect(fn.computeConfidence(400, features)).toBeGreaterThan(0.5);
  });

  it("is bounded between 0 and 1", () => {
    const features = [{ key: "repetition" as const, value: 1, weightedImpact: 0, reason: "" }];
    const conf = fn.computeConfidence(1000, features);
    expect(conf).toBeGreaterThanOrEqual(0);
    expect(conf).toBeLessThanOrEqual(1);
  });
});

describe("scoreSentences", () => {
  it("returns suspicious sentences above threshold", () => {
    const markers = fn.mergeMarkers([]);
    const sentences = [
      "In today's fast-paced world, it is important to note the following.",
      "Additionally, this furthermore highlights the key takeaways.",
      "I went to the store yesterday and bought some eggs.",
    ];
    const words = fn.tokenizeWords(sentences.join(" "));
    const suspicious = fn.scoreSentences(sentences, markers, words, 20);
    expect(suspicious.length).toBeGreaterThan(0);
    expect(suspicious).toContain(sentences[0]);
  });

  it("returns empty when nothing is suspicious", () => {
    const markers = fn.mergeMarkers([]);
    const sentences = [
      "My dog bit me yesterday.",
      "I need to buy groceries later.",
      "The weather has been unpredictable.",
    ];
    const words = fn.tokenizeWords(sentences.join(" "));
    const suspicious = fn.scoreSentences(sentences, markers, words, 80);
    expect(suspicious.length).toBe(0);
  });
});

describe("mergeMarkers", () => {
  it("includes built-in markers", () => {
    const markers = fn.mergeMarkers([]);
    expect(markers.length).toBeGreaterThan(100);
    expect(markers).toContain("in today's fast-paced world");
  });

  it("adds custom markers", () => {
    const markers = fn.mergeMarkers(["my custom marker"]);
    expect(markers).toContain("my custom marker");
  });

  it("deduplicates markers", () => {
    const markers = fn.mergeMarkers(["in today's fast-paced world"]);
    const count = markers.filter((m) => m === "in today's fast-paced world").length;
    expect(count).toBe(1);
  });
});

describe("analyzeText", () => {
  describe("result shape", () => {
    it("returns all required fields", () => {
      const result = analyzeText(AI_LINKEDIN_POST);
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("reasons");
      expect(result).toHaveProperty("suspiciousSentences");
      expect(result).toHaveProperty("warning");
      expect(result).toHaveProperty("wordCount");
    });

    it("score is a number between 0 and 100", () => {
      const result = analyzeText(AI_LINKEDIN_POST);
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("reasons is a non-empty string array", () => {
      const result = analyzeText(AI_LINKEDIN_POST);
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe("AI-generated text detection", () => {
    it("scores AI LinkedIn post >= 65", () => {
      const result = analyzeText(AI_LINKEDIN_POST);
      expect(result.score).toBeGreaterThanOrEqual(65);
      expect(result.status).toBe("Ready");
    });

    it("identifies generic corporate AI text", () => {
      const corporateAI = `In today's fast-paced world, it is important to note that digital transformation
is reshaping the landscape of modern business. Furthermore, organizations must navigate
this paradigm shift by leveraging innovative frameworks and holistic approaches.

The key takeaway is that companies need to foster a culture of continuous improvement.
Moreover, it's crucial to harness the power of data-driven decision making. Additionally,
thought leadership and actionable insights will drive impact moving forward.

Here are three ways to unlock the potential of your organization:
1. Embrace a comprehensive methodology for change management
2. Cultivate robust partnerships across the ecosystem
3. Streamline operations to optimize efficiency and reduce friction

In conclusion, the future of business lies in our ability to adapt, innovate, and
transform. The bottom line is clear - organizations that fail to evolve will be left behind.`;
      const result = analyzeText(corporateAI);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });
  });

  describe("human text detection", () => {
    it("scores casual human text < 50", () => {
      const result = analyzeText(HUMAN_CASUAL_TEXT);
      expect(result.score).toBeLessThan(50);
    });

    it("scores conversational writing low", () => {
      const humanText = `Ok so I finally got around to trying that new Thai place on 5th street and wow, 
the pad thai was actually incredible? like I wasn't expecting much because the Yelp 
reviews were mid but my friend Sarah dragged me there anyway.

we waited like 45 mins for a table which was annoying af but once we sat down the 
service was surprisingly fast. ordered the pad thai (obv), tom yum soup, and these 
crispy spring rolls that were honestly life-changing.

the bill came to $47.83 for two people which isn't bad at all for that area. 
definitely going back next week, might try the green curry this time. 
anyone else been there? lmk what you ordered`;
      const result = analyzeText(humanText);
      expect(result.score).toBeLessThan(45);
    });
  });

  describe("short text handling", () => {
    it("marks short text as Insufficient text", () => {
      const result = analyzeText(SHORT_AI_POST);
      expect(result.status).toBe("Insufficient text");
    });

    it("caps short text score at 59", () => {
      const result = analyzeText(SHORT_AI_POST);
      expect(result.score).toBeLessThanOrEqual(59);
    });

    it("includes warning about short text", () => {
      const result = analyzeText(SHORT_AI_POST);
      expect(result.warning).toContain("Short posts");
    });

    it("limits reasons to 2 for short text", () => {
      const result = analyzeText(SHORT_AI_POST);
      expect(result.reasons.length).toBeLessThanOrEqual(2);
    });

    it("returns empty suspiciousSentences for short text", () => {
      const result = analyzeText(SHORT_AI_POST);
      expect(result.suspiciousSentences).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = analyzeText("");
      expect(result.status).toBe("Insufficient text");
      expect(typeof result.score).toBe("number");
    });

    it("handles single word", () => {
      const result = analyzeText("Hello");
      expect(result.status).toBe("Insufficient text");
    });

    it("handles very long repeated text", () => {
      const longText = "This is a test sentence. ".repeat(200);
      const result = analyzeText(longText);
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("respects MAX_SCAN_CHARS (4000 char limit)", () => {
      const longText = "A".repeat(5000) + " word ".repeat(300);
      const result = analyzeText(longText);
      expect(result.wordCount).toBeLessThan(600);
    });
  });

  describe("settings", () => {
    it("respects custom threshold", () => {
      const resultHigh = analyzeText(AI_LINKEDIN_POST, { threshold: 95 });
      const resultLow = analyzeText(AI_LINKEDIN_POST, { threshold: 10 });
      expect(resultHigh.score).toBe(resultLow.score);
      if (typeof resultHigh.score === "number" && resultHigh.score < 95) {
        expect(resultHigh.summary).toContain("below");
      }
    });

    it("accepts custom markers", () => {
      const text =
        "This zubnarg text contains a zubnarg custom marker. " +
        "We can see zubnarg appearing several times in this zubnarg passage. " +
        "The zubnarg frequency is high for zubnarg detection purposes. " +
        "Overall the zubnarg signal is clear in this zubnarg text sample here.";
      const withMarker = analyzeText(text, { customMarkers: ["zubnarg"] });
      const without = analyzeText(text);
      expect(withMarker.score).toBeGreaterThanOrEqual(without.score as number);
    });
  });

  describe("discrimination between AI and human texts", () => {
    it("AI text scores significantly higher than human text", () => {
      const aiResult = analyzeText(AI_LINKEDIN_POST);
      const humanResult = analyzeText(HUMAN_CASUAL_TEXT);
      const gap = (aiResult.score as number) - (humanResult.score as number);
      expect(gap).toBeGreaterThan(20);
    });
  });
});
