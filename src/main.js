import { CHARACTERS, getCharacter, getCharactersByTier } from './data/characters.js';
import { JOKER, randomSymbol } from './data/symbols.js';
import { state, setState, patchState, setMessage, addClub, spendClub, spendCredit, resetState } from './game/state.js';
import { initAudio, isMuted, setMuted, sounds, startHum } from './game/audio.js';
import { buildSpinResult, spinReels } from './game/reels.js';
import { evaluateSpin, holdMaskForWin, labelForSymbols } from './game/engine.js';
import { flipCoin, doublePrize } from './game/gamble.js';
import { FEATURE_COST, canStartFeature } from './game/feature.js';
import { renderUpperPanel, pulseFeatureLights, setClubRingActive } from './ui/upper-panel.js';
import { renderReelsPanel, setAllHolds, setReelSpinning, setWinLine, updateReel } from './ui/reels-ui.js';
import { renderControls, setControlState, updateStatus } from './ui/controls.js';
import { animateMeter, updateMeter } from './ui/meters.js';
import {
  closePopup,
  renderPopupRoot,
  showBonusPopup,
  showCoinFlip,
  showCollectPopup,
  showGambleResult,
  showIntro,
  showJackpotPopup,
  showMysteryPopup,
  showPrizeToast,
  showWinPopup,
} from './ui/popups.js';

const app = document.getElementById('app');
let cancelSpin = null;

function boot() {
  patchState({
    reels: [randomSymbol(), randomSymbol(), randomSymbol()],
    debug: new URLSearchParams(window.location.search).has('debug'),
  });
  renderApp();
  bindEvents();
  updateEverything();
  showIntro(() => {
    initAudio();
    startHum();
    sounds.click();
    closePopup();
    patchState({ mode: 'idle', lastMessage: 'Druk op START voor een draai' });
    updateEverything();
  });
}

function renderApp() {
  app.innerHTML = `
    <main class="cabinet" id="cabinet">
      <header class="marquee">
        <div class="title">FAMILIE CLUB 2000</div>
        <div class="title-sub">FAMILIE ARCADE - GEEN ECHT GELD</div>
      </header>
      ${renderUpperPanel()}
      ${renderReelsPanel(state.reels)}
      ${renderControls(state)}
      ${renderDebugPanel()}
    </main>
    ${renderPopupRoot()}
  `;
}

function renderDebugPanel() {
  return `
    <aside class="debug-panel ${state.debug ? 'show' : ''}" id="debugPanel">
      <strong>DEBUG</strong>
      <button data-debug="moek" type="button">Force 3x Moek</button>
      <button data-debug="nowin" type="button">Force No Win</button>
      <button data-debug="high" type="button">Force High win</button>
      <button data-debug="low" type="button">Force Low win</button>
      <button data-debug="featurecross" type="button">Force Feature Criss-Cross</button>
      <button data-debug="joker" type="button">Force Joker</button>
      <button data-debug="club" type="button">Geef 100 Club punten</button>
      <button data-debug="reset" type="button">Reset game</button>
    </aside>
  `;
}

function bindEvents() {
  app.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    initAudio();
    startHum();
    sounds.click();

    if (button.dataset.action) handleAction(button.dataset.action);
    if (button.dataset.hold) toggleHold(Number(button.dataset.hold));
    if (button.dataset.debug) handleDebug(button.dataset.debug);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'd') return;
    setState('debug', !state.debug);
    document.getElementById('debugPanel')?.classList.toggle('show', state.debug);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setMuted(true);
    else setMuted(state.muted);
  });
}

function handleAction(action) {
  if (action === 'start') startBaseSpin();
  if (action === 'feature') startFeatureSpin();
  if (action === 'collect') collectPending();
  if (action === 'kop' || action === 'munt') chooseGamble(action);
  if (action === 'mute') {
    const next = !isMuted();
    setMuted(next);
    setState('muted', next);
    updateEverything();
  }
}

function startBaseSpin() {
  if (state.mode !== 'idle' || state.pendingWin) return;
  if (!spendCredit(1)) {
    setMessage('Geen vrije credits meer');
    updateEverything();
    return;
  }
  setMessage('Rollen draaien...');
  beginSpin({ feature: false, holds: [...state.holds] });
}

