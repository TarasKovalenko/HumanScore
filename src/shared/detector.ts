import { type AnalysisResult, DEFAULT_SETTINGS, MAX_SCAN_CHARS, type Settings } from "./defaults";

const BUILT_IN_TEMPLATE_MARKERS = [
  "in today's fast-paced world",
  "it is important to note",
  "it's important to note",
  "it is worth noting",
  "it's worth noting",
  "it's worth mentioning",
  "let's dive in",
  "delve into",
  "in conclusion",
  "to summarize",
  "unlock the potential",
  "game changer",
  "at the end of the day",
  "the future of",
  "in a world where",
  "now more than ever",
  "without further ado",
  "that being said",
  "needless to say",
  "furthermore",
  "moreover",
  "additionally",
  "however, it is important",
  "here are three ways",
  "here's how",
  "key takeaways",
  "actionable insights",
  "best practices",
  "thought leadership",
  "drive impact",
  "moving forward",
  "in this article",
  "in this post",
  "whether you're",
  "one thing is clear",
  "the bottom line",
  "on the other hand",
  "from my perspective",
  "to put it simply",
  "the reality is",
  "in other words",
  "this highlights the importance of",
  // Modern AI-era (2024-2025) patterns
  "let me break this down",
  "here's what most people get wrong",
  "here's what i learned",
  "the key here is",
  "this is exactly why",
  "if you're not doing",
  "let that sink in",
  "read that again",
  "the power of",
  "this changed everything",
  "stop doing",
  "most people don't realize",
  "the secret to",
  "this resonates with me",
  "i couldn't agree more",
  "it's not about",
  "imagine a world where",
  "the question is not whether",
  "the real question is",
  "on a broader note",
  "this is a great example of",
  "here's the thing",
  // Corporate/LinkedIn AI slop
  "circling back",
  "value proposition",
  "paradigm shift",
  "it goes without saying",
  "it's no secret that",
  "the fact of the matter is",
  "when all is said and done",
  "in light of",
  "with that in mind",
  "as we all know",
  "when it comes to",
  "at its core",
  "it's important to understand",
  "by and large",
  "all things considered",
  "to some extent",
  // Hedging phrases typical of AI
  "one might argue",
  "it could be said",
  "it is essential to",
  "it's essential to",
  "it's crucial to",
  "it cannot be overstated",
  "this cannot be understated",
  "it is imperative that",
  "this serves as a reminder",
  "this underscores the need",
  "this begs the question",
  "only time will tell",
  "the landscape is evolving",
  "as we navigate",
  "in an ever-changing",
  "in an era of",
  "in this day and age",
  "stands as a testament",
  "a testament to",
  "a prime example of",
  "a pivotal role",
  "remains to be seen",
  "paves the way for",
  "sheds light on",
  "tip of the iceberg",
  // LinkedIn hook patterns
  "here's why",
  "here are",
  "here is why",
  "didn't become",
  "earned its place",
  "and yes",
  // Sweeping claim patterns
  "at scale",
  "does it all",
  "without compromise",
  "no vendor lock-in",
  "without falling apart",
  "delivers all",
  "demand flexibility",
  "more teams are",
  "isn't winning because",
  "runs everywhere",
  // Takeaway/conclusion patterns
  "the real takeaway",
  "the takeaway here",
  "the takeaway is",
  "was already ready",
  "is just one reason",
  // Marketing tech patterns
  "battle-tested",
  "production-proven",
  "cloud-native",
  "by design",
  "real-world",
  "evolves with your",
  "adapts instead",
  "instead of being replaced",
  "open source without",
  "massive community",
  "built for",
  "pro tip",
  "quick overview",
  "in a nutshell",
  "under the hood",
  "behind the scenes",
  "step by step",
  "key differences",
  "common types",
  "why use",
  "used to store",
  "used to manage",
  "provides flexible",
  "provide flexible",
  "powerful built-in",
  "better performance",
  "built-in support for",
  "most commonly used",
  "no duplicates",
  "for type safety",
  "here's what you need to know",
  "everything you need to know",
  "a complete guide",
  "a beginner's guide",
  "getting started with",
  "introduction to",
  "what you should know",
  "what you need to know",
  "you need to know about",
  "let's explore",
  "let's take a look",
  "let's understand",
  "in this guide",
  "in this tutorial",
  "before we begin",
  "wrapping up",
  "to recap",
  "final thoughts",
  "drop your thoughts",
  "let's discuss",
  "share your thoughts",
];

const TRANSITION_MARKERS = [
  "additionally",
  "moreover",
  "furthermore",
  "however",
  "therefore",
  "consequently",
  "meanwhile",
  "firstly",
  "secondly",
  "thirdly",
  "subsequently",
  "nonetheless",
  "nevertheless",
  "conversely",
  "in contrast",
  "similarly",
  "likewise",
  "in addition",
  "as a result",
  "for instance",
  "in particular",
  "on the contrary",
];

