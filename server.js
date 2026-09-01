const express = require('express');
const path = require('path');
const { createStore, RATERS } = require('./db');

const PORT = process.env.PORT || 3000;

async function main() {
  const store = await createStore();

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/ratings', async (_req, res) => {
    const cocktails = await store.getRatings();
    res.json({ cocktails, raters: RATERS });
  });

  app.put('/api/ratings/:id', async (req, res) => {
    const cocktailId = Number(req.params.id);
    const { rater, score } = req.body;

    if (!RATERS.includes(rater)) {
      return res.status(400).json({ error: 'Invalid rater' });
    }

    const cocktail = await store.getCocktail(cocktailId);
    if (!cocktail) {
      return res.status(404).json({ error: 'Cocktail not found' });
    }

    if (score !== null && score !== undefined) {
      const numeric = Number(score);
      if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10) {
        return res.status(400).json({ error: 'Score must be between 0 and 10' });
      }
    }

    await store.saveRating(cocktailId, rater, score);
    res.json({ ok: true });
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cocktail ratings server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
