const fs = require('fs/promises');
const { parseIDS } = require('../src/parser/parser');

// Last character fully supported by CJK font on my machine
const CHISESupportLimit = 75160;

// Illegal characters / placeholders that should be filtered out of the DB
const IllegalCHISECharacters = [
  'α',
  'ℓ',
  '①',
  '②',
  '③',
  '④',
  '⑤',
  '⑥',
  '⑦',
  '⑧',
  '⑨',
  '⑩',
  '⑪',
  '⑫',
  '⑬',
  '⑭',
  '⑮',
  '⑯',
  '⑲',
  '△',
  'い',
  'よ',
  'り',
  'サ',
  'ス',
  '㇌',
  '㇢',
  '㇣',
  '𛂦',
  '？'
];

const invalidBabelstoneChunks = [6, 7, 8, 9, 12, 14, 15, 17, 19, 20, 21];



// ------------ Types and data structure ------------
const LangChars = ['G', 'H', 'J', 'K', 'M', 'P', 'S', 'T', 'B', 'U', 'V', 'X', 'Z', 'UCS2003'] as const;
type LangChar = typeof LangChars[number];
type LangCode = LangChar[];

const mergeLangCodes = (c1: LangCode, c2: LangCode): LangCode => {
  if (!c1 || !c2) { return c1 || c2; }
  return [...new Set([...c1, ...c2])];
}

type CharacterComposition = { composition: string, lang: LangCode };
type CharacterDictionaryEntry =
  { char: string, lang: LangCode, valid?: boolean } & // TODO: add homoglyphs, shrinkage
  ({ atomic: false, compositions: CharacterComposition[] } |
  { atomic: true });
type CharacterDictionary = Record<string, CharacterDictionaryEntry>;


type IDS = { sequence: string, lang?: LangCode }
type IDSDecomposition = { type: 'atom', lang?: LangCode } |
{ type: 'composite', sequences: IDS[] };

type IDSSelection = { char: string, decomposition: IDSDecomposition };
type IDSMap = { [char: string]: IDSDecomposition };

const IDSSelectionsToMap = (selections: IDSSelection[]): IDSMap => {
  const map: IDSMap = {};
  selections.forEach(selection => {
    if (map[selection.char]) { throw `Duplicate character: ${selection.char}` }
    map[selection.char] = selection.decomposition;
  });
  return map;
};

// ------------ Parsers ------------
const isValidLangCode = (char: string): char is LangChar => {
  return (LangChars as Readonly<string[]>).indexOf(char) > -1;
};

const decomposeBabelstoneIDS = (seqs: string[]): IDSDecomposition => {
  let parsedSequences: IDS[] = [];
  seqs.forEach(seq => {
    if (seq[0] === '*') { return; } // Line-end comment syntax
    const parsedSeq = /^\^([^\$]*)\$\(((?:[A-Z\[\]]*)|UCS2003)\)$/.exec(seq);
    if (!parsedSeq) { throw "Unparseable sequence: " + seq; }
    const langCodeStr: string = parsedSeq[2].replace(/\[\]/, '');
    parsedSequences.push({
      sequence: parsedSeq[1],
      lang: langCodeStr === 'UCS2003' ? [langCodeStr] :
        langCodeStr.split('').filter(isValidLangCode),
    });
  });

  if (parsedSequences.length === 0) { throw "No valid sequences provided: " + seqs; }
  if (parsedSequences.length === 1 && parsedSequences[0].sequence.length === 1) {
    return { type: 'atom', lang: parsedSequences[0].lang };
  }
  return { type: 'composite', sequences: parsedSequences };
};

const decomposeChiseIDS = (seqs: string[]): IDSDecomposition => {
  const parsedSequences: IDS[] = seqs.map(seq => {
    const parsedSeq = /^([^\[]*)(?:\[([A-Z]*)\])?$/.exec(seq);
    if (!parsedSeq) { throw "Unparseable sequence: " + seq; }
    return {
      sequence: parsedSeq[1],
      lang: parsedSeq[2]?.split('')?.filter(isValidLangCode),
    }
  })

  if (parsedSequences.length === 0) { throw "No valid sequences provided: " + seqs; }
  if (parsedSequences.length === 1 && parsedSequences[0].sequence.length === 1) {
    return { type: 'atom', lang: parsedSequences[0].lang };
  }
  return { type: 'composite', sequences: parsedSequences };
};


// ----------- Loaders ------------
const loadChiseSequences = async (options: {
  lastRow: number,
  illegalChars: string[],
}): Promise<IDSSelection[]> => {
  const idsFile = await fs.open('./raw/hanzi-CHISE-ids.tsv');
  const idsText: string = (await idsFile.readFile()).toString('utf-8');
  await idsFile.close();

  const idsLines = idsText
    .split('\n')
    .filter(x => !!x && x[0] !== '#')
    .slice(0, options.lastRow);

  return idsLines.map(line => {
    const ex = line.split('\t');
    return {
      char: ex[1],
      decomposition: decomposeChiseIDS(ex.slice(2)),
    };
  }).filter(ex => options.illegalChars.indexOf(ex.char) === -1);
};

const loadBabelstoneSequences = async (options: {
  chunksToExclude: number[],
}): Promise<IDSSelection[]> => {
  const idsFile = await fs.open('./raw/hanzi-babelstone-ids.tsv');
  const idsText: string = (await idsFile.readFile()).toString('utf-8');
  await idsFile.close();

  const lines = idsText
    .split('\n')
    .filter(x => !!x);

  const idsChunks: string[][] = [];
  let newSection = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let isComment = line[0] === '#';
    if (isComment) { newSection = true; continue; }
    if (newSection) { idsChunks.push([]); newSection = false; }
    idsChunks[idsChunks.length - 1].push(line);
  }

  return idsChunks
    .filter((_, i) => options.chunksToExclude.indexOf(i) === -1)
    .flat()
    .map(line => {
      const ex = line.split('\t');
      return {
        char: ex[1],
        decomposition: decomposeBabelstoneIDS(ex.slice(2)),
      };
    });
};

