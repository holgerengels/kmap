#!/usr/bin/env node
/**
 * Replicate all databases from production CouchDB (via SSH tunnel) to local CouchDB.
 *
 * Prerequisites: SSH tunnel must be running (./tunnels-kmap.sh)
 *
 * Usage: node replicate-from-prod.mjs <prod-user> <prod-password>
 */

const [,, prodUser, prodPass] = process.argv;
if (!prodUser || !prodPass) {
  console.log(`Usage: node ${process.argv[1]} <prod-user> <prod-password>`);
  process.exit(1);
}

const SOURCE = `http://localhost:5985`;
const TARGET = `http://localhost:5984`;
const SOURCE_AUTH = 'Basic ' + Buffer.from(`${prodUser}:${prodPass}`).toString('base64');
const TARGET_AUTH = 'Basic ' + Buffer.from('admin:secret').toString('base64');

async function req(url, method = 'GET', body = null) {
  const auth = url.includes(':5985') ? SOURCE_AUTH : TARGET_AUTH;
  const opts = { method, headers: { 'Authorization': auth } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const resp = await fetch(url, opts);
  return resp.json();
}

async function main() {
  console.log('Source: localhost:5985 (via SSH tunnel)');
  console.log('Target: localhost:5984 (local Docker)\n');

  try { await req(`${SOURCE}/`); } catch {
    console.log('ERROR: Cannot reach production CouchDB on localhost:5985');
    console.log('       Start the SSH tunnel first: ./tunnels-kmap.sh');
    process.exit(1);
  }
  try { await req(`${TARGET}/`); } catch {
    console.log('ERROR: Cannot reach local CouchDB on localhost:5984');
    console.log('       Start it with: docker compose up -d');
    process.exit(1);
  }

  const allDbs = (await req(`${SOURCE}/_all_dbs`)).filter(db => !db.startsWith('_'));
  console.log('Databases to replicate:');
  allDbs.forEach(db => console.log(`  ${db}`));
  console.log();

  for (const db of allDbs) {
    process.stdout.write(`Replicating ${db} ... `);

    // Drop and recreate
    await req(`${TARGET}/${db}`, 'DELETE');
    await req(`${TARGET}/${db}`, 'PUT');

    // Fetch all docs with inline attachments
    const result = await req(`${SOURCE}/${db}/_all_docs?include_docs=true&attachments=true`);
    const rows = result.rows || [];

    if (rows.length === 0) {
      console.log('empty (0 docs)');
      continue;
    }

    const docs = rows.map(r => r.doc);

    // Bulk insert with new_edits=false preserves revisions
    const resp = await req(`${TARGET}/${db}/_bulk_docs`, 'POST', { docs, new_edits: false });

    if (Array.isArray(resp)) {
      const errors = resp.filter(r => r.error);
      if (errors.length) {
        console.log(`${docs.length} docs, ${errors.length} errors`);
      } else {
        console.log(`ok (${docs.length} docs)`);
      }
    } else {
      console.log(`ok (${docs.length} docs)`);
    }
  }

  // Create auth DB
  process.stdout.write('Creating root-auth DB ... ');
  const resp = await req(`${TARGET}/root-auth`, 'PUT');
  console.log(resp.ok ? 'ok' : (resp.error || '?'));

  console.log('\nDone!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
