import katex from 'katex/dist/katex';
import AsciiMathParser from 'asciimath2tex';

const parser = new AsciiMathParser();

// ″
export function math(code, setter) {
  const segments = code.split('`');
  if (segments.length % 2 === 1)
    segments.push('');

  let buffer = '';
  for (let i=0; i < segments.length; i+=2) {
    const text = segments[i];
    const ascii = segments[i+1];
    let tex = parser.parse(ascii);
    tex = tex.replace(/\\color/g, "\\textcolor");
    const math = katex.renderToString(tex, { output: "html", throwOnError: false, trust: true });
    buffer += text;
    //buffer += math;
    buffer += "<span style='display: none'>" + tex + "</span>" + math;
  }
  setter(buffer);
}
