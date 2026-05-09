import { evaluateBaseWin, evaluateFeatureWin } from '../data/symbols.js';

export function evaluateSpin(symbols, { feature = false } = {}) {
  return feature ? evaluateFeatureWin(symbols) : evaluateBaseWin(symbols);
}

export function holdMaskForWin(symbols, win) {
  if (!win || !win.symbol) return [false, false, false];
  return symbols.map((symbol) => symbol.type === 'character' && symbol.id === win.symbol.id);
}

export function labelForSymbols(symbols) {
  return symbols.map((symbol) => symbol.name).join(' & ');
}
