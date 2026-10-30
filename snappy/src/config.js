// Loads the snappy configuration from an external config.json (neither in git nor in the docker image).
//
// Lookup order:
//   1. environment variable KMAP_CONFIG
//   2. /config/config.json                (docker volume)
//   3. <repo>/config/config.json          (local development)
//
// Snappy uses the section "snappy". If it has no own mongo settings, those of section "server" are used.
const fs = require('fs');
const path = require('path');

const candidates = [
    process.env.KMAP_CONFIG,
    '/config/config.json',
    path.join(__dirname, '../../config/config.json'),
].filter(Boolean);

const file = candidates.find(f => fs.existsSync(f));
if (!file)
    throw new Error("No configuration found. Looked for " + candidates.join(", ") + ". Set KMAP_CONFIG or mount /config/config.json");

console.log("Loading configuration from " + file);
const json = JSON.parse(fs.readFileSync(file, 'utf8'));
const snappy = json.snappy || {};
const server = json.server || {};

const config = {
    ...snappy,
    host: snappy.host || "0.0.0.0",
    port: snappy.port || 8090,
    path: snappy.path || "/opt/snappy/snaps/",
    mongo: {
        uri: (snappy.mongo && snappy.mongo.uri) || (server.mongo && server.mongo.uri),
        db: (snappy.mongo && snappy.mongo.db) || (server.mongo && server.mongo.db) || "kmap",
    },
    instance: snappy.instance || "root",
};

if (!config.path.endsWith("/"))
    config.path += "/";

module.exports = config;
