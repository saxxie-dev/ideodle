import { Accessor, Component, createMemo, createSignal } from 'solid-js';
import styles from './App.module.css';
import { CharMatch } from './CharMatch';
import { highlightIDSMatches, IDSMap, normalizeIDS, partialFindChar } from './data';

const App: Component = () => {
  const [val, setVal] = createSignal("");
  const secret = createMemo(() => {
    const IDSKeys = Object.keys(IDSMap);
    return IDSKeys[Math.floor(Math.random() * IDSKeys.length)];
  });

  // const displayVal = createMemo(() => {
  //   return JSON.stringify(partialFindChar(secret(), val()));
  // }, val());

  const partialMatches: Accessor<Set<string>> = createMemo(() => {
    return partialFindChar(secret());
  });
  // const matchedExpr = createMemo(() => matchedExprAndMatches()[0]);
  // const matches = createMemo(() => matchedExprAndMatches()[1])

  const highlight = createMemo(() => {
    console.log(val());
    return highlightIDSMatches(val(), partialMatches());
  });
  return (
    <>
      <div class={styles.App}>
        {secret()}
      </div>


      <input type='text' onCompositionEnd={e => setVal(e.data)} onInput={e => {
        if (!e.isComposing) { setVal(e.currentTarget.value); }
      }} />
      <CharMatch highlight={highlight()} position={[0, 0]} size={[12, 12]} />
    </>
  );
};

export default App;
