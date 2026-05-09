export const CHARACTERS = [
  { id: 'moek', name: 'Moek', image: 'assets/familie/Moek.png', tier: 'jackpot' },
  { id: 'kawita', name: 'Kawita', image: 'assets/familie/Kawita.png', tier: 'high' },
  { id: 'shreya', name: 'Shreya', image: 'assets/familie/Shreya.png', tier: 'high' },
  { id: 'geetha', name: 'Geetha', image: 'assets/familie/Geetha.png', tier: 'high' },
  { id: 'sindy', name: 'Sindy', image: 'assets/familie/Sindy.png', tier: 'high' },
  { id: 'roy', name: 'Roy', image: 'assets/familie/Roy.png', tier: 'mid' },
  { id: 'richella', name: 'Richella', image: 'assets/familie/Richella.png', tier: 'mid' },
  { id: 'bella', name: 'Bella', image: 'assets/familie/Bella.png', tier: 'mid' },
  { id: 'naleya', name: 'Naleya', image: 'assets/familie/Naleya.png', tier: 'mid' },
  { id: 'devan', name: 'Devan', image: 'assets/familie/Devan.png', tier: 'mid' },
  { id: 'jennifer', name: 'Jennifer', image: 'assets/familie/Jennifer.png', tier: 'mid' },
  { id: 'loek', name: 'loek', image: 'assets/familie/loek.png', tier: 'mid' },
  { id: 'amaya', name: 'Amaya', image: 'assets/familie/Amaya.png', tier: 'low' },
  { id: 'anisa', name: 'Anisa', image: 'assets/familie/Anisa.png', tier: 'low' },
  { id: 'armando', name: 'Armando', image: 'assets/familie/Armando.png', tier: 'low' },
  { id: 'berry', name: 'Berry', image: 'assets/familie/Berry.png', tier: 'low' },
  { id: 'chella', name: 'Chella', image: 'assets/familie/Chella.png', tier: 'low' },
  { id: 'chloe', name: 'Chloe', image: 'assets/familie/Chlo\u251c\u00ae.png', tier: 'low' },
  { id: 'daan', name: 'Daan', image: 'assets/familie/Daan.png', tier: 'low' },
  { id: 'ervina', name: 'Ervina', image: 'assets/familie/Ervina.png', tier: 'low' },
  { id: 'gaby', name: 'Gaby', image: 'assets/familie/Gaby.png', tier: 'low' },
  { id: 'shira', name: 'Shira', image: 'assets/familie/Shira.png', tier: 'low' },
  { id: 'stich', name: 'Stich', image: 'assets/familie/Stich.png', tier: 'low' },
];

export function getCharacter(idOrName) {
  const key = String(idOrName).toLowerCase();
  return CHARACTERS.find((character) => character.id === key || character.name.toLowerCase() === key);
}

export function getCharactersByTier(tier) {
  return CHARACTERS.filter((character) => character.tier === tier);
}
