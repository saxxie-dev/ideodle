import { Component, createMemo, createSignal } from 'solid-js';
import rawDecompositions from './assets/candidates.json';
import styles from './App.module.css';
import { parseIDS } from './compiler/Parser'

const decompositions: Record<string, string> = (rawDecompositions as any);
const App: Component = () => {
  const [val, setVal] = createSignal("");

  const displayVal = createMemo(() => {
    if (decompositions[val()]) {
      return JSON.stringify(parseIDS(decompositions[val()]));
    } else {
      return val();
    }
  }, val());
  return (
    <>
      <div class={styles.App}>
        yo
      </div>


      <input type='text' onInput={e => {
        if (!e.isComposing) {
          setVal((e.target as any).value);
        }
      }} />
      {displayVal}
    </>
  );
};

export default App;
