// Japon 2027 — "La Ligne". The whole trip, from today to the flight home, is one rail line:
// preparation months and travel days are stations; Budget, Valise and Guide open as drawers.
(() => {
  const T = window.TRIP;
  const KEY = "japon2027:v1";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = () => matchMedia("(max-width: 1000px)").matches;

  // ---------- state (same shape as v1/v2, so saved progress carries over) ----------
  const defaults = () => ({
    items: {}, extra: {}, removed: {}, notes: {},
    tasks: {}, customTasks: [],
    expenses: [], rate: 165,
    packing: {}, customPack: {}, removedPack: {}, packCat: T.packing[0].cat,
    fuji: null, theme: null, sel: null,
  });
  let S;
  try { S = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { S = defaults(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  const ui = { sel: S.sel, drawer: null, lastDrawer: "budget", sheet: false, cur: "EUR", guide: "carte", boot: true };

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const d = (iso) => new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  const qsToday = new URLSearchParams(location.search).get("today");
  const today = () => { const t = qsToday ? d(qsToday) : new Date(); t.setHours(0, 0, 0, 0); return t; };
  const isoDay = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const fmt = (iso, o) => d(iso).toLocaleDateString("fr-FR", o);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pad2 = (n) => String(n).padStart(2, "0");
  const eur = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const daysUntil = (iso) => Math.round((d(iso) - today()) / 864e5);
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const isPlace = (t) => !t.startsWith("!");
  const clean = (t) => t.replace(/^!/, "");
  const enc = encodeURIComponent;
  const mapsUrl = (q, city) => `https://www.google.com/maps/search/?api=1&query=${enc(`${q}, ${city}, Japan`)}`;
  const NF = { eur: (v) => Math.round(v).toLocaleString("fr-FR") + " €", int: (v) => Math.round(v).toLocaleString("fr-FR") };
  const num = (v, f = "int") => `<span class="num" data-v="${v}" data-f="${f}">${NF[f](v)}</span>`;

  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    yen: '<path d="M7 4l5 7 5-7M12 11v9M8 13h8M8 16.5h8"/>',
    bag: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M9 7V5a3 3 0 0 1 6 0v2M4 12h16"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
    line: '<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="6" cy="12" r="2.5"/><path d="M6 7.5v2M6 14.5v2M11 5h9M11 12h9M11 19h6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    tick: '<path d="m5 12 5 5 9-10"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="4"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    down: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
    up: '<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>',
    check: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  };
  const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const checkbox = (act, id, on, label, c) => `
    <label class="ck"${c ? ` style="--c:${c}"` : ""}>
      <input type="checkbox" data-act="${act}" data-id="${esc(id)}"${on ? " checked" : ""}>
      <span class="box"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span>
      <span class="lbl">${label}</span>
    </label>`;
  const ring = (p, label, c, size) => `<span class="ring" style="--to:${p}${c ? `;--c:${c}` : ""}${size ? `;--s:${size}px` : ""}" data-l="${label}"></span>`;
  const bar = (p, c, over) => `<div class="bar"${c ? ` style="--c:${c}"` : ""}><i style="--w:${Math.min(p, 100)}${over ? ";background:var(--red)" : ""}"></i></div>`;

  const toastEl = $("#toast");
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200); };
  const buzz = () => { try { navigator.vibrate?.(8); } catch {} };

  // ---------- derived data ----------
  const dayItems = (day) => day.items.map((text, i) => ({ id: `${day.date}#${i}`, text })).filter((it) => !S.removed[it.id])
    .concat((S.extra[day.date] || []).map((x) => ({ ...x, custom: true })));
  const allTasks = () => T.tasks.concat(S.customTasks.map((t) => ({ ...t, cat: "Perso", custom: true }))).sort((a, b) => a.due.localeCompare(b.due));
  const packItems = (cat) => (T.packing.find((p) => p.cat === cat)?.items || []).map((text, i) => ({ id: `${cat}#${i}`, text })).filter((it) => !S.removedPack[it.id])
    .concat((S.customPack[cat] || []).map((x) => ({ ...x, custom: true })));
  const toEur = (e) => (e.currency === "JPY" ? e.amount / (S.rate || 165) : e.amount);
  const spentBy = () => { const m = Object.fromEntries(T.budget.cats.map((c) => [c.id, 0])); for (const e of S.expenses) m[e.cat] = (m[e.cat] || 0) + toEur(e); return m; };
  const catOf = (id) => T.budget.cats.find((c) => c.id === id) || T.budget.cats[T.budget.cats.length - 1];
  const climateFor = (city) => T.climate.find((c) => city.startsWith(c.city.split(" ")[0]));
  const phase = () => { const t = isoDay(today()); return t < T.days[0].date ? "before" : t > T.days[T.days.length - 1].date ? "after" : "during"; };
  function stats() {
    const tasks = allTasks();
    let pTotal = 0, pDone = 0;
    for (const p of T.packing) for (const it of packItems(p.cat)) { pTotal++; if (S.packing[it.id]) pDone++; }
    return { tasks: tasks.length, tDone: tasks.filter((t) => S.tasks[t.id]).length, pTotal, pDone, spent: S.expenses.reduce((s, e) => s + toEur(e), 0) };
  }

  // ---------- the line ----------
  const LINES = {
    p: { jp: "準備", name: "Préparation", code: "PR", c: "var(--lp)" },
    0: { jp: "出発", name: "Départ", code: "DP", c: "var(--l0)" },
    1: { jp: "東京", name: "Tokyo & excursions", code: "TK", c: "var(--l1)" },
    2: { jp: "関西", name: "Kansai", code: "KS", c: "var(--l2)" },
    3: { jp: "東京", name: "Retour Tokyo", code: "RT", c: "var(--l3)" },
  };
  const lastDayOf = (m) => { const [y, mo] = m.split("-").map(Number); return isoDay(new Date(y, mo, 0)); };
  function stations() {
    const out = [];
    const months = {};
    for (const t of allTasks()) (months[t.due.slice(0, 7)] ||= []).push(t);
    Object.keys(months).sort().forEach((m, i) => {
      const tasks = months[m];
      out.push({ id: "p-" + m, kind: "prep", line: "p", no: i + 1, start: m + "-01", end: lastDayOf(m), kanji: +m.slice(5) + "月",
        ro: `${cap(fmt(m + "-01", { month: "long" }))} ${m.slice(0, 4)}`, sub: `${tasks.length} étape${tasks.length > 1 ? "s" : ""} de préparation`,
        tasks, done: tasks.filter((t) => S.tasks[t.id]).length, total: tasks.length });
    });
    const n = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const day of T.days) {
      const its = dayItems(day);
      out.push({ id: day.date, kind: "day", line: day.block, no: ++n[day.block], start: day.date, end: day.date, kanji: day.kanji, ro: day.title,
        sub: `${cap(fmt(day.date, { weekday: "long", day: "numeric", month: "long" }))} · ${day.city}`, day, items: its,
        done: its.filter((it) => S.items[it.id]).length, total: its.length });
    }
    out.forEach((s, i) => { s.i = i; s.code = LINES[s.line].code; s.c = LINES[s.line].c; s.complete = s.total > 0 && s.done === s.total; });
    return out;
  }
  function whereNow(st) {
    const t = isoDay(today());
    const here = st.find((s) => s.start <= t && t <= s.end) || null;
    const ni = st.findIndex((s) => s.end >= t);
    return { t, here, nextIdx: ni < 0 ? st.length : ni };
  }
  const codeOf = (s) => `${s.code}${pad2(s.no)}`;

  // ---------- DOM morph: patch in place so transitions keep running ----------
  let changedNums = [];
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    const oldVal = a.getAttribute("value");
    const oldNum = a.classList.contains("num") ? +a.dataset.v : null;
    const keepEnter = a.classList.contains("enter");
    for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    if (keepEnter) a.classList.add("enter");
    if (a.hasAttribute("data-keep")) return;
    if (oldNum !== null) { if (oldNum !== +b.dataset.v) changedNums.push([a, oldNum]); return; }
    const focused = document.activeElement === a;
    if (a.tagName === "INPUT") {
      if (a.type === "checkbox") a.checked = b.hasAttribute("checked");
      else if (a.type !== "file" && !focused && oldVal !== b.getAttribute("value")) a.value = b.getAttribute("value") ?? "";
      return;
    }
    if (a.tagName === "TEXTAREA") { if (!focused && a.value !== b.textContent) a.value = b.textContent; return; }
    if (a.tagName === "SELECT") { const v = a.value; morphChildren(a, b); a.value = v; return; }
    morphChildren(a, b);
  }
  function morphChildren(a, b) {
    const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
    const keyed = new Map(), loose = [];
    for (const n of a.childNodes) { const k = keyOf(n); k ? keyed.set(k, n) : loose.push(n); }
    const next = [...b.childNodes];
    let li = 0;
    next.forEach((nb, i) => {
      const k = keyOf(nb);
      const na = k ? keyed.get(k) : loose[li++];
      if (k) keyed.delete(k);
      const ref = a.childNodes[i] || null;
      if (!na || (k && na.nodeName !== nb.nodeName)) {
        a.insertBefore(nb, ref);
        if (k && nb.nodeType === 1 && !ui.boot) nb.classList.add("enter");
        return;
      }
      if (na !== ref) a.insertBefore(na, ref);
      morph(na, nb);
    });
    while (a.childNodes.length > next.length) a.lastChild.remove();
  }

  // ---------- effects ----------
  function countUp(el, from) {
    const to = +el.dataset.v, f = NF[el.dataset.f] || NF.int;
    if (RM || from === to) { el.textContent = f(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      if (+el.dataset.v !== to) return;
      const k = Math.min(1, (t - t0) / 800);
      el.textContent = f(k === 1 ? to : from + (to - from) * (1 - Math.pow(2, -10 * k)));
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  let fxCanvas, fxParts = [], fxRun = false;
  function confetti(x, y, n = 60) {
    if (RM) return;
    if (!fxCanvas) {
      if (!document.createElement("canvas").getContext?.("2d")) return;
      fxCanvas = document.createElement("canvas"); fxCanvas.className = "fx"; document.body.appendChild(fxCanvas);
    }
    const dpr = devicePixelRatio || 1;
    fxCanvas.width = innerWidth * dpr; fxCanvas.height = innerHeight * dpr;
    const css = getComputedStyle(document.documentElement);
    const cols = ["--red", "--lp", "--l1", "--l2", "--l3", "--amber"].map((v) => css.getPropertyValue(v).trim());
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
      fxParts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: Math.random() * 3, vr: (Math.random() - .5) * .4, w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, c: cols[i % cols.length], life: 1 });
    }
    if (!fxRun) { fxRun = true; requestAnimationFrame(fxStep); }
  }
  function fxStep() {
    const ctx = fxCanvas.getContext("2d"), dpr = devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    fxParts = fxParts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of fxParts) {
      p.vy += .28; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .009;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)); ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); ctx.restore();
    }
    if (fxParts.length) requestAnimationFrame(fxStep); else { fxRun = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  const burstAt = (el, n) => { if (!el) return; const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, n); };

  // ---------- views ----------
  function topBar(st, w) {
    const s = stats();
    const dark = document.documentElement.dataset.theme === "dark";
    let door = "";
    st.forEach((x, i) => {
      if (!w.here && i === w.nextIdx) door += `<span class="here" title="Vous êtes ici"></span>`;
      door += `<span class="dd ${x.end < w.t ? "past" : ""} ${x.complete ? "done" : ""} ${x.id === ui.sel ? "sel" : ""}" style="--c:${x.c}" data-act="sel" data-id="${x.id}" title="${codeOf(x)} · ${esc(x.ro)}"><i></i></span>`;
    });
    return `<header class="top">
      <a class="logo" href="#/" data-act="home"><span class="mk"></span><span><b>JAPON</b> 2027</span></a>
      <div class="door">${door}</div>
      <nav class="dock">
        <button class="dk" data-act="pal" aria-label="Rechercher">${ic("search")}<span>Rechercher</span><kbd>Ctrl K</kbd></button>
        <a class="dk ${ui.drawer === "budget" ? "on" : ""}" href="#/budget">${ic("yen")}<span>Budget</span><em>${eur(s.spent)}</em></a>
        <a class="dk ${ui.drawer === "valise" ? "on" : ""}" href="#/valise">${ic("bag")}<span>Valise</span><em>${s.pDone}/${s.pTotal}</em></a>
        <a class="dk ${ui.drawer === "guide" ? "on" : ""}" href="#/guide">${ic("book")}<span>Guide</span></a>
        <button class="dk icon" data-act="theme" aria-label="Changer de thème">${ic(dark ? "sun" : "moon")}</button>
      </nav>
    </header>`;
  }

  function boardView(st, w) {
    const ph = phase();
    const next = allTasks().filter((t) => !S.tasks[t.id]);
    const ticker = [];
    let lab, dest, sub, groups;
    if (ph === "before") {
      lab = "Prochain départ"; dest = `<span class="jp">東京</span>TOKYO`; sub = "FRA 19:50 → PEK → HND · SAM 03 JUIL 2027";
      groups = [["jours", 3], ["h", 2], ["min", 2], ["sec", 2]];
      next.slice(0, 3).forEach((t) => { const n = daysUntil(t.due); ticker.push(`${n < 0 ? "EN RETARD" : "J-" + n} · ${t.title}`); });
    } else if (ph === "during") {
      const s = w.here, idx = T.days.indexOf(s.day);
      lab = `Jour ${idx} / ${T.days.length - 1} · ${codeOf(s)}`; dest = `<span class="jp">${s.kanji}</span>${esc(s.ro.toUpperCase())}`; sub = s.day.city.toUpperCase() + " · HEURE DE TOKYO →";
      groups = [["h", 2], ["min", 2], ["sec", 2]];
      ticker.push(s.day.tip);
      const tom = T.days[idx + 1]; if (tom) ticker.push(`Demain · ${tom.title} (${tom.city})`);
    } else { lab = "Terminus"; dest = `<span class="jp">おかえり</span>BON RETOUR`; sub = "20 NUITS · 6 VOYAGEURS · 11 VILLES"; groups = []; }
    const s = stats();
    ticker.push(S.fuji ? `Fuji · ${T.fuji.find((f) => f.id === S.fuji).name} ✓` : "Fuji · format de l'ascension à trancher à six");
    ticker.push(`Budget sur place · ${eur(s.spent)} / ${eur(T.budget.cap)}`);
    ticker.push(`Valise · ${s.pDone}/${s.pTotal} objets prêts`);
    ticker.push("Pas de pourboire au Japon, jamais");
    const tk = ticker.map((x) => `<span>◆ ${esc(x)}</span>`).join("");
    return `<section class="board">
      <div class="b-row">
        <div><div class="b-lab">${lab}</div><div class="b-dest">${dest}</div><div class="b-sub">${sub}</div></div>
        ${groups.length ? `<div class="cd" id="cd" data-keep>${groups.map(([l, n]) => `<div class="fg"><div class="fl">${"<span class='flap'>0</span>".repeat(n)}</div><small>${l.toUpperCase()}</small></div>`).join("")}</div>` : ""}
      </div>
      <div class="b-tick"><span class="b-tag">INFO</span><div class="b-marq"><div class="b-marq-in">${tk}${tk}</div></div></div>
    </section>`;
  }

  function lineView(st, w) {
    let html = "", last = null;
    const hereRow = () => `<div class="here-row" data-key="here" style="--i:0"><span class="hn">${ic("train")}</span><div><b>Vous êtes ici</b><small>${cap(fmt(w.t, { weekday: "long", day: "numeric", month: "long" }))}${phase() === "before" ? ` · J-${daysUntil(T.days[0].date)} avant le départ` : ""}</small></div></div>`;
    st.forEach((s, i) => {
      if (s.line !== last) {
        last = s.line;
        const L = LINES[s.line], grp = st.filter((x) => x.line === s.line);
        const a = grp[0], z = grp[grp.length - 1];
        const range = s.line === "p" ? `${cap(fmt(a.start, { month: "short", year: "numeric" }))} → ${fmt(z.start, { month: "short", year: "numeric" })}` : a === z ? fmt(a.start, { day: "numeric", month: "long" }) : `${fmt(a.start, { day: "numeric" })} → ${fmt(z.start, { day: "numeric", month: "long" })}`;
        html += `<div class="seg" style="--c:${L.c};--i:${i}" data-key="seg-${s.line}"><span class="jp">${L.jp}</span><div><b>${L.name}</b><small>${range} · ${grp.length} gare${grp.length > 1 ? "s" : ""}</small></div></div>`;
      }
      if (!w.here && i === w.nextIdx) html += hereRow();
      const past = s.end < w.t, here = w.here === s;
      html += `<button class="stop ${past ? "past" : ""} ${s.complete ? "done" : ""} ${ui.sel === s.id ? "sel" : ""} ${here ? "here" : ""}" style="--c:${s.c};--i:${i}" data-act="sel" data-id="${s.id}" data-key="st-${s.id}" id="st-${s.id}">
        <span class="code"><small>${s.code}</small><b>${pad2(s.no)}</b></span>
        <span class="node">${here ? ic("train") : ""}</span>
        <span class="info"><span class="t"><span class="jp">${s.kanji}</span>${esc(s.ro)}</span><span class="d">${s.kind === "day" ? `${cap(fmt(s.start, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(s.day.city)}` : esc(s.sub)}${s.day?.event ? ` · <em>${s.day.event}</em>` : ""}</span></span>
        <span class="prog">${s.complete ? ic("check") : `${s.done}/${s.total}`}</span>
      </button>`;
    });
    if (!w.here && w.nextIdx >= st.length) html += hereRow();
    return `<div class="line ${ui.boot ? "boot" : ""}">${html}</div>`;
  }

  function stationView(st, w) {
    const s = st.find((x) => x.id === ui.sel) || st[0];
    const prev = st[s.i - 1], next = st[s.i + 1];
    return `<aside class="station ${ui.sheet ? "open" : ""}" id="station" aria-label="Gare ${esc(s.ro)}">
      <div class="st-grab"><button data-act="sheet-close" aria-label="Fermer">${ic("x")}</button></div>
      <div class="sign" style="--c:${s.c}">
        <div class="sign-top">
          <span class="badge"><small>${s.code}</small><b>${pad2(s.no)}</b></span>
          <div class="names"><div class="jp">${s.kanji}</div><div class="ro">${esc(s.ro)}</div><div class="fr">${esc(s.sub)}</div></div>
          ${ring(pct(s.done, s.total), `${s.done}/${s.total}`, s.c, 64)}
        </div>
        <div class="sign-bar">
          ${prev ? `<button data-act="sel" data-id="${prev.id}">${ic("left")}<span class="jp">${prev.kanji}</span><span>${esc(prev.ro)}</span></button>` : "<span></span>"}
          ${next ? `<button data-act="sel" data-id="${next.id}"><span>${esc(next.ro)}</span><span class="jp">${next.kanji}</span>${ic("right")}</button>` : "<span></span>"}
        </div>
      </div>
      <div class="st-body" data-key="body-${s.id}">${s.kind === "prep" ? prepBody(s) : dayBody(s)}</div>
    </aside>`;
  }

  const statusTag = (t) => {
    if (S.tasks[t.id]) return `<span class="tag ok">Fait</span>`;
    const n = daysUntil(t.due);
    if (n < 0) return `<span class="tag late">En retard de ${-n} j</span>`;
    if (n <= 30) return `<span class="tag warn">Dans ${n} j</span>`;
    return `<span class="tag">${fmt(t.due, { day: "numeric", month: "short" })}</span>`;
  };
  function prepBody(s) {
    const m = s.id.slice(2);
    const t = isoDay(today());
    const def = `${m}-15` >= t ? `${m}-15` : isoDay(new Date(Date.now() + 7 * 864e5));
    return `
      <section class="blk"><h3>Étapes du mois <span>${s.done}/${s.total}</span></h3>
        <div class="checks">${s.tasks.map((x) => `<div class="crow" data-key="${x.id}">
          <div class="grow">${checkbox("task", x.id, S.tasks[x.id], `<span>${esc(x.title)}</span>${x.detail ? `<small>${esc(x.detail)}</small>` : ""}`, s.c)}
            <div class="tags" style="margin-left:34px"><span class="tag">${x.cat}</span>${statusTag(x)}</div></div>
          ${x.custom ? `<button class="ibtn rm" data-act="rm-task" data-id="${x.id}" aria-label="Supprimer">${ic("x")}</button>` : ""}
        </div>`).join("")}</div>
        <form class="add" data-act="add-task">
          <input type="text" name="title" placeholder="Ajouter une étape…" autocomplete="off" required>
          <input type="date" name="due" value="${def}" required aria-label="Échéance">
          <button aria-label="Ajouter">${ic("plus")}</button>
        </form>
      </section>
      <div class="tip" style="--c:${s.c}"><span class="tip-k"><span class="jp">準備</span>Le mot du chef de gare</span><p>${s.total === s.done ? "Gare bouclée. Le train peut repartir !" : "Coche chaque étape une fois faite : la gare se remplit et le train avance vers le Japon."}</p></div>`;
  }
  function dayBody(s) {
    const day = s.day, c = s.c, city = day.city.split(" ")[0];
    const clim = climateFor(day.city);
    const places = s.items.filter((it) => isPlace(it.text)).map((it) => `${clean(it.text)}, ${city}, Japan`);
    const dir = places.length >= 2 ? `https://www.google.com/maps/dir/?api=1&travelmode=transit&origin=${enc(places[0])}&destination=${enc(places[places.length - 1])}${places.length > 2 ? `&waypoints=${places.slice(1, -1).slice(0, 8).map(enc).join("%7C")}` : ""}` : null;
    const exps = S.expenses.filter((e) => e.date === day.date);
    const spent = exps.reduce((a, e) => a + toEur(e), 0);
    return `
      <div class="pills">
        ${clim ? `<span class="pill">${ic("thermo")}${clim.hi}° / ${clim.lo}° · ${esc(clim.note)}</span>` : ""}
        ${day.event ? `<span class="pill red">${ic("star")}${day.event}</span>` : ""}
        ${dir ? `<a class="pill" href="${dir}" target="_blank" rel="noopener">${ic("route")}Parcours du jour dans Maps</a>` : ""}
      </div>
      ${day.tip ? `<div class="tip" style="--c:${c}"><span class="tip-k"><span class="jp">駅長</span>Le mot du chef de gare</span><p>${esc(day.tip)}</p></div>` : ""}
      ${s.line === 0 ? departBlock(c) : ""}
      <section class="blk"><h3>Au programme <span>${s.done}/${s.total}</span></h3>
        <div class="checks">${s.items.map((it) => `<div class="crow" data-key="${esc(it.id)}">
          <div class="grow">${checkbox("item", it.id, S.items[it.id], `<span>${esc(clean(it.text))}</span>`, c)}</div>
          ${isPlace(it.text) ? `<a class="ibtn" href="${mapsUrl(clean(it.text), city)}" target="_blank" rel="noopener" title="Voir sur Google Maps" aria-label="${esc(clean(it.text))} sur Google Maps">${ic("pin")}</a>` : ""}
          <button class="ibtn rm" data-act="rm-item" data-day="${day.date}" data-id="${esc(it.id)}" aria-label="Retirer">${ic("x")}</button>
        </div>`).join("")}</div>
        <form class="add" data-act="add-item" data-id="${day.date}">
          <input type="text" name="t" placeholder="Ajouter une activité…" autocomplete="off">
          <button aria-label="Ajouter">${ic("plus")}</button>
        </form>
      </section>
      <div class="two">
        <section class="blk"><h3>Dépenses du jour <span>${eur(spent)}</span></h3>
          ${exps.length ? exps.map(expRow).join("") : '<p class="empty">Rien pour l\'instant.</p>'}
          ${expForm(day.date)}
        </section>
        <section class="blk"><h3>Notes</h3>
          <textarea data-act="note" data-id="${day.date}" placeholder="Adresses, horaires, idées…">${esc(S.notes[day.date] || "")}</textarea>
        </section>
      </div>`;
  }
  function departBlock(c) {
    const docs = packItems("Documents");
    return `<section class="blk"><h3>Vols · Air China <span>~941 € / pers</span></h3>
        <div class="legs">${T.flights.map((f) => `<div class="leg"><b>${f.from}</b><span class="ln"></span><b>${f.to}</b><small>${f.when} · ${f.note}</small></div>`).join("")}</div>
      </section>
      <section class="blk"><h3>Dans le sac avant de partir <span>${docs.filter((x) => S.packing[x.id]).length}/${docs.length}</span></h3>
        <div class="checks">${docs.map((it) => `<div class="crow" data-key="${esc(it.id)}"><div class="grow">${checkbox("pack", it.id, S.packing[it.id], `<span>${esc(it.text)}</span>`, c)}</div></div>`).join("")}</div>
      </section>`;
  }
  const expRow = (e) => {
    const c = catOf(e.cat);
    return `<div class="erow" data-key="${e.id}"><div class="grow"><div class="t">${esc(e.label)}</div><div class="d"><span class="dot" style="--c:${c.color}"></span>${c.label}${e.currency === "JPY" ? ` · ¥${e.amount.toLocaleString("fr-FR")}` : ""}${ui.drawer ? ` · ${fmt(e.date, { day: "numeric", month: "short" })}` : ""}</div></div>
      <b>${toEur(e).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</b><button class="ibtn rm" style="opacity:1" data-act="rm-exp" data-id="${e.id}" aria-label="Supprimer">${ic("x")}</button></div>`;
  };
  const expForm = (date) => `
    <form class="expf ${date ? "" : "wide"}" data-act="add-exp" data-date="${date || ""}">
      <input type="text" name="label" placeholder="Ramen, metro…" required autocomplete="off" aria-label="Quoi">
      <input type="number" name="amount" min="0" step="${ui.cur === "EUR" ? "0.01" : "1"}" required inputmode="decimal" placeholder="${ui.cur === "EUR" ? "€" : "¥"}" aria-label="Montant">
      ${date ? "" : `<select name="cat" aria-label="Catégorie">${T.budget.cats.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select><input type="date" name="date" value="${isoDay(today())}" aria-label="Date">`}
      <button class="btn">${ic("plus")}</button>
      ${date ? `<select name="cat" aria-label="Catégorie" style="grid-column:1/-2">${T.budget.cats.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select>` : ""}
      <div class="seg2" ${date ? "" : 'style="grid-column:1/-1;justify-self:start"'}>${["EUR", "JPY"].map((c) => `<button type="button" data-act="cur" data-id="${c}" aria-pressed="${ui.cur === c}">${c === "EUR" ? "€" : "¥"}</button>`).join("")}</div>
    </form>`;

  // ---------- drawers ----------
  function drawerView() {
    const dw = ui.drawer || ui.lastDrawer;
    const titles = { budget: ["予算", "Budget"], valise: ["荷物", "Valise"], guide: ["案内", "Guide"] };
    const body = dw === "budget" ? budgetView() : dw === "valise" ? packView() : guideView();
    return `<div class="drawer ${ui.drawer ? "open" : ""}" id="drawer">
      <div class="scrim" data-act="close"></div>
      <section class="panel" role="dialog" aria-label="${titles[dw][1]}" ${ui.drawer ? "" : "inert"}>
        <header class="p-head"><span class="jp">${titles[dw][0]}</span><h2>${titles[dw][1]}</h2><button class="x" data-act="close" aria-label="Fermer">${ic("x")}</button></header>
        <div class="p-body" data-key="pb-${dw}">${body}</div>
      </section>
    </div>`;
  }
  function budgetView() {
    const s = stats(), by = spentBy();
    const est = T.budget.cats.reduce((a, c) => a + c.est, 0);
    const max = Math.max(T.budget.cap, s.spent) * 1.06;
    const t = isoDay(today());
    const trip = T.days.slice(1);
    const per = Object.fromEntries(trip.map((x) => [x.date, 0]));
    for (const e of S.expenses) if (e.date in per) per[e.date] += toEur(e);
    const tripSpent = Object.values(per).reduce((a, b) => a + b, 0);
    const dmax = Math.max(60, ...Object.values(per));
    const left = trip.filter((x) => x.date >= t).length || trip.length;
    const exps = [...S.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return `
      <section class="blk">
        <h3>Dépensé sur place <span>plafond ${eur(T.budget.cap)}</span></h3>
        <div class="big">${num(s.spent, "eur")} <small>/ ${eur(T.budget.cap)}</small></div>
        <div class="meter"><div class="fill ${s.spent > T.budget.cap ? "over" : ""}" style="--w:${(s.spent / max) * 100}"></div>
          <div class="mk t" style="left:${(est / max) * 100}%"><span>Estimé ${eur(est)}</span></div>
          <div class="mk" style="left:${(T.budget.cap / max) * 100}%"><span>Plafond</span></div></div>
        <div class="kpis">
          <div class="kpi"><b>${num(Math.max(0, (T.budget.cap - s.spent) / left), "eur")}</b><span>par jour pour tenir</span></div>
          <div class="kpi"><b>${num(T.budget.cap - s.spent, "eur")}</b><span>restant</span></div>
          <div class="kpi"><b>${eur(T.budget.fixed.reduce((a, c) => a + c.amount, 0))}</b><span>déjà fixé (vol + logements)</span></div>
        </div>
      </section>
      <section class="blk"><h3>Ajouter une dépense</h3>${expForm(null)}
        <div class="conv" style="margin-top:14px">
          <label><input type="number" id="cv-eur" value="10" min="0" step="0.5" inputmode="decimal" aria-label="Euros"><span>€</span></label>
          <span class="sw">${ic("swap")}</span>
          <label><input type="number" id="cv-jpy" value="${10 * S.rate}" min="0" step="100" inputmode="numeric" aria-label="Yens"><span>¥</span></label>
        </div>
        <div class="tags" style="margin-top:10px"><span class="tag">1 € = <input type="number" data-act="rate" value="${S.rate}" min="1" step="0.1" style="width:64px;padding:2px 6px;margin-left:4px" aria-label="Taux"> ¥</span><span class="tag">Konbini ~400 ¥</span><span class="tag">Ramen ~1 200 ¥</span></div>
      </section>
      <section class="blk"><h3>Par catégorie <span>estimé ${eur(est)}</span></h3>
        ${T.budget.cats.map((c) => `<div class="crow2" style="--c:${c.color}"><i></i><span>${c.label}</span><span class="n">${eur(by[c.id] || 0)} <small>/ ${eur(c.est)}</small></span>${bar(pct(by[c.id] || 0, c.est), c.color, (by[c.id] || 0) > c.est)}</div>`).join("")}
      </section>
      <section class="blk"><h3>Jour par jour <span>4 → 24 juil</span></h3>
        <div class="dbars">${tripSpent ? "" : '<div class="dbars-empty">Se remplira pendant le voyage.</div>'}${trip.map((x) => `<div class="b ${per[x.date] ? "" : "zero"}" style="--c:${x.date === t ? "var(--red)" : LINES[x.block].c}" data-act="sel" data-id="${x.date}" title="${fmt(x.date, { day: "numeric", month: "short" })} · ${eur(per[x.date])}"><i style="--h:${(per[x.date] / dmax) * 100}"></i><span>${+x.date.slice(8)}</span></div>`).join("")}</div>
      </section>
      <section class="blk"><h3>Toutes les dépenses <span>${exps.length}</span></h3>
        ${exps.length ? exps.map(expRow).join("") : '<p class="empty">Aucune dépense. Ajoute ton premier ramen !</p>'}
      </section>
      <section class="blk"><h3>Les kiffs prévus</h3>
        ${T.kiffs.map((k) => `<div class="erow"><div class="grow"><div class="t">${esc(k.name)}</div><div class="d">${esc(k.where)}</div></div><b style="color:var(--red)">${k.price}</b></div>`).join("")}
      </section>`;
  }
  function packView() {
    const s = stats();
    const cat = S.packCat;
    const items = packItems(cat);
    return `
      <section class="blk"><div class="vhead">${ring(pct(s.pDone, s.pTotal), pct(s.pDone, s.pTotal) + "%", "var(--l1)", 64)}
        <div style="flex:1"><b style="font:700 1.3rem var(--fc)">${s.pDone} / ${s.pTotal} objets</b><p class="faint" style="font-size:.88rem">2 valises soute de 23 kg + cabine 10 kg. Pars avec la 2e quasi vide : elle revient pleine.</p></div></div></section>
      <div class="chipsx">${T.packing.map((p) => { const its = packItems(p.cat), dn = its.filter((it) => S.packing[it.id]).length; return `<button class="chipx ${dn === its.length && its.length ? "full" : ""}" data-act="pack-cat" data-id="${esc(p.cat)}" aria-pressed="${p.cat === cat}">${esc(p.cat)}<em>${dn}/${its.length}</em></button>`; }).join("")}</div>
      <section class="blk" data-key="pk-${esc(cat)}"><h3>${esc(cat)} <span>${items.filter((it) => S.packing[it.id]).length}/${items.length}</span></h3>
        <div class="checks">${items.map((it) => `<div class="crow" data-key="${esc(it.id)}"><div class="grow">${checkbox("pack", it.id, S.packing[it.id], `<span>${esc(it.text)}</span>`, "var(--l1)")}</div><button class="ibtn rm" data-act="rm-pack" data-id="${esc(it.id)}" aria-label="Retirer">${ic("x")}</button></div>`).join("")}</div>
        <form class="add" data-act="add-pack"><input type="text" name="t" placeholder="Ajouter un objet…" autocomplete="off"><button aria-label="Ajouter">${ic("plus")}</button></form>
      </section>
      <button class="btn soft" data-act="reset-pack" style="justify-self:start">Tout décocher</button>`;
  }
  const GTABS = [["carte", "Carte"], ["vols", "Vols & logements"], ["fuji", "Mont Fuji"], ["phrases", "Phrases"], ["pratique", "Pratique"]];
  function guideView() {
    const tab = ui.guide;
    let body = "";
    if (tab === "carte") body = `<section class="blk"><h3>La route <span>touche une ville</span></h3><div class="map">${routeMap()}</div>
        <div class="tags" style="margin-top:10px"><span class="tag">${T.cities.length} villes</span><span class="tag">4 Shinkansen</span><span class="tag">~1 750 km de rail</span></div></section>
      <section class="blk"><h3>Shinkansen <span>pas de JR Pass</span></h3><table class="tbl">${T.trains.map((r) => `<tr><td><b>${r.leg}</b><div class="faint" style="font-size:.8rem">${r.date} · ${r.dur}</div></td><td>~${r.price} €</td></tr>`).join("")}</table></section>`;
    else if (tab === "vols") body = `<section class="blk"><h3>Vols · Air China <span>~941 € / pers</span></h3><div class="legs">${T.flights.map((f) => `<div class="leg"><b>${f.from}</b><span class="ln"></span><b>${f.to}</b><small>${f.when} · ${f.note}</small></div>`).join("")}</div></section>
      <section class="blk"><h3>Logements <span>~580 € / pers</span></h3>${T.stays.map((s) => `<div class="stay"><span class="jp">${s.kanji}</span><div style="min-width:0"><b>${s.name} <span class="tag">${esc(s.status)}</span></b><small>${fmt(s.from, { day: "numeric" })} → ${fmt(s.to, { day: "numeric", month: "short" })} · ${esc(s.where)}</small></div><div class="n">${s.nights}<small><br>nuit${s.nights > 1 ? "s" : ""}</small></div></div>`).join("")}</section>`;
    else if (tab === "fuji") body = `<section class="blk"><h3>Ton choix pour l'ascension <span>ven 9 – sam 10</span></h3><div class="fopts">${T.fuji.map((o) => `
        <button class="fopt" data-act="fuji" data-id="${o.id}" aria-pressed="${S.fuji === o.id}"><span class="tp">${o.name}<span class="tick">${S.fuji === o.id ? ic("tick") : ""}</span></span><span class="pr">${o.price}</span><p>${o.how}</p><span class="pc"><span style="color:var(--ok)">+ ${o.pro}</span><span style="color:var(--red)">− ${o.con}</span></span></button>`).join("")}</div>
        <p class="faint" style="font-size:.84rem;margin-top:10px">Règles 2027 à revérifier : inscription en ligne, ~4 000 ¥ d'entrée, sentier Yoshida fermé de l'après-midi à 3h sans refuge réservé.</p></section>
      <section class="blk"><h3>Équipement</h3><div class="checks">${packItems("Mont Fuji").map((it) => `<div class="crow" data-key="${esc(it.id)}"><div class="grow">${checkbox("pack", it.id, S.packing[it.id], `<span>${esc(it.text)}</span>`, "var(--l1)")}</div></div>`).join("")}</div></section>`;
    else if (tab === "phrases") body = `<section class="blk"><h3>Touche pour écouter <span>${T.phrases.length} phrases</span></h3><div class="phrases">${T.phrases.map((p, i) => `<button class="phrase" data-act="say" data-id="${i}"><span class="wave"><i></i><i></i><i></i></span><span class="jp">${p.jp}</span><span class="ro">${p.ro}</span><span class="fr">${p.fr}</span></button>`).join("")}</div></section>`;
    else body = `<section class="blk"><h3>Urgences <span>gratuit</span></h3><div class="sos">${T.emergency.map((e) => `<a href="tel:${e.num.replace(/-/g, "")}"><span>${e.label}</span><b>${e.num}</b></a>`).join("")}</div></section>
      ${T.tips.map((t) => `<section class="blk tips"><h3>${t.title}</h3><ul>${t.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>`).join("")}
      <section class="blk"><h3>Mes données <span>dans ce navigateur</span></h3><div class="tags" style="gap:8px">
        <button class="btn soft" data-act="export">${ic("down")}Exporter</button>
        <label class="btn soft" style="cursor:pointer">${ic("up")}Importer<input type="file" accept="application/json" data-act="import" hidden></label>
        <button class="btn soft" data-act="reset" style="color:var(--red)">Tout réinitialiser</button></div></section>`;
    return `<div class="tabs">${GTABS.map(([id, l]) => `<button data-act="gtab" data-id="${id}" aria-pressed="${tab === id}">${l}</button>`).join("")}</div><div style="display:grid;gap:14px" data-key="g-${tab}">${body}</div>`;
  }

  // Route map (lon/lat projected into an 800×380 box).
  const proj = (lon, lat) => [40 + ((lon - 132) / 8.2) * 720, 30 + ((36.95 - lat) / 2.75) * 320];
  const P = Object.fromEntries(T.cities.map((c) => [c.name, proj(c.lon, c.lat)]));
  const f1 = (p) => p.map((v) => v.toFixed(1)).join(",");
  function smooth(pts) {
    let o = `M${f1(pts[0])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      o += ` C${f1([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f1([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f1(p2)}`;
    }
    return o;
  }
  const arc = (a, b, k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return `M${f1(a)} Q${f1([mx - dy * k, my + dx * k])} ${f1(b)}`; };
  function routeMap() {
    const main = smooth([P.Tokyo, proj(139.15, 35.25), proj(138.4, 34.97), proj(136.9, 35.17), P.Kyoto, P.Osaka, P.Kobe, P.Himeji, proj(133.9, 34.66), P.Hiroshima, P.Miyajima]);
    const exc = [arc(P.Tokyo, P.Nikko, -.25), arc(P.Tokyo, P.Kamakura, .3), arc(P.Tokyo, P.Fuji, .25), arc(P.Kyoto, P.Nara, -.35)];
    const lab = { r: [13, 5, "start"], l: [-13, 5, "end"], t: [0, -15, "middle"], b: [0, 26, "middle"] };
    return `<svg viewBox="0 0 800 380" role="img" aria-label="Carte du trajet">
      <path id="mainline" d="${main}" fill="none"/><path class="mline glow" d="${main}"/><path class="mline draw" d="${main}" pathLength="1"/>
      ${exc.map((e) => `<path class="mexc" d="${e}"/>`).join("")}
      ${RM ? "" : `<circle class="train" r="6"><animateMotion dur="9s" begin="2.4s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"><mpath href="#mainline"/></animateMotion></circle>`}
      ${T.cities.map((c, i) => { const [x, y] = P[c.name], [dx, dy, an] = lab[c.lab]; return `<g class="city" style="--i:${i}" data-act="city" data-id="${c.day}" tabindex="0" role="button" aria-label="${c.name}, ${c.dates}"><title>${c.name} · ${c.dates}</title><circle class="dt" cx="${x}" cy="${y}" r="7"/><text x="${x + dx}" y="${y + dy}" text-anchor="${an}">${c.name}</text><text class="k" x="${x + dx}" y="${y + dy + (c.lab === "t" ? -14 : 14)}" text-anchor="${an}">${c.kanji}</text></g>`; }).join("")}
    </svg>`;
  }

  function mdock() {
    const on = (x) => (ui.drawer === x ? "on" : "");
    return `<nav class="mdock">
      <button class="${!ui.drawer ? "on" : ""}" data-act="mline">${ic("line")}Ligne</button>
      <a class="${on("budget")}" href="#/budget">${ic("yen")}Budget</a>
      <a class="${on("valise")}" href="#/valise">${ic("bag")}Valise</a>
      <a class="${on("guide")}" href="#/guide">${ic("book")}Guide</a>
      <button data-act="pal">${ic("search")}Chercher</button>
    </nav>`;
  }

  // ---------- render ----------
  const root = $("#root");
  let booted = false;
  function app() {
    const st = stations(), w = whereNow(st);
    if (!st.find((x) => x.id === ui.sel)) ui.sel = (w.here || st[Math.min(w.nextIdx, st.length - 1)]).id;
    return topBar(st, w) + `<main class="main">${boardView(st, w)}<div class="split">${lineView(st, w)}${stationView(st, w)}</div></main>`
      + `<div class="sheet-scrim ${ui.sheet ? "on" : ""}" data-act="sheet-close"></div>` + drawerView() + mdock();
  }
  function render() {
    const html = app();
    if (!booted) {
      root.innerHTML = html; booted = true;
      $$(".num", root).forEach((el) => countUp(el, 0));
      setTimeout(() => { ui.boot = false; render(); }, 2200);
    } else {
      changedNums = [];
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      morphChildren(root, tmp);
      changedNums.forEach(([el, from]) => countUp(el, from));
    }
    tick();
  }

  function select(id, opts = {}) {
    const st = stations();
    const a = st.findIndex((x) => x.id === ui.sel), b = st.findIndex((x) => x.id === id);
    if (b < 0) return;
    const same = id === ui.sel;
    ui.sel = id; S.sel = id; save();
    if (narrow() && !opts.noSheet) ui.sheet = true;
    if (opts.closeDrawer && ui.drawer) { history.replaceState(null, "", "#/"); ui.drawer = null; }
    const run = () => {
      render();
      if (!same) $("#station").scrollTop = 0;
      if (opts.scroll !== false) $("#st-" + CSS.escape(id))?.scrollIntoView({ block: "nearest", behavior: RM ? "auto" : "smooth" });
      if (narrow()) $("#station").scrollTop = 0;
    };
    if (!same && document.startViewTransition && !RM && !narrow()) { document.documentElement.dataset.dir = b < a ? "prev" : "next"; document.startViewTransition(run); }
    else run();
  }

  function tick() {
    const cd = $("#cd");
    if (!cd) return;
    const ph = phase();
    let groups;
    if (ph === "before") {
      const ms = Math.max(0, d(T.departure) - new Date());
      groups = [String(Math.floor(ms / 864e5)).padStart(3, "0"), pad2(Math.floor(ms / 36e5) % 24), pad2(Math.floor(ms / 6e4) % 60), pad2(Math.floor(ms / 1e3) % 60)];
    } else groups = new Date().toLocaleTimeString("fr-FR", { hour12: false, timeZone: "Asia/Tokyo" }).split(":");
    $$(".fl", cd).forEach((fl, gi) => $$(".flap", fl).forEach((f, k) => {
      const ch = (groups[gi] || "")[k] ?? "";
      if (f.textContent !== ch) { f.textContent = ch; if (f.dataset.on) { f.classList.remove("flip"); void f.offsetWidth; f.classList.add("flip"); } }
      f.dataset.on = 1;
    }));
  }
  setInterval(tick, 1000);

  // ---------- routing (drawers live in the hash so Back closes them) ----------
  function onHash() {
    const r = location.hash.replace(/^#\/?/, "");
    const dw = ["budget", "valise", "guide"].includes(r) ? r : null;
    if (dw) { ui.lastDrawer = dw; ui.sheet = false; }
    ui.drawer = dw;
    render();
  }
  const closeDrawer = () => { if (ui.drawer) location.hash = "#/"; };

  // ---------- events ----------
  function afterCheck(kind, id, el) {
    const st = stations();
    if (kind === "item" || kind === "task") {
      const s = kind === "item" ? st.find((x) => x.kind === "day" && x.items.some((it) => it.id === id)) : st.find((x) => x.kind === "prep" && x.tasks.some((t) => t.id === id));
      if (s && s.complete) { burstAt($("#station .ring") || el, 70); toast(`${codeOf(s)} ${s.ro} : gare bouclée ✓`); return; }
      if (kind === "task") { burstAt(el.closest(".ck"), 30); toast("Étape validée ✓"); }
    } else if (kind === "pack") {
      const cat = id.split("#")[0].startsWith("x-") ? S.packCat : id.split("#")[0];
      const its = packItems(T.packing.some((p) => p.cat === cat) ? cat : S.packCat);
      if (its.every((it) => S.packing[it.id])) { burstAt(el.closest(".ck"), 60); toast("Catégorie prête ✓"); }
    }
  }
  root.addEventListener("change", (e) => {
    const el = e.target, act = el.dataset.act, id = el.dataset.id;
    if (act === "item" || act === "task" || act === "pack") {
      ({ item: S.items, task: S.tasks, pack: S.packing })[act][id] = el.checked; save(); buzz(); render();
      if (el.checked) afterCheck(act, id, el);
    } else if (act === "rate") { S.rate = Math.max(1, +el.value || 165); save(); render(); }
    else if (act === "import") importFile(el.files[0]);
  });
  let noteT;
  root.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.act === "note") { S.notes[el.dataset.id] = el.value; clearTimeout(noteT); noteT = setTimeout(save, 300); }
    else if (el.id === "cv-eur") $("#cv-jpy").value = Math.round((+el.value || 0) * S.rate);
    else if (el.id === "cv-jpy") $("#cv-eur").value = Math.round(((+el.value || 0) / S.rate) * 100) / 100;
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, act = f.dataset.act, fd = new FormData(f);
    if (act === "add-item") {
      const text = String(fd.get("t") || "").trim(); if (!text) return;
      (S.extra[f.dataset.id] ||= []).push({ id: "x-" + uid(), text });
    } else if (act === "add-task") {
      const title = String(fd.get("title") || "").trim(); if (!title) return;
      const id = "c-" + uid();
      S.customTasks.push({ id, title, due: fd.get("due"), detail: "" });
      save(); f.reset(); toast("Étape ajoutée");
      return select("p-" + String(fd.get("due")).slice(0, 7), { noSheet: false });
    } else if (act === "add-exp") {
      const amount = parseFloat(fd.get("amount")); if (!(amount > 0)) return;
      S.expenses.push({ id: Date.now().toString(36), label: String(fd.get("label")).trim(), amount, currency: ui.cur, cat: fd.get("cat") || "misc", date: f.dataset.date || fd.get("date") || isoDay(today()) });
      toast("Dépense ajoutée");
    } else if (act === "add-pack") {
      const text = String(fd.get("t") || "").trim(); if (!text) return;
      (S.customPack[S.packCat] ||= []).push({ id: "x-" + uid(), text });
    } else return;
    save();
    const keep = act === "add-exp" ? { cat: f.elements.cat?.value, date: f.elements.date?.value } : null;
    f.reset();
    if (keep) { if (keep.cat) f.elements.cat.value = keep.cat; if (keep.date) f.elements.date.value = keep.date; }
    render();
    f.querySelector("input[type=text]")?.focus();
  });
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || ["INPUT", "FORM", "TEXTAREA"].includes(el.tagName)) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case "sel": e.preventDefault(); return select(id, { closeDrawer: !!el.closest(".drawer") });
      case "home": e.preventDefault(); ui.sheet = false; closeDrawer(); { const st = stations(), w = whereNow(st); return select((w.here || st[Math.min(w.nextIdx, st.length - 1)]).id, { noSheet: true }); }
      case "city": return select(id, { closeDrawer: true });
      case "pal": return palOpen();
      case "theme": return toggleTheme(el);
      case "close": return closeDrawer();
      case "sheet-close": ui.sheet = false; break;
      case "mline": ui.sheet = false; closeDrawer(); break;
      case "cur": ui.cur = id; break;
      case "gtab": ui.guide = id; break;
      case "pack-cat": S.packCat = id; save(); break;
      case "fuji": S.fuji = S.fuji === id ? null : id; save(); if (S.fuji) burstAt(el, 30); break;
      case "rm-item":
        if (id.startsWith("x-")) S.extra[el.dataset.day] = (S.extra[el.dataset.day] || []).filter((x) => x.id !== id); else S.removed[id] = true;
        delete S.items[id]; save(); break;
      case "rm-task": S.customTasks = S.customTasks.filter((t) => t.id !== id); delete S.tasks[id]; save(); break;
      case "rm-exp": S.expenses = S.expenses.filter((x) => x.id !== id); save(); toast("Dépense supprimée"); break;
      case "rm-pack":
        if (id.startsWith("x-")) S.customPack[S.packCat] = (S.customPack[S.packCat] || []).filter((x) => x.id !== id); else S.removedPack[id] = true;
        delete S.packing[id]; save(); break;
      case "reset-pack": S.packing = {}; save(); toast("Valise remise à zéro"); break;
      case "say": return say(T.phrases[+id].jp, el);
      case "export": return exportData();
      case "reset":
        if (el.dataset.armed) { const th = S.theme; S = defaults(); S.theme = th; ui.sel = null; save(); toast("Données réinitialisées"); break; }
        el.dataset.armed = "1"; el.textContent = "Confirmer ?"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Tout réinitialiser"; } }, 4000);
        return;
      default: return;
    }
    render();
  });
  root.addEventListener("keydown", (e) => {
    const c = e.target.closest?.(".city, .dd");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); c.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });

  function say(text, el) {
    if (!("speechSynthesis" in window)) return toast("Synthèse vocale indisponible");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = .85;
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith("ja")); if (v) u.voice = v;
    el.setAttribute("aria-pressed", "true");
    u.onend = u.onerror = () => el.setAttribute("aria-pressed", "false");
    speechSynthesis.speak(u);
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `japon-2027-${isoDay(new Date())}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function importFile(file) {
    if (!file) return;
    file.text().then((txt) => { const data = JSON.parse(txt); if (typeof data !== "object" || !data) throw 0; S = { ...defaults(), ...data }; ui.sel = S.sel; save(); render(); toast("Données importées"); })
      .catch(() => toast("Fichier invalide"));
  }

  // ---------- search palette ----------
  const pal = $("#pal"), palQ = $("#pal-q"), palList = $("#pal-list");
  let palAll = [], palItems = [], palSel = 0;
  function palIndex() {
    const out = [];
    const st = stations();
    for (const s of st) {
      out.push({ icon: s.kanji, c: s.c, title: `${s.ro}`, sub: `${codeOf(s)} · ${s.sub}`, k: codeOf(s), hay: s.day?.tip, run: () => select(s.id, { closeDrawer: true }) });
      if (s.kind === "day") for (const it of s.items) out.push({ icon: ic(isPlace(it.text) ? "pin" : "check"), title: clean(it.text), sub: `${codeOf(s)} · ${s.ro}`, k: codeOf(s), run: () => select(s.id, { closeDrawer: true }) });
      else for (const t of s.tasks) out.push({ icon: ic("check"), c: s.c, title: t.title, sub: `${codeOf(s)} · ${s.ro}`, k: codeOf(s), hay: t.detail, run: () => select(s.id, { closeDrawer: true }) });
    }
    out.push({ icon: ic("yen"), title: "Budget", sub: "Dépenses, catégories, convertisseur", run: () => (location.hash = "#/budget") });
    out.push({ icon: ic("bag"), title: "Valise", sub: "Checklist des bagages", run: () => (location.hash = "#/valise") });
    for (const [id, l] of GTABS) out.push({ icon: ic("book"), title: `Guide · ${l}`, sub: "Guide", run: () => { ui.guide = id; location.hash === "#/guide" ? render() : (location.hash = "#/guide"); } });
    for (const p of T.packing) for (const it of packItems(p.cat)) out.push({ icon: ic("bag"), title: it.text, sub: `Valise · ${p.cat}`, run: () => { S.packCat = p.cat; save(); location.hash === "#/valise" ? render() : (location.hash = "#/valise"); } });
    for (const p of T.phrases) out.push({ icon: "あ", title: `${p.ro} — ${p.fr}`, sub: p.jp, run: () => { ui.guide = "phrases"; location.hash === "#/guide" ? render() : (location.hash = "#/guide"); } });
    for (const tp of T.tips) for (const x of tp.items) out.push({ icon: ic("bulb"), title: x, sub: `Pratique · ${tp.title}`, run: () => { ui.guide = "pratique"; location.hash === "#/guide" ? render() : (location.hash = "#/guide"); } });
    return out.map((o) => ({ ...o, n: norm(`${o.title} ${o.sub} ${o.hay || ""}`) }));
  }
  const hl = (text, terms) => {
    const n = norm(text);
    const marks = terms.map((t) => [n.indexOf(t), t.length]).filter(([i]) => i >= 0 && n.length === text.length).map(([i, l]) => [i, i + l]).sort((a, b) => a[0] - b[0]);
    let out = "", pos = 0;
    for (const [a, b] of marks) { if (a < pos) continue; out += esc(text.slice(pos, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; pos = b; }
    return out + esc(text.slice(pos));
  };
  function palRender() {
    if (!palAll.length) palAll = palIndex();
    const terms = norm(palQ.value.trim()).split(/\s+/).filter(Boolean);
    palItems = terms.length ? palAll.filter((o) => terms.every((t) => o.n.includes(t))).slice(0, 40) : palAll.filter((o) => o.k && !o.icon.startsWith("<")).slice(0, 8);
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.length ? palItems.map((o, i) => `<button class="pal-item ${i === palSel ? "sel" : ""}" data-i="${i}" role="option"><span class="pi" ${o.c ? `style="--c:${o.c}"` : ""}>${o.icon}</span><span style="min-width:0"><b>${hl(o.title, terms)}</b><small>${esc(o.sub)}</small></span><span class="k">${o.k || "↵"}</span></button>`).join("")
      : `<div class="pal-empty">Rien trouvé pour « ${esc(palQ.value)} »</div>`;
  }
  function palOpen() { palAll = palIndex(); pal.hidden = false; palQ.value = ""; palSel = 0; palRender(); palQ.focus(); }
  const palClose = () => { pal.hidden = true; };
  function palRun(i) { const o = palItems[i]; if (!o) return; palClose(); o.run(); }
  const palMark = () => { $$(".pal-item", palList).forEach((b, i) => b.classList.toggle("sel", i === palSel)); $(".pal-item.sel", palList)?.scrollIntoView({ block: "nearest" }); };
  palQ.addEventListener("input", () => { palSel = 0; palRender(); });
  palQ.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && palItems.length) { e.preventDefault(); palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + palItems.length) % palItems.length; palMark(); }
    else if (e.key === "Enter") { e.preventDefault(); palRun(palSel); }
  });
  palList.addEventListener("click", (e) => { const b = e.target.closest(".pal-item"); if (b) palRun(+b.dataset.i); });
  palList.addEventListener("pointermove", (e) => { const b = e.target.closest(".pal-item"); if (b && +b.dataset.i !== palSel) { palSel = +b.dataset.i; $$(".pal-item", palList).forEach((x, i) => x.classList.toggle("sel", i === palSel)); } });
  pal.addEventListener("click", (e) => { if (e.target === pal) palClose(); });

  // ---------- theme ----------
  function applyTheme() {
    const dark = S.theme ? S.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }
  function toggleTheme(from) {
    S.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; save();
    const apply = () => { applyTheme(); render(); };
    if (!document.startViewTransition || RM) return apply();
    const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add("vt-theme");
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" }));
    vt.finished.finally(() => document.documentElement.classList.remove("vt-theme"));
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { applyTheme(); render(); });

  // ---------- keyboard ----------
  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest?.("input,textarea,select");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); pal.hidden ? palOpen() : palClose(); return; }
    if (e.key === "Escape") { if (!pal.hidden) palClose(); else if (ui.drawer) closeDrawer(); else if (ui.sheet) { ui.sheet = false; render(); } return; }
    if (typing || !pal.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    const st = stations(), i = st.findIndex((x) => x.id === ui.sel);
    if ((e.key === "ArrowDown" || e.key === "j" || e.key === "ArrowRight") && !ui.drawer && st[i + 1]) { e.preventDefault(); select(st[i + 1].id, { noSheet: true }); }
    else if ((e.key === "ArrowUp" || e.key === "k" || e.key === "ArrowLeft") && !ui.drawer && st[i - 1]) { e.preventDefault(); select(st[i - 1].id, { noSheet: true }); }
    else if (e.key === "b") location.hash = "#/budget";
    else if (e.key === "v") location.hash = "#/valise";
    else if (e.key === "g") location.hash = "#/guide";
    else if (e.key === "d") toggleTheme($('[data-act="theme"]') || document.body);
  });

  if (phase() === "during") ui.sel = isoDay(today());
  applyTheme();
  addEventListener("hashchange", onHash);
  onHash();
  // During the trip, bring today's station into view on load.
  setTimeout(() => { if (phase() === "during") $("#st-" + CSS.escape(ui.sel))?.scrollIntoView({ block: "center" }); }, 300);
})();
