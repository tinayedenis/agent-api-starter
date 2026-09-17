/**
 * Extractive summarizer — no external API keys required.
 * Splits into sentences, scores by word frequency, returns top N.
 */

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9"'])|(?<=[.!?])\s*$/gm;
const WORD = /[a-z0-9']+/gi;

const STOP = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "as", "is", "was", "are", "were", "be", "been", "being", "have",
  "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "this", "that", "these", "those",
  "it", "its", "i", "you", "he", "she", "we", "they", "them", "his", "her",
  "our", "your", "with", "from", "by", "not", "no", "so", "if", "then",
  "than", "too", "very", "just", "about", "into", "over", "after", "before",
]);

export type SummarizeResult = {
  summary: string;
  sentencesUsed: number;
  allSentenceCount: number;
};

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : [cleaned];
}

function tokenize(sentence: string): string[] {
  return (sentence.toLowerCase().match(WORD) ?? []).filter((w) => !STOP.has(w) && w.length > 1);
}

export function summarizeText(text: string, maxSentences = 3): SummarizeResult {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return { summary: "", sentencesUsed: 0, allSentenceCount: 0 };
  }

  const n = Math.max(1, Math.min(maxSentences, sentences.length));

  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const w of tokenize(s)) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  const scored = sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    const score =
      words.length === 0
        ? 0
        : words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / words.length;
    // Slight preference for earlier sentences (classic extractive bias)
    return { sentence, index, score: score + (sentences.length - index) * 0.01 };
  });

  const selected = scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .sort((a, b) => a.index - b.index);

  return {
    summary: selected.map((s) => s.sentence).join(" "),
    sentencesUsed: selected.length,
    allSentenceCount: sentences.length,
  };
}

// Silence unused if bundlers complain about regex constant
void SENTENCE_SPLIT;
