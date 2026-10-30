var config = require('./config');

const puppeteer = require('puppeteer');
const http = require("http");
const url = require("url");
const fs = require("fs").promises;
const schedule = require('node-schedule');
const { MongoClient } = require('mongodb');

const host = config.host;
const port = config.port;

const mongoUri = process.env.MONGO_URI || config.mongo.uri || "mongodb://admin:password@localhost:27017";
const mongoDbName = process.env.MONGO_DB || config.mongo.db;
const instance = process.env.INSTANCE || config.instance;

let server;
let browser;
const mongoClient = new MongoClient(mongoUri);
let db;

async function getDb() {
    if (!db) {
        await mongoClient.connect();
        db = mongoClient.db(mongoDbName);
    }
    return db;
}

const job = schedule.scheduleJob('22 12,21 * * *', async function() {
    console.log("Snappy background job");

    const arr = await latest();
    let count = 0;
    for (const entry of arr) {
        let path = entry[0];

        const parts = path.split("/").map(p => decodeURIComponent(p));

        const lastModified = await modified(parts);
        if (lastModified !== entry[1]) {
            const directory = config.path + path;
            const file = directory + "/" + lastModified + ".png";
            console.log("Snappy precache " + path);
            await generate(directory, path, file);

            count++;
            if (count >= 10)
                break;
        }
    }
});

function determineWidth(url) {
    const width = url.searchParams.get("width");
    return width ? parseInt(width) : 800;
}

function determineHeight(url) {
    const height = url.searchParams.get("height");
    return height ? parseInt(height) : 450;
}

(async () => {
    browser = await puppeteer.launch({args: ['--disable-dev-shm-usage', '--no-sandbox'] });

    const requestListener = async function (req, res) {
        try {
            let url = new URL(req.url, "https://kmap.eu");
            let path = url.pathname;
            let width = determineWidth(url);
            let height = determineHeight(url);

            if (path.endsWith(".png"))
                path = path.substr(0, path.length - 4);

            path = path.substr("snappy/".length + 1);
            console.log("Snappy snap " + path);

            const parts = path.split("/").map(p => decodeURIComponent(p));
            const directory = config.path + width + "x" + height + "/" + path;

            const lastModified = await modified(parts);
            const file = directory + "/" + lastModified + ".png";

            const cached = await exists(file);
            if (!cached) {
                console.log("Snappy regenerate " + path);
                await generate(directory, path, file, width, height);
            }
            else {
                console.log("Snappy load from cache " + path);
            }
            let fileName = parts.pop();
            await sendFile(res, file, fileName);
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
        console.log(`Snappy is running on http://${host}:${port}`);
    });

})();

const cleanupServer = async function(type) {
    console.log('Snappy is going down ..');
    if (server) await server.close();
    if (browser) await browser.close();
    await mongoClient.close();
    console.log("Snappy has stopped ..");
};

async function latest() {
    try {
        const database = await getDb();
        const cursor = database.collection('cards').find(
            { instance, modified: { $exists: true }, chapter: { $exists: true }, topic: { $exists: true } },
            { projection: { subject: 1, chapter: 1, topic: 1, modified: 1 } }
        ).sort({ modified: -1 });

        const map = new Map();
        for await (const doc of cursor) {
            map.set(encodeURIComponent(doc.subject) + "/" + encodeURIComponent(doc.chapter) + "/" + encodeURIComponent(doc.topic), doc.modified);
        }
        return [...map].sort((a, b) => b[1] - a[1]);
    } catch (err) {
        console.log(err);
        return [];
    }
}

async function modified(parts) {
    try {
        const database = await getDb();
        const doc = await database.collection('cards').findOne(
            { instance, subject: parts[0], chapter: parts[1], topic: parts[2] },
            { projection: { modified: 1 } }
        );
        return doc ? doc.modified : -1;
    } catch (err) {
        console.log(err);
        return -1;
    }
}

async function exists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

const windowSet = (page, name, value) => page.evaluateOnNewDocument(`Object.defineProperty(window, '${name}', { get: function() { return '${value}' } })`);

async function generate(directory, path, file, width, height) {
    await fs.mkdir(directory, {recursive: true});
    const url = "https://kmap.eu/app/browser/" + path;
    const page = await browser.newPage();
    await page.setViewport({width: width + 16, height: height + 48 + 16});
    await windowSet(page, 'compactCards', true);
    await page.goto(url, {waitUntil: 'networkidle0'});
    await page.waitForTimeout(1000);
    await page.screenshot({path: file, clip: {x: 8, y: 48 + 8, width: width, height: height}});
}

async function sendFile(res, location, fileName) {
    const content = await fs.readFile(location);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "attachment; filename=" + encodeURIComponent(fileName) + ".png");
    res.writeHead(200);
    res.end(content);
}

const signals = ["SIGINT"];
signals.forEach((signal) => process.on(signal, cleanupServer.bind(this, signal)));
