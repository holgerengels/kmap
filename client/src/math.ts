import katex from 'katex/dist/katex';
import AsciiMathParser from 'asciimath2tex';

const parser = new AsciiMathParser();

// ″
export function math(code: string, setter: (string) => void) {
  var segments = code.split('`');
  if (segments.length % 2 === 1)
    segments.push('');

  let buffer = '';
  for (let i=0; i < segments.length; i+=2) {
    const text = segments[i];
    var ascii = segments[i+1];
    var inline = false
    if (ascii.startsWith("\\inline\\")) {
      ascii = ascii.substr("\\inline\\".length)
      inline = true;
    }
    let tex = parser.parse(ascii);
    tex = tex.replace(/\\color/g, "\\textcolor");
    if (!inline)
      tex = "\\displaystyle " + tex;
    const math = katex.renderToString(tex, { output: "html", throwOnError: false, trust: true, displayMode: false });
    buffer += text;
    //buffer += math;
    buffer += "<span style='display: none'>" + tex + "</span>" + math;
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
    //buffer += math;
    buffer += "<span style='display: none'>" + tex + "</span>" + math;
  }

  setter(buffer);
}
