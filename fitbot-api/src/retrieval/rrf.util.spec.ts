import { fuseWithReciprocalRankFusion } from './rrf.util';

describe('fuseWithReciprocalRankFusion', () => {
  it('ranks a chunk found by both rankers above one found by only one', () => {
    const lexical = [
      { id: 'a', content: 'A' },
      { id: 'b', content: 'B' },
    ];
    const semantic = [
      { id: 'b', content: 'B' },
      { id: 'c', content: 'C' },
    ];

    const result = fuseWithReciprocalRankFusion(lexical, semantic, 60);

    // b: 1/(60+2) [lexical] + 1/(60+1) [semantic] = 0.03226
    // a: 1/(60+1) [lexical only] = 0.01639
    // c: 1/(60+2) [semantic only] = 0.01613
    expect(result.map((r) => r.id)).toEqual(['b', 'a', 'c']);
    expect(result[0].lexicalRank).toBe(2);
    expect(result[0].semanticRank).toBe(1);
    expect(result[1].lexicalRank).toBe(1);
    expect(result[1].semanticRank).toBeNull();
    expect(result[2].lexicalRank).toBeNull();
    expect(result[2].semanticRank).toBe(2);
  });

  it('computes the exact fused score using k', () => {
    const lexical = [{ id: 'x', content: 'X' }];
    const semantic = [{ id: 'x', content: 'X' }];

    const [result] = fuseWithReciprocalRankFusion(lexical, semantic, 60);

    expect(result.rrfScore).toBeCloseTo(1 / 61 + 1 / 61, 10);
  });

  it('returns an empty array when both lists are empty', () => {
    expect(fuseWithReciprocalRankFusion([], [])).toEqual([]);
  });

  it('surfaces a semantic-only match even if it never appears lexically', () => {
    const result = fuseWithReciprocalRankFusion(
      [],
      [{ id: 'only-semantic', content: 'paraphrase match' }],
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('only-semantic');
    expect(result[0].lexicalRank).toBeNull();
    expect(result[0].semanticRank).toBe(1);
  });
});
