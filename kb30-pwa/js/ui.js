// ui.js — piepkleine DOM-helpers. Geen framework.

export function fmtTime(sec) {
  const s = Math.max(0, sec | 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
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

/** Vaste navigatiebalk onderin — minimaal, uppercase, geen iconen. */
export function tabbar(active) {
  const tabs = [
    ['dashboard', 'Vandaag'],
    ['library', 'Oefeningen'],
    ['progress', 'Voortgang'],
    ['settings', 'Meer'],
  ];
  return `<nav class="nav" aria-label="Hoofdmenu">${tabs.map(([route, label]) => `
    <button class="tab ${route === active ? 'on' : ''}" data-act="nav-${route}" aria-current="${route === active ? 'page' : 'false'}">${label}</button>`).join('')}</nav>`;
}

/** Handel 'nav-*' acties af; geeft true terug als de actie navigatie was. */
export function handleNav(act, nav) {
  if (act && act.startsWith('nav-')) { nav(act.slice(4)); return true; }
  return false;
}
