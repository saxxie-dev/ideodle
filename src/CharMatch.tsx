import { Accessor, Component, createMemo, createSignal, JSX } from 'solid-js';
import { IDSHighlight } from './data';
import { IDS } from './compiler/Expr';



export type CharMatchProps = {
  highlight: IDSHighlight;
  position: [number, number];
  size: [number, number];
}
export const CharMatch: Component<CharMatchProps> = (props) => {
  console.log(props.highlight);
  const sizeStyle = createMemo(() => `width: ${props.size[0]}rem; height:${props.size[1]}rem;`)
  if (props.highlight.type === 'leaf') {
    return <div
      class={`charMatch ${props.highlight.match ? 'match' : ''}`}
      style={sizeStyle()}
    >
      {props.highlight.val as string}
    </div>;
  };
  if (!Array.isArray(props.highlight.val)) { throw 'badly formatted IDSHighlight'; }
  switch (props.highlight.val[0]) {
    case '⿰': return <div class='charMatch H' style={sizeStyle()}>
      <CharMatch highlight={props.highlight.val[1]} position={[0, 0]} size={[props.size[0] / 2, props.size[1]]} />
      <CharMatch highlight={props.highlight.val[2]} position={[0, 0]} size={[props.size[0] / 2, props.size[1]]} />
    </div>;
    case '⿱': return <div class='charMatch V' style={sizeStyle()}>
      <CharMatch highlight={props.highlight.val[1]} position={[0, 0]} size={[props.size[0], props.size[1] / 2]} />
      <CharMatch highlight={props.highlight.val[2]} position={[0, 0]} size={[props.size[0], props.size[1] / 2]} />
    </div>;
    case '⿲': return <div class='charMatch H' style={sizeStyle()}>
      <CharMatch highlight={props.highlight.val[1]} position={[0, 0]} size={[props.size[0] / 3, props.size[1]]} />
      <CharMatch highlight={props.highlight.val[2]} position={[0, 0]} size={[props.size[0] / 3, props.size[1]]} />
      <CharMatch highlight={props.highlight.val[3]} position={[0, 0]} size={[props.size[0] / 3, props.size[1]]} />
    </div>;
    case '⿳': return <div class='charMatch V' style={sizeStyle()}>
      <CharMatch highlight={props.highlight.val[1]} position={[0, 0]} size={[props.size[0], props.size[1] / 3]} />
      <CharMatch highlight={props.highlight.val[2]} position={[0, 0]} size={[props.size[0], props.size[1] / 3]} />
      <CharMatch highlight={props.highlight.val[3]} position={[0, 0]} size={[props.size[0], props.size[1] / 3]} />
    </div>;
  }

  return <div class='charMatch' style={`width: ${props.size[0]}rem; height:${props.size[1]}rem`}>{JSON.stringify(props.highlight)}</div>;
};

  // This is a hack around not understanding how reactivity works in solid-js
  // const memoComponent = createMemo(() => IDS.cata(props.highlight(), (components: IDS.ExprF<JSX.Element>): JSX.Element => {
  //   if (typeof components === 'string') {
  //     if (props.matches.has(components)) {
  //       return <div class="match">{components}</div>
  //     }
  //     return <div>{components}</div>;
  //   } else {
  //     switch (components[0]) {
  //       case '⿰': return <div class='charMatch H H2'>{components[1]}{components[2]}</div>;
  //       case '⿱': return <div class='charMatch V V2'>{components[1]}{components[2]}</div>;
  //       case '⿲': return <div class='charMatch H H3'>{components[1]}{components[2]}{components[3]}</div>;
  //       case '⿳': return <div class='charMatch V V3'>{components[1]}{components[2]}{components[3]}</div>;
  //     }
  //   }
  // }));