import rawDecompositions from './assets/candidates.json';
import { IDS } from './compiler/Expr';
import { parseIDS } from './compiler/Parser';
const decompositions: Record<string, string> = (rawDecompositions as any);

export const IDSMap: Record<string, IDS.Expr> = (() => {
  const ret: Record<string, IDS.Expr> = {};
  Object.keys(decompositions).forEach(key => {
    ret[key] = parseIDS(decompositions[key]);
  });
  return ret;
})();

export const normalizeIDS = (x: string, normalizer: (s: string) => IDS.Expr): IDS.Expr =>
  IDS.ana(x,
    (expr: IDS.Expr): IDS.Expr => {
      if (typeof expr === 'string') {
        return normalizer(expr);
      }
      return expr;
    });

export const partialFindChar = (goal: string): Set<string> => {
  const matching: Set<string> = new Set();
  normalizeIDS(goal, (s: string) => {
    matching.add(s);
    return IDSMap[s] ?? s;
  });
  return matching;
  // return [normalizeIDS(query, (s: string) => {
  //   if (matching.has(s)) { return s; }
  //   return IDSMap[s] ?? s;
  // }), matching];
};

export type IDSHighlight = {
  type: 'leaf',
  val: string,
  match: boolean,
} | {
  type: 'node',
  val: IDS.ExprF<IDSHighlight, IDSHighlight>,
  match: boolean,
}

export const highlightIDSMatches = (query: string, matches: Set<string>): IDSHighlight => {
  if (matches.has(query)) {
    return { type: 'leaf', val: query, match: true };
  }
  const decomposition = IDSMap[query];
  if (decomposition) {
    const leafified: IDS.ExprF<IDS.Expr<IDSHighlight>, IDSHighlight> = IDS.mapL(decomposition, x => highlightIDSMatches(x, matches));
    const collapsed = IDS.cata(leafified, flattenMatches);
    if (collapsed.match) { return collapsed; }
  }
  return { type: 'leaf', val: query, match: false };
}

const flattenMatches = (e: IDS.ExprF<IDSHighlight, IDSHighlight>): IDSHighlight => {
  if (!Array.isArray(e)) { return e; }
  return {
    type: 'node',
    val: e,
    match: e[1].match || e[2]?.match || e?.[3]?.match || false,
  };
}