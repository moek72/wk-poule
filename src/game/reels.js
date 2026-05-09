import { randomSymbol } from '../data/symbols.js';

const STOP_DELAYS = [850, 1250, 1700];

export function buildSpinResult({ current = [null, null, null], holds = [false, false, false], forced = null } = {}) {
  const forcedSymbols = forced ? forced.map((symbol) => ({ ...symbol })) : null;
  return [0, 1, 2].map((index) => {
    if (holds[index] && current[index]) return current[index];
    return forcedSymbols?.[index] || randomSymbol();
  });
}

export function spinReels({ result, current, holds, onTick, onStop, onDone }) {
  const timers = [];
  const stopped = [false, false, false];
  const tickers = [0, 1, 2].map((index) => window.setInterval(() => {
    if (holds[index] && current[index]) {
      onTick(index, current[index], true);
      return;
    }
    onTick(index, randomSymbol(), false);
  }, 72 + index * 10));

  [0, 1, 2].forEach((index) => {
    timers.push(window.setTimeout(() => {
      window.clearInterval(tickers[index]);
      stopped[index] = true;
      onStop(index, result[index], holds[index]);
      if (stopped.every(Boolean)) onDone(result);
    }, holds[index] && current[index] ? 260 + index * 120 : STOP_DELAYS[index]));
  });

  return () => {
    tickers.forEach(window.clearInterval);
    timers.forEach(window.clearTimeout);
  };
}
