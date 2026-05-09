function imageStrip(symbols = []) {
  return `
    <div class="popup-symbols">
      ${symbols.map((symbol) => symbol.type === 'joker'
        ? `<span class="popup-joker">?</span>`
        : `<img src="${symbol.image}" alt="${symbol.name}">`).join('')}
    </div>
  `;
}

export function renderPopupRoot() {
  return `<div id="popupRoot" class="popup-root" aria-live="polite"></div><div id="confettiRoot" class="confetti-root"></div>`;
}

export function closePopup() {
  const root = document.getElementById('popupRoot');
  if (!root) return;
  root.classList.remove('show');
  root.innerHTML = '';
}

export function showIntro(onPlay) {
  showPopup(`
    <div class="popup-card intro-card">
      <p class="popup-kicker">FOR FUN ONLY - GEEN ECHT GELD</p>
      <h2>Welkom bij Familie Club 2000</h2>
      <p>Start de familie-arcadekast en speel met punten, lampjes en portretten.</p>
      <button class="popup-button primary" data-popup-action="play" type="button">SPEEL</button>
    </div>
  `);
  document.querySelector('[data-popup-action="play"]')?.addEventListener('click', onPlay);
}

export function showWinPopup(win, onChoice) {
  showPopup(`
    <div class="popup-card win-card">
      <p class="popup-kicker">PRIJS ${win.amount} PUNTEN</p>
      <h2>Jij wint ${win.title}</h2>
      ${imageStrip(win.symbols)}
      <div class="gamble-lights" id="gambleLights"><span>KOP</span><i></i><span>MUNT</span></div>
      <div class="popup-actions">
        <button class="popup-button" data-choice="kop" type="button">KOP</button>
        <button class="popup-button" data-choice="munt" type="button">MUNT</button>
        <button class="popup-button primary" data-choice="collect" type="button">NEEM PRIJS</button>
      </div>
    </div>
  `);
  document.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => onChoice(button.dataset.choice));
  });
}

export function showMysteryPopup(win, onDone) {
  showPopup(`
    <div class="popup-card mystery-card">
      <p class="popup-kicker">CRISS-CROSS MYSTERY</p>
      <h2>Mystery teller</h2>
      ${imageStrip(win.symbols)}
      <div class="mystery-number led-display" id="mysteryNumber">008</div>
    </div>
  `);
  const number = document.getElementById('mysteryNumber');
  const start = performance.now();
  const duration = 1200;
  const tick = (time) => {
    const progress = Math.min(1, (time - start) / duration);
    const value = Math.round(8 + (win.amount - 8) * (1 - Math.pow(1 - progress, 3)));
    if (number) number.textContent = String(value).padStart(3, '0');
    if (progress < 1) requestAnimationFrame(tick);
    else window.setTimeout(onDone, 350);
  };
  requestAnimationFrame(tick);
}

export function showJackpotPopup(win, onClose) {
  fireConfetti();
  showPopup(`
    <div class="popup-card jackpot-card">
      <p class="popup-kicker">ALLE LAMPEN AAN</p>
      <div class="crown-mark"><span>FAMILIE CLUB 2000</span></div>
      <h2>JACKPOT! 3x MOEK!</h2>
      ${imageStrip(win.symbols)}
      <div class="jackpot-value led-display">200</div>
      <button class="popup-button primary" data-popup-action="ok" type="button">NAAR CLUB METER</button>
    </div>
  `);
  document.querySelector('[data-popup-action="ok"]')?.addEventListener('click', onClose);
}

export function showCollectPopup(win, onCollect) {
  showPopup(`
    <div class="popup-card win-card collect-card">
      <p class="popup-kicker">CLUBSPEL PRIJS</p>
      <h2>${win.title}</h2>
      ${imageStrip(win.symbols)}
      <div class="jackpot-value led-display">${String(win.amount).padStart(3, '0')}</div>
      <button class="popup-button primary" data-popup-action="collect" type="button">COLLECT</button>
    </div>
  `);
  document.querySelector('[data-popup-action="collect"]')?.addEventListener('click', onCollect);
}

export function showPrizeToast(title, symbols, amount, onDone) {
  showPopup(`
    <div class="popup-card win-card">
      <p class="popup-kicker">DIRECT NAAR CLUB METER</p>
      <h2>${title}</h2>
      ${imageStrip(symbols)}
      <div class="jackpot-value led-display">${String(amount).padStart(3, '0')}</div>
    </div>
  `);
  window.setTimeout(() => {
    closePopup();
    onDone?.();
  }, 1350);
}

export function showCoinFlip({ choice, amount }, onReveal) {
  showPopup(`
    <div class="popup-card coin-card">
      <p class="popup-kicker">KOP OF MUNT</p>
      <h2>${choice.toUpperCase()} gekozen</h2>
      <div class="coin" id="coin"><span>KOP</span><span>MUNT</span></div>
      <p>Prijs: ${amount} punten</p>
    </div>
  `);
  window.setTimeout(onReveal, 1250);
}

export function showGambleResult(result, amount, onNext) {
  showPopup(`
    <div class="popup-card ${result.won ? 'win-card' : 'small-card'}">
      <p class="popup-kicker">UITKOMST: ${result.outcome.toUpperCase()}</p>
      <h2>${result.won ? 'GOED! Prijs verdubbeld!' : 'Helaas, munt viel verkeerd!'}</h2>
      <p>${result.won ? `Nieuwe prijs: ${amount} punten` : 'Prijs kwijt.'}</p>
      <button class="popup-button primary" data-popup-action="next" type="button">${result.won ? 'VERDER' : 'OK'}</button>
    </div>
  `);
  document.querySelector('[data-popup-action="next"]')?.addEventListener('click', onNext);
}

export function showBonusPopup(onDone) {
  showPopup(`
    <div class="popup-card bonus-card">
      <p class="popup-kicker">BONUS</p>
      <h2>BONUS! De honden doen mee!</h2>
      <div class="bonus-dogs">
        <img src="assets/familie/Stich.png" alt="Stich">
        <img src="assets/familie/Bella.png" alt="Bella">
      </div>
    </div>
  `);
  window.setTimeout(() => {
    closePopup();
    onDone?.();
  }, 1400);
}

function showPopup(html) {
  const root = document.getElementById('popupRoot');
  if (!root) return;
  root.innerHTML = html;
  root.classList.add('show');
}

function fireConfetti() {
  const root = document.getElementById('confettiRoot');
  if (!root) return;
  root.innerHTML = Array.from({ length: 80 }, (_, index) => `<span style="--x:${Math.random() * 100};--d:${0.8 + Math.random() * 1.2};--r:${Math.random() * 360};--i:${index % 5}"></span>`).join('');
  window.setTimeout(() => { root.innerHTML = ''; }, 2400);
}
