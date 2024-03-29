import katex from 'katex';
import AsciiMathParser from './asciimath2tex.js';

const parser = new AsciiMathParser();

// ″
export function math(code: string): string {
  let segments = code.split('`');
  if (segments.length % 2 === 1)
    segments.push('');

  let buffer = '';
  for (let i=0; i < segments.length; i+=2) {
    const text = segments[i];
    let ascii = segments[i+1];
    let display = false
    if (ascii.startsWith("\\display\\")) {
      ascii = ascii.substr("\\display\\".length)
      display = true;
    }
    ascii = ascii.replace(/([0-9]+),([0-9]+)/g, "$1.$2");
    let tex = parser.parse(ascii);
    tex = tex.replace(/([0-9]+)\.([0-9]+)/g, "$1{,}$2");
    tex = tex.replace(/\\color/g, "\\textcolor");
    if (display)
      tex = `\\displaystyle ${tex}`;
    const html = katex.renderToString(tex, { output: "html", throwOnError: false, trust: true, displayMode: false });
    buffer += text;
    // buffer += math;
    buffer += `<span style='display: none'>${tex}</span>${html}`;
  }
  segments = buffer.split('´');
  if (segments.length % 2 === 1)
    segments.push('');

  buffer = '';
  for (let i=0; i < segments.length; i+=2) {
    const text = segments[i];
    const tex = segments[i+1];
    const math = katex.renderToString(tex, { output: "html", throwOnError: false, trust: true });
    buffer += text;
    // buffer += math;
    buffer += `<span style='display: none'>${tex}</span>${math}`;
  }

  return buffer;
}