const AI_OVERUSED_WORDS = new Set([
  "delve",
  "tapestry",
  "intricate",
  "pivotal",
  "nuanced",
  "comprehensive",
  "multifaceted",
  "holistic",
  "paramount",
  "robust",
  "dynamic",
  "innovative",
  "leverage",
  "foster",
  "cultivate",
  "navigate",
  "empower",
  "harness",
  "transformative",
  "groundbreaking",
  "seamlessly",
  "effortlessly",
  "undeniably",
  "notably",
  "landscape",
  "paradigm",
  "ecosystem",
  "framework",
  "methodology",
  "realm",
  "spectrum",
  "trajectory",
  "cornerstone",
  "catalyst",
  "linchpin",
  "bedrock",
  "plethora",
  "myriad",
  "underscore",
  "illuminate",
  "elucidate",
  "exemplify",
  "facilitate",
  "optimize",
  "streamline",
  "bolster",
  "augment",
  "resonate",
  "synergy",
  "envision",
  "spearhead",
  "embark",
  "unravel",
  "demystify",
  "juxtapose",
  "commendable",
  "meticulous",
  "discerning",
  "testament",
  "interplay",
  "imperative",
  "standardizing",
  "extensible",
  "scalable",
  "dominating",
  "accelerating",
  "seamless",
  "adaptable",
  "impactful",
  "actionable",
  "overarching",
  "burgeoning",
  "proliferation",
  "ubiquitous",
  "indispensable",
  "noteworthy",
  "compelling",
  "elevate",
  "reimagine",
]);

const COMMON_WORDS = new Set([
  "the",
  "and",
  "that",
  "have",
  "for",
  "not",
  "with",
  "you",
  "this",
  "but",
  "his",
  "from",
  "they",
  "say",
  "her",
  "she",
  "will",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "about",
  "which",
  "when",
  "make",
  "can",
  "like",
  "time",
  "just",
  "know",
  "take",
  "into",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "also",
  "only",
  "come",
  "work",
  "over",
  "think",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "first",
  "well",
  "way",
  "even",
  "new",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "as",
  "by",
  "at",
  "or",
  "if",
  "it",
  "its",
  "we",
  "i",
  "me",
]);

const SUBORDINATING_CONJUNCTIONS = new Set([
  "because",
  "since",
  "although",
  "though",
  "while",
  "whereas",
  "unless",
  "until",
  "if",
  "when",
  "whenever",
  "wherever",
  "after",
  "before",
  "once",
]);

const RELATIVE_PRONOUNS = new Set(["which", "that", "who", "whom", "whose", "where"]);

const FEATURE_WEIGHTS = {
  repetition: 0.14,
  burstiness: 0.1,
  corporateTone: 0.13,
  structure: 0.1,
  readability: 0.08,
  lexicalConcentration: 0.14,
  predictability: 0.13,
  zipfDeviation: 0.08,
  sentenceComplexity: 0.06,
  reduction: -0.1,
};

type FeatureKey = keyof typeof FEATURE_WEIGHTS;

type Feature = {
  key: FeatureKey;
  reason: string;
  value: number;
  weightedImpact: number;
};

export function analyzeText(text: string, nextSettings?: Partial<Settings>): AnalysisResult {
  const settings = { ...DEFAULT_SETTINGS, ...nextSettings };
  const rawText = String(text).replace(/\r/g, "").slice(0, MAX_SCAN_CHARS);
  const normalizedText = collapseWhitespace(rawText);
  const words = tokenizeWords(normalizedText);
  const sentences = splitSentences(rawText);
  const lines = splitLines(rawText);
  const markers = mergeMarkers(settings.customMarkers);
  const featureSet = buildFeatureSet({
    lines,
    markers,
    normalizedText,
    rawText,
    sentences,
    words,
  });
  const rawScore = calculateRawScore(featureSet);
  const reasons = selectReasons(featureSet, 3);

  if (words.length < 90) {
    const provisionalScore = Math.min(59, Math.round(applyScoreCurve(rawScore) * 75));
    return {
      score: provisionalScore,
      confidence: Math.max(
        18,
        Math.round(computeConfidence(words.length, Object.values(featureSet)) * 60)
      ),
      status: "Insufficient text",
      summary:
        "This sample is short, so the score is provisional only. The extension avoids strong labeling below about 90 words.",
      reasons: reasons.slice(0, 2),
      suspiciousSentences: [],
      warning:
        "False positives happen. Short posts can resemble templates by accident, so treat this as a weak signal.",
      wordCount: words.length,
    };
  }

  const mappedScore = applyScoreCurve(rawScore);
  const score = Math.round(clamp(mappedScore, 0, 1) * 100);
  const confidence = Math.round(computeConfidence(words.length, Object.values(featureSet)) * 100);
  const suspiciousSentences = scoreSentences(sentences, markers, words, settings.threshold);

  return {
    score,
    confidence,
    status: "Ready",
    summary:
      score >= settings.threshold
        ? `Estimated AI-likely score ${score}/100. This is a likelihood signal, not proof.`
        : `Estimated AI-likely score ${score}/100. Signals were below your current threshold.`,
    reasons,
    suspiciousSentences,
    warning:
      "False positives happen. Personal style, domain conventions, and editing can look templated.",
    wordCount: words.length,
  };
}

function applyScoreCurve(raw: number): number {
  const clamped = clamp(raw, 0, 1);
  const midpoint = 0.2;
  const steepness = 10;
  return 1 / (1 + Math.exp(-steepness * (clamped - midpoint)));
}

function buildFeatureSet({
  lines,
  markers,
  normalizedText,
  rawText,
  sentences,
  words,
}: {
  lines: string[];
  markers: string[];
  normalizedText: string;
  rawText: string;
  sentences: string[];
  words: string[];
}): Record<FeatureKey, Feature> {
  return {
    repetition: computeRepetitionFeature(sentences),
    burstiness: computeBurstinessFeature(sentences, words),
    corporateTone: computeCorporateToneFeature(normalizedText, words, markers),
    structure: computeStructureFeature(rawText, normalizedText, sentences, lines),
    readability: computeReadabilityFeature(sentences),
    lexicalConcentration: computeLexicalConcentrationFeature(words),
    predictability: computePredictabilityFeature(words, sentences),
    zipfDeviation: computeZipfDeviationFeature(words),
    sentenceComplexity: computeSentenceComplexityFeature(sentences),
    reduction: computeHumanizingReduction(rawText, words, sentences),
  };
}

