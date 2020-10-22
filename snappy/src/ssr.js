var config = require('./config.json');

const puppeteer = require('puppeteer');
const http = require("http");

const host = config.ssr.host;
const port = config.ssr.port;

let server;
let browser;

(async () => {
    browser = await puppeteer.launch();

    const requestListener = async function (req, res) {
        try {
            let path = req.url;
            let fileName = decodeURIComponent(path.split("/").pop()) + ".png";
            console.log("ssr " + path);
            path = "https://kmap.eu/app/browser" + path;
            const page = await browser.newPage();
            await page.setViewport({width: 400, height: 688,})
            await page.goto(path, {waitUntil: 'networkidle0'});
            await page.waitForTimeout(1000);

            const content = await page.content();
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(content);
        }
        catch (err) {
            res.writeHead(500);
            res.end(err);
        }
    };

    server = http.createServer(requestListener);
    server.listen(port, host, () => {
        console.log(`SSR is running on http://${host}:${port}`);
    });

})();

const cleanupServer = async function(type) {
    console.log('Snappy is going down ..');
    await server.close();
    await browser.close();
    console.log("Snappy has stopped ..");
}

const signals = ["SIGINT"];
signals.forEach((signal) => process.on(signal, cleanupServer.bind(this, signal)));
