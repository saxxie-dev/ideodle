import { IDS } from './Expr';

export const betaReduce = (expr: IDS.Expr, char: string, decomposition: IDS.Expr): IDS.Expr =>
  IDS.cata(expr, e => e === char ? decomposition : e);
