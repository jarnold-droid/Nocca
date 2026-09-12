export interface MatchCandidate {
  id: string;
  name: string;
  accountNumber: string;
}

export interface ScoredCandidate extends MatchCandidate {
  score: number; // 0..1, higher is a better match
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function bigrams(text: string): string[] {
  const padded = ` ${text} `;
  const grams: string[] = [];
  for (let i = 0; i < padded.length - 1; i++) {
    grams.push(padded.slice(i, i + 2));
  }
  return grams;
}

/** Sorensen-Dice coefficient over character bigrams: robust to shorthand, word order, and minor typos. */
function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const gram of bigramsA) {
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }

  let matches = 0;
  for (const gram of bigramsB) {
    const count = counts.get(gram) ?? 0;
    if (count > 0) {
      matches++;
      counts.set(gram, count - 1);
    }
  }

  return (2 * matches) / (bigramsA.length + bigramsB.length);
}

/** Boosts the score when one name is a prefix/substring of the other, which is common for shorthand entries like "Barracuda #1" vs "Barracuda Tchoup #1". */
function containmentBonus(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  if (candidate.includes(query) || query.includes(candidate)) return 0.15;
  return 0;
}

/**
 * Ranks stored customers against a (possibly handwritten/shorthand) name read off an invoice.
 * Returns the top `limit` matches, sorted best-first. Never auto-selects — callers must still
 * have the user confirm, especially when scores are close together.
 */
export function matchCustomers(
  rawName: string,
  candidates: MatchCandidate[],
  limit = 3
): ScoredCandidate[] {
  const query = normalize(rawName);
  if (!query) return [];

  return candidates
    .map((candidate) => {
      const normalizedCandidate = normalize(candidate.name);
      const score = Math.min(
        1,
        diceCoefficient(query, normalizedCandidate) + containmentBonus(query, normalizedCandidate)
      );
      return { ...candidate, score };
    })
    .filter((c) => c.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
