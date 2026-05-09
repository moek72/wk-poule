function symbolMarkup(symbol) {
  if (!symbol) return `<div class="symbol-card empty"><span>?</span></div>`;
  if (symbol.type === 'joker') {
    return `
      <div class="symbol-card joker">
        <span class="joker-big">?</span>
        <span class="symbol-name">CRISS-CROSS</span>
      </div>
    `;
  }
  return `
    <div class="symbol-card ${symbol.tier}">
      <img src="${symbol.image}" alt="${symbol.name}">
      <span class="symbol-name">${symbol.name}</span>
    </div>
  `;
}

export function renderReelsPanel(reels) {
  return `
    <section class="lower-panel" id="lowerPanel">
      <div class="reel-stage">
        <div class="win-line" id="winLine"></div>
        ${[0, 1, 2].map((index) => `
          <div class="reel-shell" id="reelShell${index}">
            <div class="reel-window" id="reel${index}">
              ${symbolMarkup(reels[index])}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="hold-row">
        ${[0, 1, 2].map((index) => `<button class="hold-button" data-hold="${index}" type="button">HOLD ${index + 1}</button>`).join('')}
      </div>
    </section>
  `;
}

export function updateReel(index, symbol) {
  const node = document.getElementById(`reel${index}`);
  if (!node) return;
  node.innerHTML = symbolMarkup(symbol);
}

export function setReelSpinning(index, active) {
  document.getElementById(`reelShell${index}`)?.classList.toggle('spinning', active);
}

export function setHoldActive(index, active, disabled = false) {
  const button = document.querySelector(`[data-hold="${index}"]`);
  if (!button) return;
  button.classList.toggle('active', active);
  button.disabled = disabled;
}

export function setAllHolds(holds, disabled = false) {
  holds.forEach((active, index) => setHoldActive(index, active, disabled));
}

export function setWinLine(state) {
  const line = document.getElementById('winLine');
  if (!line) return;
  line.classList.remove('hit', 'miss');
  if (state) {
    void line.offsetWidth;
    line.classList.add(state);
  }
}