function calculateRawScore(featureSet: Record<FeatureKey, Feature>): number {
  let base = 0;
  for (const feature of Object.values(featureSet)) {
    base += feature.value * FEATURE_WEIGHTS[feature.key];
  }

  const featureValues = Object.values(featureSet)
    .filter((f) => f.key !== "reduction")
    .map((f) => f.value);

  const highFeatures = featureValues.filter((v) => v > 0.6).length;
  const coherenceBonus = highFeatures >= 4 ? 0.04 : highFeatures >= 3 ? 0.02 : 0;

  return base + coherenceBonus;
}

function selectReasons(featureSet: Record<FeatureKey, Feature>, limit: number): string[] {
  const reasons = Object.values(featureSet)
    .filter((feature) => feature.value > 0.08 && feature.weightedImpact > 0)
    .sort((left, right) => right.weightedImpact - left.weightedImpact)
    .slice(0, limit)
    .map((feature) => feature.reason);

  if (!reasons.length) {
    reasons.push(
      "No single pattern dominated; the estimate comes from several weak stylistic signals."
    );
  }

  return reasons;
}

function computeRepetitionFeature(sentences: string[]): Feature {
  const normalizedSentences = sentences.map((sentence) =>
    tokenizeWords(sentence).slice(0, 14).join(" ")
  );
  const starters = sentences.map((sentence) => tokenizeWords(sentence).slice(0, 3).join(" "));
  const repeatedStarterRatio = ratioOfRepeated(starters);
  const repeatedSentenceRatio = ratioOfRepeated(normalizedSentences);
  const ngramRatio = repeatedNgramRatio(sentences);

  const endings = sentences.map((s) => {
    const words = tokenizeWords(s);
    return words.slice(-3).join(" ");
  });
  const repeatedEndingRatio = ratioOfRepeated(endings);

  const rawStarters = sentences.map((s) => {
    const trimmed = s.trim();
    const emojiMatch = trimmed.match(/^([\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
    return emojiMatch?.[1] ?? "";
  });
  const emojiRepetition = ratioOfRepeated(rawStarters.filter(Boolean));
  const emojiStarterCount = rawStarters.filter(Boolean).length;
  const structuralRepetition = emojiStarterCount >= 3 ? emojiRepetition : 0;

  const value = clamp(
    repeatedStarterRatio * 0.24 +
      repeatedSentenceRatio * 0.14 +
      ngramRatio * 0.28 +
      repeatedEndingRatio * 0.12 +
      structuralRepetition * 0.22,
    0,
    1
  );

  return {
    key: "repetition",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.repetition,
    reason: "Repeated starters, structural patterns, or phrase reuse made the post look templated.",
  };
}

function computeBurstinessFeature(sentences: string[], words: string[]): Feature {
  const lengths = sentences.map((sentence) => tokenizeWords(sentence).length).filter(Boolean);
  const rarityValues = words.map((word) => approximateRarity(word));
  const sentenceCv = coefficientOfVariation(lengths);
  const rarityStd = standardDeviation(rarityValues);
  const cadenceUniformity = 1 - clamp(sentenceCv / 0.9, 0, 1);
  const rarityUniformity = 1 - clamp(rarityStd / 0.4, 0, 1);

  const wordLengths = words.map((w) => w.length);
  const wordLenCv = coefficientOfVariation(wordLengths);
  const wordLenUniformity = 1 - clamp(wordLenCv / 0.55, 0, 1);

  const avgWordLen = mean(wordLengths);
  const mediumBias = avgWordLen >= 4.2 && avgWordLen <= 5.8 ? 0.15 : 0;

  const value = clamp(
    cadenceUniformity * 0.42 +
      rarityUniformity * 0.28 +
      wordLenUniformity * 0.18 +
      mediumBias * 0.12,
    0,
    1
  );

  return {
    key: "burstiness",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.burstiness,
    reason:
      "Low variation in sentence cadence, word length, and vocabulary rarity increased the estimate.",
  };
}

function computeCorporateToneFeature(text: string, words: string[], markers: string[]): Feature {
  const lowerText = text.toLowerCase();
  const markerHits = markers.reduce((sum, marker) => sum + countOccurrences(lowerText, marker), 0);
  const transitionHits = TRANSITION_MARKERS.reduce(
    (sum, marker) => sum + countOccurrences(lowerText, marker),
    0
  );

  const aiVocabHits = words.filter((w) => AI_OVERUSED_WORDS.has(w)).length;
  const aiVocabRate = clamp(aiVocabHits / Math.max(1, words.length / 30), 0, 1);

  const normalizedMarkerRate = clamp(markerHits / Math.max(1, words.length / 40), 0, 1);
  const normalizedTransitionRate = clamp(transitionHits / Math.max(1, words.length / 50), 0, 1);
  const value = clamp(
    normalizedMarkerRate * 0.48 + normalizedTransitionRate * 0.2 + aiVocabRate * 0.32,
    0,
    1
  );

  return {
    key: "corporateTone",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.corporateTone,
    reason:
      "AI-favored vocabulary, generic transitions, or template filler language pushed the score upward.",
  };
}

function computeStructureFeature(
  rawText: string,
  normalizedText: string,
  sentences: string[],
  lines: string[]
): Feature {
  const lowerText = normalizedText.toLowerCase();
  const numberedPattern = /\b(?:1[).\s]|2[).\s]|3[).\s])/.test(lowerText) ? 0.22 : 0;
  const sequenceWords = /\b(firstly|secondly|thirdly)\b/.test(lowerText) ? 0.2 : 0;
  const bulletSymmetry = detectSymmetry(sentences);
  const templateTriplet =
    /\bproblem\b/.test(lowerText) &&
    /\bsolution\b/.test(lowerText) &&
    /\b(takeaway|takeaways)\b/.test(lowerText)
      ? 0.18
      : 0;
  const repeatedPrefix = detectRepeatedLinePrefix(lines);
  const shortLabelLines = clamp(lines.filter(isShortLabelLine).length / 4, 0, 0.22);
  const checklistPattern = detectChecklistPattern(rawText, lines);
  const emojiHeadings = detectEmojiHeadings(lines);
  const linkedinFormat = detectLinkedInFormat(rawText, lines);
  const definitionList = detectDefinitionList(lines);
  const value = clamp(
    numberedPattern +
      sequenceWords +
      bulletSymmetry +
      templateTriplet +
      repeatedPrefix +
      shortLabelLines +
      checklistPattern +
      emojiHeadings +
      linkedinFormat +
      definitionList,
    0,
    1
  );

  return {
    key: "structure",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.structure,
    reason: "Structured checklist or framework formatting made the post look machine-templated.",
  };
}

