const {ComputeEngine} = require("@cortex-js/compute-engine");
const AsciiMathParser = require('asciimath2tex');
const parser = new AsciiMathParser();

const ce = new ComputeEngine();
const e1 = ce.parse(parser.parse("ln(1/2)")).simplify();
const e2 = ce.parse(parser.parse("-ln(2)")).simplify();

console.log(e1.latex);
console.log(e2.latex);
console.log(e1.isEqual(e2));