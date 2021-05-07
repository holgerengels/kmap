var config = require('./config.json');

const puppeteer = require('puppeteer');
const http = require("http");
const fs = require("fs").promises;
const schedule = require('node-schedule');
const NodeCouchDb = require('node-couchdb');

const host = config.host;
const port = config.port;

const couchDB = config.couch_db;

let server;
let browser;
const couch = new NodeCouchDb({ host: config.couch_host, auth: { user: config.couch_user, pass: config.couch_password }});

const job = schedule.scheduleJob('22 12,21 * * *', async function() {
    console.log("Snappy background job");

    const arr = await latest();
    let count = 0;
    for (const entry of arr) {
        const path = entry[0];
        const parts = path.split("/").map(p => decodeURIComponent(p));

        const lastModified = modified(parts);
        if (lastModified !== entry[1]) {
            const directory = config.path + path;
            const file = directory + "/" + lastModified + ".png"
            console.log("Snappy precache " + path);
            await generate(directory, path, file);

            count++;
            if (count >= 10)
                break;
        }
    }
});

(async () => {
    browser = await puppeteer.launch({args: ['--disable-dev-shm-usage', '--no-sandbox'] });

    const requestListener = async function (req, res) {
        try {
            let path = req.url;
            path = path.substr("snappy/".length + 1);
            console.log("Snappy snap " + path);

            const parts = path.split("/").map(p => decodeURIComponent(p));
            const directory = config.path + path;

            const lastModified = modified(parts);
            const file = directory + "/" + lastModified + ".png"

            const cached = await exists(file);
            if (!cached) {
                console.log("Snappy regenerate " + path);
                await generate(directory, path, file);
            }
            else {
                console.log("Snappy load from cache " + path);
            }
            let fileName = parts.pop();
            await sendFile(res, file, fileName);
        }
        catch (err) {
            console.log(err);
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

function latest() {
    return couch.get(couchDB, "_design/net/_view/byModified", {descending: "true", include_docs: "true"}).then(({ data, headers, status}) => {
        let map = new Map();
        data.rows.forEach(row => map.set(encodeURIComponent(row.doc.subject) + "/" + encodeURIComponent(row.doc.chapter) + "/" + encodeURIComponent(row.doc.topic), row.doc.modified));
        return [...map].sort((a, b) => b[1] - a[1]);
    }, err => {
        console.log(err);
        return [];
    });
}

function modified(parts) {
    return couch.get(couchDB, "_design/net/_view/byTopic", {keys: [parts], include_docs: "true"}).then(({ data, headers, status}) => {
        return data.rows[0].doc.modified;
    }, err => {
        console.log(err);
        return -1;
    });
}

async function exists(path) {
    try {
        await fs.access(path);
        return true
    } catch {
        return false
    }
}

async function generate(directory, path, file) {
    await fs.mkdir(directory, {recursive: true});
    const url = "https://kmap.eu/app/browser/" + path;
    const page = await browser.newPage();
    await page.setViewport({width: 400, height: 688,})
    await page.goto(url, {waitUntil: 'networkidle0'});
    await page.waitForTimeout(1000);
    await page.screenshot({path: file, clip: {x: 0, y: 48, width: 400, height: 640}});
}

async function sendFile(res, location, fileName) {
    const content = await fs.readFile(location);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "attachment; filename=" + encodeURIComponent(fileName));
    res.writeHead(200);
    res.end(content);
}

const signals = ["SIGINT"];
signals.forEach((signal) => process.on(signal, cleanupServer.bind(this, signal)));
