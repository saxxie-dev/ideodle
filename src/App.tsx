import { Component, createMemo, createSignal } from 'solid-js';
import styles from './App.module.css';
import { IDSMap, normalizeIDS, partialFindChar } from './data';

const App: Component = () => {
  const [val, setVal] = createSignal("");
  const secret = createMemo(() => {
    const IDSKeys = Object.keys(IDSMap);
    return IDSKeys[Math.floor(Math.random() * IDSKeys.length)];
  })

  const displayVal = createMemo(() => {
    return JSON.stringify(partialFindChar(secret(), val()));
  }, val());
  return (
    <>
      <div class={styles.App}>
        {secret()}
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
