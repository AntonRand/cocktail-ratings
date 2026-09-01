const COCKTAILS = [
  {
    name: 'Mojito',
    description: 'White rum, lime, mint, sugar syrup & soda water',
    emoji: '🌿',
    color: '#34d399',
    accent: '#059669',
  },
  {
    name: 'Gin Gin Mule',
    description: 'Gin, fresh lime juice, ginger beer & mint',
    emoji: '🫚',
    color: '#38bdf8',
    accent: '#0284c7',
  },
  {
    name: 'Old Fashioned',
    description: 'Whisky, sugar syrup & Angostura bitters',
    emoji: '🥃',
    color: '#f97316',
    accent: '#c2410c',
  },
  {
    name: 'Aperol Spritz',
    description: 'Aperol, sparkling wine & soda water',
    emoji: '🍊',
    color: '#fb923c',
    accent: '#ea580c',
  },
  {
    name: 'Negroni',
    description: 'Gin, vermouth & Campari',
    emoji: '🍒',
    color: '#f43f5e',
    accent: '#be123c',
  },
  {
    name: 'Hugo',
    description: 'Elderflower syrup, sparkling wine, soda water & mint',
    emoji: '🌸',
    color: '#a78bfa',
    accent: '#7c3aed',
  },
  {
    name: 'Strawberry Margarita',
    description: 'Tequila, triple sec, lemon juice & strawberry purée',
    emoji: '🍓',
    color: '#fb7185',
    accent: '#e11d48',
  },
  {
    name: 'Pina Colada',
    description: 'White rum, coconut purée & pineapple juice',
    emoji: '🥥',
    color: '#fbbf24',
    accent: '#d97706',
  },
  {
    name: 'Mandarin Collins',
    description: 'Vodka, mandarin syrup & soda water',
    emoji: '🍊',
    color: '#fdba74',
    accent: '#f97316',
  },
  {
    name: 'The Strawberry Statement',
    description: 'Vodka, crème de cacao, fresh lime juice & strawberry purée',
    emoji: '🍫',
    color: '#f472b6',
    accent: '#db2777',
  },
  {
    name: 'Dark & Stormy',
    description: 'Dark rum, ginger beer, fresh lime juice & Angostura bitters',
    emoji: '⛈️',
    color: '#64748b',
    accent: '#334155',
  },
  {
    name: 'Garden of Eden',
    description: 'Gin, fresh lime juice & blueberry purée',
    emoji: '🫐',
    color: '#818cf8',
    accent: '#4f46e5',
  },
];

const COCKTAIL_BY_NAME = Object.fromEntries(COCKTAILS.map((c) => [c.name, c]));

module.exports = { COCKTAILS, COCKTAIL_BY_NAME };
