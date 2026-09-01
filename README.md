# Cocktail Ratings

A shared rating board for Anton and Verity to score cocktails out of 10.

## Cocktails

- Mojito
- Gin Gin Mule
- Old Fashioned
- Aperol Spritz
- Negroni
- Hugo
- Strawberry Margarita
- Pina Colada
- Mandarin Collins
- The Strawberry Statement
- Dark & Stormy
- Garden of Eden

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

Ratings are stored in SQLite locally (`data/ratings.db`) or Postgres on Render (`DATABASE_URL`).

## Deploy to Render

1. Add secrets to your Cursor environment:
   - `RENDER_API_KEY` — from [Render API keys](https://dashboard.render.com/u/settings#api-keys)
   - `GITHUB_TOKEN` — GitHub token with `repo` scope

2. Run the deploy script:

```bash
npm install
chmod +x scripts/deploy-render.sh
./scripts/deploy-render.sh
```

The site will be available at **https://cocktail-ratings.onrender.com** once the deploy completes.

Alternatively, connect the GitHub repo manually in the [Render Dashboard](https://dashboard.render.com) using the `render.yaml` Blueprint.