function computeReadabilityFeature(sentences: string[]): Feature {
  const lengths = sentences.map((sentence) => tokenizeWords(sentence).length).filter(Boolean);
  const commaRates = sentences.map((sentence) => sentence.split(",").length - 1);
  const semicolonRate = sentences.join(" ").split(";").length > 3 ? 0.18 : 0;
  const cadenceUniformity = 1 - clamp(coefficientOfVariation(lengths) / 0.85, 0, 1);
  const commaUniformity = 1 - clamp(standardDeviation(commaRates) / 1.55, 0, 1);
  const terminalSignal = 1 - normalizedEntropy(extractSentenceEndings(sentences));

  const paragraphLengths = groupSentencesByParagraph(sentences);
  const paragraphUniformity =
    paragraphLengths.length >= 3
      ? 1 - clamp(coefficientOfVariation(paragraphLengths) / 0.6, 0, 1)
      : 0;

  const fkSignal = computeFleschKincaidSignal(sentences);

  const value = clamp(
    cadenceUniformity * 0.28 +
      commaUniformity * 0.14 +
      terminalSignal * 0.08 +
      semicolonRate +
      paragraphUniformity * 0.14 +
      fkSignal * 0.18,
    0,
    1
  );

  return {
    key: "readability",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.readability,
    reason:
      "Very even punctuation, sentence rhythm, readability grade, or paragraph length looked unusually uniform.",
  };
}

function computeLexicalConcentrationFeature(words: string[]): Feature {
  const counts = buildCounts(words);
  const uniqueCount = counts.size || 1;
  const hapaxCount = Array.from(counts.values()).filter((count) => count === 1).length;
  const ttr = uniqueCount / Math.max(1, words.length);
  const mattr = movingAverageTypeTokenRatio(words, 25);
  const hapaxRatio = hapaxCount / uniqueCount;
  const yuleK = calculateYulesK(words);

  const lowTtr = 1 - clamp((ttr - 0.34) / 0.28, 0, 1);
  const lowMattr = 1 - clamp((mattr - 0.5) / 0.24, 0, 1);
  const lowHapax = 1 - clamp((hapaxRatio - 0.42) / 0.24, 0, 1);
  const yuleSignal = clamp(yuleK / 170, 0, 1);
  const value = clamp(lowTtr * 0.22 + lowMattr * 0.34 + lowHapax * 0.18 + yuleSignal * 0.26, 0, 1);

  return {
    key: "lexicalConcentration",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.lexicalConcentration,
    reason:
      "Low lexical diversity and concentrated word reuse (MATTR / Yule-style signals) increased the estimate.",
  };
}

function computePredictabilityFeature(words: string[], sentences: string[]): Feature {
  const sentenceStarters = sentences
    .map((sentence) => tokenizeWords(sentence).slice(0, 2).join(" "))
    .filter(Boolean);
  const normalizedWordEntropy = normalizedEntropy(words);
  const normalizedStarterEntropy = normalizedEntropy(sentenceStarters);
  const endingEntropy = normalizedEntropy(extractSentenceEndings(sentences));

  const bigramEntropy = computeBigramEntropy(words);
  const coherence = computeLocalCoherence(sentences);

  const wordSignal = 1 - normalizedWordEntropy;
  const starterSignal = 1 - normalizedStarterEntropy;
  const endingSignal = 1 - endingEntropy;
  const bigramSignal = 1 - bigramEntropy;
  const value = clamp(
    wordSignal * 0.3 +
      starterSignal * 0.2 +
      endingSignal * 0.1 +
      bigramSignal * 0.2 +
      coherence * 0.2,
    0,
    1
  );

  return {
    key: "predictability",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.predictability,
    reason:
      "Low entropy, high local coherence, or predictable sentence openings suggest generated text.",
  };
}

