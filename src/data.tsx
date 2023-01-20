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

export const partialFindChar = (goal: string, query: string) => {
  const matching: Set<String> = new Set();
  normalizeIDS(goal, (s: string) => {
    matching.add(s);
    return IDSMap[s] ?? s;
  });
  console.log(matching);
  return normalizeIDS(query, (s: string) => {
    if (matching.has(s)) { return "y" + s; }
    return IDSMap[s] ?? s;
  });

};