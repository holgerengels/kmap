import { css } from 'lit-element';

export const fontStyles = css`
h1, .font-title {
  font-family: Roboto, Noto, sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 1.25rem;
  font-weight: 500;
}
h2, .font-subtitle, label[section] {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 1.10rem;
  font-weight: 500;
}
h3, .font-subsubtitle {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 500;
}
p, .font-body, label {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 400;
}
a {
  text-decoration: none;
  font-weight: bold;
}
a:hover {
  text-decoration: underline;
}
`;

export const colorStyles = css`
h1, h2, h3, p, label, .color-content-text, :host {
  color: var(--color-darkgray);
}
`;
