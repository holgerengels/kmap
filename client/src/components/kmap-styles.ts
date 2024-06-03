import {css, CSSResult} from 'lit';

// language=CSS
export const resetStyles: CSSResult = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }
  :host {
    font-family: Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    font-size: 0.875rem;
  }
`;

// language=CSS
export const fontStyles: CSSResult = css`
h1 {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 1.125rem;
  font-weight: 500;
}
h2 {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 1.0625rem;
  font-weight: 500;
}
h3 {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 1.00rem;
  font-weight: 500;
}
h4, label {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 0.9375rem;
  font-weight: 500;
}
h5, th, dt, b, label[secondary] {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 0.875rem;
  font-weight: 500;
}
p, .font-body, td, dd, .secondary {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 0.875rem;
  font-weight: 400;
}
img {
  display: block;
}
h1, h2, h3, h4, h5, p, img {
  margin-block: 1.15em;
  line-height: 1.2rem;
}
h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child, p:first-child, img:first-child {
  margin-block-start: 0px;
}
sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}
sub {
  bottom: -0.25em;
}
sup {
  top: -0.5em;
}
figcaption {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.8125rem;
  font-weight: 400;
}
a {
  color: var(--color-primary-dark);
  text-decoration: none;
  font-size: inherit;
  font-weight: 500;
}
a:hover {
  text-decoration: underline;
}
a[disabled] {
    pointer-events: none;
    color: var(--color-mediumgray) !important;
}
ol, ul {
  padding-inline-start: 16px;
}
button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.2rem;
  margin: 0;
}
`;

// language=CSS
export const colorStyles: CSSResult = css`
h1, h2, h3, h4, p, th, td, :host {
  color: var(--color-darkgray);
}
span.secondary, label, mwc-icon-button {
  color: var(--color-mediumgray);
}
hr {
  border: 1px solid var(--color-mediumgray);
}
`;

// language=CSS
export const formStyles: CSSResult = css`
        .form {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-gap: 8px;
        }
        .form > [s2] {
          grid-column: span 2;
        }
        .form > [s3] {
          grid-column: span 3;
        }
        .form > [s4] {
          grid-column: span 4;
        }
        .form > [s5] {
          grid-column: span 5;
        }
        .form > [s6] {
          grid-column: span 6;
        }
`;

// language=CSS
export const calculationStyles: CSSResult = css`
  calculation {
    display: grid;
    grid-gap: 16px;
    grid-template-columns: max-content auto;
  }
  step {
    grid-column: 1;
  }
  notes {
    grid-column: 2;
    font-size: small;
  }
`;

// language=CSS
export const elevationStyles: CSSResult = css`
:host {
    --elevation-00: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);
    --elevation-01: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
    --elevation-02: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
    --elevation-03: 0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12);
    --elevation-04: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
    --elevation-05: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 5px 8px 0px rgba(0, 0, 0, 0.14), 0px 1px 14px 0px rgba(0, 0, 0, 0.12);
    --elevation-06: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12);
    --elevation-07: 0px 4px 5px -2px rgba(0, 0, 0, 0.2), 0px 7px 10px 1px rgba(0, 0, 0, 0.14), 0px 2px 16px 1px rgba(0, 0, 0, 0.12);
    --elevation-08: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);
    --elevation-09: 0px 5px 6px -3px rgba(0, 0, 0, 0.2), 0px 9px 12px 1px rgba(0, 0, 0, 0.14), 0px 3px 16px 2px rgba(0, 0, 0, 0.12);
    --elevation-10: 0px 6px 6px -3px rgba(0, 0, 0, 0.2), 0px 10px 14px 1px rgba(0, 0, 0, 0.14), 0px 4px 18px 3px rgba(0, 0, 0, 0.12);
    --elevation-transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
`;

//     --elevation-11: 0px 6px 7px -4px rgba(0, 0, 0, 0.2), 0px 11px 15px 1px rgba(0, 0, 0, 0.14), 0px 4px 20px 3px rgba(0, 0, 0, 0.12);
//     --elevation-12: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12);
//     --elevation-13: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 13px 19px 2px rgba(0, 0, 0, 0.14), 0px 5px 24px 4px rgba(0, 0, 0, 0.12);
//     --elevation-14: 0px 7px 9px -4px rgba(0, 0, 0, 0.2), 0px 14px 21px 2px rgba(0, 0, 0, 0.14), 0px 5px 26px 4px rgba(0, 0, 0, 0.12);
//     --elevation-15: 0px 8px 9px -5px rgba(0, 0, 0, 0.2), 0px 15px 22px 2px rgba(0, 0, 0, 0.14), 0px 6px 28px 5px rgba(0, 0, 0, 0.12);
//     --elevation-16: 0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);
//     --elevation-17: 0px 8px 11px -5px rgba(0, 0, 0, 0.2), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12);
//     --elevation-18: 0px 9px 11px -5px rgba(0, 0, 0, 0.2), 0px 18px 28px 2px rgba(0, 0, 0, 0.14), 0px 7px 34px 6px rgba(0, 0, 0, 0.12);
//     --elevation-19: 0px 9px 12px -6px rgba(0, 0, 0, 0.2), 0px 19px 29px 2px rgba(0, 0, 0, 0.14), 0px 7px 36px 6px rgba(0, 0, 0, 0.12);
//     --elevation-20: 0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 20px 31px 3px rgba(0, 0, 0, 0.14), 0px 8px 38px 7px rgba(0, 0, 0, 0.12);
//     --elevation-21: 0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 21px 33px 3px rgba(0, 0, 0, 0.14), 0px 8px 40px 7px rgba(0, 0, 0, 0.12);
//     --elevation-22: 0px 10px 14px -6px rgba(0, 0, 0, 0.2), 0px 22px 35px 3px rgba(0, 0, 0, 0.14), 0px 8px 42px 7px rgba(0, 0, 0, 0.12);
//     --elevation-23: 0px 11px 14px -7px rgba(0, 0, 0, 0.2), 0px 23px 36px 3px rgba(0, 0, 0, 0.14), 0px 9px 44px 8px rgba(0, 0, 0, 0.12);
//     --elevation-24: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);