function computeZipfDeviationFeature(words: string[]): Feature {
  const counts = buildCounts(words);
  const frequencies = Array.from(counts.values()).sort((a, b) => b - a);

  if (frequencies.length < 10) {
    return {
      key: "zipfDeviation",
      value: 0,
      weightedImpact: 0,
      reason: "Word frequency distribution could not be analyzed (too few unique words).",
    };
  }

  const n = Math.min(frequencies.length, 50);
  let sumLogRank = 0;
  let sumLogFreq = 0;
  let sumProduct = 0;
  let sumLogRankSq = 0;

  for (let i = 0; i < n; i++) {
    const logRank = Math.log(i + 1);
    const logFreq = Math.log(frequencies[i]);
    sumLogRank += logRank;
    sumLogFreq += logFreq;
    sumProduct += logRank * logFreq;
    sumLogRankSq += logRank * logRank;
  }

  const denominator = n * sumLogRankSq - sumLogRank * sumLogRank;
  const alpha = denominator !== 0 ? -(n * sumProduct - sumLogRank * sumLogFreq) / denominator : 1;

  const intercept = (sumLogFreq + alpha * sumLogRank) / n;
  const meanLogFreq = sumLogFreq / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const logRank = Math.log(i + 1);
    const logFreq = Math.log(frequencies[i]);
    const predicted = -alpha * logRank + intercept;
    ssTot += (logFreq - meanLogFreq) ** 2;
    ssRes += (logFreq - predicted) ** 2;
  }
  const rSquared = ssTot > 0 ? clamp(1 - ssRes / ssTot, 0, 1) : 0;

  const flatAlphaSignal = alpha < 1.0 ? clamp((1.0 - alpha) / 0.45, 0, 1) : 0;
  const perfectionSignal = clamp((rSquared - 0.88) / 0.1, 0, 1);

  const midStart = Math.floor(frequencies.length * 0.2);
  const midEnd = Math.floor(frequencies.length * 0.6);
  const midFreqs = frequencies.slice(midStart, midEnd);
  const midCV = midFreqs.length > 2 ? coefficientOfVariation(midFreqs) : 1;
  const midUniformitySignal = 1 - clamp(midCV / 0.5, 0, 1);

  const value = clamp(
    flatAlphaSignal * 0.4 + perfectionSignal * 0.25 + midUniformitySignal * 0.35,
    0,
    1
  );

  return {
    key: "zipfDeviation",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.zipfDeviation,
    reason: "Word frequency distribution deviated from natural language patterns (Zipf's law).",
  };
}

function computeSentenceComplexityFeature(sentences: string[]): Feature {
  if (sentences.length < 4) {
    return {
      key: "sentenceComplexity",
      value: 0,
      weightedImpact: 0,
      reason: "Too few sentences to assess complexity uniformity.",
    };
  }

  const complexities = sentences
    .map((sentence) => {
      const words = tokenizeWords(sentence);
      if (words.length < 3) return -1;

      const subordinateCount = words.filter((w) => SUBORDINATING_CONJUNCTIONS.has(w)).length;
      const relativeCount = words.filter((w) => RELATIVE_PRONOUNS.has(w)).length;
      const commaCount = (sentence.match(/,/g) || []).length;
      const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

      return (
        subordinateCount * 2.0 +
        relativeCount * 1.5 +
        commaCount * 0.5 +
        avgWordLength * 0.3 +
        words.length * 0.08
      );
    })
    .filter((c) => c >= 0);

  if (complexities.length < 3) {
    return {
      key: "sentenceComplexity",
      value: 0,
      weightedImpact: 0,
      reason: "Too few measurable sentences to assess complexity uniformity.",
    };
  }

  const cv = coefficientOfVariation(complexities);
  const uniformity = 1 - clamp(cv / 0.65, 0, 1);

  const avgComplexity = mean(complexities);
  const mediumBias = 1 - clamp(Math.abs(avgComplexity - 4.5) / 3.5, 0, 1);

  const value = clamp(uniformity * 0.65 + mediumBias * 0.35, 0, 1);

  return {
    key: "sentenceComplexity",
    value,
    weightedImpact: value * FEATURE_WEIGHTS.sentenceComplexity,
    reason: "Sentence complexity was unusually uniform, typical of generated text.",
  };
}