function startFeatureSpin() {
  if (state.mode !== 'idle' || state.pendingWin || !canStartFeature(state.club)) return;
  spendClub(FEATURE_COST);
  sounds.feature();
  pulseFeatureLights('feature');
  setMessage('FEATURE: low tier telt als criss-cross');
  beginSpin({ feature: true, holds: [false, false, false] });
}

function beginSpin({ feature, holds }) {
  closePopup();
  cancelSpin?.();
  const mode = feature ? 'feature-spinning' : 'spinning';
  const result = buildSpinResult({
    current: state.reels,
    holds,
    forced: state.forcedResult,
  });
  patchState({
    mode,
    forcedResult: null,
    holds: feature ? [false, false, false] : holds,
    pendingWin: null,
    round: state.round + 1,
  });
  setClubRingActive(feature);
  document.getElementById('cabinet')?.classList.toggle('feature-mode', feature);
  setWinLine(null);
  setAllHolds(state.holds, true);
  [0, 1, 2].forEach((index) => setReelSpinning(index, true));

  cancelSpin = spinReels({
    result,
    current: state.reels,
    holds: feature ? [false, false, false] : holds,
    onTick: (index, symbol, held) => {
      updateReel(index, symbol);
      if (!held) sounds.reelTick();
    },
    onStop: (index, symbol) => {
      updateReel(index, symbol);
      setReelSpinning(index, false);
      sounds.reelStop();
    },
    onDone: (symbols) => finishSpin(symbols, feature),
  });
}

function finishSpin(symbols, feature) {
  const win = evaluateSpin(symbols, { feature });
  const stats = {
    ...state.stats,
    spins: state.stats.spins + 1,
    wins: state.stats.wins + (win ? 1 : 0),
    jackpots: state.stats.jackpots + (win?.kind === 'jackpot' ? 1 : 0),
  };
  patchState({
    reels: symbols,
    stats,
    mode: 'idle',
    holds: win && !feature ? holdMaskForWin(symbols, win) : [false, false, false],
  });
  setAllHolds(state.holds, feature);
  setClubRingActive(false);
  document.getElementById('cabinet')?.classList.toggle('feature-mode', false);

  if (!win) {
    setWinLine('miss');
    sounds.lose();
    setMessage(feature ? 'Geen feature prijs deze ronde' : 'Geen prijs - START staat klaar');
    updateEverything();
    return;
  }

  setWinLine('hit');
  if (feature) {
    sounds.win();
    pulseFeatureLights('feature');
    patchState({ pendingWin: win, mode: 'collecting' });
    setMessage(`${win.title}: ${win.amount} punten - druk COLLECT`);
    updateEverything();
    showCollectPopup(win, collectPending);
    return;
  }

  if (win.kind === 'jackpot') {
    sounds.jackpot();
    setState('club', 200);
    setMessage('JACKPOT! Club Meter naar 200');
    updateEverything();
    document.getElementById('cabinet')?.classList.add('jackpot-shake');
    window.setTimeout(() => document.getElementById('cabinet')?.classList.remove('jackpot-shake'), 1200);
    showJackpotPopup(win, () => {
      closePopup();
      setMessage('Jackpot verzameld in de Club Meter');
      updateEverything();
    });
    return;
  }

  patchState({ pendingWin: win, mode: 'gambling' });
  if (win.kind === 'mystery') {
    sounds.mystery();
    showMysteryPopup(win, () => showGamblePrompt(win));
  } else {
    sounds.win();
    showGamblePrompt(win);
  }
  setMessage(`${win.title}: ${win.amount} punten`);
  updateEverything();
}

function showGamblePrompt(win) {
  patchState({ pendingWin: win, mode: 'gambling' });
  showWinPopup(win, (choice) => {
    if (choice === 'collect') collectPending();
    else chooseGamble(choice);
  });
  updateEverything();
}

