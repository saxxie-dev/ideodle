import { Eq } from '../prelude/Eq';
import { assertNever } from '../prelude/Never'


export module IDS {
  export const Combo1_enumeration = ['〾', '↔', '↷', '⊖'] as const;
  export const Combo2_enumeration = ['⿰', '⿱', '⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻'] as const;
  export const Combo3_enumeration = ['⿲', '⿳'] as const;

  export type Combo1 = (typeof Combo1_enumeration)[number];
  export type Combo2 = (typeof Combo2_enumeration)[number];
  export type Combo3 = (typeof Combo3_enumeration)[number];

  export type Expr<L = string> =
    [Combo1, Expr<L>] |
    [Combo2, Expr<L>, Expr<L>] |
    [Combo3, Expr<L>, Expr<L>, Expr<L>] |
    L;

  export type ExprF<A, L = string> =
    [Combo1, A] |
    [Combo2, A, A] |
    [Combo3, A, A, A] |
    L;

  const witness_Expr_is_Fix_ExprF:
    <L>() => Eq<Expr<L>, ExprF<Expr<L>, L>> = () => true;

  export const map = <A, B, L = string>(expr: ExprF<A, L>, f: (a: A) => B): ExprF<B, L> => {
    if (!Array.isArray(expr)) {
      return expr;
    }
    if (expr.length === 2) {
      return [expr[0], f(expr[1])];
    }
    if (expr.length === 3) {
      return [expr[0], f(expr[1]), f(expr[2])];
    }
    if (expr.length === 4) {
      return [expr[0], f(expr[1]), f(expr[2]), f(expr[3])];
    }
    throw assertNever(expr);
  }

  export const mapL = <L, M>(expr: Expr<L>, f: (l: L) => M): Expr<M> => {
    if (!Array.isArray(expr)) {
      return f(expr);
    }
    if (expr.length === 2) {
      return [expr[0], mapL(expr[1], f)];
    }
    if (expr.length === 3) {
      return [expr[0], mapL(expr[1], f), mapL(expr[2], f)];
    }
    if (expr.length === 4) {
      return [expr[0], mapL(expr[1], f), mapL(expr[2], f), mapL(expr[3], f)];
    }
    throw assertNever(expr);
  }

  export const cata = <A, L = string>(expr: Expr<L>, f: (e: ExprF<A, L>) => A): A => {
    return f(map<Expr<L>, A, L>(expr, x => cata<A, L>(x, f)));
  };

  export const ana = <A>(a: A, f: (a: A) => ExprF<A>): Expr => {
    return map<A, Expr>(f(a), x => ana(x, f));
  }
};

