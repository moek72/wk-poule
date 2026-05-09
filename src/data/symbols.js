import { CHARACTERS } from './characters.js';

export const TIERS = {
  jackpot: { label: 'JACKPOT', threeOfKind: 200, twoOfKind: null, weight: 1 },
  high: { label: 'HIGH', threeOfKind: 50, twoOfKind: 10, weight: 4 },
  mid: { label: 'MID', threeOfKind: 20, twoOfKind: 5, weight: 7 },
  low: { label: 'LOW', threeOfKind: 8, twoOfKind: null, weight: 10 },
};

export const JOKER = {
  id: 'joker',
  type: 'joker',
  name: 'Criss-Cross',
  tier: 'joker',
  symbol: '?',
  weight: 6,
  mysteryMin: 8,
  mysteryMax: 200,
};

let pool;

export function buildSymbolPool() {
  if (pool) return pool;
  pool = [];
  CHARACTERS.forEach((character) => {
    for (let index = 0; index < TIERS[character.tier].weight; index += 1) {
      pool.push({ type: 'character', ...character });
    }
  });
  for (let index = 0; index < JOKER.weight; index += 1) {
    pool.push({ ...JOKER });
  }
  return pool;
}

export function cloneSymbol(symbol) {
  return { ...symbol };
}

export function randomSymbol() {
  const symbols = buildSymbolPool();
  return cloneSymbol(symbols[Math.floor(Math.random() * symbols.length)]);
}

export function generateMysteryPrize() {
  return JOKER.mysteryMin + Math.floor(Math.random() * (JOKER.mysteryMax - JOKER.mysteryMin + 1));
}

function sameCharacter(symbols) {
  return symbols.every((symbol) => symbol.type === 'character' && symbol.id === symbols[0].id);
}

function countById(symbols) {
  return symbols.reduce((counts, symbol) => {
    if (symbol.type === 'character') counts[symbol.id] = (counts[symbol.id] || 0) + 1;
    return counts;
  }, {});
}

export function evaluateBaseWin(symbols, mysteryAmount = generateMysteryPrize()) {
  if (!symbols || symbols.length !== 3) return null;
  const jokerCount = symbols.filter((symbol) => symbol.type === 'joker').length;

  if (sameCharacter(symbols) && symbols[0].id === 'moek') {
    return {
      kind: 'jackpot',
      title: 'JACKPOT! 3x MOEK!',
      amount: 200,
      symbols,
      forceJackpot: true,
      canGamble: false,
    };
  }

  if (jokerCount > 0) {
    return {
      kind: 'mystery',
      title: 'CRISS-CROSS MYSTERY!',
      amount: mysteryAmount,
      symbols,
      canGamble: true,
    };
  }

  if (sameCharacter(symbols)) {
    const tier = TIERS[symbols[0].tier];
    return {
      kind: 'three',
      title: `3x ${symbols[0].name}`,
      amount: tier.threeOfKind,
      symbol: symbols[0],
      symbols,
      canGamble: true,
    };
  }

  const counts = countById(symbols);
  const pairId = Object.keys(counts).find((id) => counts[id] === 2);
  if (pairId) {
    const symbol = symbols.find((item) => item.id === pairId);
    const tier = TIERS[symbol.tier];
    if (tier.twoOfKind) {
      return {
        kind: 'two',
        title: `2x ${symbol.name}`,
        amount: tier.twoOfKind,
        symbol,
        symbols,
        canGamble: true,
      };
    }
  }

  return null;
}

export function evaluateFeatureWin(symbols, mysteryAmount = generateMysteryPrize()) {
  if (!symbols || symbols.length !== 3) return null;
  if (symbols.some((symbol) => symbol.type === 'joker')) {
    return {
      kind: 'mystery',
      title: 'FEATURE MYSTERY',
      amount: Math.min(200, mysteryAmount),
      symbols,
      canGamble: false,
    };
  }

  const nonWild = symbols.filter((symbol) => symbol.tier !== 'low');
  const wildCount = symbols.length - nonWild.length;
  if (nonWild.length === 0) {
    return {
      kind: 'feature-wild',
      title: 'CRISS-CROSS FEATURE',
      amount: 16,
      symbols,
      canGamble: false,
    };
  }

  const target = nonWild[0];
  const allMatch = nonWild.every((symbol) => symbol.id === target.id);
  if (!allMatch || target.tier === 'jackpot') return null;

  if (target.tier === 'high' && nonWild.length + wildCount >= 3) {
    return {
      kind: 'feature-three',
      title: `FEATURE ${target.name}`,
      amount: 50,
      symbol: target,
      symbols,
      canGamble: false,
    };
  }

  if (target.tier === 'mid' && nonWild.length + wildCount >= 3) {
    return {
      kind: 'feature-three',
      title: `FEATURE ${target.name}`,
      amount: 20,
      symbol: target,
      symbols,
      canGamble: false,
    };
  }

  return null;
}
