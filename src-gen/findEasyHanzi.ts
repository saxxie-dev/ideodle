import { IDS } from "../src/compiler/Expr";
import { parseIDS } from "../src/compiler/Parser";
import { fs, invalidBabelstoneChunks, loadBabelstoneSequences } from "./cook-hanzi";
import * as STROKECOUNT from "../raw/strokeCount.json";
import * as CANDIDATES from "../raw/characters.json";


const StrokeCountData: Record<string, number> = STROKECOUNT;
const CandidateData: Set<string> = new Set((CANDIDATES as any).default);
const EasyCandidateData: Set<string> = new Set((CANDIDATES as any).default.slice(0, 3500));

type SimpleSeq = { char: string, combo: string }

type AnnotatedSeq = { char: string, parsedExpr: IDS.Expr, strokeCount: number };


export const radicalMap: Record<string, string> = {
  "亻": "人",
  "𠆢": "人",
  "灬": "火",
  "氵": "水",
  "釒": "金",
  "钅": "金",
  "扌": "手",
  "艹": "艸",
  "䒑": "艸",
  "𥫗": "竹",
  "⺼": "肉",
  "訁": "言",
  "讠": "言",
  "糹": "糸",
  "纟": "糸",
  "⺶": "羊",
  "飠": "食",
  "饣": "食",
  "牜": "牛",
  "𤣩": "玉",
  "犭": "犬",
  "衤": "衣",
  "辶": "辵",
  // "阝": "阜", // Also is 邑 when on RHS
  "刂": "刀",
  "忄": "心",
  "⺗": "心",
  "㣺": "心",
  "爫": "爪",
  "⺆": "冂",
  "囗": "口",
};