const writeCandidateSequences = async (map: Record<string, string>) => {
  await fs.writeFile('src/assets/candidates.json', JSON.stringify(map));
};

// Dont remember what this does, looks annoying
// const generateReverseMap = (map: IDSMap): [string[], { [k: string]: string }] => {
//   const retMap: { [k: string]: string } = {};
//   let atomList: string[] = [];
//   Object.keys(map).forEach(char => {
//     const entry = map[char];
//     if (entry.type === 'atom') {
//       if (retMap[char] || atomList.indexOf(char) > -1) { console.error(`Duplicate atom: ${char}`); }
//       atomList.push(char);
//     } else {
//       entry.sequences.forEach(({ sequence }) => {
//         // if (sequence.length === 1) { throw `sequence '${sequence}'should be atom`; }
//         if (retMap[sequence]) { console.log(`Duplicate sequence: ${char} = ${sequence} = ${retMap[sequence]}`); }
//         retMap[sequence] = char;
//       });
//     }
//   });
//   return [atomList, retMap];
// };

const fuseBabelstoneWithChise = (babelstoneMap: IDSMap, chiseMap: IDSMap): Record<string, string> => {
  const chiseKeys = Object.keys(chiseMap);
  const simpleIDSMap: Record<string, string> = {};
  chiseKeys.forEach(key => {
    const bab = babelstoneMap[key];
    const chik = chiseMap[key];
    if (!bab) { return; } // Discard xor. Too sketchy
    if (bab.type === 'atom' || chik.type === 'atom') { return; } // Discard atoms - we'll never show these

    // Only use characters that exist in GHT - Simplified, Hong Kong, and Traditional
    const langs = new Set<LangChar>();
    bab.sequences.forEach(x => x.lang?.forEach(lang => langs.add(lang)));
    chik.sequences.forEach(x => x.lang?.forEach(lang => langs.add(lang)));
    const requiredLangs: LangCode = ['G']
    if (!requiredLangs.every(x => langs.has(x))) { return; }

    // Pick shortest valid decomposition. If it contains illegal chars, throw it out
    const allSeqs = new Set<string>();
    bab.sequences.forEach(x => {
      if (isBabelstoneDecompositionRepresentable(x.sequence)) {
        allSeqs.add(x.sequence);
      }
    });
    chik.sequences.forEach(x => {
      if (isChiseDecompositionRepresentable(x.sequence)) {
        allSeqs.add(x.sequence);
      }
    });
    if (allSeqs.size === 0) { return; }
    const sortedSeqs = [...allSeqs].sort((s1, s2) => s1.length - s2.length);
    simpleIDSMap[key] = sortedSeqs[0];
  });
  return simpleIDSMap;
}

const isChiseDecompositionRepresentable = (s: string) => {
  for (let c of IllegalCHISECharacters) {
    if (s.indexOf(c) > -1) { return false; }
  }
  return isSequenceDecompositionRepresentable(s);
}

const isBabelstoneDecompositionRepresentable = (s: string) => {
  if (['{', '？', '〾', '↔', '↷', '⊖'].some(x => s.indexOf(x) > -1)) { return false; }
  return isSequenceDecompositionRepresentable(s);
}

const isSequenceDecompositionRepresentable = (s: string) => {
  // TODO: whitelist some of these, under certain conditions
  if (['⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻'].some(x => s.indexOf(x) > -1)) { return false; }
  return true;
}

const processIdsSequences = async () => {
  const chiseSequences = await loadChiseSequences({ lastRow: CHISESupportLimit, illegalChars: IllegalCHISECharacters });
  const babelstoneSequences = await loadBabelstoneSequences({
    chunksToExclude: invalidBabelstoneChunks,
  });

  const [chiseMap, babelstoneMap] = [chiseSequences, babelstoneSequences].map(IDSSelectionsToMap);
  const candidates = fuseBabelstoneWithChise(babelstoneMap, chiseMap);
  writeCandidateSequences(candidates);

  // console.log(babelstoneKeys.filter(x => chiseKeys.indexOf(x) === -1));
};

processIdsSequences();