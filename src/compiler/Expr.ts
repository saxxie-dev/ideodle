import { Eq } from '../prelude/Eq';
import { assertNever } from '../prelude/Never'


export module IDS {
  export const Combo1_enumeration = ['〾', '↔', '↷', '⊖'] as const;
  export const Combo2_enumeration = ['⿰', '⿱', '⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻'] as const;
  export const Combo3_enumeration = ['⿲', '⿳'] as const;

  export type Combo1 = (typeof Combo1_enumeration)[number];
  export type Combo2 = (typeof Combo2_enumeration)[number];
  export type Combo3 = (typeof Combo3_enumeration)[number];

  export type Unrepresentable = `{${number}}`;
  export type Expr =
    Unrepresentable |
    [Combo1, Expr] |
    [Combo2, Expr, Expr] |
    [Combo3, Expr, Expr, Expr] |
    string;

  export type ExprF<A> =
    Unrepresentable |
    [Combo1, A] |
    [Combo2, A, A] |
    [Combo3, A, A, A] |
    string;

  const witness_Expr_is_Fix_ExprF:
    Eq<Expr, ExprF<Expr>> = true;

  export const map = <A, B>(expr: ExprF<A>, f: (a: A) => B): ExprF<B> => {
    if (typeof expr === 'string') {
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

  export const cata = <A>(expr: Expr, f: (e: ExprF<A>) => A): A => {
    return f(map<Expr, A>(expr, x => cata(x, f)));
  };

  export const ana = <A>(a: A, f: (a: A) => ExprF<A>): Expr => {
    return map<A, Expr>(f(a), x => ana(x, f));
  }
};

