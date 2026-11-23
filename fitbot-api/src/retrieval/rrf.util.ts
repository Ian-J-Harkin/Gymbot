export interface RetrievalCandidate {
  id: string | number;
  content: string;
  fileName?: string;
}

export interface FusedCandidate extends RetrievalCandidate {
  lexicalRank: number | null;
  semanticRank: number | null;
  rrfScore: number;
}

/**
 * Reciprocal rank fusion: combines two independently-ranked candidate lists by
 * rank position only, not raw scores, since lexical term-overlap scores and
 * cosine-similarity scores are not comparable without calibration. See
 * SEMANTIC_SEARCH_DESIGN_DISCUSSION.md and eval_implementation_plan.md Task 3.5
 * ("Decided: ... reciprocal rank fusion (k=60)").
 *
 * A chunk present in only one list still gets a score (and a null rank for the
 * list it is absent from), so it can still surface if that single list ranks it
 * highly enough.
 */
export function fuseWithReciprocalRankFusion(
  lexicalRanked: RetrievalCandidate[],
  semanticRanked: RetrievalCandidate[],
  k = 60,
): FusedCandidate[] {
  const byId = new Map<string | number, FusedCandidate>();

  lexicalRanked.forEach((item, index) => {
    const rank = index + 1;
    byId.set(item.id, {
      ...item,
      lexicalRank: rank,
      semanticRank: null,
      rrfScore: 1 / (k + rank),
    });
  });

  semanticRanked.forEach((item, index) => {
    const rank = index + 1;
    const score = 1 / (k + rank);
    const existing = byId.get(item.id);

    if (existing) {
      existing.semanticRank = rank;
      existing.rrfScore += score;
    } else {
      byId.set(item.id, {
        ...item,
        lexicalRank: null,
        semanticRank: rank,
        rrfScore: score,
      });
    }
  });

  return Array.from(byId.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}
