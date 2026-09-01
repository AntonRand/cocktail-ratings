const COCKTAILS = [
  'Mojito',
  'Gin Gin Mule',
  'Old Fashioned',
  'Aperol Spritz',
  'Negroni',
  'Hugo',
  'Strawberry Margarita',
  'Pina Colada',
  'Mandarin Collins',
  'The Strawberry Statement',
  'Dark & Stormy',
  'Garden of Eden',
];

const RATERS = ['Anton', 'Verity'];

function createSqliteStore() {
  const fs = require('fs');
  const path = require('path');
  const Database = require('better-sqlite3');

  const dbPath = path.join(__dirname, 'data', 'ratings.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS cocktails (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ratings (
      cocktail_id INTEGER NOT NULL,
      rater TEXT NOT NULL,
      score REAL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (cocktail_id, rater),
      FOREIGN KEY (cocktail_id) REFERENCES cocktails(id)
    );
  `);

  const insertCocktail = db.prepare(
    'INSERT OR IGNORE INTO cocktails (name, sort_order) VALUES (?, ?)'
  );
  COCKTAILS.forEach((name, index) => insertCocktail.run(name, index));

  return {
    async getRatings() {
      return db
        .prepare(
          `
          SELECT c.id, c.name,
            MAX(CASE WHEN r.rater = 'Anton' THEN r.score END) AS anton,
            MAX(CASE WHEN r.rater = 'Verity' THEN r.score END) AS verity
          FROM cocktails c
          LEFT JOIN ratings r ON r.cocktail_id = c.id
          GROUP BY c.id, c.name
          ORDER BY c.sort_order
        `
        )
        .all();
    },

    async getCocktail(id) {
      return db.prepare('SELECT id FROM cocktails WHERE id = ?').get(id);
    },

    async saveRating(cocktailId, rater, score) {
      if (score === null || score === undefined || score === '') {
        db.prepare('DELETE FROM ratings WHERE cocktail_id = ? AND rater = ?').run(
          cocktailId,
          rater
        );
        return;
      }

      db.prepare(
        `
        INSERT INTO ratings (cocktail_id, rater, score, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(cocktail_id, rater) DO UPDATE SET
          score = excluded.score,
          updated_at = excluded.updated_at
      `
      ).run(cocktailId, rater, Number(score));
    },
  };
}

function createPostgresStore(connectionString) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cocktails (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ratings (
        cocktail_id INTEGER NOT NULL REFERENCES cocktails(id),
        rater TEXT NOT NULL,
        score REAL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (cocktail_id, rater)
      );
    `);

    for (const [index, name] of COCKTAILS.entries()) {
      await pool.query(
        'INSERT INTO cocktails (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [name, index]
      );
    }
  }

  const store = {
    async getRatings() {
      const { rows } = await pool.query(
        `
        SELECT c.id, c.name,
          MAX(CASE WHEN r.rater = 'Anton' THEN r.score END) AS anton,
          MAX(CASE WHEN r.rater = 'Verity' THEN r.score END) AS verity
        FROM cocktails c
        LEFT JOIN ratings r ON r.cocktail_id = c.id
        GROUP BY c.id, c.name
        ORDER BY c.sort_order
      `
      );
      return rows;
    },

    async getCocktail(id) {
      const { rows } = await pool.query('SELECT id FROM cocktails WHERE id = $1', [
        id,
      ]);
      return rows[0];
    },

    async saveRating(cocktailId, rater, score) {
      if (score === null || score === undefined || score === '') {
        await pool.query(
          'DELETE FROM ratings WHERE cocktail_id = $1 AND rater = $2',
          [cocktailId, rater]
        );
        return;
      }

      await pool.query(
        `
        INSERT INTO ratings (cocktail_id, rater, score, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (cocktail_id, rater) DO UPDATE SET
          score = EXCLUDED.score,
          updated_at = NOW()
      `,
        [cocktailId, rater, Number(score)]
      );
    },
  };

  return { store, init };
}

async function createStore() {
  if (process.env.DATABASE_URL) {
    const { store, init } = createPostgresStore(process.env.DATABASE_URL);
    await init();
    return store;
  }

  return createSqliteStore();
}

module.exports = { createStore, COCKTAILS, RATERS };
