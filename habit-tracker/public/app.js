'use strict';

/* ============================================================
   Global error handling
   ============================================================ */
function showError(msg) {
  try {
    const b = document.getElementById('error-banner');
    const t = document.getElementById('error-text');
    if (b && t) {
      t.textContent = String(msg || 'خطای غیرمنتظره');
      b.hidden = false;
      clearTimeout(showError._t);
      showError._t = setTimeout(() => { b.hidden = true; }, 5000);
    } else {
      console.error('❌', msg);
    }
  } catch { console.error('❌', msg); }
}

window.addEventListener('error', (e) => showError(e.message || 'خطای JS'));
window.addEventListener('unhandledrejection', (e) =>
  showError((e.reason && e.reason.message) || 'خطای async'));

/* helper برای امنیت DOM */
const $ = (id) => {
  try { return document.getElementById(id); } catch { return null; }
};
const on = (el, ev, fn) => {
  if (el && typeof el.addEventListener === 'function') el.addEventListener(ev, fn);
};
const qs = (sel, root = document) => {
  try { return root.querySelector(sel); } catch { return null; }
};
const qsa = (sel, root = document) => {
  try { return Array.from(root.querySelectorAll(sel)); } catch { return []; }
};
function setText(id, val) {
  const el = $(id); if (el) el.textContent = val;
}
function toggleClass(el, cls, on) {
  if (el && el.classList) el.classList.toggle(cls, !!on);
}

/* ============================================================
   Jalali conversion
   ============================================================ */
(function () {
  const div = (a, b) => ~~(a / b);
  const mod = (a, b) => a - ~~(a / b) * b;

  function jalCal(jy) {
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
      1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    let bl = breaks.length, gy = jy + 621, leapJ = -14,
        jp = breaks[0], jm, jump = 0, leap, leapG, march, n;
    for (let i = 1; i < bl; i++) {
      jm = breaks[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ++;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap, gy, march };
  }
  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
          + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }
  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }
  function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    let gy = d2g(jdn).gy, jy = gy - 621, jd, jm;
    const r = jalCal(jy), jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy, jm, jd }; }
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  }
  window.Jalali = {
    toJalaali: (gy, gm, gd) => d2j(g2d(gy, gm, gd)),
    toGregorian: (jy, jm, jd) => d2g(j2d(jy, jm, jd)),
    jalaaliMonthLength: (jy, jm) =>
      jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy).leap === 0 ? 30 : 29),
  };
})();

/* ============================================================
   Icons — thesvg with complete fallback
   ============================================================ */
const FALLBACK_ICONS = {
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.89 1.7 1.7 0 0 0 4.26 7l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6h.09A1.7 1.7 0 0 0 10 3.05V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.09a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  block: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5z"/><path d="M3.5 7.25 12 12l8.5-4.75M12 12v9.5"/></svg>',
};

let ICONS = {};
async function loadIcons() {
  try {
    const res = await fetch('/api/icons');
    if (!res.ok) return;
    ICONS = (await res.json()) || {};
  } catch { /* silent */ }
}
function iconSvg(name) {
  if (ICONS && ICONS[name]) return ICONS[name];
  if (FALLBACK_ICONS[name]) return FALLBACK_ICONS[name];
  return '';
}
function applyIcons(root = document) {
  qsa('[data-icon]', root).forEach((el) => {
    const n = el.getAttribute('data-icon');
    const svg = iconSvg(n);
    if (svg) el.innerHTML = svg;
  });
  qsa('[data-icon-btn]', root).forEach((el) => {
    const n = el.getAttribute('data-icon-btn');
    const svg = iconSvg(n);
    if (svg) el.innerHTML = svg;
  });
}