function computeHumanizingReduction(text: string, words: string[], sentences: string[]): Feature {
  const allEmoji = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) ?? [];
  const emojiCounts = new Map<string, number>();
  for (const e of allEmoji) emojiCounts.set(e, (emojiCounts.get(e) ?? 0) + 1);
  const structuralEmoji = Array.from(emojiCounts.values()).filter((c) => c >= 3).length > 0;
  const expressiveEmoji = structuralEmoji
    ? allEmoji.filter((e) => (emojiCounts.get(e) ?? 0) < 3).length
    : allEmoji.length;

  const slangMatches =
    text.match(
      /\b(gonna|wanna|lol|imo|btw|idk|tbh|y'all|kinda|sorta|ngl|fwiw|afaik|smh|omg)\b/gi
    ) ?? [];
  const personalReferences = text.match(/\b(i|i'm|i've|i'd|i'll|my|me|we|our|us)\b/gi) ?? [];
  const numericSpecifics = text.match(/\b\d{3,}\b/g) ?? [];
  const technicalTokens = text.match(/\b[A-Za-z0-9]+[+#.][A-Za-z0-9+#.]*\b/g) ?? [];

  const exclamations = (text.match(/!/g) || []).length;
  const ellipsis = (text.match(/\.{2,3}/g) || []).length;

  const sentenceLengths = sentences.map((s) => tokenizeWords(s).length);
  const hasVeryShort = sentenceLengths.some((l) => l <= 3);
  const hasVeryLong = sentenceLengths.some((l) => l >= 35);
  const lengthVariety = hasVeryShort && hasVeryLong ? 0.08 : 0;

  const emojiSignal = structuralEmoji
    ? clamp(expressiveEmoji / 6, 0, 0.04)
    : clamp(allEmoji.length / 8, 0, 0.08);
  const slangSignal = clamp(slangMatches.length / 4, 0, 0.18);
  const personalSignal = clamp(personalReferences.length / Math.max(1, words.length / 16), 0, 0.22);
  const specificitySignal = clamp(
    (numericSpecifics.length + technicalTokens.length) / Math.max(1, words.length / 18),
    0,
    0.15
  );
  const punctuationPersonality = clamp(
    (exclamations * 0.5 + ellipsis * 0.4) / Math.max(1, sentences.length),
    0,
    0.08
  );

  const value = clamp(
    emojiSignal +
      slangSignal +
      personalSignal +
      specificitySignal +
      punctuationPersonality +
      lengthVariety,
    0,
    1
  );

  return {
    key: "reduction",
    value,
    weightedImpact: 0,
    reason: "Personal voice, slang, or specific details reduced the estimate.",
  };
}

function computeConfidence(wordCount: number, features: Feature[]): number {
  const lengthFactor = clamp((wordCount - 90) / 410, 0, 1);
  const featureValues = features
    .filter((feature) => feature.key !== "reduction")
    .map((feature) => feature.value);
  const agreement = 1 - clamp(standardDeviation(featureValues) / 0.32, 0, 1);
  const activeFeatures = featureValues.filter((v) => v > 0.15).length;
  const breadth = clamp(activeFeatures / 5, 0, 1);
  return clamp(lengthFactor * 0.45 + agreement * 0.3 + breadth * 0.25, 0, 1);
}

function scoreSentences(
  sentences: string[],
  markers: string[],
  allWords: string[],
  threshold: number
): string[] {
  const starters = new Map<string, number>();

  for (const sentence of sentences) {
    const starter = tokenizeWords(sentence).slice(0, 3).join(" ");
    if (!starter) {
      continue;
    }
    starters.set(starter, (starters.get(starter) ?? 0) + 1);
  }

  const globalAvgWordLen =
    allWords.length > 0 ? allWords.reduce((s, w) => s + w.length, 0) / allWords.length : 5;

  return sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const words = tokenizeWords(sentence);
      const starter = words.slice(0, 3).join(" ");
      const markerHits = markers.filter((marker) => lower.includes(marker)).length;
      const transitionHits = TRANSITION_MARKERS.filter((marker) => lower.includes(marker)).length;
      const aiVocabHits = words.filter((w) => AI_OVERUSED_WORDS.has(w)).length;
      const starterPenalty = starter && (starters.get(starter) ?? 0) > 1 ? 0.22 : 0;
      const lengthPenalty = words.length >= 10 && words.length <= 24 ? 0.12 : 0;
      const listPenalty = /\b(firstly|secondly|thirdly)\b|\b\d[).\s]/i.test(sentence) ? 0.18 : 0;
      const markerScore = clamp(markerHits * 0.16 + transitionHits * 0.08, 0, 0.48);
      const aiVocabPenalty = clamp(aiVocabHits * 0.1, 0, 0.24);

      const sentAvgWordLen =
        words.length > 0 ? words.reduce((s, w) => s + w.length, 0) / words.length : 0;
      const tooSmooth =
        Math.abs(sentAvgWordLen - globalAvgWordLen) < 0.3 && words.length >= 8 ? 0.06 : 0;

      const score = clamp(
        starterPenalty + lengthPenalty + listPenalty + markerScore + aiVocabPenalty + tooSmooth,
        0,
        1
      );

      return {
        text: sentence,
        score,
      };
    })
    .filter((entry) => entry.score >= threshold / 100)
    .map((entry) => entry.text);
}

function mergeMarkers(customMarkers: string[]): string[] {
  return Array.from(
    new Set(
      [...BUILT_IN_TEMPLATE_MARKERS, ...customMarkers]
        .map((marker) => collapseWhitespace(marker.toLowerCase()))
        .filter(Boolean)
    )
  );
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  return matches.map((entry) => collapseWhitespace(entry)).filter((entry) => entry.length >= 4);
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => collapseWhitespace(line))
    .filter((line) => line.length >= 2);
}

function tokenizeWords(text: string): string[] {
  return (text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? [])
    .map((word) => word.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

function repeatedNgramRatio(sentences: string[]): number {
  const counts = new Map<string, number>();
  const all: string[] = [];

  for (const sentence of sentences) {
    const tokens = tokenizeWords(sentence);
    for (const size of [2, 3, 4]) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const gram = tokens.slice(index, index + size).join(" ");
        all.push(gram);
        counts.set(gram, (counts.get(gram) ?? 0) + 1);
      }
    }
  }

  if (!all.length) {
    return 0;
  }

  const repeated = all.filter((gram) => (counts.get(gram) ?? 0) > 1).length;
  return clamp(repeated / all.length, 0, 1);
}

function ratioOfRepeated(items: string[]): number {
  if (!items.length) {
    return 0;
  }

  const counts = buildCounts(items);
  const repeated = items.filter((item) => item && (counts.get(item) ?? 0) > 1).length;
  return clamp(repeated / items.length, 0, 1);
}

function approximateRarity(word: string): number {
  if (COMMON_WORDS.has(word)) return 0.05;
  if (AI_OVERUSED_WORDS.has(word)) return 0.35;
  if (word.length >= 12) return 0.85;
  if (word.length >= 9) return 0.65;
  if (/\d/.test(word)) return 0.7;
  if (word.length >= 7) return 0.45;
  return 0.25;
}

