const listEl = document.getElementById('cocktail-list');
const statusEl = document.getElementById('status');

let saveTimeout = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function fetchRatings() {
  const res = await fetch('/api/ratings');
  if (!res.ok) throw new Error('Failed to load ratings');
  return res.json();
}

async function saveRating(cocktailId, rater, score, input) {
  input.classList.add('saving');
  setStatus('Saving…');

  try {
    const res = await fetch(`/api/ratings/${cocktailId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rater, score }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save');
    }

    input.classList.remove('saving');
    input.classList.add('saved');
    setTimeout(() => input.classList.remove('saved'), 400);
    setStatus('All changes saved ✨');
  } catch (err) {
    input.classList.remove('saving');
    setStatus(err.message, true);
  }
}

function createRatingInput(cocktailId, rater, value, cssClass) {
  const cell = document.createElement('div');
  cell.className = 'rating-cell';

  const label = document.createElement('span');
  label.className = `rating-label ${cssClass}`;
  label.textContent = rater;

  const wrap = document.createElement('div');
  wrap.className = 'rating-input-wrap';

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = '10';
  input.step = '0.5';
  input.placeholder = '—';
  input.className = `rating-input ${cssClass}`;
  input.setAttribute('aria-label', `${rater} rating`);
  if (value != null) input.value = value;

  const suffix = document.createElement('span');
  suffix.className = 'rating-suffix';
  suffix.textContent = '/10';

  input.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    const raw = input.value.trim();

    saveTimeout = setTimeout(() => {
      let score = raw === '' ? null : Number(raw);
      if (score !== null && (score < 0 || score > 10)) {
        setStatus('Score must be between 0 and 10', true);
        return;
      }
      saveRating(cocktailId, rater, score, input);
    }, 400);
  });

  wrap.appendChild(input);
  wrap.appendChild(suffix);
  cell.appendChild(label);
  cell.appendChild(wrap);
  return cell;
}

function renderCocktails(cocktails) {
  listEl.innerHTML = '';

  cocktails.forEach((cocktail) => {
    const card = document.createElement('article');
    card.className = 'cocktail-card';

    const icon = document.createElement('div');
    icon.className = 'cocktail-icon';
    icon.style.background = `linear-gradient(135deg, ${cocktail.color}, ${cocktail.accent})`;
    icon.textContent = cocktail.emoji || '🍹';
    icon.setAttribute('aria-hidden', 'true');

    const info = document.createElement('div');
    info.className = 'cocktail-info';

    const name = document.createElement('h2');
    name.className = 'cocktail-name';
    name.textContent = cocktail.name;

    const description = document.createElement('p');
    description.className = 'cocktail-description';
    description.textContent = cocktail.description || '';

    info.appendChild(name);
    if (cocktail.description) info.appendChild(description);

    const ratingsGroup = document.createElement('div');
    ratingsGroup.className = 'ratings-group';
    ratingsGroup.appendChild(
      createRatingInput(cocktail.id, 'Anton', cocktail.anton, 'anton')
    );
    ratingsGroup.appendChild(
      createRatingInput(cocktail.id, 'Verity', cocktail.verity, 'verity')
    );

    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(ratingsGroup);
    listEl.appendChild(card);
  });
}

async function init() {
  try {
    const data = await fetchRatings();
    renderCocktails(data.cocktails);
    setStatus('');
  } catch (err) {
    listEl.innerHTML =
      '<p class="loading">Could not load cocktails. Please refresh.</p>';
    setStatus(err.message, true);
  }
}

init();
