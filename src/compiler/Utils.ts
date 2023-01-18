export const matchUnicodeCons = (s: string): [string, string] => {
  const headCodepoint = s.codePointAt(0);
  if (!headCodepoint) {
    throw `Headless string "${s}"`;
  }
  const head = String.fromCodePoint(headCodepoint);
  return [head, s.slice(head.length)];
};

export const headHas = <A extends readonly string[]>(search: string, check: A): A[number] | undefined => {
  const head: A[number] = search[0];
  return check.indexOf(search[0]) > -1 ? head : undefined;
};