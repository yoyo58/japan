// Japon 2027 — product-page design. One long page (hero, stats, places, itinerary, scroll-driven route,
// preparation, tools); days, budget, packing and guide open in modals routed through the URL hash.
(() => {
  const T = window.TRIP, PH = window.PHOTOS || {};
  const KEY = "japon2027:v1";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- state (same shape as earlier versions, so saved progress carries over) ----------
  const defaults = () => ({
    items: {}, extra: {}, removed: {}, notes: {},
    tasks: {}, customTasks: [],
    expenses: [], rate: 165,
    packing: {}, customPack: {}, removedPack: {}, packCat: T.packing[0].cat,
    fuji: null, theme: null,
  });
  let S;
  try { S = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { S = defaults(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const ui = { modal: null, last: { type: "budget" }, block: "all", cur: "EUR", gtab: "vols", open: new Set(), phrase: 0 };

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
  const img = (id, size = "m", alt = "", eager) => `<img src="img/${id}-${size}.webp" ${size === "l" ? `srcset="img/${id}-m.webp 900w, img/${id}-l.webp 1800w" sizes="(max-aspect-ratio: 1/1) 180vh, 100vw"` : ""} alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;

  const DAYPHOTO = {
    "2027-07-03": "shinkansen", "2027-07-04": "neon", "2027-07-05": "asakusa", "2027-07-06": "nikko", "2027-07-07": "shibuya",
    "2027-07-08": "tokyotower", "2027-07-09": "kamakura", "2027-07-10": "fuji", "2027-07-11": "fushimi", "2027-07-12": "arashiyama",
    "2027-07-13": "kiyomizu", "2027-07-14": "nara", "2027-07-15": "osaka", "2027-07-16": "miyajima", "2027-07-17": "itsukushima",
    "2027-07-18": "himeji", "2027-07-19": "shinkansen", "2027-07-20": "kaminarimon", "2027-07-21": "shibuya2", "2027-07-22": "shibuya3",
    "2027-07-23": "dusk", "2027-07-24": "tokyotower",
  };
  const PLACES = [
    { name: "Tokyo", kanji: "東京", photo: "shibuya", day: "2027-07-04", when: "4 → 8 et 19 → 24 juillet", line: "Néons, temples et nuits sans fin" },
    { name: "Nikko", kanji: "日光", photo: "nikko", day: "2027-07-06", when: "Mardi 6 juillet", line: "Sanctuaires dorés dans la forêt" },
    { name: "Kamakura", kanji: "鎌倉", photo: "kamakura", day: "2027-07-09", when: "Vendredi 9 juillet", line: "Le Grand Bouddha et l'océan" },
    { name: "Mont Fuji", kanji: "富士山", photo: "fuji", day: "2027-07-10", when: "Samedi 10 juillet", line: "3 776 mètres, au lever du soleil" },
    { name: "Kyoto", kanji: "京都", photo: "fushimi", day: "2027-07-11", when: "11 → 14 juillet", line: "Mille torii et des ruelles de bois" },
    { name: "Nara", kanji: "奈良", photo: "nara", day: "2027-07-14", when: "Mercredi 14 juillet", line: "Cerfs en liberté, Bouddha géant" },
    { name: "Osaka", kanji: "大阪", photo: "osaka", day: "2027-07-15", when: "15 → 19 juillet", line: "La cuisine de rue du Japon" },
    { name: "Hiroshima", kanji: "広島", photo: "hiroshima", day: "2027-07-16", when: "Vendredi 16 juillet", line: "Mémoire et paix" },
    { name: "Miyajima", kanji: "宮島", photo: "miyajima", day: "2027-07-16", when: "16 → 17 juillet", line: "Le torii qui flotte sur la mer" },
    { name: "Himeji", kanji: "姫路", photo: "himeji", day: "2027-07-18", when: "Dimanche 18 juillet", line: "Le château du héron blanc" },
  ];
  const BLOCKS = { 0: { jp: "出発", name: "Départ" }, 1: { jp: "東京", name: "Tokyo et excursions" }, 2: { jp: "関西", name: "Kansai" }, 3: { jp: "東京", name: "Retour à Tokyo" } };
  const LC = { 0: "var(--l0)", 1: "var(--l1)", 2: "var(--l2)", 3: "var(--l3)" };

  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    tick: '<path d="m5 12 5 5 9-10"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    down: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
    up: '<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>',
    check: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
  };
  const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const checkbox = (act, id, on, label, c) => `
    <label class="ck"${c ? ` style="--c:${c}"` : ""}>
      <input type="checkbox" data-act="${act}" data-id="${esc(id)}"${on ? " checked" : ""}>
      <span class="box"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span>
      <span class="lbl">${label}</span>
    </label>`;
  const bar = (p, c, over) => `<div class="bar"${c ? ` style="--c:${c}"` : ""}><i style="--w:${Math.min(p, 100)}${over ? ";background:var(--red)" : ""}"></i></div>`;
  const ring = (p, label, c, s) => `<span class="ring" style="--to:${p}${c ? `;--c:${c}` : ""}${s ? `;--s:${s}px` : ""}" data-l="${label}"></span>`;

  const toastEl = $("#toast");
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2400); };
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
    let pTotal = 0, pDone = 0, aTotal = 0, aDone = 0;
    for (const p of T.packing) for (const it of packItems(p.cat)) { pTotal++; if (S.packing[it.id]) pDone++; }
    for (const day of T.days) for (const it of dayItems(day)) { aTotal++; if (S.items[it.id]) aDone++; }
    return { tasks: tasks.length, tDone: tasks.filter((t) => S.tasks[t.id]).length, pTotal, pDone, aTotal, aDone, spent: S.expenses.reduce((s, e) => s + toEur(e), 0) };
  }
  const months = () => { const m = {}; for (const t of allTasks()) (m[t.due.slice(0, 7)] ||= []).push(t); return m; };

  // ---------- DOM morph: patch in place so transitions keep running ----------
  let changedNums = [];
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    const oldVal = a.getAttribute("value");
    const oldNum = a.classList.contains("num") ? +a.dataset.v : null;
    const keep = ["in", "enter", "solid", "on-hero", "dark"].filter((c) => a.classList.contains(c));
    for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    keep.forEach((c) => a.classList.add(c));
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
      if (!na || (k && na.nodeName !== nb.nodeName)) { a.insertBefore(nb, ref); if (k && nb.nodeType === 1) nb.classList.add("enter", "in"); return; }
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
      const k = Math.min(1, (t - t0) / 1100);
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
    const cols = ["#e5322d", "#0071e3", "#1d9d4f", "#ef6a1d", "#7d5cf2", "#f2a516"];
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

  // ---------- page sections ----------
  function nav() {
    const dark = document.documentElement.dataset.theme === "dark";
    const links = [["etapes", "Étapes"], ["itineraire", "Itinéraire"], ["route", "La route"], ["preparer", "Préparer"], ["outils", "Budget et valise"]];
    return `<nav class="gnav" id="gnav"><div class="gnav-in">
      <button class="brand" data-act="goto" data-id="top"><i></i>Japon 2027</button>
      <div class="glinks">${links.map(([id, l]) => `<button data-act="goto" data-id="${id}">${l}</button>`).join("")}</div>
      <div class="gicons"><button data-act="pal" aria-label="Rechercher">${ic("search")}</button><button data-act="theme" aria-label="Changer de thème">${ic(dark ? "sun" : "moon")}</button></div>
    </div></nav>`;
  }

  function hero() {
    const ph = phase(), t = isoDay(today());
    const day = T.days.find((x) => x.date === t);
    let eyebrow = "Été 2027", h1 = "Japon.", sub = "20 nuits. 11 villes. 6 amis.", cta = `<button class="pill" data-act="goto" data-id="itineraire">Voir l'itinéraire</button>`, cd = "";
    if (ph === "during" && day) {
      const n = T.days.indexOf(day);
      eyebrow = `${cap(fmt(t, { weekday: "long", day: "numeric", month: "long" }))}`; h1 = `Jour ${n}.`; sub = `${day.title}. ${day.city}.`;
      cta = `<a class="pill" href="#/jour/${t}">Voir aujourd'hui</a>`;
    } else if (ph === "after") { eyebrow = "おかえり"; h1 = "Arigatō."; sub = "20 nuits. Des souvenirs pour toujours."; }
    if (ph === "before") cd = `<div class="hero-cd" id="cd" data-keep>${["jours", "heures", "minutes", "secondes"].map((l) => `<div><b>–</b><span>${l}</span></div>`).join("")}</div>`;
    return `<header class="hero" id="top">
      <div class="hero-media" id="hero-media">${img("hero", "l", "Le mont Fuji et la pagode Chureito", true)}</div>
      <div class="hero-copy" id="hero-copy">
        <p class="eyebrow">${eyebrow}</p>
        <h1>${h1}</h1>
        <p class="sub">${sub}</p>
        <div class="ctas">${cta}<button class="more" data-act="goto" data-id="preparer">Préparer le voyage ${ic("right")}</button></div>
      </div>
      ${cd}
    </header>`;
  }

  function statsSec() {
    const items = [
      [20, "nuits", "du 4 au 24 juillet 2027", "#e5322d", "#ff9f45"],
      [T.cities.length, "villes", "de Nikko à Miyajima", "#0071e3", "#5ac8fa"],
      [1750, "km de rail", "en Shinkansen", "#7d5cf2", "#e0559b"],
      [6, "amis", "une seule équipe", "#1d9d4f", "#a8e063"],
      [22, "journées", "chacune avec son plan", "#ef6a1d", "#f2a516"],
    ];
    return `<section class="sec"><div class="wrap">
      <div class="sh rv"><span class="eyebrow">Le voyage</span><h2>Un été au Japon. En chiffres.</h2></div>
      <div class="stats">${items.map(([n, l, s, g1, g2], i) => `<div class="stat rv" style="--i:${i};--g1:${g1};--g2:${g2}"><b>${i === 2 ? "~" : ""}${num(n)}</b><span>${l}</span><small>${s}</small></div>`).join("")}</div>
    </div></section>`;
  }

  function places() {
    return `<section class="sec gray" id="etapes">
      <div class="wrap sh-row"><div class="sh rv"><span class="eyebrow">Les étapes</span><h2>Dix lieux. Une seule route.</h2></div>
        <div class="car-nav rv"><button data-act="car" data-id="-1" aria-label="Précédent">${ic("left")}</button><button data-act="car" data-id="1" aria-label="Suivant">${ic("right")}</button></div></div>
      <div class="car" id="car">${PLACES.map((p, i) => `<a class="ccard rv" style="--i:${Math.min(i, 3)}" href="#/jour/${p.day}">${img(p.photo, "m", p.name)}
        <div class="ct"><small>${p.when}</small><b>${p.name}</b><span class="jp">${p.kanji}</span><small style="margin-top:10px;font-weight:500">${p.line}</small></div>
        <span class="plus">${ic("plus")}</span></a>`).join("")}</div>
    </section>`;
  }

  function itinerary() {
    const t = isoDay(today());
    const s = stats();
    const seg = [["all", "Tout"], ["1", "Tokyo"], ["2", "Kansai"], ["3", "Retour"]];
    const groups = [1, 2, 3].filter((b) => ui.block === "all" || String(b) === ui.block).map((b) => {
      const days = T.days.filter((x) => x.block === b || (b === 1 && x.block === 0));
      return `<div data-key="b-${b}"><div class="bh rv" style="--c:${LC[b]}"><span class="jp">${BLOCKS[b].jp}</span><h3>${BLOCKS[b].name}</h3><small>${days.length === 1 ? fmt(days[0].date, { day: "numeric", month: "long" }) : `${fmt(days[0].date, { day: "numeric" })} → ${fmt(days[days.length - 1].date, { day: "numeric", month: "long" })}`}</small></div>
        <div class="days">${days.map((day, i) => {
          const its = dayItems(day), dn = its.filter((it) => S.items[it.id]).length;
          const done = dn && dn === its.length;
          return `<a class="dcard rv" style="--c:${LC[b]};--i:${i % 3}" href="#/jour/${day.date}" data-key="d-${day.date}">
            <div class="dimg">${img(DAYPHOTO[day.date], "m", day.title)}<span class="kj jp">${day.kanji}</span>${day.date === t ? '<span class="badge today">Aujourd\'hui</span>' : done ? '<span class="badge done">Fait ✓</span>' : day.event ? `<span class="badge">${day.event}</span>` : ""}</div>
            <div class="dtxt"><span class="dd">${cap(fmt(day.date, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(day.city)}</span><h3>${esc(day.title)}</h3>
              <p>${its.map((x) => esc(clean(x.text))).join(" · ")}</p>
              <div class="dfoot">${bar(pct(dn, its.length), LC[b])}<span>${dn}/${its.length}</span></div></div>
          </a>`;
        }).join("")}</div></div>`;
    }).join("");
    return `<section class="sec" id="itineraire"><div class="wrap">
      <div class="sh-row"><div class="sh rv"><span class="eyebrow">Itinéraire</span><h2>Jour après jour.</h2><p>${s.aDone} activités faites sur ${s.aTotal}. Touche une journée pour son programme, ses conseils et tes notes.</p></div>
        <div class="segc rv">${seg.map(([id, l]) => `<button data-act="block" data-id="${id}" aria-pressed="${ui.block === id}">${l}</button>`).join("")}</div></div>
      <div>${groups}</div>
    </div></section>`;
  }

  // Route map, projected lon/lat into an 800×380 box.
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
  // Scroll steps: [label, kanji, dates, city lit at this step, excursion index lit]
  const RSTEPS = [
    ["Tokyo", "東京", "4 juil.", ["Tokyo"]], ["Nikko", "日光", "6 juil.", ["Nikko"], 0], ["Kamakura", "鎌倉", "9 juil.", ["Kamakura"], 1],
    ["Mont Fuji", "富士", "10 juil.", ["Fuji"], 2], ["Kyoto", "京都", "11 juil.", ["Kyoto"]], ["Nara", "奈良", "14 juil.", ["Nara"], 3],
    ["Osaka", "大阪", "15 juil.", ["Osaka"]], ["Hiroshima · Miyajima", "宮島", "16 juil.", ["Hiroshima", "Miyajima"]],
    ["Himeji · Kobe", "姫路", "18 juil.", ["Himeji", "Kobe"]], ["Retour à Tokyo", "東京", "19 juil.", []],
  ];
  // Fraction of the main line drawn when each step is reached.
  const RDRAW = [0, 0, 0, 0, .42, .42, .47, 1, 1, 1];
  function routeSec() {
    const main = smooth([P.Tokyo, proj(139.15, 35.25), proj(138.4, 34.97), proj(136.9, 35.17), P.Kyoto, P.Osaka, P.Kobe, P.Himeji, proj(133.9, 34.66), P.Hiroshima, P.Miyajima]);
    const exc = [arc(P.Tokyo, P.Nikko, -.25), arc(P.Tokyo, P.Kamakura, .3), arc(P.Tokyo, P.Fuji, .25), arc(P.Kyoto, P.Nara, -.35)];
    const lab = { r: [14, 5, "start"], l: [-14, 5, "end"], t: [0, -16, "middle"], b: [0, 28, "middle"] };
    return `<section class="route" id="route"><div class="route-stick">
      <div class="route-copy"><span class="eyebrow">La route</span><h2>1 750 km de rail.</h2>
        <ol class="rsteps" id="rsteps">${RSTEPS.map(([n, k, dt], i) => `<li data-i="${i}"><small>${dt}</small><span><span class="jp">${k}</span> ${n}</span></li>`).join("")}</ol>
        <div class="route-cur" id="route-cur"></div></div>
      <div class="route-map"><svg viewBox="0 0 800 380" role="img" aria-label="Carte du trajet">
        <path class="rline base" d="${main}"/><path class="rline glow" id="rglow" d="${main}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>
        <path class="rline" id="rline" d="${main}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>
        ${exc.map((e, i) => `<path class="rexc" data-x="${i}" d="${e}"/>`).join("")}
        ${T.cities.map((c) => { const [x, y] = P[c.name], [dx, dy, an] = lab[c.lab]; return `<g class="rcity" data-c="${c.name}" data-act="dayhash" data-id="${c.day}"><circle cx="${x}" cy="${y}" r="7"/><text x="${x + dx}" y="${y + dy}" text-anchor="${an}">${c.name === "Fuji" ? "Mont Fuji" : c.name}</text><text class="k" x="${x + dx}" y="${y + dy + (c.lab === "t" ? -15 : 15)}" text-anchor="${an}">${c.kanji}</text></g>`; }).join("")}
        <circle class="rtrain" id="rtrain" r="6" cx="${P.Tokyo[0]}" cy="${P.Tokyo[1]}"/>
      </svg></div>
    <span class="route-hint">Fais défiler ↓</span></div></section>`;
  }

  function prepSec() {
    const tasks = allTasks(), s = stats();
    const nextT = tasks.find((t) => !S.tasks[t.id]);
    const m = months();
    const t = isoDay(today());
    if (!ui.open.size && nextT) ui.open.add(nextT.due.slice(0, 7));
    const n = nextT ? daysUntil(nextT.due) : 0;
    return `<section class="sec gray" id="preparer"><div class="wrap">
      <div class="sh rv"><span class="eyebrow">Préparer</span><h2>Tout est prêt. Ou presque.</h2><p>Les réservations, les papiers et les petites choses à ne pas oublier, mois par mois.</p></div>
      <div class="prep">
        <div class="tile ptile rv">
          <div class="bigring" style="--to:${pct(s.tDone, s.tasks)}"><div><b>${num(pct(s.tDone, s.tasks))}%</b><small>${s.tDone} étape${s.tDone > 1 ? "s" : ""} sur ${s.tasks}</small></div></div>
          ${nextT ? `<div class="next"><small>${n < 0 ? `En retard de ${-n} jours` : `Prochaine étape · dans ${n} jours`}</small><b>${esc(nextT.title)}</b>${nextT.detail ? `<p>${esc(nextT.detail)}</p>` : ""}
            <div class="row"><span class="tag">${fmt(nextT.due, { day: "numeric", month: "long", year: "numeric" })}</span><button class="btn" data-act="task-done" data-id="${nextT.id}">${ic("tick")}C'est fait</button></div></div>` : `<div class="next"><small>Bravo</small><b>Tout est prêt. いってらっしゃい !</b></div>`}
        </div>
        <div class="months">${Object.entries(m).map(([mo, list], i) => {
          const dn = list.filter((x) => S.tasks[x.id]).length, open = ui.open.has(mo);
          const def = `${mo}-15` >= t ? `${mo}-15` : isoDay(new Date(Date.now() + 7 * 864e5));
          return `<div class="month rv ${open ? "open" : ""} ${dn === list.length ? "complete" : ""}" style="--i:${i}" data-key="mo-${mo}">
            <button class="month-h" data-act="month" data-id="${mo}" aria-expanded="${open}"><span class="jp">${+mo.slice(5)}月</span>
              <span class="grow"><b>${cap(fmt(mo + "-01", { month: "long", year: "numeric" }))}</b><small>${list.length} étape${list.length > 1 ? "s" : ""} · ${dn} faite${dn > 1 ? "s" : ""}</small></span>${ic("chev").replace("<svg", '<svg class="chev"')}</button>
            <div class="month-b"><div><div class="inner">
              <div class="checks">${list.map((x) => `<div class="crow" data-key="${x.id}"><div class="grow">${checkbox("task", x.id, S.tasks[x.id], `<span>${esc(x.title)}</span>${x.detail ? `<small>${esc(x.detail)}</small>` : ""}`)}
                <div class="tags" style="margin-left:38px"><span class="tag">${x.cat}</span>${statusTag(x)}</div></div>${x.custom ? `<button class="ibtn rm" data-act="rm-task" data-id="${x.id}" aria-label="Supprimer">${ic("x")}</button>` : ""}</div>`).join("")}</div>
              <form class="add" data-act="add-task"><input type="text" name="title" placeholder="Ajouter une étape…" autocomplete="off" required><input type="date" name="due" value="${def}" required aria-label="Échéance"><button aria-label="Ajouter">${ic("plus")}</button></form>
            </div></div></div>
          </div>`;
        }).join("")}</div>
      </div>
    </div></section>`;
  }
  const statusTag = (t) => {
    if (S.tasks[t.id]) return `<span class="tag ok">Fait</span>`;
    const n = daysUntil(t.due);
    if (n < 0) return `<span class="tag late">En retard de ${-n} j</span>`;
    if (n <= 30) return `<span class="tag warn">Dans ${n} j</span>`;
    return `<span class="tag">${fmt(t.due, { day: "numeric", month: "short" })}</span>`;
  };

  function toolsSec() {
    const s = stats();
    const p = T.phrases[ui.phrase % T.phrases.length];
    const fuji = S.fuji ? T.fuji.find((f) => f.id === S.fuji) : null;
    return `<section class="sec" id="outils"><div class="wrap">
      <div class="sh rv"><span class="eyebrow">Budget, valise et guide</span><h2>Tout ce qu'il faut. Rien de plus.</h2></div>
      <div class="bento">
        <a class="btile w4 rv" href="#/budget"><small>Budget sur place</small><h3>Chaque yen compte.</h3>
          <div class="bnum">${num(s.spent, "eur")} <small>sur ${eur(T.budget.cap)}</small></div>
          <div class="bmeter"><i class="${s.spent > T.budget.cap ? "over" : ""}" style="--w:${Math.min(100, pct(s.spent, T.budget.cap))}"></i></div><span class="go">${ic("plus")}</span></a>
        <a class="btile w2 rv" style="--i:1" href="#/valise"><small>Valise</small><h3>Prêt à partir.</h3>
          <div class="vring">${ring(pct(s.pDone, s.pTotal), pct(s.pDone, s.pTotal) + "%", "var(--l1)", 96)}<span class="muted" style="font-size:15px">${s.pDone} objets<br>sur ${s.pTotal}</span></div><span class="go">${ic("plus")}</span></a>
        <a class="btile photo w2 rv" href="#/guide/fuji">${img("fuji", "m", "Mont Fuji")}<small>Mont Fuji</small><h3>${fuji ? esc(fuji.name) + "." : "Choisis ton ascension."}</h3><span class="go">${ic("plus")}</span></a>
        <a class="btile dark w4 rv" style="--i:1" href="#/guide/phrases"><small>Phrases utiles · touche pour écouter</small><h3>Parle un peu japonais.</h3>
          <div class="phr-show" data-key="phr-${ui.phrase}"><div><div class="jp">${p.jp}</div><p>${p.ro} — ${p.fr}</p></div></div><span class="go">${ic("plus")}</span></a>
        <a class="btile w3 rv" href="#/guide/vols"><small>Vols et logements</small><h3>Air China, 5 adresses.</h3>
          <div class="flist"><div><span>Aller</span><b>Sam. 3 juil. · 19h50</b></div><div><span>Retour</span><b>Sam. 24 juil. · 8h30</b></div><div><span>Nuits réservées</span><b>20 / 20</b></div></div><span class="go">${ic("plus")}</span></a>
        <a class="btile photo rv" href="#/guide/pratique">${img("shinkansen", "m", "Shinkansen et mont Fuji")}<small>Pratique</small><h3>Transports, argent, urgences.</h3><span class="go">${ic("plus")}</span></a>
      </div>
    </div></section>`;
  }

  function footer() {
    return `<footer class="foot"><div class="wrap">
      <p>Japon 2027 · 6 voyageurs · du 3 au 24 juillet 2027. Tes coches, notes et dépenses sont enregistrées dans ce navigateur.</p>
      <p>Photos : Wikimedia Commons, sous licences libres. Merci aux photographes :</p>
      <div class="credits">${Object.entries(PH).map(([id, p]) => `<a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(id)} · ${esc(p.artist)} · ${esc(p.lic)}</a>`).join("")}</div>
      <div class="row"><span>Raccourcis : Ctrl K pour chercher · D pour le thème · Échap pour fermer</span>
        <span><button data-act="export">Exporter mes données</button> · <label style="color:var(--link);cursor:pointer">Importer<input type="file" accept="application/json" data-act="import" hidden></label> · <button data-act="reset">Tout réinitialiser</button></span></div>
    </div></footer>`;
  }

  // ---------- modals ----------
  function modal() {
    const m = ui.modal || ui.last;
    let body = "";
    if (m.type === "day") body = dayModal(m.id);
    else if (m.type === "budget") body = `<div class="mhead"><small>Budget</small><h2>Chaque yen compte.</h2></div><div class="mbody" data-key="mb-budget">${budgetBody()}</div>`;
    else if (m.type === "valise") body = `<div class="mhead"><small>Valise</small><h2>Prêt à partir.</h2></div><div class="mbody" data-key="mb-valise">${packBody()}</div>`;
    else body = guideModal(m.id || ui.gtab);
    return `<div class="modal ${ui.modal ? "open" : ""}" id="modal">
      <div class="scrim" data-act="close"></div>
      <div class="sheet" role="dialog" aria-modal="true" ${ui.modal ? "" : "inert"} id="sheet"><button class="mx" data-act="close" aria-label="Fermer">${ic("x")}</button>${body}</div>
    </div>`;
  }
  function dayModal(date) {
    const day = T.days.find((x) => x.date === date) || T.days[1];
    const idx = T.days.indexOf(day), prev = T.days[idx - 1], next = T.days[idx + 1];
    const its = dayItems(day), dn = its.filter((it) => S.items[it.id]).length;
    const c = LC[day.block], city = day.city.split(" ")[0], clim = climateFor(day.city);
    const places = its.filter((it) => isPlace(it.text)).map((it) => `${clean(it.text)}, ${city}, Japan`);
    const dir = places.length >= 2 ? `https://www.google.com/maps/dir/?api=1&travelmode=transit&origin=${enc(places[0])}&destination=${enc(places[places.length - 1])}${places.length > 2 ? `&waypoints=${places.slice(1, -1).slice(0, 8).map(enc).join("%7C")}` : ""}` : null;
    const exps = S.expenses.filter((e) => e.date === day.date), spent = exps.reduce((a, e) => a + toEur(e), 0);
    return `<div class="mhero" data-key="mh-${day.date}">${img(DAYPHOTO[day.date], "l", day.title)}
        <div class="mt"><div><small>${cap(fmt(day.date, { weekday: "long", day: "numeric", month: "long" }))} · ${esc(day.city)}</small><h2>${esc(day.title)}</h2></div><span class="jp">${day.kanji}</span></div></div>
      <div class="mnav"><button data-act="dayhash" data-id="${prev?.date || ""}" ${prev ? "" : "disabled"}>${ic("left")}<span>${prev ? esc(prev.title) : ""}</span></button><button data-act="dayhash" data-id="${next?.date || ""}" ${next ? "" : "disabled"}><span>${next ? esc(next.title) : ""}</span>${ic("right")}</button></div>
      <div class="mbody" data-key="mb-${day.date}">
        <div class="chips">${clim ? `<span class="chip">${ic("thermo")}${clim.hi}° / ${clim.lo}° · ${esc(clim.note)}</span>` : ""}${day.event ? `<span class="chip red">${ic("star")}${day.event}</span>` : ""}${dir ? `<a class="chip" href="${dir}" target="_blank" rel="noopener">${ic("route")}Parcours du jour dans Maps</a>` : ""}</div>
        ${day.tip ? `<div class="tip" style="--c:${c}">${ic("bulb")}<div><b>Le conseil du jour</b><p>${esc(day.tip)}</p></div></div>` : ""}
        ${day.block === 0 ? `<div class="card"><h3>Vols <span>Air China · ~941 €</span></h3><div class="legs">${T.flights.map((f) => `<div class="leg"><b>${f.from}</b><span class="ln"></span><b>${f.to}</b><small>${f.when} · ${f.note}</small></div>`).join("")}</div></div>` : ""}
        <div class="card"><h3>Au programme <span>${dn} sur ${its.length}</span></h3>
          <div class="checks">${its.map((it) => `<div class="crow" data-key="${esc(it.id)}"><div class="grow">${checkbox("item", it.id, S.items[it.id], `<span>${esc(clean(it.text))}</span>`, c)}</div>
            ${isPlace(it.text) ? `<a class="ibtn" href="${mapsUrl(clean(it.text), city)}" target="_blank" rel="noopener" title="Voir sur Google Maps" aria-label="${esc(clean(it.text))} sur Google Maps">${ic("pin")}</a>` : ""}
            <button class="ibtn rm" data-act="rm-item" data-day="${day.date}" data-id="${esc(it.id)}" aria-label="Retirer">${ic("x")}</button></div>`).join("")}</div>
          <form class="add" data-act="add-item" data-id="${day.date}"><input type="text" name="t" placeholder="Ajouter une activité…" autocomplete="off"><button aria-label="Ajouter">${ic("plus")}</button></form>
        </div>
        <div class="two">
          <div class="card"><h3>Dépenses du jour <span>${eur(spent)}</span></h3>${exps.length ? exps.map(expRow).join("") : '<p class="empty">Rien pour l\'instant.</p>'}${expForm(day.date)}</div>
          <div class="card"><h3>Notes</h3><textarea data-act="note" data-id="${day.date}" placeholder="Adresses, horaires, idées…">${esc(S.notes[day.date] || "")}</textarea></div>
        </div>
      </div>`;
  }
  const expRow = (e) => {
    const c = catOf(e.cat);
    return `<div class="erow" data-key="${e.id}"><div class="grow"><div class="t">${esc(e.label)}</div><div class="d"><span class="dot" style="--c:${c.color}"></span>${c.label}${e.currency === "JPY" ? ` · ¥${e.amount.toLocaleString("fr-FR")}` : ""} · ${fmt(e.date, { day: "numeric", month: "short" })}</div></div>
      <b>${toEur(e).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</b><button class="ibtn rm" style="opacity:1" data-act="rm-exp" data-id="${e.id}" aria-label="Supprimer">${ic("x")}</button></div>`;
  };
  const catOpts = () => T.budget.cats.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
  const curSeg = () => `<div class="seg2">${["EUR", "JPY"].map((c) => `<button type="button" data-act="cur" data-id="${c}" aria-pressed="${ui.cur === c}">${c === "EUR" ? "€" : "¥"}</button>`).join("")}</div>`;
  const expForm = (date) => `
    <form class="expf ${date ? "" : "wide"}" data-act="add-exp" data-date="${date || ""}">
      <input type="text" name="label" placeholder="Ramen, métro…" required autocomplete="off" aria-label="Quoi">
      <input type="number" name="amount" min="0" step="${ui.cur === "EUR" ? "0.01" : "1"}" required inputmode="decimal" placeholder="Montant ${ui.cur === "EUR" ? "€" : "¥"}" aria-label="Montant">
      ${date ? "" : `<select name="cat" aria-label="Catégorie">${catOpts()}</select><input type="date" name="date" value="${isoDay(today())}" aria-label="Date">`}
      <button class="btn" aria-label="Ajouter">${ic("plus")}</button>
      ${date ? `<select name="cat" aria-label="Catégorie" style="grid-column:1/-2">${catOpts()}</select>` : ""}
      <div style="grid-column:${date ? "-2/-1" : "1/-1"}">${curSeg()}</div>
    </form>`;
  function budgetBody() {
    const s = stats(), by = spentBy();
    const est = T.budget.cats.reduce((a, c) => a + c.est, 0);
    const max = Math.max(T.budget.cap, s.spent) * 1.06;
    const t = isoDay(today()), trip = T.days.slice(1);
    const per = Object.fromEntries(trip.map((x) => [x.date, 0]));
    for (const e of S.expenses) if (e.date in per) per[e.date] += toEur(e);
    const tripSpent = Object.values(per).reduce((a, b) => a + b, 0), dmax = Math.max(60, ...Object.values(per));
    const left = trip.filter((x) => x.date >= t).length || trip.length;
    const exps = [...S.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return `
      <div class="card"><div class="big">${num(s.spent, "eur")} <small>dépensés sur ${eur(T.budget.cap)}</small></div>
        <div class="meter"><div class="fill ${s.spent > T.budget.cap ? "over" : ""}" style="--w:${(s.spent / max) * 100}"></div><div class="mk t" style="left:${(est / max) * 100}%"><span>Estimé ${eur(est)}</span></div><div class="mk" style="left:${(T.budget.cap / max) * 100}%"><span>Plafond</span></div></div>
        <div class="kpis"><div class="kpi"><b>${num(Math.max(0, (T.budget.cap - s.spent) / left), "eur")}</b><span>par jour pour tenir</span></div><div class="kpi"><b>${num(T.budget.cap - s.spent, "eur")}</b><span>restant</span></div><div class="kpi"><b>${eur(T.budget.fixed.reduce((a, c) => a + c.amount, 0))}</b><span>déjà payé : vol et logements</span></div></div></div>
      <div class="card"><h3>Ajouter une dépense</h3>${expForm(null)}
        <div class="conv" style="margin-top:16px"><label><input type="number" id="cv-eur" value="10" min="0" step="0.5" inputmode="decimal" aria-label="Euros"><span>€</span></label><span class="sw">${ic("swap")}</span><label><input type="number" id="cv-jpy" value="${10 * S.rate}" min="0" step="100" inputmode="numeric" aria-label="Yens"><span>¥</span></label></div>
        <div class="tags" style="margin-top:12px"><span class="tag">1 € = <input type="number" data-act="rate" value="${S.rate}" min="1" step="0.1" style="width:70px;padding:2px 8px;margin:0 4px;font-size:13px" aria-label="Taux"> ¥</span><span class="tag">Konbini ~400 ¥</span><span class="tag">Ramen ~1 200 ¥</span><span class="tag">Bière ~500 ¥</span></div></div>
      <div class="two">
        <div class="card"><h3>Par catégorie <span>estimé ${eur(est)}</span></h3>${T.budget.cats.map((c) => `<div class="crow2" style="--c:${c.color}"><i></i><span>${c.label}</span><span class="n">${eur(by[c.id] || 0)} <small>/ ${eur(c.est)}</small></span>${bar(pct(by[c.id] || 0, c.est), c.color, (by[c.id] || 0) > c.est)}</div>`).join("")}</div>
        <div class="card"><h3>Jour par jour <span>4 → 24 juil.</span></h3><div class="dbars">${tripSpent ? "" : '<div class="dbars-empty">Se remplira pendant le voyage.</div>'}${trip.map((x) => `<div class="b ${per[x.date] ? "" : "zero"}" style="--c:${x.date === t ? "var(--red)" : LC[x.block]}" data-act="dayhash" data-id="${x.date}" title="${fmt(x.date, { day: "numeric", month: "short" })} · ${eur(per[x.date])}"><i style="--h:${(per[x.date] / dmax) * 100}"></i><span>${+x.date.slice(8)}</span></div>`).join("")}</div>
          <h3 style="margin-top:22px">Les gros repas prévus</h3>${T.kiffs.slice(0, 4).map((k) => `<div class="erow"><div class="grow"><div class="t">${esc(k.name)}</div><div class="d">${esc(k.where)}</div></div><b style="color:var(--red)">${k.price}</b></div>`).join("")}</div>
      </div>
      <div class="card"><h3>Toutes les dépenses <span>${exps.length}</span></h3>${exps.length ? exps.map(expRow).join("") : '<p class="empty">Aucune dépense. Ajoute ton premier ramen !</p>'}</div>`;
  }
  function packBody() {
    const s = stats(), cat = S.packCat, items = packItems(cat);
    return `
      <div class="card" style="display:flex;align-items:center;gap:20px">${ring(pct(s.pDone, s.pTotal), pct(s.pDone, s.pTotal) + "%", "var(--l1)", 84)}<div><b style="font-size:22px;letter-spacing:-.02em">${s.pDone} objets sur ${s.pTotal}</b><p class="muted" style="font-size:15px">2 valises soute de 23 kg et une cabine de 10 kg. Pars avec la deuxième presque vide : elle reviendra pleine.</p></div></div>
      <div class="chipsx">${T.packing.map((p) => { const its = packItems(p.cat), dn = its.filter((it) => S.packing[it.id]).length; return `<button class="chipx" data-act="pack-cat" data-id="${esc(p.cat)}" aria-pressed="${p.cat === cat}">${esc(p.cat)}<em>${dn === its.length && its.length ? "✓" : `${dn}/${its.length}`}</em></button>`; }).join("")}</div>
      <div class="card" data-key="pk-${esc(cat)}"><h3>${esc(cat)} <span>${items.filter((it) => S.packing[it.id]).length} sur ${items.length}</span></h3>
        <div class="checks">${items.map((it) => `<div class="crow" data-key="${esc(it.id)}"><div class="grow">${checkbox("pack", it.id, S.packing[it.id], `<span>${esc(it.text)}</span>`, "var(--l1)")}</div><button class="ibtn rm" data-act="rm-pack" data-id="${esc(it.id)}" aria-label="Retirer">${ic("x")}</button></div>`).join("")}</div>
        <form class="add" data-act="add-pack"><input type="text" name="t" placeholder="Ajouter un objet…" autocomplete="off"><button aria-label="Ajouter">${ic("plus")}</button></form></div>
      <div><button class="btn soft" data-act="reset-pack">Tout décocher</button></div>`;
  }
  const GTABS = [["vols", "Vols et logements"], ["fuji", "Mont Fuji"], ["phrases", "Phrases"], ["pratique", "Pratique"]];
  function guideModal(tab) {
    const titles = { vols: "Vols et logements.", fuji: "Le mont Fuji.", phrases: "Quelques mots de japonais.", pratique: "Bon à savoir." };
    let b = "";
    if (tab === "vols") b = `<div class="card"><h3>Vols <span>Air China · ~941 € par personne</span></h3><div class="legs">${T.flights.map((f) => `<div class="leg"><b>${f.from}</b><span class="ln"></span><b>${f.to}</b><small>${f.when} · ${f.note}</small></div>`).join("")}</div></div>
      <div class="card"><h3>Logements <span>~580 € par personne · paiement en juin 2027</span></h3>${T.stays.map((s) => `<div class="stay"><span class="jp">${s.kanji}</span><div style="min-width:0"><b>${s.name}</b> <span class="tag">${esc(s.status)}</span><small>${fmt(s.from, { day: "numeric" })} → ${fmt(s.to, { day: "numeric", month: "short" })} · ${esc(s.where)}</small></div><div class="n">${s.nights}<small><br>nuit${s.nights > 1 ? "s" : ""}</small></div></div>`).join("")}</div>
      <div class="card"><h3>Shinkansen <span>pas de JR Pass</span></h3><table class="tbl">${T.trains.map((r) => `<tr><td><b>${r.leg}</b><div class="muted" style="font-size:13px">${r.date} · ${r.dur}</div></td><td>~${r.price} €</td></tr>`).join("")}</table></div>`;
    else if (tab === "fuji") b = `<div class="card"><h3>Ton choix pour l'ascension <span>ven. 9 et sam. 10 juillet</span></h3><div class="fopts">${T.fuji.map((o) => `<button class="fopt" data-act="fuji" data-id="${o.id}" aria-pressed="${S.fuji === o.id}"><span class="tp">${o.name}<span class="tick">${S.fuji === o.id ? ic("tick") : ""}</span></span><span class="pr">${o.price}</span><p>${o.how}</p><span class="pc"><span style="color:var(--ok)">+ ${o.pro}</span><span style="color:var(--red)">− ${o.con}</span></span></button>`).join("")}</div>
        <p class="muted" style="font-size:14px;margin-top:12px">Règles 2027 à revérifier : inscription en ligne, ~4 000 ¥ d'entrée, sentier Yoshida fermé de l'après-midi à 3h sans refuge réservé.</p></div>
      <div class="card"><h3>Équipement</h3><div class="checks">${packItems("Mont Fuji").map((it) => `<div class="crow" data-key="${esc(it.id)}"><div class="grow">${checkbox("pack", it.id, S.packing[it.id], `<span>${esc(it.text)}</span>`, "var(--l1)")}</div></div>`).join("")}</div></div>`;
    else if (tab === "phrases") b = `<div class="card"><h3>Touche une phrase pour l'écouter <span>${T.phrases.length} phrases</span></h3><div class="phrases">${T.phrases.map((p, i) => `<button class="phrase" data-act="say" data-id="${i}"><span class="wave"><i></i><i></i><i></i></span><span class="jp">${p.jp}</span><span class="ro">${p.ro}</span><span class="fr">${p.fr}</span></button>`).join("")}</div></div>`;
    else b = `<div class="card"><h3>Urgences <span>appel gratuit</span></h3><div class="sos">${T.emergency.map((e) => `<a href="tel:${e.num.replace(/-/g, "")}"><span>${e.label}</span><b>${e.num}</b></a>`).join("")}</div></div>
      <div class="two">${T.tips.map((t) => `<div class="card tips"><h3>${t.title}</h3><ul>${t.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>`;
    return `<div class="mhead"><small>Guide</small><h2>${titles[tab]}</h2></div>
      <div class="mbody" data-key="mb-g-${tab}"><div class="mtabs">${GTABS.map(([id, l]) => `<button data-act="gtab" data-id="${id}" aria-pressed="${tab === id}">${l}</button>`).join("")}</div>${b}</div>`;
  }

  // ---------- render ----------
  const root = $("#root");
  let booted = false;
  const app = () => nav() + `<main>${hero()}${statsSec()}${places()}${itinerary()}${routeSec()}${prepSec()}${toolsSec()}</main>` + footer() + modal();
  function render() {
    const html = app();
    if (!booted) {
      root.innerHTML = html; booted = true;
      reveal();
    } else {
      changedNums = [];
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      morphChildren(root, tmp);
      changedNums.forEach(([el, from]) => countUp(el, from));
      reveal();
    }
    tick(); onScroll();
  }

  // Reveal on scroll; numbers count up when they appear.
  let io;
  function reveal() {
    const els = $$(".rv:not(.in)", root);
    if (RM || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    io ||= new IntersectionObserver((ents) => ents.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in"); io.unobserve(en.target);
      $$(".num", en.target).forEach((n) => countUp(n, 0));
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }

  // Scroll-linked effects: nav state, hero parallax, route drawing.
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY, vh = innerHeight;
      const navEl = $("#gnav");
      if (navEl) {
        navEl.classList.toggle("solid", y > vh - 60); navEl.classList.toggle("on-hero", y <= vh - 60);
        const rr = $("#route")?.getBoundingClientRect();
        navEl.classList.toggle("dark", !!rr && rr.top <= 48 && rr.bottom >= 48);
      }
      const hm = $("#hero-media"), hc = $("#hero-copy");
      if (hm && !RM && y < vh * 1.2) {
        const p = Math.min(1, y / vh);
        hm.style.transform = `translateY(${p * 30}%) scale(${1 + p * .08})`;
        hc.style.transform = `translateY(${p * 120}px)`; hc.style.opacity = String(1 - p * 1.6);
      }
      const rs = $("#route");
      if (rs) {
        const r = rs.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, -r.top / (r.height - vh)));
        const step = Math.min(RSTEPS.length - 1, Math.floor(p * RSTEPS.length * 1.02));
        const prog = RM ? 1 : RDRAW[step] + (step < RSTEPS.length - 1 ? (RDRAW[step + 1] - RDRAW[step]) * ((p * RSTEPS.length) % 1) : 0);
        const line = $("#rline"), glow = $("#rglow");
        line.style.strokeDashoffset = glow.style.strokeDashoffset = String(1 - prog);
        const pt = line.getTotalLength ? line.getPointAtLength(prog * line.getTotalLength()) : null;
        const tr = $("#rtrain"); if (pt && tr) { tr.setAttribute("cx", pt.x); tr.setAttribute("cy", pt.y); }
        const lit = new Set(RSTEPS.slice(0, step + 1).flatMap((s) => s[3]));
        $$(".rcity", rs).forEach((g) => { const c = g.dataset.c; g.classList.toggle("on", lit.has(c) || c === "Tokyo"); g.classList.toggle("cur", RSTEPS[step][3].includes(c) || (step === RSTEPS.length - 1 && c === "Tokyo")); });
        $$(".rexc", rs).forEach((e) => e.classList.toggle("on", RSTEPS.slice(0, step + 1).some((s) => s[4] === +e.dataset.x)));
        $$("#rsteps li").forEach((li, i) => { li.classList.toggle("on", i < step); li.classList.toggle("cur", i === step); });
        const cur = $("#route-cur"); if (cur) cur.innerHTML = `<small>${RSTEPS[step][2]}</small>${RSTEPS[step][1]} ${RSTEPS[step][0]}`;
      }
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);

  function tick() {
    const cd = $("#cd"); if (!cd) return;
    const ms = Math.max(0, d(T.departure) - new Date());
    const v = [Math.floor(ms / 864e5), pad2(Math.floor(ms / 36e5) % 24), pad2(Math.floor(ms / 6e4) % 60), pad2(Math.floor(ms / 1e3) % 60)];
    $$("b", cd).forEach((b, i) => { if (b.textContent !== String(v[i])) b.textContent = v[i]; });
  }
  setInterval(tick, 1000);
  // Rotate the phrase shown in the "Phrases" tile.
  setInterval(() => { if (document.hidden || ui.modal) return; ui.phrase = (ui.phrase + 1) % T.phrases.length; render(); }, 4200);

  // ---------- routing: modals live in the hash so Back closes them ----------
  function onHash() {
    const [a, b] = location.hash.replace(/^#\/?/, "").split("/");
    let m = null;
    if (a === "jour" && T.days.some((x) => x.date === b)) m = { type: "day", id: b };
    else if (a === "budget" || a === "valise") m = { type: a };
    else if (a === "guide") m = { type: "guide", id: GTABS.some(([id]) => id === b) ? b : ui.gtab };
    const wasOpen = !!ui.modal, sameKind = ui.modal && m && ui.modal.type === m.type;
    if (m) { ui.last = m; if (m.type === "guide") ui.gtab = m.id; }
    ui.modal = m;
    document.documentElement.style.overflow = m ? "hidden" : "";
    render();
    if (m && (!wasOpen || !sameKind || m.type === "day")) { const sh = $("#sheet"); if (sh) sh.scrollTop = 0; }
  }
  const closeModal = () => { if (ui.modal) history.length > 1 && history.state?.m ? history.back() : (location.hash = "#/"); };
  const openHash = (h) => { history.pushState({ m: 1 }, "", h); onHash(); };

  // ---------- events ----------
  function afterCheck(kind, id, el) {
    if (kind === "item") {
      const day = T.days.find((x) => dayItems(x).some((it) => it.id === id));
      if (day && dayItems(day).every((it) => S.items[it.id])) { burstAt(el.closest(".ck"), 70); toast(`${day.title} : journée bouclée ✓`); }
    } else if (kind === "task") {
      burstAt(el.closest(".ck"), 30);
      const mo = Object.values(months()).find((l) => l.some((t) => t.id === id));
      toast(mo && mo.every((t) => S.tasks[t.id]) ? "Mois bouclé ✓" : "Étape validée ✓");
    } else if (kind === "pack") {
      const cat = T.packing.find((p) => packItems(p.cat).some((it) => it.id === id))?.cat || S.packCat;
      if (packItems(cat).every((it) => S.packing[it.id])) { burstAt(el.closest(".ck"), 60); toast(`${cat} : prêt ✓`); }
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
      S.customTasks.push({ id: "c-" + uid(), title, due: fd.get("due"), detail: "" });
      ui.open.add(String(fd.get("due")).slice(0, 7)); toast("Étape ajoutée");
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
    const a = e.target.closest('a[href^="#/"]');
    if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); return openHash(a.getAttribute("href")); }
    const el = e.target.closest("[data-act]");
    if (!el || ["INPUT", "FORM", "TEXTAREA"].includes(el.tagName)) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case "goto": { const t = id === "top" ? 0 : $("#" + id)?.offsetTop - 48; if (t != null) scrollTo({ top: t, behavior: RM ? "auto" : "smooth" }); return; }
      case "dayhash": if (!id) return; return ui.modal ? (history.replaceState(history.state, "", `#/jour/${id}`), onHash()) : openHash(`#/jour/${id}`);
      case "pal": return palOpen();
      case "theme": return toggleTheme(el);
      case "close": return closeModal();
      case "car": { const c = $("#car"); c.scrollBy({ left: +id * Math.min(c.clientWidth * .8, 780), behavior: "smooth" }); return; }
      case "block": ui.block = id; break;
      case "month": ui.open.has(id) ? ui.open.delete(id) : ui.open.add(id); break;
      case "task-done": S.tasks[id] = true; save(); burstAt(el, 60); toast("Étape validée ✓"); break;
      case "cur": ui.cur = id; break;
      case "gtab": history.replaceState(history.state, "", `#/guide/${id}`); return onHash();
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
        if (el.dataset.armed) { const th = S.theme; S = defaults(); S.theme = th; save(); toast("Données réinitialisées"); break; }
        el.dataset.armed = "1"; el.textContent = "Confirmer la réinitialisation ?"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Tout réinitialiser"; } }, 4000);
        return;
      default: return;
    }
    render();
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
    file.text().then((txt) => { const data = JSON.parse(txt); if (typeof data !== "object" || !data) throw 0; S = { ...defaults(), ...data }; save(); render(); toast("Données importées"); })
      .catch(() => toast("Fichier invalide"));
  }

  // ---------- search palette ----------
  const pal = $("#pal"), palQ = $("#pal-q"), palList = $("#pal-list");
  let palAll = [], palItems = [], palSel = 0;
  function palIndex() {
    const out = [];
    for (const day of T.days) {
      const go = () => openHash(`#/jour/${day.date}`);
      out.push({ icon: `<img src="img/${DAYPHOTO[day.date]}-m.webp" alt="">`, title: day.title, sub: `${cap(fmt(day.date, { weekday: "long", day: "numeric", month: "long" }))} · ${day.city}`, hay: day.tip, run: go, top: true });
      for (const it of dayItems(day)) out.push({ icon: ic(isPlace(it.text) ? "pin" : "check"), title: clean(it.text), sub: `${day.title} · ${fmt(day.date, { day: "numeric", month: "short" })}`, run: go });
    }
    for (const t of allTasks()) out.push({ icon: ic("check"), title: t.title, sub: `Préparer · ${fmt(t.due, { month: "long", year: "numeric" })}`, hay: t.detail, run: () => { ui.open.add(t.due.slice(0, 7)); render(); $("#preparer").scrollIntoView({ behavior: "smooth" }); } });
    out.push({ icon: ic("route"), title: "Budget", sub: "Dépenses, catégories, convertisseur", run: () => openHash("#/budget") });
    out.push({ icon: ic("check"), title: "Valise", sub: "Checklist des bagages", run: () => openHash("#/valise") });
    for (const [id, l] of GTABS) out.push({ icon: ic("bulb"), title: l, sub: "Guide", run: () => openHash(`#/guide/${id}`) });
    for (const p of T.packing) for (const it of packItems(p.cat)) out.push({ icon: ic("check"), title: it.text, sub: `Valise · ${p.cat}`, run: () => { S.packCat = p.cat; save(); openHash("#/valise"); } });
    for (const p of T.phrases) out.push({ icon: "あ", title: `${p.ro} — ${p.fr}`, sub: p.jp, run: () => openHash("#/guide/phrases") });
    for (const tp of T.tips) for (const x of tp.items) out.push({ icon: ic("bulb"), title: x, sub: `Pratique · ${tp.title}`, run: () => openHash("#/guide/pratique") });
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
    palItems = terms.length ? palAll.filter((o) => terms.every((t) => o.n.includes(t))).slice(0, 40) : palAll.filter((o) => o.top).slice(1, 9);
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.length ? palItems.map((o, i) => `<button class="pal-item ${i === palSel ? "sel" : ""}" data-i="${i}" role="option"><span class="pi">${o.icon}</span><span style="min-width:0"><b>${hl(o.title, terms)}</b><small>${esc(o.sub)}</small></span></button>`).join("")
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
    $('meta[name="theme-color"]').content = dark ? "#000000" : "#ffffff";
  }
  function toggleTheme(from) {
    S.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; save();
    const apply = () => { applyTheme(); render(); };
    if (!document.startViewTransition || RM) return apply();
    const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add("vt-theme");
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 700, easing: "cubic-bezier(.25,.1,.25,1)", pseudoElement: "::view-transition-new(root)" }));
    vt.finished.finally(() => document.documentElement.classList.remove("vt-theme"));
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { applyTheme(); render(); });

  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest?.("input,textarea,select");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); pal.hidden ? palOpen() : palClose(); return; }
    if (e.key === "Escape") { if (!pal.hidden) palClose(); else closeModal(); return; }
    if (typing || !pal.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "d") toggleTheme($('[data-act="theme"]') || document.body);
    if (ui.modal?.type === "day" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const i = T.days.findIndex((x) => x.date === ui.modal.id), n = T.days[i + (e.key === "ArrowRight" ? 1 : -1)];
      if (n) { history.replaceState(history.state, "", `#/jour/${n.date}`); onHash(); }
    }
  });

  applyTheme();
  addEventListener("hashchange", onHash);
  addEventListener("popstate", onHash);
  onHash();
})();
