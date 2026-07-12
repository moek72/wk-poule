// ui.js — piepkleine DOM-helpers. Geen framework.

export function fmtTime(sec) {
  const s = Math.max(0, sec | 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Zet HTML in het #app-element en geef het element terug. */
export function mount(html) {
  const app = document.getElementById('app');
  app.innerHTML = html;
  return app;
}

/** Bind click op alle elementen met [data-act]; cb krijgt (act, el, event). */
export function bindActions(root, cb) {
  root.querySelectorAll('[data-act]').forEach((el) => {
    el.addEventListener('click', (e) => cb(el.dataset.act, el, e));
  });
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
