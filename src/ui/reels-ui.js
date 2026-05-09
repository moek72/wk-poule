import { randomSymbol } from '../data/symbols.js';

const lastSymbol = [null, null, null];

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

function reelHTML(index, midSymbol) {
  return `
    <div class="reel-slot top-slot" id="reelSlot${index}-top">${symbolMarkup(randomSymbol())}</div>
    <div class="reel-slot mid-slot" id="reelSlot${index}-mid">${symbolMarkup(midSymbol)}</div>
    <div class="reel-slot bot-slot" id="reelSlot${index}-bot">${symbolMarkup(randomSymbol())}</div>
  `;
}

export function renderReelsPanel(reels) {
  return `
    <section class="lower-panel" id="lowerPanel">
      <div class="reel-stage">
        <div class="win-line" id="winLine"></div>
        ${[0, 1, 2].map((index) => `
          <div class="reel-shell" id="reelShell${index}">
            <div class="reel-track" id="reel${index}">
              ${reelHTML(index, reels[index])}
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
  const topNode = document.getElementById(`reelSlot${index}-top`);
  const midNode = document.getElementById(`reelSlot${index}-mid`);
  const botNode = document.getElementById(`reelSlot${index}-bot`);
  if (!midNode) return;
  lastSymbol[index] = symbol;
  if (topNode) topNode.innerHTML = midNode.innerHTML;
  midNode.innerHTML = symbolMarkup(symbol);
  if (botNode) botNode.innerHTML = symbolMarkup(randomSymbol());
}

export function setReelSpinning(index, active) {
  document.getElementById(`reelShell${index}`)?.classList.toggle('spinning', active);
  if (!active && lastSymbol[index]) {
    const topNode = document.getElementById(`reelSlot${index}-top`);
    const midNode = document.getElementById(`reelSlot${index}-mid`);
    const botNode = document.getElementById(`reelSlot${index}-bot`);
    if (midNode) midNode.innerHTML = symbolMarkup(lastSymbol[index]);
    if (topNode) topNode.innerHTML = symbolMarkup(randomSymbol());
    if (botNode) botNode.innerHTML = symbolMarkup(randomSymbol());
  }
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
