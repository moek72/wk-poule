export function flipCoin(choice) {
  const outcome = Math.random() < 0.5 ? 'kop' : 'munt';
  return {
    choice,
    outcome,
    won: choice === outcome,
  };
}

export function doublePrize(amount) {
  return Math.min(200, amount * 2);
}
