var config = require('./config.json');

const puppeteer = require('puppeteer');
const http = require("http");
const fs = require("fs").promises;

const host = config.host;
const port = config.port;

let server;
let browser;

(async () => {
    browser = await puppeteer.launch();

    const requestListener = async function (req, res) {
        try {
            let path = req.url;
            let fileName = decodeURIComponent(path.split("/").pop()) + ".png";
            console.log("snap " + path);
            path = "https://kmap.eu/app/browser" + path;
            const page = await browser.newPage();
            await page.setViewport({width: 400, height: 688,})
            await page.goto(path);
            await page.screenshot({path: config.path + fileName, clip: {x: 0, y: 48, width: 400, height: 640}});

            const content = await fs.readFile(config.path + fileName);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
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
        console.log(`Snappy is running on http://${host}:${port}`);
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
