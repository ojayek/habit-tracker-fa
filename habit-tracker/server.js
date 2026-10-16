'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const path = require('path');
const fs = require('fs');

/* ============================================================
   thesvg — لود تمام آیکون‌ها از پکیج (با fallback ایمن)
   ============================================================ */
let ICONS = {};
(function loadThesvg() {
  try {
    const mod = require('thesvg');
    const seen = new WeakSet();

    const harvest = (src, depth = 0) => {
      if (!src || depth > 3) return;
      if (typeof src === 'string') return;
      if (typeof src !== 'object' && typeof src !== 'function') return;
      if (seen.has(src)) return;
      seen.add(src);

      for (const key of Object.keys(src)) {
        let v;
        try { v = src[key]; } catch { continue; }

        if (typeof v === 'string' && v.includes('<svg')) {
          if (!ICONS[key]) ICONS[key] = v;
        } else if (v && typeof v === 'object') {
          if (typeof v.svg === 'string' && v.svg.includes('<svg')) ICONS[key] = v.svg;
          else if (typeof v.content === 'string' && v.content.includes('<svg')) ICONS[key] = v.content;
          else if (typeof v.path === 'string') {
            ICONS[key] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${v.path}"/></svg>`;
          } else harvest(v, depth + 1);
        } else if (typeof v === 'function') {
          try {
            const r = v();
            if (typeof r === 'string' && r.includes('<svg')) ICONS[key] = r;
          } catch { /* ignore */ }
        }
      }
    };

    harvest(mod);
    harvest(mod && mod.icons);
    harvest(mod && mod.default);
    harvest(mod && mod.default && mod.default.icons);

    const count = Object.keys(ICONS).length;
    if (count > 0) console.log(`🎨 thesvg: ${count}   LOADED icon Fully OJAYEK`);
    else console.log('🎨 thesvg نصب است ولی ساختار export ناشناخته — fallback فعال');
  } catch (e) {
    console.warn('⚠️  thesvg نصب نیست — fallback داخلی استفاده می‌شود');
  }
})();

/* ============================================================
   Store — JSON atomic
   ============================================================ */
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { habits: [], records: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
    };
  } catch (err) {
    console.error('loadData failed:', err.message);
    return { habits: [], records: {} };
  }
}

function saveData(data) {
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.error('saveData failed:', err.message);
  }
}

/* ============================================================
   App
   ============================================================ */
const app = new Koa();
const router = new Router();

/* error boundary */
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message || 'internal error' };
    console.error('❌', err.message);
  }
});

/* Basic Auth */
if (process.env.AUTH_USER && process.env.AUTH_PASS) {
  app.use(async (ctx, next) => {
    const h = ctx.headers.authorization;
    const fail = () => {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic realm="Habit Tracker"');
      ctx.body = 'Auth required';
    };
    if (!h || !h.startsWith('Basic ')) return fail();
    const [u, p] = Buffer.from(h.slice(6), 'base64').toString().split(':');
    if (u !== process.env.AUTH_USER || p !== process.env.AUTH_PASS) return fail();
    await next();
  });
}

/* ============================================================
   API
   ============================================================ */
router.get('/api/data', (ctx) => {
  ctx.body = loadData();
});

router.get('/api/icons', (ctx) => {
  ctx.body = ICONS;
  ctx.set('Cache-Control', 'public, max-age=3600');
});

router.post('/api/habits', (ctx) => {
  const data = loadData();
  const { name, goal } = ctx.request.body || {};
  if (!name || !String(name).trim()) {
    ctx.status = 400;
    ctx.body = { error: 'نام عادت الزامی است' };
    return;
  }
  const habit = {
    id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: String(name).trim(),
    goal: Math.max(1, Math.min(31, Number(goal) || 1)),
  };
  data.habits.push(habit);
  saveData(data);
  ctx.body = { ok: true, habit };
});

router.put('/api/habits/:id', (ctx) => {
  const data = loadData();
  const h = data.habits.find((x) => x.id === ctx.params.id);
  if (!h) { ctx.status = 404; ctx.body = { error: 'habit not found' }; return; }
  const { name, goal } = ctx.request.body || {};
  if (name !== undefined && String(name).trim()) h.name = String(name).trim();
  if (goal !== undefined) h.goal = Math.max(1, Math.min(31, Number(goal) || 1));
  saveData(data);
  ctx.body = { ok: true, habit: h };
});

router.delete('/api/habits/:id', (ctx) => {
  const data = loadData();
  const id = ctx.params.id;
  data.habits = data.habits.filter((x) => x.id !== id);
  for (const k of Object.keys(data.records)) {
    if (data.records[k]) delete data.records[k][id];
  }
  saveData(data);
  ctx.body = { ok: true };
});

router.post('/api/toggle', (ctx) => {
  const { monthKey, habitId, day } = ctx.request.body || {};
  if (!monthKey || !habitId || !day) {
    ctx.status = 400;
    ctx.body = { error: 'missing fields' };
    return;
  }
  const data = loadData();
  if (!data.records[monthKey]) data.records[monthKey] = {};
  if (!data.records[monthKey][habitId]) data.records[monthKey][habitId] = [];
  const arr = data.records[monthKey][habitId];
  const idx = arr.indexOf(Number(day));
  if (idx >= 0) arr.splice(idx, 1); else arr.push(Number(day));
  arr.sort((a, b) => a - b);
  saveData(data);
  ctx.body = { ok: true, checks: arr };
});

/* 404 fallback */
app.use(async (ctx, next) => {
  await next();
  if (ctx.status === 404 && !ctx.body) {
    ctx.body = { error: 'not found', path: ctx.path };
  }
});

app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));
app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  http://localhost:${PORT}`);
});