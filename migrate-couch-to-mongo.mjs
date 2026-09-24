#!/usr/bin/env node
/**
 * Migrate all databases from CouchDB to MongoDB.
 *
 * Usage:
 *   NODE_PATH=/home/holger/jdevel/tix/backend/node_modules node migrate-couch-to-mongo.mjs [options]
 *
 * Options:
 *   --couch-url <url>      CouchDB URL (default: http://admin:secret@localhost:5984)
 *   --mongo-uri <uri>      MongoDB URI (default: mongodb://admin:password@localhost:27017)
 *   --mongo-db <dbname>    MongoDB database name (default: kmap)
 *   --drop                 Drop target collections before migration (default: true)
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// Helper to resolve mongodb package
let MongoClient, Binary;
try {
  const mod = await import('mongodb');
  MongoClient = mod.MongoClient;
  Binary = mod.Binary;
} catch (e) {
  // Fallback to sibling project node_modules if not in kmap root
  const require = createRequire('/home/holger/jdevel/tix/backend/');
  const mod = require('mongodb');
  MongoClient = mod.MongoClient;
  Binary = mod.Binary;
}

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const rawCouchUrl = getArg('--couch-url', 'http://admin:secret@localhost:5984');
const parsedCouchUrl = new URL(rawCouchUrl);
let couchAuthHeader = null;
if (parsedCouchUrl.username || parsedCouchUrl.password) {
  const credentials = `${decodeURIComponent(parsedCouchUrl.username)}:${decodeURIComponent(parsedCouchUrl.password)}`;
  couchAuthHeader = 'Basic ' + Buffer.from(credentials).toString('base64');
  parsedCouchUrl.username = '';
  parsedCouchUrl.password = '';
}
const COUCH_URL = parsedCouchUrl.toString().replace(/\/$/, '');
const MONGO_URI = getArg('--mongo-uri', 'mongodb://admin:password@localhost:27017');
const MONGO_DB = getArg('--mongo-db', 'kmap');
const SHOULD_DROP = !args.includes('--no-drop');

// Mapping CouchDB database names to target collections and instances
function parseDbName(dbName) {
  if (dbName === 'root-auth') {
    return { instance: 'root', collection: 'users' };
  }
  const lastDash = dbName.lastIndexOf('-');
  if (lastDash === -1) {
    return null;
  }
  const instance = dbName.substring(0, lastDash);
  const type = dbName.substring(lastDash + 1);

  const collectionMap = {
    'map': 'cards',
    'test': 'tests',
    'course': 'courses',
    'feedback': 'feedback',
    'state': 'states',
  };

  const collection = collectionMap[type];
  if (!collection) return null;

  return { instance, collection };
}

function getCouchHeaders() {
  const headers = {};
  if (couchAuthHeader) {
    headers['Authorization'] = couchAuthHeader;
  }
  return headers;
}

async function fetchJson(url) {
  const resp = await fetch(url, { headers: getCouchHeaders() });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching ${url}`);
  }
  return resp.json();
}

async function fetchBuffer(url) {
  const resp = await fetch(url, { headers: getCouchHeaders() });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching ${url}`);
  }
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log('=== KMap CouchDB to MongoDB Migration ===');
  console.log(`Source CouchDB : ${COUCH_URL}`);
  console.log(`Target MongoDB : ${MONGO_URI} (db: ${MONGO_DB})\n`);

  // Connect to MongoDB
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db(MONGO_DB);
  console.log('✓ Connected to MongoDB');

  // Verify CouchDB
  try {
    const couchWelcome = await fetchJson(`${COUCH_URL}/`);
    console.log(`✓ Connected to CouchDB (version: ${couchWelcome.version})`);
  } catch (err) {
    console.error(`✗ Cannot reach CouchDB at ${COUCH_URL}:`, err.message);
    process.exit(1);
  }

  // Get list of all CouchDB databases
  const allDbs = (await fetchJson(`${COUCH_URL}/_all_dbs`)).filter(d => !d.startsWith('_'));
  console.log(`Found ${allDbs.length} databases in CouchDB.\n`);

  const collections = ['cards', 'tests', 'courses', 'states', 'feedback', 'users', 'attachments'];

  if (SHOULD_DROP) {
    console.log('Dropping existing target collections in MongoDB...');
    for (const col of collections) {
      try {
        await db.collection(col).drop();
      } catch (e) {
        // Ignore NamespaceNotFound
      }
    }
    console.log('✓ Collections dropped\n');
  }

  const stats = {};
  for (const col of collections) {
    stats[col] = 0;
  }
  let totalAttachmentBytes = 0;

  for (const dbName of allDbs) {
    const parsed = parseDbName(dbName);
    if (!parsed) {
      console.log(`Skipping unknown database: ${dbName}`);
      continue;
    }

    const { instance, collection } = parsed;
    process.stdout.write(`Migrating ${dbName.padEnd(25)} -> ${collection.padEnd(12)} (instance: ${instance}) ... `);

    // Fetch all documents including attachments metadata
    const result = await fetchJson(`${COUCH_URL}/${dbName}/_all_docs?include_docs=true&attachments=false`);
    const rows = result.rows || [];

    const docsToInsert = [];
    const attachmentsToInsert = [];

    for (const row of rows) {
      const doc = row.doc;
      if (!doc || doc._id.startsWith('_design/')) {
        continue;
      }

      // Handle binary attachments if present
      if (doc._attachments) {
        for (const [attName, attInfo] of Object.entries(doc._attachments)) {
          let slug;
          let cardRef;

          if (collection === 'cards' && doc.subject && doc.chapter && doc.topic) {
            slug = `${instance}/cards/${doc.subject}/${doc.chapter}/${doc.topic}/${attName}`;
            cardRef = `${doc.subject}.${doc.chapter}.${doc.topic}`;
          } else if (collection === 'tests' && doc.subject && doc.set && doc.key) {
            slug = `${instance}/tests/${doc.subject}/${doc.set}/${doc.key}/${attName}`;
            cardRef = `${doc.subject}.${doc.set}.${doc.key}`;
          } else if (doc.subject && doc.chapter && doc.topic) {
            slug = `${instance}/${collection}/${doc.subject}/${doc.chapter}/${doc.topic}/${attName}`;
            cardRef = `${doc.subject}.${doc.chapter}.${doc.topic}`;
          } else {
            slug = `${instance}/${collection}/${doc._id}/${attName}`;
            cardRef = doc._id;
          }

          // Fetch attachment binary from CouchDB
          const attUrl = `${COUCH_URL}/${dbName}/${encodeURIComponent(doc._id)}/${encodeURIComponent(attName)}`;
          try {
            const buffer = await fetchBuffer(attUrl);
            totalAttachmentBytes += buffer.length;

            attachmentsToInsert.push({
              _id: slug,
              instance,
              target: collection,
              card: cardRef,
              name: attName,
              contentType: attInfo.content_type || 'application/octet-stream',
              length: attInfo.length || buffer.length,
              digest: attInfo.digest || null,
              data: new Binary(buffer),
              modified: doc.modified || Date.now(),
            });
          } catch (e) {
            console.error(`\n  Warning: could not fetch attachment ${attName} for doc ${doc._id}: ${e.message}`);
          }
        }
      }

      // Clean CouchDB specifics
      delete doc._rev;
      delete doc._attachments;

      // Add instance tag and ensure _id is globally unique across instances
      doc.instance = instance;
      const originalId = doc._id;
      doc.couch_id = originalId;
      doc._id = `${instance}:${originalId}`;

      docsToInsert.push(doc);
    }

    // Insert docs in bulk
    if (docsToInsert.length > 0) {
      await db.collection(collection).insertMany(docsToInsert, { ordered: false });
      stats[collection] += docsToInsert.length;
    }

    // Insert attachments in bulk
    if (attachmentsToInsert.length > 0) {
      await db.collection('attachments').insertMany(attachmentsToInsert, { ordered: false });
      stats['attachments'] += attachmentsToInsert.length;
    }

    console.log(`ok (${docsToInsert.length} docs, ${attachmentsToInsert.length} attachments)`);
  }

  // Create Indexes
  console.log('\nCreating MongoDB indexes...');

  // Cards
  await db.collection('cards').createIndex(
    { instance: 1, subject: 1, chapter: 1, topic: 1 },
    { unique: true, partialFilterExpression: { topic: { $type: 'string' } } }
  );
  await db.collection('cards').createIndex({ instance: 1, subject: 1, chapter: 1 });
  await db.collection('cards').createIndex({ instance: 1, subject: 1, module: 1 });
  await db.collection('cards').createIndex({ instance: 1, subject: 1, modified: -1 });
  await db.collection('cards').createIndex({ chapter: 'text', topic: 'text', summary: 'text', description: 'text' });
  console.log('✓ Cards indexes created');

  // Tests
  await db.collection('tests').createIndex({ instance: 1, subject: 1, chapter: 1, topic: 1, key: 1 });
  await db.collection('tests').createIndex({ instance: 1, subject: 1, set: 1, key: 1 });
  await db.collection('tests').createIndex({ instance: 1, subject: 1, modified: -1 });
  console.log('✓ Tests indexes created');

  // Courses
  await db.collection('courses').createIndex({ instance: 1, user: 1, name: 1 });
  await db.collection('courses').createIndex({ instance: 1, subject: 1, name: 1 });
  console.log('✓ Courses indexes created');

  // States
  await db.collection('states').createIndex({ instance: 1, user: 1 });
  console.log('✓ States indexes created');

  // Feedback
  await db.collection('feedback').createIndex({ instance: 1, timestamp: -1 });
  await db.collection('feedback').createIndex({ instance: 1, type: 1, timestamp: -1 });
  console.log('✓ Feedback indexes created');

  // Users
  await db.collection('users').createIndex({ instance: 1, userid: 1 });
  await db.collection('users').createIndex({ instance: 1, email: 1 });
  console.log('✓ Users indexes created');

  // Attachments (_id is already unique slug, add index on card soft-ref)
  await db.collection('attachments').createIndex({ instance: 1, card: 1 });
  console.log('✓ Attachments indexes created');

  // Summary
  console.log('\n================ Migration Summary ================');
  for (const [col, count] of Object.entries(stats)) {
    console.log(`  ${col.padEnd(15)} : ${count.toString().padStart(6)} documents`);
  }
  const mb = (totalAttachmentBytes / (1024 * 1024)).toFixed(2);
  console.log(`  attachment data : ${mb.padStart(6)} MB`);
  console.log('===================================================\n');

  await mongoClient.close();
  console.log('Migration finished successfully!');
}

main().catch(err => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});