function computeBigramEntropy(words: string[]): number {
  if (words.length < 10) return 0;
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return normalizedEntropy(bigrams);
}

function detectSymmetry(sentences: string[]): number {
  if (sentences.length < 3) {
    return 0;
  }

  const lengths = sentences.map((sentence) => tokenizeWords(sentence).length).filter(Boolean);
  const std = standardDeviation(lengths);
  if (std < 2.2) {
    return 0.18;
  }
  if (std < 3.8) {
    return 0.1;
  }
  return 0;
}

function detectRepeatedLinePrefix(lines: string[]): number {
  if (lines.length < 3) {
    return 0;
  }

  const prefixes = lines.map(extractLinePrefix).filter(Boolean);
  if (!prefixes.length) {
    return 0;
  }

  const counts = buildCounts(prefixes);
  const repeated = prefixes.filter((prefix) => (counts.get(prefix) ?? 0) > 1).length;
  return clamp(repeated / Math.max(1, prefixes.length), 0, 0.22);
}

function extractLinePrefix(line: string): string {
  const trimmed = line.trim();
  const numbered = trimmed.match(/^(\d+[.)-])/u);
  if (numbered?.[1]) {
    return "#";
  }

  const bullet = trimmed.match(/^([^\p{L}\p{N}\s]{1,3})/u);
  if (bullet?.[1]) {
    return bullet[1];
  }

  const label = trimmed.match(/^([A-Za-z]{2,12})\b/u);
  if (label?.[1] && isShortLabelLine(trimmed)) {
    return label[1].toLowerCase();
  }

  return "";
}

function isShortLabelLine(line: string): boolean {
  return line.length <= 64 && /[:?]$/.test(line) && tokenizeWords(line).length <= 8;
}

function detectChecklistPattern(rawText: string, lines: string[]): number {
  const cueLines = lines.filter((line) => {
    return /^(?:[^\p{L}\p{N}\s]{1,3}\s*)?(what|why|how|example|takeaway|key|steps?)\b/iu.test(line);
  }).length;
  const checkIcons = (rawText.match(/✅|☑️|✔️/gu) ?? []).length;
  return clamp(cueLines * 0.08 + Math.min(checkIcons, 4) * 0.04, 0, 0.24);
}

function detectLinkedInFormat(rawText: string, lines: string[]): number {
  const emojiSectionPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const emojiSectionLines = lines.filter((l) => emojiSectionPattern.test(l.trim().charAt(0)));
  const hasEmojiSections = emojiSectionLines.length >= 3;

  const hookPattern = /👇|here's why|here is why/i.test(rawText);
  const conclusionPattern = /💡|the real takeaway|key takeaway|the takeaway|in summary/i.test(
    rawText
  );

  let score = 0;
  if (hasEmojiSections) score += 0.18;
  if (hookPattern) score += 0.1;
  if (conclusionPattern) score += 0.08;
  if (hasEmojiSections && hookPattern) score += 0.06;
  if (hasEmojiSections && conclusionPattern) score += 0.04;

  return clamp(score, 0, 0.36);
}

function detectEmojiHeadings(lines: string[]): number {
  const emojiStarters = lines.filter((line) =>
    /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(line.trim())
  ).length;
  return emojiStarters >= 3 ? clamp(emojiStarters * 0.05, 0, 0.2) : 0;
}

function groupSentencesByParagraph(sentences: string[]): number[] {
  const groups: number[] = [];
  let current = 0;
  for (const s of sentences) {
    current++;
    if (/\n/.test(s)) {
      groups.push(current);
      current = 0;
    }
  }
  if (current > 0) groups.push(current);
  return groups.filter((g) => g > 0);
}

function detectDefinitionList(lines: string[]): number {
  const defPattern = /^.{2,40}\s+[–--]\s+.{4,}/;
  const colonDefPattern = /^[A-Z][\w<>,\s]{1,35}:\s+.{4,}/;
  const matches = lines.filter((l) => defPattern.test(l) || colonDefPattern.test(l)).length;
  return matches >= 3 ? clamp(matches * 0.06, 0, 0.24) : 0;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 2) return 1;
  let count = 0;
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = "aeiouy".includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (w.endsWith("e") && !w.endsWith("le") && count > 1) count--;
  if (w.endsWith("ed") && count > 1) count--;
  return Math.max(1, count);
}

function computeFleschKincaidSignal(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  let totalWords = 0;
  let totalSyllables = 0;
  const perSentenceGrades: number[] = [];

  for (const sentence of sentences) {
    const words = tokenizeWords(sentence);
    if (words.length < 3) continue;
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    totalWords += words.length;
    totalSyllables += syllables;

    const syllPerWord = syllables / words.length;
    const grade = 0.39 * words.length + 11.8 * syllPerWord - 15.59;
    perSentenceGrades.push(grade);
  }

  if (totalWords < 20 || perSentenceGrades.length < 3) return 0;

  const avgSyllPerWord = totalSyllables / totalWords;
  const avgWordsPerSent = totalWords / sentences.length;
  const globalGrade = 0.39 * avgWordsPerSent + 11.8 * avgSyllPerWord - 15.59;

  // AI text clusters in grade 8-12 (medium complexity, suspiciously consistent)
  const mediumGradeBias =
    globalGrade >= 7 && globalGrade <= 13 ? 1 - clamp(Math.abs(globalGrade - 10) / 3, 0, 1) : 0;

  const gradeCV = coefficientOfVariation(perSentenceGrades.map(Math.abs));
  const gradeUniformity = 1 - clamp(gradeCV / 0.7, 0, 1);

  return clamp(mediumGradeBias * 0.5 + gradeUniformity * 0.5, 0, 1);
}