/* ---------- Blockchain logo ---------- */
function blockchainSvg(color, state) {
  const isFull = state === 'full';
  const isPartial = state === 'partial';
  const stroke = color;
  const accent = isFull ? '#FFFFFF' : color;
  const accentOpacity = state === 'empty' ? 0.35 : 1;
  const dotR = isFull ? 1.7 : isPartial ? 1.5 : 1.3;

  return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5z"
            stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"
            fill="${isFull ? color : 'none'}" fill-opacity="${isFull ? 0.22 : 0}"/>
      <path d="M3.5 7.25 12 12l8.5-4.75M12 12v9.5"
            stroke="${stroke}" stroke-width="1.3" stroke-linejoin="round"
            stroke-opacity="${state === 'empty' ? 0.5 : 0.9}"/>
      <circle cx="12" cy="12" r="${dotR}" fill="${accent}" fill-opacity="${accentOpacity}"/>
      ${isFull
        ? '<path d="M9.4 12.2l1.9 1.9 3.6-3.7" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        : ''}
    </svg>
  `;
}
function logoState(checksCount, goal) {
  if (checksCount <= 0) return 'empty';
  if (checksCount >= goal) return 'full';
  return 'partial';
}

/* ---------- Brand logo ---------- */
function renderBrandLogo() {
  const el = $('brand-logo');
  if (!el) return;
  el.innerHTML = `
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#22D3EE"/>
        </linearGradient>
      </defs>
      <path d="M16 3 27 9.5v13L16 29 5 22.5v-13z"
            stroke="url(#brandGrad)" stroke-width="1.8" stroke-linejoin="round"
            fill="url(#brandGrad)" fill-opacity="0.15"/>
      <path d="M5 9.5 16 16l11-6.5M16 16v13"
            stroke="url(#brandGrad)" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="16" cy="16" r="2.4" fill="#8B5CF6"/>
      <circle cx="5"  cy="9.5"  r="1.4" fill="#22D3EE"/>
      <circle cx="27" cy="9.5"  r="1.4" fill="#22D3EE"/>
      <circle cx="5"  cy="22.5" r="1.4" fill="#22D3EE"/>
      <circle cx="27" cy="22.5" r="1.4" fill="#22D3EE"/>
      <circle cx="16" cy="29"   r="1.4" fill="#22D3EE"/>
    </svg>
  `;
}

/* ============================================================
   Constants
   ============================================================ */
const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
                'مهر','آبان','آذر','دی','بهمن','اسفند'];
const DOW_LETTERS = ['ی','د','س','چ','پ','ج','ش'];

const HABIT_COLORS = ['#10B981','#8B5CF6','#0EA5E9','#EF4444','#F59E0B',
                      '#22D3EE','#D946EF','#84CC16','#EC4899','#14B8A6'];
const colorFor = (i, h) => (h && h.color) || HABIT_COLORS[i % HABIT_COLORS.length];

const pad2 = (n) => String(n).padStart(2, '0');
const monthKey = (y, m) => `${y}-${pad2(m)}`;

function dowLetterForJalaliDay(jy, jm, jd) {
  try {
    const g = Jalali.toGregorian(jy, jm, jd);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    return DOW_LETTERS[d.getDay()];
  } catch { return '·'; }
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ============================================================
   State
   ============================================================ */
const LS = {
  collapsed: 'habit.collapsed',
  panelOpen: 'habit.panelOpen',
  views: 'habit.views',
  hideDate: 'habit.hideDate',
  hideHabitCol: 'habit.hideHabitCol',
  noOrbit: 'habit.noOrbit',
  noMouse: 'habit.noMouse',
  compactAll: 'habit.compactAll',
};

function lsGet(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v;
  } catch { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

const state = {
  year: 1403, month: 7,
  habits: [], records: {},
  today: null,
  collapsed: new Set(JSON.parse(lsGet(LS.collapsed, '[]'))),
  compactAll: lsGet(LS.compactAll, '0') === '1',
  panelOpen: lsGet(LS.panelOpen, '1') !== '0',
  hideDate: lsGet(LS.hideDate, '0') === '1',
  hideHabitCol: lsGet(LS.hideHabitCol, '0') === '1',
  views: Object.assign(
    { date: true, wave: true, rate: true, habits: true, donuts: true },
    JSON.parse(lsGet(LS.views, '{}'))
  ),
};

/* ============================================================
   API
   ============================================================ */
const api = {
  getData: () => fetch('/api/data').then((r) => r.json()),
  addHabit: (name, goal) => fetch('/api/habits', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, goal }),
  }).then((r) => r.json()),
  updateHabit: (id, name, goal) => fetch('/api/habits/' + encodeURIComponent(id), {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, goal }),
  }).then((r) => r.json()),
  deleteHabit: (id) => fetch('/api/habits/' + encodeURIComponent(id), { method: 'DELETE' }).then((r) => r.json()),
  toggle: (monthKey, habitId, day) => fetch('/api/toggle', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthKey, habitId, day }),
  }).then((r) => r.json()),
};

/* ============================================================
   Selectors
   ============================================================ */
function buildSelectors() {
  const yearSel = $('year-select');
  const monthSel = $('month-select');
  if (!yearSel || !monthSel || !state.today) return;
  const cy = state.today.jy;

  yearSel.innerHTML = '';
  for (let y = cy - 2; y <= cy + 2; y++) {
    const o = document.createElement('option');
    o.value = String(y); o.textContent = String(y);
    yearSel.appendChild(o);
  }
  yearSel.value = String(state.year);

  monthSel.innerHTML = '';
  MONTHS.forEach((m, i) => {
    const o = document.createElement('option');
    o.value = String(i + 1); o.textContent = m;
    monthSel.appendChild(o);
  });
  monthSel.value = String(state.month);

  on(yearSel, 'change', () => { state.year = +yearSel.value; render(); });
  on(monthSel, 'change', () => { state.month = +monthSel.value; render(); });
}

/* ============================================================
   Info + Rate
   ============================================================ */
function renderInfoAndRate(totals) {
  try {
    const days = Jalali.jalaaliMonthLength(state.year, state.month);
    const start = Jalali.toGregorian(state.year, state.month, 1);
    const end = Jalali.toGregorian(state.year, state.month, days);

    setText('info-year', String(state.year));
    setText('info-month', MONTHS[state.month - 1] || '—');
    setText('info-start', `${start.gy}/${pad2(start.gm)}/${pad2(start.gd)}`);
    setText('info-end', `${end.gy}/${pad2(end.gm)}/${pad2(end.gd)}`);
    setText('info-days', String(days));

    const rate = totals.goal ? Math.min(1, totals.done / totals.goal) : 0;
    setText('rate-big', Math.round(rate * 100) + '%');

    const badge = $('rate-badge');
    if (badge) {
      let text = '—', color = '#71717A';
      if (rate > 0.95)      { text = '🏆 Excellent';  color = '#4ADE80'; }
      else if (rate > 0.8)  { text = '❤️ Good Job';   color = '#A7F3D0'; }
      else if (rate > 0.5)  { text = '✊ Do Better';  color = '#FCD34D'; }
      else if (rate > 0.3)  { text = '👎 Low Effort'; color = '#FDBA74'; }
      else                  { text = '⚠️ Disaster';   color = '#FCA5A5'; }
      badge.textContent = text;
      badge.style.color = color;
    }

    setText('footer-total', `${totals.done} / ${totals.goal}`);
  } catch (err) { showError('renderInfo: ' + err.message); }
}

/* ============================================================
   Wave
   ============================================================ */
function buildSmoothPath(values, W, H, padTop, padBottom) {
  const n = values.length; if (!n) return '';
  const stepX = W / Math.max(1, n - 1);
  const pts = values.map((v, i) => [i * stepX, padTop + (1 - v) * (H - padTop - padBottom)]);
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function renderWave() {
  try {
    const svg = $('wave-svg');
    if (!svg) return;
    const days = Jalali.jalaaliMonthLength(state.year, state.month);
    const key = monthKey(state.year, state.month);
    const rec = state.records[key] || {};
    const totalHabits = Math.max(1, state.habits.length);

    const values = [];
    for (let d = 1; d <= days; d++) {
      let done = 0;
      for (const h of state.habits) if ((rec[h.id] || []).includes(d)) done++;
      values.push(done / totalHabits);
    }

    const W = 1000, H = 190, padTop = 40, padBottom = 40;
    const path = buildSmoothPath(values, W, H, padTop, padBottom);
    const stepX = W / Math.max(1, days - 1);

    let markers = '';
    for (let i = 0; i < days; i++) {
      const v = values[i];
      const x = i * stepX;
      const y = padTop + (1 - v) * (H - padTop - padBottom);
      const label = v >= 0.999 ? '1' : v <= 0.001 ? '0' : '';
      const labelY = v >= 0.5 ? y - 12 : y + 20;
      if (label) {
        markers += `<text x="${x}" y="${labelY}" text-anchor="middle"
          font-family="'Times New Roman',serif" font-size="14" font-weight="700"
          fill="${v >= 0.5 ? '#A7F3D0' : '#71717A'}">${label}</text>`;
      }
    }

    const todayX = (state.today && state.today.jy === state.year && state.today.jm === state.month)
      ? (state.today.jd - 1) * stepX : -100;

    svg.innerHTML = `
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10B981" stop-opacity=".35"/>
          <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
        </linearGradient>
        <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      ${[0,1,2,3,4].map(i => {
        const y = padTop + (H - padTop - padBottom) * (i / 4);
        return `<line x1="0" y1="${y}" x2="${W}" y2="${y}"
          stroke="#27272A" stroke-width="1" stroke-dasharray="2 6" opacity=".5"/>`;
      }).join('')}
      ${todayX > 0 ? `<line x1="${todayX}" y1="8" x2="${todayX}" y2="${H-8}"
        stroke="#8B5CF6" stroke-width="1" stroke-dasharray="4 4" opacity=".5"/>` : ''}
      <path d="${path} L ${W},${H} L 0,${H} Z" fill="url(#waveGrad)" opacity=".6"/>
      <path d="${path}" fill="none" stroke="#10B981" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#waveGlow)"/>
      ${markers}
    `;
  } catch (err) { showError('renderWave: ' + err.message); }
}

/* ============================================================
   Donuts
   ============================================================ */
function drawDonut(svgEl, pct, color, valueLabel) {
  if (!svgEl) return;
  const r = 46, c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  const dash = clamped * c;
  svgEl.innerHTML = `
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#27272A" stroke-width="10"/>
    <circle cx="60" cy="60" r="${r}" fill="none"
      stroke="${color}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${dash} ${c}" transform="rotate(-90 60 60)"
      style="filter:drop-shadow(0 0 6px ${color}66); transition:stroke-dasharray .5s ease;"/>
    <text x="60" y="58" text-anchor="middle"
      font-family="'Times New Roman',serif" font-size="18" font-weight="700"
      fill="#FAFAFA" style="font-variant-numeric:tabular-nums">${valueLabel}</text>
    <text x="60" y="74" text-anchor="middle"
      font-family="'Libre Franklin',sans-serif" font-size="8"
      fill="#71717A" letter-spacing="1">PROGRESS</text>
  `;
}

function renderDonuts(totals) {
  try {
    const days = Jalali.jalaaliMonthLength(state.year, state.month);
    const key = monthKey(state.year, state.month);
    const rec = state.records[key] || {};
    const todayDay = (state.today && state.today.jy === state.year && state.today.jm === state.month)
      ? state.today.jd : days;

    const monthly = totals.goal ? Math.min(1, totals.done / totals.goal) : 0;
    const pace = totals.goal / Math.max(1, days);
    const actualPerDay = totals.done / Math.max(1, todayDay);
    const daysNorm = pace ? Math.min(1, actualPerDay / pace) : 0;

    const totalHabits = Math.max(1, state.habits.length);
    let last3sum = 0;
    for (let d = Math.max(1, todayDay - 2); d <= todayDay; d++) {
      let c = 0;
      for (const h of state.habits) if ((rec[h.id] || []).includes(d)) c++;
      last3sum += c / totalHabits;
    }
    const last3 = last3sum / Math.min(3, Math.max(1, todayDay));

    drawDonut(qs('[data-id="donut-month"]'), monthly, '#EF4444',
      Math.round(monthly * 1000) / 10 + '%');
    drawDonut(qs('[data-id="donut-days"]'), daysNorm, '#0EA5E9',
      Math.round(daysNorm * 1000) / 10 + '%');
    drawDonut(qs('[data-id="donut-last"]'), last3, '#F59E0B',
      Math.round(last3 * 1000) / 10 + '%');
  } catch (err) { showError('renderDonuts: ' + err.message); }
}

/* ============================================================
   Table
   ============================================================ */
function renderTable() {
  try {
    const days = Jalali.jalaaliMonthLength(state.year, state.month);
    const key = monthKey(state.year, state.month);
    const rec = state.records[key] || {};
    const isCurrent = state.today && state.today.jy === state.year && state.today.jm === state.month;
    const todayDay = isCurrent ? state.today.jd : -1;

    /* header days */
    const dh = $('days-header');
    if (dh) {
      let html = '';
      for (let d = 1; d <= days; d++) {
        const dow = dowLetterForJalaliDay(state.year, state.month, d);
        const isToday = d === todayDay ? ' is-today' : '';
        html += `<div class="day-head${isToday}">
          <span class="num">${d}</span>
          <span class="dow">${dow}</span>
        </div>`;
      }
      dh.innerHTML = html;
    }

    setText('panel-count', `(${state.habits.length})`);

    const list = $('habit-list');
    const wrap = $('table-wrap');
    const empty = $('empty-state');
    const foot = $('habit-foot');

    if (!list) return;

    if (!state.habits.length) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      if (wrap) wrap.classList.add('hidden');
      if (foot) foot.innerHTML = '';
      return;
    }
    if (empty) empty.classList.add('hidden');
    if (wrap) wrap.classList.remove('hidden');

    /* rows */
    const editIcon = iconSvg('edit');
    const trashIcon = iconSvg('trash');

    let rows = '';
    state.habits.forEach((h, idx) => {
      const color = colorFor(idx, h);
      const checks = new Set(rec[h.id] || []);
      const g = Math.max(1, Number(h.goal) || 1);
      const done = Math.min(checks.size, g);
      const progress = Math.min(1, checks.size / g);
      const collapsed = state.compactAll || state.collapsed.has(h.id);
      const logoStateVal = logoState(checks.size, g);
      const logoSvg = blockchainSvg(color, logoStateVal);

      rows += `<div class="habit-row${collapsed ? ' is-collapsed' : ''}"
                    data-id="${h.id}" style="--c:${color}">
        <div class="col-habit">
          <button class="habit-logo" data-action="toggle-collapse"
                  data-state="${logoStateVal}"
                  title="${collapsed ? 'باز کردن' : 'جمع کردن'}">${logoSvg}</button>
          <span class="habit-name" title="${escapeHtml(h.name)}">${escapeHtml(h.name)}</span>
          <span class="habit-actions">
            <button class="icon-btn" data-action="edit" title="ویرایش">${editIcon}</button>
            <button class="icon-btn danger" data-action="delete" title="حذف">${trashIcon}</button>
          </span>
        </div>
        <div class="col-goal">${g}</div>
        <div class="col-days" dir="ltr">`;

      for (let d = 1; d <= days; d++) {
        const checked = checks.has(d) ? 'true' : 'false';
        const isToday = d === todayDay ? ' is-today' : '';
        rows += `<button class="day-cell${isToday}" role="checkbox"
          aria-checked="${checked}" data-habit="${h.id}" data-day="${d}"
          aria-label="${escapeHtml(h.name)}، روز ${d}"><span class="day-box"></span></button>`;
      }

      rows += `</div>
        <div class="col-progress">
          <div class="progress-bar">
            <div class="progress-fill${progress >= 1 ? ' is-full' : ''}"
                 style="width:${(progress * 100).toFixed(1)}%"></div>
          </div>
          <span class="progress-text">${done}/${g}</span>
        </div>
      </div>`;
    });
    list.innerHTML = rows;

    /* footer */
    if (foot) {
      let f = `<div class="col-habit">تکمیل روز</div><div class="col-goal"></div>
               <div class="col-days" dir="ltr">`;
      for (let d = 1; d <= days; d++) {
        let count = 0;
        for (const h of state.habits) if ((rec[h.id] || []).includes(d)) count++;
        const isToday = d === todayDay ? ' is-today' : '';
        f += `<div class="day-cell${isToday}" data-count="${count}"><span class="day-box"></span></div>`;
      }
      f += `</div><div class="col-progress"></div>`;
      foot.innerHTML = f;
    }
  } catch (err) { showError('renderTable: ' + err.message); }
}

/* ============================================================
   Totals
   ============================================================ */
function computeTotals() {
  try {
    const key = monthKey(state.year, state.month);
    const rec = state.records[key] || {};
    let done = 0, goal = 0;
    for (const h of state.habits) {
      const checks = rec[h.id] || [];
      const g = Math.max(1, Number(h.goal) || 1);
      goal += g;
      done += Math.min(checks.length, g);
    }
    return { done, goal };
  } catch { return { done: 0, goal: 0 }; }
}

/* ============================================================
   Views
   ============================================================ */
function applyViews() {
  try {
    const setDisp = (id, show) => {
      const el = $(id);
      if (el) el.style.display = show ? '' : 'none';
    };
    setDisp('date-box', state.views.date);
    setDisp('wave-box', state.views.wave);
    setDisp('rate-box', state.views.rate);
    setDisp('habits-panel', state.views.habits);
    setDisp('donuts', state.views.donuts);

    const pt = $('panel-toggle');
    if (pt) pt.setAttribute('aria-expanded', state.panelOpen ? 'true' : 'false');

    toggleClass(document.body, 'hide-date', state.hideDate);
    const tDate = $('toggle-date');
    if (tDate) tDate.checked = !state.hideDate;

    toggleClass(document.body, 'hide-habit-col', state.hideHabitCol);
    const tHabit = $('toggle-habit-col');
    if (tHabit) tHabit.checked = !state.hideHabitCol;

    /* control panel checkboxes sync */
    qsa('[data-view]').forEach((el) => {
      el.checked = !!state.views[el.getAttribute('data-view')];
    });
    const c = $('cmd-compact-all'); if (c) c.checked = state.compactAll;
    const o = $('cmd-no-orbit');    if (o) o.checked = document.body.classList.contains('no-orbit');
    const m = $('cmd-mouse-glow');  if (m) m.checked = !document.body.classList.contains('no-mouse');
  } catch (err) { showError('applyViews: ' + err.message); }
}

function render() {
  const totals = computeTotals();
  renderInfoAndRate(totals);
  renderWave();
  renderTable();
  renderDonuts(totals);
  applyViews();
}

/* ============================================================
   Modal
   ============================================================ */
function openModal(habit) {
  try {
    setText('modal-title', habit ? 'ویرایش عادت' : 'افزودن عادت');
    const idEl = $('habit-id'); if (idEl) idEl.value = habit ? habit.id : '';
    const nameEl = $('habit-name'); if (nameEl) nameEl.value = habit ? habit.name : '';
    const goalEl = $('habit-goal'); if (goalEl) goalEl.value = habit ? habit.goal : 20;
    const m = $('modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    setTimeout(() => { const n = $('habit-name'); if (n) n.focus(); }, 0);
  } catch (err) { showError('openModal: ' + err.message); }
}
function closeModal() {
  const m = $('modal');
  if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
}

/* ============================================================
   Control panel
   ============================================================ */
const cmdPanel = $('cmd-panel');
function openCmd()  { if (cmdPanel) { cmdPanel.classList.add('is-open'); cmdPanel.setAttribute('aria-hidden', 'false'); } }
function closeCmd() { if (cmdPanel) { cmdPanel.classList.remove('is-open'); cmdPanel.setAttribute('aria-hidden', 'true'); } }
function toggleCmd() {
  if (!cmdPanel) return;
  cmdPanel.classList.contains('is-open') ? closeCmd() : openCmd();
}

/* ============================================================
   Events
   ============================================================ */
on(document, 'click', async (e) => {
  try {
    /* toggle day cell */
    const cell = e.target.closest && e.target.closest('.day-cell');
    if (cell && cell.dataset.habit) {
      const habitId = cell.dataset.habit;
      const day = Number(cell.dataset.day);
      const key = monthKey(state.year, state.month);
      if (!state.records[key]) state.records[key] = {};
      if (!state.records[key][habitId]) state.records[key][habitId] = [];
      const arr = state.records[key][habitId];
      const idx = arr.indexOf(day);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(day);
      render();
      api.toggle(key, habitId, day).catch((err) => showError('toggle: ' + err.message));
      return;
    }

    /* habit action */
    const action = e.target.closest && e.target.closest('[data-action]');
    if (action) {
      const row = action.closest('.habit-row');
      const id = row && row.dataset.id;
      if (!id) return;
      const h = state.habits.find((x) => x.id === id);
      if (!h) return;

      if (action.dataset.action === 'toggle-collapse') {
        if (state.compactAll) { state.compactAll = false; state.collapsed.clear(); }
        else if (state.collapsed.has(id)) state.collapsed.delete(id);
        else state.collapsed.add(id);
        lsSet(LS.collapsed, JSON.stringify([...state.collapsed]));
        render();
        return;
      }
      if (action.dataset.action === 'edit') { openModal(h); return; }
      if (action.dataset.action === 'delete') {
        if (confirm(`عادت «${h.name}» حذف بشه؟`)) {
          try {
            await api.deleteHabit(id);
            state.habits = state.habits.filter((x) => x.id !== id);
            state.collapsed.delete(id);
            lsSet(LS.collapsed, JSON.stringify([...state.collapsed]));
            render();
          } catch (err) { showError('delete: ' + err.message); }
        }
        return;
      }
    }

    /* panel toggle */
    if (e.target.closest && e.target.closest('#panel-toggle')) {
      state.panelOpen = !state.panelOpen;
      lsSet(LS.panelOpen, state.panelOpen ? '1' : '0');
      applyViews();
      return;
    }

    /* add / cancel / close modal */
    if (e.target.closest && (e.target.closest('#add-habit') || e.target.closest('#add-first'))) {
      openModal(null); return;
    }
    if (e.target.closest && e.target.closest('#cancel')) closeModal();
    if (e.target.id === 'modal') closeModal();

    /* control panel */
    if (e.target.closest && e.target.closest('#cmd-toggle')) { toggleCmd(); return; }
    if (e.target.closest && e.target.closest('#cmd-close'))  { closeCmd(); return; }
    if (cmdPanel && cmdPanel.classList.contains('is-open')
        && !(e.target.closest && e.target.closest('#cmd-panel'))
        && !(e.target.closest && e.target.closest('#cmd-toggle'))) {
      closeCmd();
    }
  } catch (err) { showError('click handler: ' + err.message); }
});

/* ---------- toolbar switches ---------- */
on($('toggle-date'), 'change', (e) => {
  state.hideDate = !e.target.checked;
  lsSet(LS.hideDate, state.hideDate ? '1' : '0');
  applyViews();
});
on($('toggle-habit-col'), 'change', (e) => {
  state.hideHabitCol = !e.target.checked;
  lsSet(LS.hideHabitCol, state.hideHabitCol ? '1' : '0');
  applyViews();
});

/* ---------- views checkboxes ---------- */
qsa('[data-view]').forEach((el) => {
  on(el, 'change', () => {
    state.views[el.getAttribute('data-view')] = el.checked;
    lsSet(LS.views, JSON.stringify(state.views));
    applyViews();
  });
});

on($('cmd-compact-all'), 'change', (e) => {
  state.compactAll = e.target.checked;
  lsSet(LS.compactAll, state.compactAll ? '1' : '0');
  render();
});
on($('cmd-no-orbit'), 'change', (e) => {
  document.body.classList.toggle('no-orbit', e.target.checked);
  lsSet(LS.noOrbit, e.target.checked ? '1' : '0');
});
on($('cmd-mouse-glow'), 'change', (e) => {
  document.body.classList.toggle('no-mouse', !e.target.checked);
  lsSet(LS.noMouse, e.target.checked ? '0' : '1');
});

/* ---------- keyboard ---------- */
on(document, 'keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault(); toggleCmd(); return;
  }
  if (e.key === 'Escape') {
    const m = $('modal');
    if (m && !m.classList.contains('hidden')) closeModal();
    else if (cmdPanel && cmdPanel.classList.contains('is-open')) closeCmd();
  }
});

/* ---------- mouse glow ---------- */
on(document, 'mousemove', (e) => {
  document.documentElement.style.setProperty('--mx', e.clientX + 'px');
  document.documentElement.style.setProperty('--my', e.clientY + 'px');
});

/* ---------- form submit ---------- */
on($('habit-form'), 'submit', async (e) => {
  e.preventDefault();
  try {
    const nameEl = $('habit-name');
    const goalEl = $('habit-goal');
    const idEl = $('habit-id');
    const name = (nameEl && nameEl.value || '').trim();
    const goal = Number(goalEl && goalEl.value) || 1;
    if (!name) return;
    const id = idEl && idEl.value;

    if (id) {
      await api.updateHabit(id, name, goal);
      const h = state.habits.find((x) => x.id === id);
      if (h) { h.name = name; h.goal = goal; }
    } else {
      const res = await api.addHabit(name, goal);
      if (res && res.habit) state.habits.push(res.habit);
      else if (res && res.error) { showError(res.error); return; }
    }
    closeModal();
    render();
  } catch (err) { showError('submit: ' + err.message); }
});

/* ============================================================
   Init
   ============================================================ */
(async function init() {
  try {
    /* restore UI-only state from LS */
    if (lsGet(LS.noOrbit, '0') === '1') document.body.classList.add('no-orbit');
    if (lsGet(LS.noMouse, '0') === '1') document.body.classList.add('no-mouse');

    /* brand logo */
    renderBrandLogo();

    /* icons */
    await loadIcons();
    applyIcons();

    /* today */
    const now = new Date();
    const j = Jalali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    state.today = j;
    state.year = j.jy;
    state.month = j.jm;

    /* data */
    try {
      const data = await api.getData();
      state.habits = Array.isArray(data.habits) ? data.habits : [];
      state.records = data.records && typeof data.records === 'object' ? data.records : {};
    } catch (err) {
      showError('بارگذاری داده ناموفق: ' + err.message);
    }

    buildSelectors();
    render();

    /* sync control panel checkboxes with LS state on boot */
    const c = $('cmd-compact-all'); if (c) c.checked = state.compactAll;
  } catch (err) {
    showError('init: ' + err.message);
    console.error(err);
  }
})();