function chooseGamble(choice) {
  if (state.mode !== 'gambling' || !state.pendingWin) return;
  const currentWin = state.pendingWin;
  showCoinFlip({ choice, amount: currentWin.amount }, () => {
    const result = flipCoin(choice);
    sounds.flip();
    if (result.won) {
      const amount = doublePrize(currentWin.amount);
      const updatedWin = { ...currentWin, amount };
      patchState({ pendingWin: updatedWin });
      sounds.win();
      setMessage(`Goed! Prijs verdubbeld naar ${amount}`);
      window.setTimeout(() => {
        if (amount >= 200) collectPending();
        else showGamblePrompt(updatedWin);
      }, 450);
    } else {
      patchState({ pendingWin: null, mode: 'idle' });
      sounds.lose();
      showGambleResult(result, 0, () => {
        closePopup();
        updateEverything();
      });
      setMessage('Helaas, munt viel verkeerd.');
    }
    updateEverything();
  });
}

function collectPending() {
  if (!state.pendingWin) return;
  const amount = state.pendingWin.amount;
  const from = state.club;
  addClub(amount);
  sounds.collect();
  patchState({ pendingWin: null, mode: 'idle' });
  closePopup();
  setMessage('Prijs naar Club Meter');
  updateEverything();
  animateMeter('clubMeterDisplay', from, state.club);
}

function toggleHold(index) {
  if (state.mode !== 'idle' || state.pendingWin || !state.reels[index]) return;
  const holds = [...state.holds];
  holds[index] = !holds[index];
  patchState({ holds });
  sounds.click();
  updateEverything();
}

function maybeBonus() {
  if (Math.random() > 0.08) return;
  setState('bonus', state.bonus + 1);
  sounds.dogBonus();
  updateEverything();
  showBonusPopup(() => setMessage('Bonus voorbij, START staat klaar'));
}

function handleDebug(action) {
  if (action === 'moek') {
    const moek = { type: 'character', ...getCharacter('moek') };
    setState('forcedResult', [moek, moek, moek]);
    setMessage('Debug: volgende draai is 3x Moek');
  }
  if (action === 'nowin') {
    setState('forcedResult', [
      { type: 'character', ...getCharactersByTier('high')[0] },
      { type: 'character', ...getCharactersByTier('mid')[0] },
      { type: 'character', ...getCharactersByTier('low')[0] },
    ]);
    setMessage('Debug: volgende draai heeft geen prijs');
  }
  if (action === 'high') {
    const high = { type: 'character', ...getCharactersByTier('high')[0] };
    setState('forcedResult', [high, high, high]);
    setMessage('Debug: volgende draai is high win');
  }
  if (action === 'low') {
    const low = { type: 'character', ...getCharactersByTier('low')[0] };
    setState('forcedResult', [low, low, low]);
    setMessage('Debug: volgende draai is low win');
  }
  if (action === 'featurecross') {
    const high = { type: 'character', ...getCharactersByTier('high')[0] };
    const lowA = { type: 'character', ...getCharactersByTier('low')[0] };
    const lowB = { type: 'character', ...getCharactersByTier('low')[1] };
    setState('forcedResult', [high, lowA, lowB]);
    setMessage('Debug: volgende clubspel draai is criss-cross');
  }
  if (action === 'joker') {
    setState('forcedResult', [
      { type: 'character', ...getCharactersByTier('mid')[0] },
      { ...JOKER },
      { type: 'character', ...getCharactersByTier('high')[0] },
    ]);
    setMessage('Debug: volgende draai heeft Joker');
  }
  if (action === 'club') {
    addClub(100);
    setMessage('Debug: 100 Club punten toegevoegd');
  }
  if (action === 'reset') {
    resetState();
    patchState({ reels: [randomSymbol(), randomSymbol(), randomSymbol()], mode: 'idle', debug: true });
    [0, 1, 2].forEach((index) => updateReel(index, state.reels[index]));
    closePopup();
    setMessage('Debug: reset klaar');
  }
  updateEverything();
}

function updateEverything() {
  updateMeter('creditDisplay', state.credit);
  updateMeter('roundDisplay', state.round);
  updateMeter('bonusDisplay', state.bonus);
  updateMeter('clubMeterDisplay', state.club);
  updateStatus(state.lastMessage);
  setAllHolds(state.holds, state.mode !== 'idle' || Boolean(state.pendingWin));
  setControlState(state);
  document.getElementById('debugPanel')?.classList.toggle('show', state.debug);
}

console.log(`Familie Club 2000 boot: ${CHARACTERS.length} familiebeelden geladen`);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
