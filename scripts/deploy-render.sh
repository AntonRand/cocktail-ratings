#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo "Error: RENDER_API_KEY is not set."
  echo "Create one at https://dashboard.render.com/u/settings#api-keys"
  exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Error: GITHUB_TOKEN is not set."
  echo "Create a token with repo scope at https://github.com/settings/tokens"
  exit 1
fi

REPO_NAME="${GITHUB_REPO_NAME:-cocktail-ratings}"
GITHUB_USER="${GITHUB_USER:-$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user | python3 -c 'import sys,json; print(json.load(sys.stdin)["login"])')}"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}"

echo "==> Ensuring GitHub repo exists: $REPO_URL"
if ! curl -sf -H "Authorization: Bearer $GITHUB_TOKEN" "https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}" >/dev/null; then
  curl -sf -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"${REPO_NAME}\",\"private\":false,\"description\":\"Anton & Verity cocktail ratings\"}" >/dev/null
  echo "Created repository."
else
  echo "Repository already exists."
fi

echo "==> Pushing code to GitHub"
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
git push -u origin HEAD:main --force

echo "==> Creating Render Blueprint"
OWNER_ID=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/owners \
  | python3 -c 'import sys,json; owners=json.load(sys.stdin); print(owners[0]["owner"]["id"] if owners else "")')

if [[ -z "$OWNER_ID" ]]; then
  echo "Error: Could not determine Render owner ID."
  exit 1
fi

BLUEPRINT_PAYLOAD=$(python3 - <<PY
import json, pathlib
repo = "${REPO_URL}.git"
print(json.dumps({
  "name": "cocktail-ratings",
  "ownerId": "${OWNER_ID}",
  "repo": repo,
  "branch": "main",
}))
PY
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  https://api.render.com/v1/blueprints \
  -d "$BLUEPRINT_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" != "201" && "$HTTP_CODE" != "200" ]]; then
  echo "Blueprint create response ($HTTP_CODE):"
  echo "$BODY"
  echo "If a blueprint already exists, open https://dashboard.render.com and sync it."
else
  echo "Blueprint created."
  echo "$BODY"
fi

echo ""
echo "Done! Open https://dashboard.render.com to monitor the deploy."
echo "Your site will be at: https://cocktail-ratings.onrender.com"
