import { meterMarkup } from './meters.js';

export function renderControls(state) {
  return `
    <section class="status-panel">
      <div class="status-display led-display" id="statusDisplay">${state.lastMessage}</div>
      <div class="meters-row">
        ${meterMarkup('CREDIT', state.credit, 'creditDisplay')}
        ${meterMarkup('RONDE', state.round, 'roundDisplay')}
        ${meterMarkup('BONUS', state.bonus, 'bonusDisplay')}
      </div>
    </section>

    <section class="controls" id="controls">
      <button class="control-button kop" data-action="kop" type="button">KOP</button>
      <button class="control-button munt" data-action="munt" type="button">MUNT</button>
      <button class="control-button collect" data-action="collect" type="button">COLLECT</button>
      <button class="control-button feature" data-action="feature" type="button">CLUBSPEL</button>
      <button class="control-button start" data-action="start" type="button">START</button>
      <button class="mute-button" data-action="mute" type="button" aria-label="Geluid dempen">SOUND</button>
    </section>
  `;
}

export function updateStatus(message) {
  const node = document.getElementById('statusDisplay');
  if (!node) return;
  node.textContent = message;
  node.classList.remove('status-flash');
  void node.offsetWidth;
  node.classList.add('status-flash');
}

export function setControlState(state) {
  const isSpinning = state.mode === 'spinning' || state.mode === 'feature-spinning';
  const isGamble = state.mode === 'gambling';
  const hasPending = Boolean(state.pendingWin);
  document.querySelector('[data-action="start"]')?.toggleAttribute('disabled', isSpinning || isGamble || hasPending || state.credit <= 0);
  document.querySelector('[data-action="feature"]')?.toggleAttribute('disabled', isSpinning || isGamble || hasPending || state.club < 4);
  document.querySelector('[data-action="collect"]')?.toggleAttribute('disabled', isSpinning || !hasPending);
  document.querySelector('[data-action="kop"]')?.toggleAttribute('disabled', !isGamble);
  document.querySelector('[data-action="munt"]')?.toggleAttribute('disabled', !isGamble);
  const mute = document.querySelector('[data-action="mute"]');
  if (mute) mute.classList.toggle('active', state.muted);
}
