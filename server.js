const express = require('express');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'ratings.db');

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

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
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

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/ratings', (_req, res) => {
  const rows = db
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

  res.json({ cocktails: rows, raters: RATERS });
});

app.put('/api/ratings/:id', (req, res) => {
  const cocktailId = Number(req.params.id);
  const { rater, score } = req.body;

  if (!RATERS.includes(rater)) {
    return res.status(400).json({ error: 'Invalid rater' });
  }

  const cocktail = db
    .prepare('SELECT id FROM cocktails WHERE id = ?')
    .get(cocktailId);
  if (!cocktail) {
    return res.status(404).json({ error: 'Cocktail not found' });
  }

  if (score !== null && score !== undefined) {
    const numeric = Number(score);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10) {
      return res.status(400).json({ error: 'Score must be between 0 and 10' });
    }
  }

  if (score === null || score === undefined || score === '') {
    db.prepare('DELETE FROM ratings WHERE cocktail_id = ? AND rater = ?').run(
      cocktailId,
      rater
    );
  } else {
    db.prepare(
      `
      INSERT INTO ratings (cocktail_id, rater, score, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(cocktail_id, rater) DO UPDATE SET
        score = excluded.score,
        updated_at = excluded.updated_at
    `
    ).run(cocktailId, rater, Number(score));
  }

  res.json({ ok: true });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cocktail ratings server running on http://0.0.0.0:${PORT}`);
});
