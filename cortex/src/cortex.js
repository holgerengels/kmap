var config = require('./config.json');

const http = require("http");
var url = require("node:url");
const fs = require("fs").promises;
const {ComputeEngine} = require("@cortex-js/compute-engine");
const AsciiMathParser = require('asciimath2tex');

const ce = new ComputeEngine();
const parser = new AsciiMathParser();

const host = config.host;
const port = config.port;

let server;
let browser;

(async () => {
    const requestListener = async function (req, res) {
        try {
            var query = url.parse(req.url,true).query;
            const expression1 = query.expression1;
            const expression2 = query.expression2;
            console.log("Cortex compare " + expression1 + " ≟ " + expression2);
            const e1 = ce.parse(parser.parse(expression1)).simplify();
            const e2 = ce.parse(parser.parse(expression2)).simplify();
            const result = e1.isEqual(e2);

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Method", "GET");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.write(JSON.stringify({
                isEquivalent: result
            }));
            res.end();
        }
        catch (err) {
            console.log(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end(err.stack);
        }
    };

    server = http.createServer(requestListener);
    server.listen(port, host, () => {
        console.log(`Cortex is running on http://${host}:${port}`);
    });

})();

const cleanupServer = async function(type) {
    console.log('Cortex is going down ..');
    await server.close();
    console.log("Cortex has stopped ..");
}

const signals = ["SIGINT"];
signals.forEach((signal) => process.on(signal, cleanupServer.bind(this, signal)));
