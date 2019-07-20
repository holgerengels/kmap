import { css } from 'lit-element';

// language=CSS
export const mathjaxStyles = css`
  g[data-mml-node="merror"] > g {
    fill: red;
    stroke: red;
  }

  g[data-mml-node="merror"] > rect[data-background] {
    fill: yellow;
    stroke: none;
  }

  g[data-mml-node="mtable"] > line[data-line] {
    stroke-width: 70px;
    fill: none;
  }

  g[data-mml-node="mtable"] > rect[data-frame] {
    stroke-width: 70px;
    fill: none;
  }

  g[data-mml-node="mtable"] > .mjx-dashed {
    stroke-dasharray: 140;
  }

  g[data-mml-node="mtable"] > .mjx-dotted {
    stroke-linecap: round;
    stroke-dasharray: 0,140;
  }

  g[data-mml-node="mtable"] > svg {
    overflow: visible;
  }

  g[data-mml-node="maction"][data-toggle] {
    cursor: pointer;
  }

  .MathJax path {
    stroke-width: 3;
  }
`;
