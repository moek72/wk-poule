// ui.js — piepkleine DOM-helpers. Geen framework.

import { icon } from './illustrations.js';

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

/** Vaste navigatiebalk onderin (dashboard / bibliotheek / voortgang / meer). */
export function tabbar(active) {
  const tabs = [
    ['dashboard', 'home', 'Vandaag'],
    ['library', 'book', 'Oefeningen'],
    ['progress', 'chart', 'Voortgang'],
    ['settings', 'gear', 'Meer'],
  ];
  return `<nav class="tabbar" aria-label="Hoofdmenu">${tabs.map(([route, icn, label]) => `
    <button class="tab ${route === active ? 'active' : ''}" data-act="nav-${route}" aria-label="${label}">
      ${icon(icn)}<span>${label}</span>
    </button>`).join('')}</nav>`;
}

/** Handel 'nav-*' acties af; geeft true terug als de actie navigatie was. */
export function handleNav(act, nav) {
  if (act && act.startsWith('nav-')) { nav(act.slice(4)); return true; }
  return false;
}
