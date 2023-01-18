import { IDS } from './Expr';
import { headHas, matchUnicodeCons } from './Utils';

const parseIDS_ = (input: string): [IDS.Expr, string] => {
  const h1 = headHas(input, IDS.Combo1_enumeration);
  if (h1) {
    const [arg1, rem] = parseIDS_(input.slice(1));
    return [
      [h1, arg1],
      rem,
    ];
  }

  const h2 = headHas(input, IDS.Combo2_enumeration);
  if (h2) {
    const [arg1, rem1] = parseIDS_(input.slice(1));
    const [arg2, rem] = parseIDS_(rem1);
    return [
      [h2, arg1, arg2],
      rem,
    ];
  }

  const h3 = headHas(input, IDS.Combo3_enumeration);
  if (h3) {
    const [arg1, rem1] = parseIDS_(input.slice(1));
    const [arg2, rem2] = parseIDS_(rem1);
    const [arg3, rem] = parseIDS_(rem2);

    return [
      [h3, arg1, arg2, arg3],
      rem,
    ];
  }

  return matchUnicodeCons(input);
}

export const parseIDS = (input: string): IDS.Expr => {
  const [parsed, rem] = parseIDS_(input);
  if (rem !== '') { throw `Parser failed to interpret remainder "${rem}" of string "${input}`; }
  return parsed;
}