function computeLocalCoherence(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  const sentenceWordSets = sentences.map((s) => {
    const words = tokenizeWords(s).filter((w) => !COMMON_WORDS.has(w) && w.length > 2);
    return new Set(words);
  });

  let totalJaccard = 0;
  let pairs = 0;

  for (let i = 0; i < sentenceWordSets.length - 1; i++) {
    const a = sentenceWordSets[i];
    const b = sentenceWordSets[i + 1];
    if (a.size === 0 || b.size === 0) continue;

    let intersection = 0;
    for (const word of a) {
      if (b.has(word)) intersection++;
    }
    const union = a.size + b.size - intersection;
    if (union > 0) {
      totalJaccard += intersection / union;
      pairs++;
    }
  }

  if (pairs < 2) return 0;

  const avgJaccard = totalJaccard / pairs;

  // AI text: higher average Jaccard (~0.15-0.3, unnaturally smooth)
  // Human text: lower average (~0.03-0.12, more varied topic shifts)
  const highCoherenceSignal = clamp((avgJaccard - 0.08) / 0.18, 0, 1);

  const jaccardValues: number[] = [];
  for (let i = 0; i < sentenceWordSets.length - 1; i++) {
    const a = sentenceWordSets[i];
    const b = sentenceWordSets[i + 1];
    if (a.size === 0 || b.size === 0) continue;
    let intersection = 0;
    for (const word of a) {
      if (b.has(word)) intersection++;
    }
    const union = a.size + b.size - intersection;
    if (union > 0) jaccardValues.push(intersection / union);
  }
  const coherenceCV = jaccardValues.length > 2 ? coefficientOfVariation(jaccardValues) : 1;
  const coherenceUniformity = 1 - clamp(coherenceCV / 1.0, 0, 1);

  return clamp(highCoherenceSignal * 0.6 + coherenceUniformity * 0.4, 0, 1);
}

function buildCounts(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function movingAverageTypeTokenRatio(words: string[], windowSize: number): number {
  if (!words.length) {
    return 0;
  }

  if (words.length <= windowSize) {
    return buildCounts(words).size / words.length;
  }

  let total = 0;
  let windows = 0;

  for (let start = 0; start <= words.length - windowSize; start += 1) {
    const slice = words.slice(start, start + windowSize);
    total += buildCounts(slice).size / windowSize;
    windows += 1;
  }

  return total / windows;
}

function calculateYulesK(words: string[]): number {
  if (words.length < 2) {
    return 0;
  }

  const counts = buildCounts(words);
  const frequencyOfFrequencies = new Map<number, number>();

  for (const frequency of counts.values()) {
    frequencyOfFrequencies.set(frequency, (frequencyOfFrequencies.get(frequency) ?? 0) + 1);
  }

  let sum = 0;
  for (const [frequency, vocabCount] of frequencyOfFrequencies.entries()) {
    sum += frequency * frequency * vocabCount;
  }

  return (10000 * (sum - words.length)) / (words.length * words.length);
}

function normalizedEntropy(values: string[]): number {
  if (values.length < 2) {
    return 0;
  }

  const counts = buildCounts(values);
  if (counts.size < 2) {
    return 0;
  }

  const total = values.length;
  let entropy = 0;

  for (const count of counts.values()) {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  }

  return clamp(entropy / Math.log2(counts.size), 0, 1);
}

function extractSentenceEndings(sentences: string[]): string[] {
  return sentences.map((sentence) => {
    const match = sentence.match(/[.!?;:]+$/u);
    return match?.[0].charAt(0) || ".";
  });
}

function countOccurrences(text: string, phrase: string): number {
  if (!phrase) {
    return 0;
  }

  let count = 0;
  let offset = 0;

  while (offset >= 0) {
    offset = text.indexOf(phrase, offset);
    if (offset >= 0) {
      count += 1;
      offset += phrase.length;
    }
  }

  return count;
}

function mean(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (!avg) {
    return 0;
  }
  return standardDeviation(values) / avg;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const _internals = {
  applyScoreCurve,
  approximateRarity,
  buildCounts,
  buildFeatureSet,
  calculateRawScore,
  calculateYulesK,
  clamp,
  coefficientOfVariation,
  collapseWhitespace,
  computeBigramEntropy,
  computeBurstinessFeature,
  computeConfidence,
  computeCorporateToneFeature,
  computeFleschKincaidSignal,
  computeHumanizingReduction,
  computeLexicalConcentrationFeature,
  computeLocalCoherence,
  computePredictabilityFeature,
  computeReadabilityFeature,
  computeRepetitionFeature,
  computeSentenceComplexityFeature,
  computeStructureFeature,
  computeZipfDeviationFeature,
  countOccurrences,
  countSyllables,
  detectChecklistPattern,
  detectDefinitionList,
  detectEmojiHeadings,
  detectLinkedInFormat,
  detectRepeatedLinePrefix,
  detectSymmetry,
  extractSentenceEndings,
  groupSentencesByParagraph,
  mean,
  mergeMarkers,
  movingAverageTypeTokenRatio,
  normalizedEntropy,
  ratioOfRepeated,
  repeatedNgramRatio,
  scoreSentences,
  selectReasons,
  splitLines,
  splitSentences,
  standardDeviation,
  tokenizeWords,
};
