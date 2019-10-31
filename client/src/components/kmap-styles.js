import { css } from 'lit-element';

// language=CSS
export const fontStyles = css`
h1, .font-title {
  font-family: Roboto, Noto, sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 1.15rem;
  font-weight: 600;
}
h2, .font-subtitle, label[section] {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 1.05rem;
  font-weight: 600;
}
h3, .font-subsubtitle, th {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 600;
}
p, .font-body, label, td {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 500;
}
.secondary {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.85rem;
  font-weight: 300;
}
a {
  color: var(--color-mediumgray);
  text-decoration: none;
  font-weight: bold;
}
a:hover {
  text-decoration: underline;
}
a[disabled] {
    pointer-events: none;
    color: var(--color-mediumgray) !important;
}
`;

export const colorStyles = css`
h1, h2, h3, p, label, .color-content-text, :host {
  color: var(--color-darkgray);
}
.secondary {
  color: var(--color-mediumgray);
}
`;