const listNonDecomposable = async () => {
  const babelstoneSeqs = await loadBabelstoneSequences({ chunksToExclude: [] });

  const zhSeqs: SimpleSeq[] = babelstoneSeqs.map(seq => {
    if (seq.decomposition.type === 'atom') {
      return undefined;
    }
    const filteredSeqs = seq.decomposition.sequences.filter(x => {
      if (!x.lang || x.lang.indexOf("G") === -1) { return false; }
      // if (x.sequence.length >= 5) { return undefined; } // Forbid multilevel - only for candidates;
      const forbiddenCharacters = ["{", "}", '〾', '↔', '↷', '⊖', '⿻', '？']; // Undecomposable constructs
      for (const char of forbiddenCharacters) {
        if (x.sequence.indexOf(char) > -1) { return false; }
      }
      return true;
    });
    if (filteredSeqs.length === 0) { return undefined; }
    if ([...filteredSeqs[0].sequence].length === 1) { return undefined; }
    return { char: seq.char, combo: filteredSeqs[0].sequence };
  }).filter((x): x is SimpleSeq => !!x);

  const easyDecompositions: AnnotatedSeq[] = zhSeqs.map(({ char, combo }) => {
    const parsedExpr = parseIDS(combo);
    if (typeof parsedExpr === "string") { throw "Misplaced atom " + parsedExpr; }
    // Stroke count coherence is very broken. Couple reasons: 1) Unihan sucks 2) outdated dataset 3) variant glyphs
    // 4) creative accounting for simplified radicals. E.g. grass top = 3,4, or 6
    // const componentStrokeCounts = (ids.slice(1) as string[]).map(x => StrokeCountData[x]);
    // if (Math.abs(StrokeCountData[char] - componentStrokeCounts.reduce((x, y) => x + y, 0)) > 1) {
    //   console.log("Very Broken stroke counts on " + char + ": expected " + StrokeCountData[char] + " got " + componentStrokeCounts);
    // }
    const wrapperChar = parsedExpr[1];
    const wis = typeof wrapperChar === "string";
    switch (parsedExpr[0]) {
      case '⿴':
        if (!wis) { return undefined; }
        if (wrapperChar !== '囗') { return undefined; }
        break;
      case '⿶':
        if (!wis) { return undefined; }
        if (wrapperChar !== '凵') { return undefined; }
        break;
      case '⿷':
        if (!wis) { return undefined; }
        if (wrapperChar !== '匚') { return undefined; }
        break;
      case '⿵':
        if (!wis) { return undefined; }
        if (['冂', '⺆', '𠘨', '门', '𰃦'].indexOf(wrapperChar) === -1) { return undefined; }
        break;
      case '⿺':
        if (!wis) { return undefined; }
        if (['𠃊', '辶', '廴'].indexOf(wrapperChar) === -1) { return undefined; }
        break;
      case '⿹':
        if (!wis) { return undefined; }
        if (['𠄎', '𠃌', '勹', '⺄', '气'].indexOf(wrapperChar) === -1) { return undefined; }
        break;
      case '⿸': // This method discards a lot of characters that can undergo rewriting
        // A = ⿸BC; B = ⿸DE => A = ⿸D⿱EC
        if (!wis) { return undefined; }
        if (['厂', '𠂋', '厃', '𠂇', '𠂆', '户', '尸', '⺶', '广', '产', '疒', '𠃜'].indexOf(wrapperChar) === -1) { return undefined; }
        break;
    }
    return { char, parsedExpr, strokeCount: StrokeCountData[char] };
  }).filter((x: AnnotatedSeq | undefined): x is AnnotatedSeq => !!x).map(x => x!);

  const easyDecompositionMap: Record<string, IDS.Expr> = {};
  easyDecompositions.forEach(d => {
    easyDecompositionMap[d.char] = d.parsedExpr;
  });

  // Narrow down to just things in the standard character list
  const radicalFrequencies: Record<string, number> = {};
  const allIntermediates: Set<string> = new Set();
  const expand1 = (x: IDS.Expr) => {
    if (typeof x === 'string') {
      allIntermediates.add(x);
      if (easyDecompositionMap[x]) { return easyDecompositionMap[x]; };
      const normalizedRadical = radicalMap[x] ?? x;
      radicalFrequencies[normalizedRadical] = (radicalFrequencies[normalizedRadical] ?? 0) + 1;
    }
    return x;
  }
  const expand1IDS = (x: IDS.Expr): IDS.Expr => {
    return IDS.map(expand1(x), expand1IDS);
  }
  CandidateData.forEach(expand1IDS);
  const radicals = Object.keys(radicalFrequencies);
  radicals.sort((y, x) => radicalFrequencies[x] - radicalFrequencies[y]);
  const goodRadicals = new Set(radicals.slice(0, 200));

  let counter = 0;
  const expand2 = (x: IDS.Expr) => {
    if (typeof x === 'string') {
      if (easyDecompositionMap[x]) { return easyDecompositionMap[x]; };
      if (!goodRadicals.has(x)) {
        throw "Bad radical";
      }
    }
    return x;
  }
  const expand2IDS = (x: IDS.Expr): IDS.Expr => {
    counter++;
    return IDS.map(expand2(x), expand2IDS);
  }
  const validCandidates: Record<string, number> = {};
  CandidateData.forEach(x => {
    try {
      counter = 0; // ugly hacky but I don't wanna dive in to recursion schemes any more
      expand2IDS(x);
      validCandidates[x] = counter;
    } catch (e) {
      return;
    }
  });

  // Our actual candidates for running the game. These are things with enough subcomponents
  // which are also on the first block of the PRC simplified chinese character list
  const bigEasyCandidates = Object.keys(validCandidates).filter(x => (
    validCandidates[x] >= 5 && EasyCandidateData.has(x)));
  await fs.writeFile('src/assets/candidates.json', `"${bigEasyCandidates.join("")}"`);

  // Output stroke counts for every radical we encountered
  const radicalStrokes: Record<string, number> = {};
  radicals.forEach(r => {
    if (!StrokeCountData[r]) {
      throw "No stroke count info for " + r;
    }
    radicalStrokes[r] = StrokeCountData[r];
  });
  await fs.writeFile('src/assets/strokecounts.json', JSON.stringify(radicalStrokes));

  // output IDS for every character encountered in any block of PRC simplified characters
  // or in any of their components
  const simplifiedIDSes: Record<string, string> = {};
  allIntermediates.forEach(intermediate => {
    if (easyDecompositionMap[intermediate]) {
      simplifiedIDSes[intermediate] = flattenIDS(easyDecompositionMap[intermediate]);
    }
  });
  await fs.writeFile('src/assets/ids.json', JSON.stringify(simplifiedIDSes));
};

const flattenIDS = (e: IDS.Expr): string => {
  if (typeof e === "string") { return e; }
  if (e === undefined) { console.log("huh"); }
  return IDS.map(e, flattenIDS).join("");
}

listNonDecomposable();