#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

node <<'NODE'
const Database = require('better-sqlite3');
const path = require('path');
const { createStore } = require('./db');

const sqlitePath = path.join(__dirname, 'data', 'ratings.db');
const sqlite = new Database(sqlitePath, { readonly: true });

const ratings = sqlite
  .prepare(
    `
    SELECT c.name, r.rater, r.score
    FROM ratings r
    JOIN cocktails c ON c.id = r.cocktail_id
    ORDER BY c.sort_order
  `
  )
  .all();

(async () => {
  const store = await createStore();
  const cocktails = await store.getRatings();
  const byName = Object.fromEntries(cocktails.map((c) => [c.name, c.id]));

  for (const row of ratings) {
    const id = byName[row.name];
    if (!id) continue;
    await store.saveRating(id, row.rater, row.score);
    console.log(`Migrated ${row.name}: ${row.rater} = ${row.score}`);
  }

  console.log(`Done. Migrated ${ratings.length} ratings.`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
NODE
