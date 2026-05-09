const animationTokens = new Map();

export function meterMarkup(label, value, id) {
  return `
    <div class="meter">
      <span class="meter-label">${label}</span>
      <span class="led-display" id="${id}">${String(value).padStart(3, '0')}</span>
    </div>
  `;
}

export function updateMeter(id, value) {
  animationTokens.set(id, (animationTokens.get(id) || 0) + 1);
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = String(value).padStart(3, '0');
  node.classList.remove('meter-pop');
  void node.offsetWidth;
  node.classList.add('meter-pop');
}

export function animateMeter(id, from, to, duration = 650) {
  const token = (animationTokens.get(id) || 0) + 1;
  animationTokens.set(id, token);
  const start = performance.now();
  const step = (time) => {
    if (animationTokens.get(id) !== token) return;
    const progress = Math.min(1, (time - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const node = document.getElementById(id);
    if (node) node.textContent = String(Math.round(from + (to - from) * eased)).padStart(3, '0');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
