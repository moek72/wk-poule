import { getCharactersByTier, getCharacter } from '../data/characters.js';

function smallFace(character) {
  return `<span class="price-face"><img src="${character.image}" alt="${character.name}"></span>`;
}

export function renderUpperPanel() {
  const moek = getCharacter('moek');
  const high = getCharactersByTier('high').slice(0, 4);
  const mid = getCharactersByTier('mid').slice(0, 4);
  const low = getCharactersByTier('low').slice(0, 4);
  const left = [moek, ...high.slice(0, 2), ...mid.slice(0, 2)];
  const right = [...high.slice(2), ...mid.slice(2), ...low.slice(0, 1)];

  return `
    <section class="upper-panel" id="upperPanel">
      <div class="price-board price-board-left">
        <div class="price-title">PRIJZEN</div>
        ${left.map((character) => `
          <div class="price-row">
            ${smallFace(character)}
            <span>${character.name}</span>
            <b>${character.tier === 'jackpot' ? '200' : character.tier === 'high' ? '50 / 10' : '20 / 5'}</b>
          </div>
        `).join('')}
      </div>

      <div class="club-meter-ring" id="clubRing">
        ${Array.from({ length: 18 }, (_, index) => `<span class="ring-light ring-light-${index}"></span>`).join('')}
        <div class="club-meter-core">
          <span class="club-label">CLUB METER</span>
          <span class="club-value led-display" id="clubMeterDisplay">000</span>
          <span class="club-max">MAX 200</span>
          <div class="feature-grid" id="featureGrid">
            ${Array.from({ length: 9 }, (_, index) => `<span class="feature-dot" data-dot="${index}"></span>`).join('')}
          </div>
        </div>
      </div>

      <div class="price-board price-board-right">
        <div class="price-title">KRIS-KRAS</div>
        ${right.map((character) => `
          <div class="price-row">
            ${smallFace(character)}
            <span>${character.name}</span>
            <b>${character.tier === 'high' ? '50 / 10' : character.tier === 'mid' ? '20 / 5' : '8'}</b>
          </div>
        `).join('')}
        <div class="price-row joker-row"><span class="joker-token">?</span><span>Mystery</span><b>8-200</b></div>
      </div>
    </section>
  `;
}

export function setClubRingActive(active) {
  document.getElementById('clubRing')?.classList.toggle('ring-active', active);
}

export function pulseFeatureLights(mode = 'soft') {
  const grid = document.getElementById('featureGrid');
  if (!grid) return;
  grid.dataset.mode = mode;
  grid.classList.remove('feature-pulse');
  void grid.offsetWidth;
  grid.classList.add('feature-pulse');
}
