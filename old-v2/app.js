(() => {
  const T = window.TRIP;
  const KEY = "japon2027:v1";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- state ----------
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

  const ui = { open: new Set(), block: "all", prepFilter: "todo", cur: "EUR", focus: null };

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const d = (iso) => new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  const qsToday = new URLSearchParams(location.search).get("today");
  const today = () => { const t = qsToday ? d(qsToday) : new Date(); t.setHours(0, 0, 0, 0); return t; };
  const isoDay = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const fmt = (iso, o) => d(iso).toLocaleDateString("fr-FR", o);
  const eur = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const daysUntil = (iso) => Math.round((d(iso) - today()) / 864e5);
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const isPlace = (t) => !t.startsWith("!");
  const clean = (t) => t.replace(/^!/, "");
  const mapsUrl = (q, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${q}, ${city}, Japan`)}`;
  // Animated number: <span class="num" data-v data-f>
  const NF = { eur: (v) => Math.round(v).toLocaleString("fr-FR") + " €", int: (v) => Math.round(v).toLocaleString("fr-FR"), pct: (v) => Math.round(v) + "%" };
  const num = (v, f = "int") => `<span class="num" data-v="${v}" data-f="${f}">${NF[f](v)}</span>`;

  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    map: '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    check: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/><path d="M6 6V5a2 2 0 0 1 2-2h9"/>',
    bag: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M9 7V5a3 3 0 0 1 6 0v2M4 12h16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    tick: '<path d="m5 12 5 5 9-10"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    down: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
    up: '<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
  };
  const ic = (n, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const checkbox = (act, id, on, label, color) => `
    <label class="ck"${color ? ` style="--c:${color}"` : ""}>
      <input type="checkbox" data-act="${act}" data-id="${esc(id)}"${on ? " checked" : ""}>
      <span class="box"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span>
      <span class="lbl">${label}</span>
    </label>`;
  const ring = (p, label, c, size) => `<span class="ring${p >= 100 ? " full" : ""}" style="--to:${p}${c ? `;--c:${c}` : ""}${size ? `;--s:${size}px` : ""}" data-l="${label}"></span>`;
  const bar = (p, c) => `<div class="bar"${c ? ` style="--c:${c}"` : ""}><i style="--w:${Math.min(p, 100)}"></i></div>`;

  const toastEl = $("#toast");
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200); };
  const buzz = () => { try { navigator.vibrate?.(8); } catch {} };

  // ---------- derived ----------
  const blockColor = (b) => T.blocks[b].color;
  const dayItems = (day) => {
    const base = day.items.map((text, i) => ({ id: `${day.date}#${i}`, text })).filter((it) => !S.removed[it.id]);
    return base.concat((S.extra[day.date] || []).map((x) => ({ ...x, custom: true })));
  };
  const allTasks = () => T.tasks.concat(S.customTasks.map((t) => ({ ...t, cat: "Perso", custom: true })))
    .sort((a, b) => a.due.localeCompare(b.due));
  const packItems = (cat) => {
    const base = (T.packing.find((p) => p.cat === cat)?.items || []).map((text, i) => ({ id: `${cat}#${i}`, text })).filter((it) => !S.removedPack[it.id]);
    return base.concat((S.customPack[cat] || []).map((x) => ({ ...x, custom: true })));
  };
  const toEur = (e) => (e.currency === "JPY" ? e.amount / (S.rate || 165) : e.amount);
  const spentBy = () => {
    const m = Object.fromEntries(T.budget.cats.map((c) => [c.id, 0]));
    for (const e of S.expenses) m[e.cat] = (m[e.cat] || 0) + toEur(e);
    return m;
  };
  const stats = () => {
    const tasks = allTasks();
    const tDone = tasks.filter((t) => S.tasks[t.id]).length;
    let pTotal = 0, pDone = 0;
    for (const p of T.packing) for (const it of packItems(p.cat)) { pTotal++; if (S.packing[it.id]) pDone++; }
    let aTotal = 0, aDone = 0;
    for (const day of T.days) for (const it of dayItems(day)) { aTotal++; if (S.items[it.id]) aDone++; }
    const spent = S.expenses.reduce((s, e) => s + toEur(e), 0);
    return { tasks: tasks.length, tDone, pTotal, pDone, aTotal, aDone, spent };
  };
  const phase = () => {
    const t = isoDay(today());
    if (t < T.days[0].date) return "before";
    if (t > T.days[T.days.length - 1].date) return "after";
    return "during";
  };
  const climateFor = (city) => T.climate.find((c) => city.startsWith(c.city.split(" ")[0]));

  // ---------- DOM morph (keeps nodes alive so CSS transitions run) ----------
  const KEEP = ["in", "ready", "flash"];
  let changedNums = [];
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    const oldVal = a.getAttribute("value");
    const oldNum = a.classList.contains("num") ? +a.dataset.v : null;
    const keep = KEEP.filter((c) => a.classList.contains(c));
    for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    keep.forEach((c) => a.classList.add(c));
    if (oldNum !== null && oldNum !== +b.dataset.v) changedNums.push([a, oldNum]);
    const focused = document.activeElement === a;
    if (a.tagName === "INPUT") {
      if (a.type === "checkbox") a.checked = b.hasAttribute("checked");
      else if (a.type !== "file" && !focused && oldVal !== b.getAttribute("value")) a.value = b.getAttribute("value") ?? "";
      return;
    }
    if (a.tagName === "TEXTAREA") { if (!focused && a.value !== b.textContent) a.value = b.textContent; return; }
    if (oldNum !== null) return; // countUp owns the text
    morphChildren(a, b);
  }
  function morphChildren(a, b) {
    const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
    const keyed = new Map();
    const loose = [];
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
        if (k && nb.nodeType === 1) nb.classList.add("enter", "in");
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
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      if (+el.dataset.v !== to) return; // a newer animation took over
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(2, -10 * k);
      el.textContent = f(k === 1 ? to : from + (to - from) * e);
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let fxCanvas, fxParts = [], fxRun = false;
  function confetti(x, y, n = 70) {
    if (RM) return;
    if (!fxCanvas) {
      if (!document.createElement("canvas").getContext?.("2d")) return;
      fxCanvas = document.createElement("canvas"); fxCanvas.className = "fx"; document.body.appendChild(fxCanvas); }
    const dpr = devicePixelRatio || 1;
    fxCanvas.width = innerWidth * dpr; fxCanvas.height = innerHeight * dpr;
    const css = getComputedStyle(document.documentElement);
    const cols = ["--accent", "--c-b1", "--c-b3", "--c-gold", "--c-rose", "--c-violet"].map((v) => css.getPropertyValue(v).trim());
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
      fxParts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .4,
        w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, c: cols[i % cols.length], life: 1, round: Math.random() < .3 });
    }
    if (!fxRun) { fxRun = true; requestAnimationFrame(fxStep); }
  }
  function fxStep() {
    const ctx = fxCanvas.getContext("2d"), dpr = devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    fxParts = fxParts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of fxParts) {
      p.vy += .28; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .009;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (fxParts.length) requestAnimationFrame(fxStep);
    else { fxRun = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  const burstAt = (el, n) => { const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, n); };

  // Falling sakura petals in the hero.
  function petals(canvas) {
    if (RM || canvas.dataset.on || !window.ResizeObserver) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.dataset.on = "1";
    let W = 0, H = 0;
    const size = () => {
      const dpr = devicePixelRatio || 1, r = canvas.getBoundingClientRect();
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ps = Array.from({ length: Math.round(Math.max(12, Math.min(34, W / 28))) }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: 4 + Math.random() * 6, vy: .25 + Math.random() * .6,
      vx: -.2 - Math.random() * .5, r: Math.random() * 6, vr: (Math.random() - .5) * .03, ph: Math.random() * 6, o: .35 + Math.random() * .5,
    }));
    let mx = 0;
    canvas.parentElement.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - .5) * 2; });
    const ro = new ResizeObserver(size); ro.observe(canvas);
    const step = (t) => {
      if (!canvas.isConnected) { ro.disconnect(); return; }
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y += p.vy; p.x += p.vx + Math.sin(t / 900 + p.ph) * .35 + mx * .4; p.r += p.vr;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W * 1.2; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.sin(t / 700 + p.ph)) * .6 + .4);
        ctx.globalAlpha = p.o; ctx.fillStyle = "#ffb7c9";
        ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.quadraticCurveTo(p.s, -p.s * .2, 0, p.s); ctx.quadraticCurveTo(-p.s, -p.s * .2, 0, -p.s); ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let revealIO;
  function reveal(root) {
    revealIO?.disconnect();
    const els = $$(".rv:not(.in)", root);
    if (RM || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    revealIO = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => revealIO.observe(e));
  }

  document.addEventListener("pointermove", (e) => {
    const c = e.target.closest?.(".spot");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  // ---------- nav ----------
  const ROUTES = [
    { id: "", label: "Accueil", icon: "home" },
    { id: "itineraire", label: "Itinéraire", icon: "map" },
    { id: "prepa", label: "Prépa", icon: "check" },
    { id: "budget", label: "Budget", icon: "wallet" },
    { id: "valise", label: "Valise", icon: "bag" },
    { id: "infos", label: "Infos", icon: "info" },
  ];
  const route = () => location.hash.replace(/^#\/?/, "").split("?")[0];
  ROUTES.forEach((x) => {
    $("#nav").insertAdjacentHTML("beforeend", `<a href="#/${x.id}" data-r="${x.id}">${ic(x.icon)}<span>${x.label}</span><span class="count"></span></a>`);
    $("#tabbar").insertAdjacentHTML("beforeend", `<a href="#/${x.id}" data-r="${x.id}">${ic(x.icon)}<span>${x.label}</span></a>`);
  });
  function renderNav() {
    const r = route();
    const s = stats();
    const counts = { prepa: `${s.tDone}/${s.tasks}`, valise: `${s.pDone}/${s.pTotal}` };
    for (const [box, ind] of [["#nav", ".nav-ind"], ["#tabbar", ".tab-ind"]]) {
      const root = $(box);
      let on;
      $$("a", root).forEach((a) => {
        const is = a.dataset.r === r; a.classList.toggle("on", is); if (is) on = a;
        const c = a.querySelector(".count"); if (c) c.textContent = counts[a.dataset.r] || "";
      });
      const el = $(ind, root);
      if (on && on.offsetWidth) {
        el.style.width = on.offsetWidth + "px"; el.style.height = on.offsetHeight + "px";
        el.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
        requestAnimationFrame(() => el.classList.add("ready"));
      }
    }
  }
  addEventListener("resize", () => renderNav());
  addEventListener("scroll", () => { const sc = $("#scrub"); if (sc) sc.classList.toggle("stuck", sc.getBoundingClientRect().top <= 1 && scrollY > 80); }, { passive: true });

  // ---------- route map ----------
  const proj = (lon, lat) => [40 + ((lon - 132) / 8.2) * 720, 30 + ((36.95 - lat) / 2.75) * 320];
  const P = Object.fromEntries(T.cities.map((c) => [c.name, proj(c.lon, c.lat)]));
  const f1 = (p) => p.map((v) => v.toFixed(1)).join(",");
  function smooth(pts) { // Catmull-Rom → cubic Bézier
    let out = `M${f1(pts[0])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      out += ` C${f1(c1)} ${f1(c2)} ${f1(p2)}`;
    }
    return out;
  }
  const arc = (a, b, bend) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return `M${f1(a)} Q${f1([mx - dy * bend, my + dx * bend])} ${f1(b)}`; };
  const cityDays = (c) => T.days.filter((x) => x.city === c.name || (c.name === "Miyajima" && x.date === "2027-07-17") || (c.name === "Kobe" && x.date === "2027-07-18")).map((x) => x.date);
  function routeMap() {
    const t = isoDay(today());
    const main = smooth([P.Tokyo, proj(139.15, 35.25), proj(138.4, 34.97), proj(136.9, 35.17), P.Kyoto, P.Osaka, P.Kobe, P.Himeji, proj(133.9, 34.66), P.Hiroshima, P.Miyajima]);
    const exc = [arc(P.Tokyo, P.Nikko, -.25), arc(P.Tokyo, P.Kamakura, .3), arc(P.Tokyo, P.Fuji, .25), arc(P.Kyoto, P.Nara, -.35)];
    const lab = { r: [12, 4, "start"], l: [-12, 4, "end"], t: [0, -14, "middle"], b: [0, 24, "middle"] };
    const cities = T.cities.map((c, i) => {
      const [x, y] = P[c.name], [dx, dy, anc] = lab[c.lab], v = cityDays(c);
      const cls = v.includes(t) ? "now" : v.length && v[v.length - 1] < t ? "done" : "";
      return `<g class="city ${cls}" style="--i:${i}" data-act="city" data-id="${c.day}" tabindex="0" role="button" aria-label="${c.name}, ${c.dates}">
        <title>${c.name} · ${c.dates}</title>
        <circle class="halo" cx="${x}" cy="${y}" r="10"/><circle class="dot" cx="${x}" cy="${y}" r="6"/>
        <text x="${x + dx}" y="${y + dy}" text-anchor="${anc}">${c.name}</text>
        <text class="k" x="${x + dx}" y="${y + dy + (c.lab === "t" ? -13 : 13)}" text-anchor="${anc}">${c.kanji}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 800 380" role="img" aria-label="Carte du trajet">
      <path id="mainline" d="${main}" fill="none" stroke="none"/>
      <path class="mline glow" d="${main}"/>
      <path class="mline draw" d="${main}" pathLength="1"/>
      ${exc.map((e) => `<path class="mexc" d="${e}"/>`).join("")}
      ${RM ? "" : `<circle class="train" r="5"><animateMotion dur="9s" begin="2.6s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"><mpath href="#mainline"/></animateMotion></circle>`}
      ${cities}
    </svg>`;
  }

  // ---------- views ----------
  function viewHome() {
    const s = stats();
    const ph = phase();
    const t = isoDay(today());
    const next = allTasks().filter((x) => !S.tasks[x.id]).slice(0, 5);
    const todayIdx = T.days.findIndex((x) => x.date === t);

    let heroRight;
    if (ph === "before") heroRight = `<div class="cd" id="cd">${["jours", "heures", "min", "sec"].map((l) => `<div><b><span>–</span></b><span>${l}</span></div>`).join("")}</div>`;
    else if (ph === "during") heroRight = `<div class="cd"><div><b>${todayIdx + 1}</b><span>jour sur ${T.days.length}</span></div><div><b>${T.days.length - todayIdx - 1}</b><span>restants</span></div></div>`;
    else heroRight = `<div class="cd"><div><b>おかえり</b><span>Bon retour !</span></div></div>`;
    const lead = ph === "during" ? `Aujourd'hui : <b>${esc(T.days[todayIdx].title)}</b> · ${esc(T.days[todayIdx].tip)}` : `20 nuits · ${T.group} voyageurs · 4 → 24 juillet 2027`;
    const spentPct = pct(s.spent, T.budget.cap);
    const focusDay = ph === "during" ? T.days[todayIdx] : null;

    return `
      <section class="hero">
        ${heroScape()}
        <canvas id="petals" aria-hidden="true"></canvas>
        <div>
          <span class="eyebrow"><i></i>Tokyo · Kyoto · Osaka · Hiroshima</span>
          <h1>Japon 2027<span class="jp">日本</span></h1>
          <p class="lead">${lead}</p>
          ${!focusDay && next[0] ? `<a class="chipline" href="#/prepa"><b>J-${Math.max(0, daysUntil(next[0].due))}</b>Prochaine étape : ${esc(next[0].title)}</a>` : ""}
        </div>
        ${heroRight}
      </section>

      <section class="card map-card rv" style="margin-bottom:16px">
        <div class="card-h"><h2>La route</h2><a href="#/itineraire">Itinéraire →</a></div>
        <div class="map-outer" style="position:relative">
          <div class="map-stats"><div><b>${T.cities.length}</b><span>villes</span></div><div><b>4</b><span>Shinkansen</span></div><div><b>~1 750</b><span>km de rail</span></div></div>
          <div class="map-wrap" id="map-wrap">${routeMap()}</div>
        </div>
        <div class="map-legend"><span><i></i>Shinkansen</span><span><i class="d"></i>Excursions</span><span>Touche une ville pour voir ses journées</span><span class="swipe-hint">← Fais glisser la carte</span></div>
      </section>

      <section class="grid g4" style="margin-bottom:16px">
        ${statCard(0, "Préparatifs", "check", `${num(s.tDone)}<small> / ${s.tasks}</small>`, pct(s.tDone, s.tasks), "var(--accent)", "#/prepa")}
        ${statCard(1, "Valise", "bag", `${num(s.pDone)}<small> / ${s.pTotal}</small>`, pct(s.pDone, s.pTotal), "var(--c-b3)", "#/valise")}
        ${statCard(2, "Dépensé sur place", "wallet", `${num(s.spent, "eur")}<small> / ${eur(T.budget.cap)}</small>`, spentPct, spentPct > 100 ? "var(--late)" : "var(--c-b1)", "#/budget")}
        ${statCard(3, "Activités faites", "map", `${num(s.aDone)}<small> / ${s.aTotal}</small>`, pct(s.aDone, s.aTotal), "var(--c-violet)", "#/itineraire")}
      </section>

      <section class="grid g-home" style="margin-bottom:16px">
        ${focusDay ? `
        <div class="card spot rv">
          <div class="card-h"><h2>Programme du jour</h2><a href="#/itineraire">Voir tout →</a></div>
          <div style="display:grid;gap:10px">${dayItems(focusDay).map((it) => `<div data-key="${esc(it.id)}">${checkbox("item", it.id, S.items[it.id], esc(clean(it.text)), blockColor(focusDay.block))}</div>`).join("")}</div>
        </div>` : `
        <div class="card spot rv">
          <div class="card-h"><h2>Prochaines étapes</h2><a href="#/prepa">Tout voir →</a></div>
          <div class="list">${next.length ? next.map(taskRowMini).join("") : '<p class="empty">Tout est prêt. いってらっしゃい !</p>'}</div>
        </div>`}
        <div class="card spot rv" style="--i:1">
          <div class="card-h"><h2>Heure & yens</h2><span class="small faint">1 € = ${S.rate} ¥</span></div>
          <div class="clock"><div class="jst"><b id="clk-jp">--:--</b><span>Tokyo (JST)</span></div><div><b id="clk-here">--:--</b><span>Ici</span></div></div>
          <div class="conv">
            <label><input type="number" id="cv-eur" value="10" min="0" step="0.5" inputmode="decimal" aria-label="Euros"><span>€</span></label>
            <span class="swap">${ic("swap")}</span>
            <label><input type="number" id="cv-jpy" value="${10 * S.rate}" min="0" step="100" inputmode="numeric" aria-label="Yens"><span>¥</span></label>
          </div>
          <div class="quick"><span>Konbini ~400 ¥</span><span>Ramen ~1 200 ¥</span><span>Bière ~500 ¥</span><span>Club ~3 000 ¥</span></div>
        </div>
      </section>

      <section class="card rv">
        <div class="card-h"><h2>Météo en juillet</h2><span class="small faint">Moyennes max / min · 20-25 000 pas/jour</span></div>
        <div class="climate">${T.climate.map((c, i) => `
          <div class="clim rv" style="--i:${i}">
            <b>${c.city}</b>
            <span class="t">${c.hi}°<small> / ${c.lo}°</small></span>
            <span class="th"><i style="--x:${Math.round((c.hi / 36) * 100)}"></i></span>
            <p>${c.note}</p>
          </div>`).join("")}</div>
      </section>`;
  }
  // Layered night landscape with Mt Fuji and a rising sun.
  const heroScape = () => `
    <svg class="hero-scape" viewBox="0 0 1200 300" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="hs-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".55" stop-color="#e8452a"/><stop offset="1" stop-color="#e8452a" stop-opacity="0"/></radialGradient>
        <linearGradient id="hs-fuji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4f9e"/><stop offset="1" stop-color="#1b2155"/></linearGradient>
        <linearGradient id="hs-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151b4d"/><stop offset="1" stop-color="#0d1130"/></linearGradient>
      </defs>
      <circle class="sunc" cx="930" cy="112" r="98" fill="url(#hs-sun)" opacity=".75"/>
      <circle class="sunc" cx="930" cy="112" r="52" fill="#f2603f" opacity=".9"/>
      <path class="l1" fill="#262d6c" opacity=".7" d="M420 300 C520 240 600 250 680 215 C740 190 790 205 840 185 C900 200 1000 170 1080 205 C1130 225 1170 210 1200 220 V300 Z"/>
      <g class="l2">
        <path fill="url(#hs-fuji)" d="M690 300 L868 128 C884 112 896 108 912 108 L948 108 C964 108 976 112 992 128 L1170 300 Z"/>
        <path fill="#eef0ff" opacity=".92" d="M868 128 C884 112 896 108 912 108 L948 108 C964 108 976 112 992 128 L972 146 L956 133 L940 152 L924 134 L906 150 L890 136 Z"/>
      </g>
      <path class="l3" fill="url(#hs-near)" d="M0 300 V262 C120 250 220 272 340 258 C470 243 560 276 700 262 C820 250 900 278 1010 266 C1100 256 1160 270 1200 264 V300 Z"/>
    </svg>`;
  const statCard = (i, k, icon, v, p, c, href) => `
    <a class="card stat spot rv" style="--i:${i}" href="${href}">
      <div class="k">${ic(icon)}${k}</div>
      <div class="v">${v}</div>
      ${bar(p, c)}
    </a>`;
  const statusTag = (t) => {
    if (S.tasks[t.id]) return `<span class="tag ok">Fait</span>`;
    const n = daysUntil(t.due);
    if (n < 0) return `<span class="tag late">En retard</span>`;
    if (n <= 30) return `<span class="tag warn">Dans ${n} j</span>`;
    return `<span class="tag">${fmt(t.due, { day: "numeric", month: "short" })}</span>`;
  };
  const taskRowMini = (t) => `
    <div class="row" data-key="${t.id}">
      <div class="grow">${checkbox("task", t.id, S.tasks[t.id], `<span class="t">${esc(t.title)}</span>`)}</div>
      ${statusTag(t)}
    </div>`;
  const stayRow = (s, extra = "") => `
    <div class="stay">
      <span class="jp">${s.kanji}</span>
      <div style="min-width:0"><b>${s.name}</b>${extra}<div class="small faint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmt(s.from, { day: "numeric" })} → ${fmt(s.to, { day: "numeric", month: "short" })} · ${esc(s.where)}</div></div>
      <div class="n">${s.nights}<small>nuit${s.nights > 1 ? "s" : ""}</small></div>
    </div>`;

  function viewItin() {
    const t = isoDay(today());
    const chips = [["all", "Tout", "var(--ink-3)"]].concat(T.blocks.slice(1).map((b) => [String(b.id), b.name, b.color]))
      .map(([id, label, c]) => `<button class="chip" data-act="block" data-id="${id}" aria-pressed="${ui.block === id}"><i style="background:${c}"></i>${label}</button>`).join("");
    const groups = T.blocks.map((b) => {
      if (ui.block !== "all" && ui.block !== String(b.id) && !(ui.block === "1" && b.id === 0)) return "";
      const days = T.days.filter((x) => x.block === b.id);
      return `<div data-key="blk-${b.id}">
        <div class="block-h" style="--c:${b.color}"><i></i><h2>${b.name}</h2><span>${fmt(days[0].date, { day: "numeric" })} → ${fmt(days[days.length - 1].date, { day: "numeric", month: "long" })}</span></div>
        <div class="days">${days.map((day, i) => dayCard(day, t, i)).join("")}</div>
      </div>`;
    }).join("");
    const s = stats();
    return `
      <header class="head">
        <div><span class="eyebrow">22 jours · 3 blocs · ${s.aDone}/${s.aTotal} activités</span><h1>Itinéraire</h1>
        <p>Coche ce que tu as fait, ouvre une journée pour ses conseils, ses lieux sur Maps et tes notes.</p></div>
        <button class="btn soft" data-act="toggle-all">${ui.open.size ? "Tout fermer" : "Tout ouvrir"}</button>
      </header>
      <nav class="scrub" id="scrub" aria-label="Aller à un jour">${T.days.map((day) => {
        const its = dayItems(day), dn = its.filter((it) => S.items[it.id]).length;
        return `<button data-act="jump" data-id="${day.date}" style="--c:${blockColor(day.block)}" class="${dn && dn === its.length ? "done" : ""} ${day.date === t ? "today" : ""}" title="${esc(day.title)}"><small>${fmt(day.date, { weekday: "short" }).slice(0, 3)}</small><b>${+day.date.slice(8)}</b><i></i></button>`;
      }).join("")}</nav>
      <div class="chips" style="margin:6px 0 8px">${chips}</div>
      <div>${groups}</div>`;
  }
  function dayCard(day, t, idx) {
    const items = dayItems(day);
    const done = items.filter((it) => S.items[it.id]).length;
    const open = ui.open.has(day.date);
    const c = blockColor(day.block);
    const clim = climateFor(day.city);
    const city = day.city.split(" ")[0];
    return `
      <article class="day rv ${open ? "open" : ""} ${day.date === t ? "today" : ""} ${done && done === items.length ? "complete" : ""}" style="--c:${c};--i:${idx % 6}" data-key="${day.date}" id="day-${day.date}">
        <button class="day-h" data-act="day" data-id="${day.date}" aria-expanded="${open}">
          <span class="day-k">${day.kanji}</span>
          <span style="min-width:0">
            <span class="dt">${fmt(day.date, { weekday: "short", day: "numeric", month: "long" })} · ${esc(day.city)}</span>
            <h3>${esc(day.title)}${day.event ? `<span class="tag accent">${day.event}</span>` : ""}${day.date === t ? '<span class="tag accent">Aujourd\'hui</span>' : ""}</h3>
            <div class="prev">${items.map((x) => esc(clean(x.text))).join(" · ")}</div>
          </span>
          <span class="day-meta">
            ${ring(pct(done, items.length), `${done}/${items.length}`, c)}
            ${ic("chev", "chev")}
          </span>
        </button>
        <div class="day-b"><div>
          <div class="day-in">
            <div class="items">
              ${items.map((it, i) => `<div class="item-row" style="--i:${i}" data-key="${esc(it.id)}">${checkbox("item", it.id, S.items[it.id], esc(clean(it.text)), c)}
                <span class="acts">${isPlace(it.text) ? `<a class="maps" href="${mapsUrl(clean(it.text), city)}" target="_blank" rel="noopener" title="Ouvrir dans Google Maps" aria-label="Ouvrir ${esc(clean(it.text))} dans Google Maps">${ic("pin")}</a>` : ""}<button class="icon-btn" data-act="rm-item" data-day="${day.date}" data-id="${esc(it.id)}" aria-label="Retirer">${ic("x")}</button></span></div>`).join("")}
              <form class="add-inline" data-act="add-item" data-id="${day.date}">
                <input type="text" name="t" placeholder="Ajouter une activité…" autocomplete="off">
                <button aria-label="Ajouter">${ic("plus")}</button>
              </form>
            </div>
            <div class="day-side">
              ${day.tip ? `<div class="tipbox">${ic("bulb")}<span>${esc(day.tip)}</span></div>` : ""}
              ${clim ? `<span class="wchip">${ic("thermo")}${clim.hi}° / ${clim.lo}° · ${esc(clim.note)}</span>` : ""}
              <label class="f">Notes
                <textarea data-act="note" data-id="${day.date}" placeholder="Adresses, horaires, idées…">${esc(S.notes[day.date] || "")}</textarea>
              </label>
            </div>
          </div>
        </div></div>
      </article>`;
  }

  function viewPrep() {
    const tasks = allTasks();
    const done = tasks.filter((t) => S.tasks[t.id]).length;
    const late = tasks.filter((t) => !S.tasks[t.id] && daysUntil(t.due) < 0).length;
    const shown = tasks.filter((t) => ui.prepFilter === "all" || (ui.prepFilter === "done" ? S.tasks[t.id] : !S.tasks[t.id]));
    const months = {};
    for (const t of shown) (months[t.due.slice(0, 7)] ||= []).push(t);
    const nextT = tasks.find((t) => !S.tasks[t.id]);
    const chips = [["todo", "À faire"], ["done", "Faites"], ["all", "Toutes"]]
      .map(([id, l]) => `<button class="chip" data-act="prep-filter" data-id="${id}" aria-pressed="${ui.prepFilter === id}">${l}</button>`).join("");
    const n = nextT ? daysUntil(nextT.due) : 0;

    return `
      <header class="head">
        <div><span class="eyebrow">Avant le départ</span><h1>Préparatifs</h1>
        <p>Après le passeport et le vol, rien d'urgent avant avril 2027. Le Fuji et le PokePark partent vite.</p></div>
        <div style="display:flex;align-items:center;gap:14px">
          ${ring(pct(done, tasks.length), pct(done, tasks.length) + "%", "", 66)}
          <div><b style="font-size:1.3rem">${num(done)} / ${tasks.length}</b><div class="small faint">${late ? `<span style="color:var(--late)">${late} en retard</span>` : "dans les temps"}</div></div>
        </div>
      </header>
      <div>${nextT ? `
      <section class="card spotlight rv" data-key="spot-${nextT.id}">
        <div class="jx">${n < 0 ? "!" : "J-" + n}<small>${n < 0 ? `en retard de ${-n} j` : fmt(nextT.due, { day: "numeric", month: "long" })}</small></div>
        <div style="min-width:0"><span class="small muted">Prochaine échéance · ${nextT.cat}</span><h2 style="font-size:1.3rem;margin-top:2px">${esc(nextT.title)}</h2>${nextT.detail ? `<p class="small muted" style="margin-top:4px">${esc(nextT.detail)}</p>` : ""}</div>
        <button class="btn" data-act="task-done" data-id="${nextT.id}">${ic("tick")}C'est fait</button>
      </section>` : ""}</div>
      <section class="card rv" style="margin-bottom:20px">
        <form class="form-grid" data-act="add-task">
          <label class="f">Nouvelle tâche<input type="text" name="title" placeholder="Ex. Réserver Universal Express Pass" required autocomplete="off"></label>
          <label class="f">Échéance<input type="date" name="due" required value="${isoDay(new Date(Date.now() + 14 * 864e5))}"></label>
          <button class="btn">${ic("plus")}Ajouter</button>
        </form>
      </section>
      <div class="chips" style="margin-bottom:18px">${chips}</div>
      <div>
        ${Object.keys(months).length ? Object.entries(months).map(([m, list]) => `<div data-key="m-${m}">
          <div class="month-h"><h2>${fmt(m + "-01", { month: "long", year: "numeric" })}</h2><span class="small faint">${list.length} tâche${list.length > 1 ? "s" : ""}</span></div>
          ${list.map((t) => `
            <div class="task ${S.tasks[t.id] ? "is-done" : ""}" data-key="${t.id}">
              <div class="grow">
                ${checkbox("task", t.id, S.tasks[t.id], `<span class="t">${esc(t.title)}</span>${t.detail ? `<span class="d" style="display:block">${esc(t.detail)}</span>` : ""}`)}
                <div class="meta" style="margin-left:34px"><span class="tag">${t.cat}</span>${statusTag(t)}</div>
              </div>
              ${t.custom ? `<button class="icon-btn" data-act="rm-task" data-id="${t.id}" aria-label="Supprimer">${ic("x")}</button>` : ""}
            </div>`).join("")}</div>`).join("") : '<p class="empty">Rien ici.</p>'}
      </div>`;
  }

  function viewBudget() {
    const s = stats();
    const by = spentBy();
    const est = T.budget.cats.reduce((a, c) => a + c.est, 0);
    const fixed = T.budget.fixed.reduce((a, c) => a + c.amount, 0);
    const max = Math.max(T.budget.cap, s.spent) * 1.05;
    const exps = [...S.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const catOf = (id) => T.budget.cats.find((c) => c.id === id) || T.budget.cats[T.budget.cats.length - 1];

    // Donut: actual split once something is spent, otherwise the estimate.
    const useReal = s.spent > 0;
    const parts = T.budget.cats.map((c) => ({ ...c, v: useReal ? by[c.id] || 0 : c.est }));
    const tot = parts.reduce((a, p) => a + p.v, 0) || 1;
    let acc = 0;
    const grad = parts.map((p) => { const a = acc; acc += (p.v / tot) * 100; return `${p.color} ${a.toFixed(2)}% ${acc.toFixed(2)}%`; }).join(",");

    // Per-day bars over the trip.
    const t = isoDay(today());
    const tripDays = T.days.slice(1);
    const perDay = Object.fromEntries(tripDays.map((x) => [x.date, 0]));
    for (const e of S.expenses) if (e.date in perDay) perDay[e.date] += toEur(e);
    const dmax = Math.max(60, ...Object.values(perDay));
    const left = tripDays.filter((x) => x.date >= t).length || tripDays.length;
    const perDayAdvice = Math.max(0, (T.budget.cap - s.spent) / left);
    const tripSpent = Object.values(perDay).reduce((a, b) => a + b, 0);
    const daysWith = Object.values(perDay).filter((v) => v > 0).length;

    return `
      <header class="head">
        <div><span class="eyebrow">Par personne</span><h1>Budget</h1>
        <p>Fixe ~${eur(fixed)} (vol + logements). Sur place : estimation ${eur(est)} sous un plafond de ${eur(T.budget.cap)}, pour ${eur(T.budget.available)} disponibles.</p></div>
      </header>
      <section class="grid g2" style="margin-bottom:16px">
        <div class="card spot rv">
          <div class="card-h"><h2>Dépensé sur place</h2><span class="tag ${s.spent > T.budget.cap ? "late" : "ok"}">${s.spent > T.budget.cap ? "Plafond dépassé" : `Reste ${eur(T.budget.cap - s.spent)}`}</span></div>
          <div class="big-num">${num(s.spent, "eur")} <small>/ ${eur(T.budget.cap)}</small></div>
          <div class="meter">
            <div class="fill ${s.spent > T.budget.cap ? "over" : ""}" style="--w:${(s.spent / max) * 100}"></div>
            <div class="mk t" style="left:${(est / max) * 100}%"><span>Estimé ${eur(est)}</span></div>
            <div class="mk r" style="left:${(T.budget.cap / max) * 100}%"><span>Plafond</span></div>
          </div>
          <div class="kpis" style="margin-bottom:14px">
            <div class="kpi"><b>${num(perDayAdvice, "eur")}</b><span>par jour pour tenir</span></div>
            <div class="kpi"><b>${num(daysWith ? tripSpent / daysWith : 0, "eur")}</b><span>moyenne / jour</span></div>
            <div class="kpi"><b>${num(S.expenses.length)}</b><span>dépenses</span></div>
          </div>
          <div>${T.budget.cats.map((c) => `
            <div class="cat-row" style="--c:${c.color}">
              <i></i><span>${c.label}</span><span class="n">${eur(by[c.id] || 0)} <small>/ ${eur(c.est)}</small></span>
              <div class="bar"><i style="--w:${Math.min(pct(by[c.id] || 0, c.est), 100)};${(by[c.id] || 0) > c.est ? "background:var(--late)" : ""}"></i></div>
            </div>`).join("")}</div>
        </div>
        <div class="stack">
          <div class="card rv" style="--i:1">
            <div class="card-h"><h2>Ajouter une dépense</h2>
              <div class="seg">${["EUR", "JPY"].map((c) => `<button data-act="cur" data-id="${c}" aria-pressed="${ui.cur === c}">${c === "EUR" ? "€" : "¥"}</button>`).join("")}</div>
            </div>
            <form class="exp-form" data-act="add-exp">
              <label class="f">Quoi<input type="text" name="label" placeholder="Ramen Ichiran" required autocomplete="off"></label>
              <label class="f">Montant (${ui.cur === "EUR" ? "€" : "¥"})<input type="number" name="amount" min="0" step="${ui.cur === "EUR" ? "0.01" : "1"}" required inputmode="decimal"></label>
              <label class="f">Catégorie<select name="cat">${T.budget.cats.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select></label>
              <label class="f">Date<input type="date" name="date" value="${isoDay(today())}"></label>
              <label class="f">1 € = ¥<input type="number" data-act="rate" value="${S.rate}" min="1" step="0.1"></label>
              <button class="btn accent" style="align-self:end">${ic("plus")}Ajouter</button>
            </form>
          </div>
          <div class="card rv" style="--i:2">
            <div class="card-h"><h2>${useReal ? "Répartition réelle" : "Répartition estimée"}</h2></div>
            <div class="donut">
              <div class="donut-c" style="background:conic-gradient(${grad})"><div><b>${eur(useReal ? s.spent : est)}</b><span>${useReal ? "dépensé" : "estimé"}</span></div></div>
              <div class="legend">${parts.map((p) => `<div><i style="background:${p.color}"></i><span>${p.label}</span><b>${Math.round((p.v / tot) * 100)}%</b></div>`).join("")}</div>
            </div>
          </div>
        </div>
      </section>
      <section class="grid g2" style="margin-bottom:16px">
        <div class="card rv">
          <div class="card-h"><h2>Jour par jour</h2><span class="small faint">4 → 24 juillet</span></div>
          <div class="dbars-wrap">${tripSpent ? "" : '<div class="dbars-empty">Les barres se rempliront au fil de tes dépenses pendant le voyage.</div>'}<div class="dbars">${tripDays.map((x, i) => `<div class="b ${x.date === t ? "today" : ""} ${perDay[x.date] ? "" : "empty"}" style="--i:${i}" title="${fmt(x.date, { day: "numeric", month: "short" })} · ${eur(perDay[x.date])}"><i style="--h:${(perDay[x.date] / dmax) * 100}"></i><span>${fmt(x.date, { day: "numeric" })}</span></div>`).join("")}</div></div>
        </div>
        <div class="card rv" style="--i:1">
          <div class="card-h"><h2>Dépenses</h2><span class="small faint">${exps.length}</span></div>
          <div class="list" style="max-height:340px;overflow:auto">${exps.length ? exps.map((e) => {
            const c = catOf(e.cat);
            return `<div class="row" data-key="${e.id}">
              <span class="date-pill"><b>${fmt(e.date, { day: "numeric" })}</b><span>${fmt(e.date, { month: "short" }).replace(".", "")}</span></span>
              <div class="grow"><div class="t">${esc(e.label)}</div><div class="d"><span style="color:${c.color}">●</span> ${c.label}${e.currency === "JPY" ? ` · ¥${e.amount.toLocaleString("fr-FR")}` : ""}</div></div>
              <b>${toEur(e).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</b>
              <button class="icon-btn" data-act="rm-exp" data-id="${e.id}" aria-label="Supprimer">${ic("x")}</button>
            </div>`;
          }).join("") : '<p class="empty">Aucune dépense pour l\'instant. Ajoute ton premier ramen !</p>'}</div>
        </div>
      </section>
      <section class="card rv">
        <div class="card-h"><h2>Les kiffs prévus</h2><span class="small faint">5-6 gros repas sur le voyage</span></div>
        <div class="kiffs">${T.kiffs.map((k) => `<div class="kiff lift"><b>${esc(k.name)}</b><span class="small muted">${esc(k.where)}</span><span class="p">${k.price}</span></div>`).join("")}</div>
      </section>`;
  }

  function viewPack() {
    const cat = S.packCat;
    const items = packItems(cat);
    const s = stats();
    return `
      <header class="head">
        <div><span class="eyebrow">2 valises soute de 23 kg + cabine 10 kg</span><h1>Valise</h1>
        <p>Astuce : partir avec la deuxième valise quasi vide, elle revient pleine d'achats.</p></div>
        <div style="display:flex;align-items:center;gap:14px">
          ${ring(pct(s.pDone, s.pTotal), pct(s.pDone, s.pTotal) + "%", "var(--c-b3)", 66)}
          <button class="btn soft" data-act="reset-pack">Tout décocher</button>
        </div>
      </header>
      <div class="pack-layout">
        <div class="pack-cats">${T.packing.map((p, i) => {
          const its = packItems(p.cat);
          const dn = its.filter((it) => S.packing[it.id]).length;
          return `<button class="pcat rv" style="--i:${i}" data-act="pack-cat" data-id="${esc(p.cat)}" aria-pressed="${p.cat === cat}">
            <b>${esc(p.cat)}</b><span>${dn === its.length && its.length ? "✓" : `${dn}/${its.length}`}</span>
            ${bar(pct(dn, its.length), "var(--c-b3)")}</button>`;
        }).join("")}</div>
        <div class="card rv" style="--i:1">
          <div class="card-h"><h2>${esc(cat)}</h2><span class="small faint">${items.filter((it) => S.packing[it.id]).length}/${items.length}</span></div>
          <div class="list">
            ${items.map((it) => `<div class="row" data-key="${esc(it.id)}">${checkbox("pack", it.id, S.packing[it.id], esc(it.text), "var(--c-b3)")}<span class="grow"></span><button class="icon-btn" data-act="rm-pack" data-id="${esc(it.id)}" aria-label="Retirer">${ic("x")}</button></div>`).join("")}
          </div>
          <form class="add-inline" data-act="add-pack" style="margin-top:10px">
            <input type="text" name="t" placeholder="Ajouter un objet…" autocomplete="off">
            <button aria-label="Ajouter">${ic("plus")}</button>
          </form>
        </div>
      </div>`;
  }

  function viewInfos() {
    return `
      <header class="head">
        <div><span class="eyebrow">Tout au même endroit</span><h1>Infos</h1>
        <p>Vols, logements, Fuji, transports, phrases, urgences et bons plans.</p></div>
      </header>
      <section class="grid g2" style="margin-bottom:16px">
        <div class="card flight rv">
          <div class="card-h"><h2>Vols · Air China</h2><span class="muted small">~941 € / pers</span></div>
          ${T.flights.map((f) => `<div class="leg"><b>${f.from}</b><span class="ln"></span><b>${f.to}</b><small>${f.when} · ${f.note}</small></div>`).join("")}
        </div>
        <div class="card rv" style="--i:1">
          <div class="card-h"><h2>Logements</h2><span class="small faint">~580 € / pers · paiement juin 2027</span></div>
          ${T.stays.map((s) => stayRow(s, ` <span class="tag" style="margin-left:4px">${esc(s.status)}</span>`)).join("")}
        </div>
      </section>

      <section class="card rv" style="margin-bottom:16px">
        <div class="card-h"><h2>Mont Fuji · ton choix</h2><span class="small faint">Ven 9 – sam 10 juillet · ~100-145 € / pers</span></div>
        <div class="fuji-opts">${T.fuji.map((o) => `
          <button class="fopt" data-act="fuji" data-id="${o.id}" aria-pressed="${S.fuji === o.id}">
            <span class="top">${o.name}<span class="tick">${S.fuji === o.id ? ic("tick") : ""}</span></span>
            <span class="price">${o.price}</span>
            <p>${o.how}</p>
            <span class="pc"><span style="color:var(--ok)">+ ${o.pro}</span><span style="color:var(--late)">− ${o.con}</span></span>
          </button>`).join("")}</div>
        <p class="small faint" style="margin-top:12px">Règles 2027 à revérifier : inscription en ligne, ~4 000 ¥ d'entrée, sentier Yoshida fermé de l'après-midi à 3h sans refuge réservé.</p>
      </section>

      <section class="card rv" style="margin-bottom:16px">
        <div class="card-h"><h2>Phrases utiles</h2><span class="small faint">Touche pour écouter la prononciation</span></div>
        <div class="phrases">${T.phrases.map((p, i) => `<button class="phrase lift" data-act="say" data-id="${i}"><span class="wave"><i></i><i></i><i></i></span><span class="jp">${p.jp}</span><span class="ro">${p.ro}</span><span class="fr">${p.fr}</span></button>`).join("")}</div>
      </section>

      <section class="grid g2" style="margin-bottom:16px">
        <div class="card rv">
          <div class="card-h"><h2>Shinkansen</h2><span class="small faint">Pas de JR Pass · ~533 € transport total</span></div>
          <table class="table">${T.trains.map((r) => `<tr><td><b>${r.leg}</b><div class="small faint">${r.date} · ${r.dur}</div></td><td>~${r.price} €</td></tr>`).join("")}</table>
        </div>
        <div class="card rv" style="--i:1">
          <div class="card-h"><h2>Urgences</h2><span class="small faint">Gratuit depuis n'importe quel téléphone</span></div>
          <div class="sos">${T.emergency.map((e) => `<a href="tel:${e.num.replace(/-/g, "")}"><span>${e.label}</span><b>${e.num}</b></a>`).join("")}</div>
        </div>
      </section>

      <section class="tips-wrap">
        ${T.tips.map((t, i) => `<div class="card tips spot rv" style="--i:${i % 3}"><div class="card-h"><h2>${t.title}</h2></div><ul>${t.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
      </section>

      <section class="card rv">
        <div class="card-h"><h2>Mes données</h2><span class="small faint">Enregistrées dans ce navigateur</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn soft" data-act="export">${ic("down")}Exporter (JSON)</button>
          <label class="btn soft" style="cursor:pointer">${ic("up")}Importer<input type="file" accept="application/json" data-act="import" hidden></label>
          <button class="btn soft" data-act="theme">Changer de thème</button>
          <button class="btn soft" data-act="reset" style="color:var(--late)">Tout réinitialiser</button>
        </div>
      </section>`;
  }

  // ---------- render ----------
  const VIEWS = { "": viewHome, itineraire: viewItin, prepa: viewPrep, budget: viewBudget, valise: viewPack, infos: viewInfos };
  const view = $("#view");
  let lastRoute = null, clockTimer;
  function render() {
    const r = route();
    const html = (VIEWS[r] || viewHome)();
    const full = r !== lastRoute;
    lastRoute = r;
    if (full) {
      view.classList.add("pre");
      view.innerHTML = html;
      window.scrollTo(0, 0);
      requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove("pre")));
      $$(".num", view).forEach((el) => countUp(el, 0));
    } else {
      changedNums = [];
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      morphChildren(view, tmp);
      changedNums.forEach(([el, from]) => countUp(el, from));
    }
    reveal(view);
    renderNav();
    const pc = $("#petals"); if (pc) petals(pc);
    const mw = $("#map-wrap"); if (full && mw && mw.scrollWidth > mw.clientWidth) mw.scrollLeft = mw.scrollWidth;
    clearInterval(clockTimer);
    if ($("#cd") || $("#clk-jp")) { tick(); clockTimer = setInterval(tick, 1000); }
    if (ui.focus) {
      const el = $("#day-" + ui.focus); ui.focus = null;
      if (el) setTimeout(() => { el.classList.add("in"); el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1700); }, 150);
    }
  }
  const go = (hash) => {
    if (location.hash === hash || (hash === "#/" && !location.hash)) render();
    else location.hash = hash;
  };
  function navigate() {
    if (document.startViewTransition && !RM && lastRoute !== null && route() !== lastRoute) document.startViewTransition(render);
    else render();
  }

  function tick() {
    const cd = $("#cd");
    if (cd) {
      const ms = Math.max(0, d(T.departure) - new Date());
      const p = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
      $$("b span", cd).forEach((sp, i) => {
        const v = String(p[i]).padStart(i ? 2 : 1, "0");
        if (sp.textContent !== v) { sp.textContent = v; if (sp.dataset.init) { sp.classList.remove("bump"); void sp.offsetWidth; sp.classList.add("bump"); } sp.dataset.init = 1; }
      });
    }
    const jp = $("#clk-jp");
    if (jp) {
      const now = new Date();
      jp.textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
      $("#clk-here").textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
  }

  // Remove with a collapse animation, then update state.
  function leave(el, then) {
    if (!el || RM || !el.animate) { then(); render(); return; }
    el.style.overflow = "hidden";
    el.animate([{ height: el.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" })
      .finished.then(() => { then(); el.remove(); render(); });
  }

  // ---------- events ----------
  view.addEventListener("change", (e) => {
    const el = e.target, act = el.dataset.act, id = el.dataset.id;
    if (act === "item") {
      S.items[id] = el.checked; save(); buzz();
      const day = T.days.find((x) => id.startsWith(x.date + "#") || (S.extra[x.date] || []).some((y) => y.id === id));
      render();
      if (el.checked && day && dayItems(day).every((it) => S.items[it.id])) {
        burstAt($(`#day-${day.date} .ring`) || el, 60); toast(`${day.title} : journée bouclée ✓`);
      }
    } else if (act === "task") {
      S.tasks[id] = el.checked; save(); buzz(); render();
      if (el.checked) { burstAt(el.closest(".ck") || el, 40); toast("Bien joué ✓"); }
    } else if (act === "pack") {
      S.packing[id] = el.checked; save(); buzz(); render();
      if (el.checked && packItems(S.packCat).every((it) => S.packing[it.id])) { burstAt($('.pcat[aria-pressed="true"]') || el, 60); toast(`${S.packCat} : tout est prêt ✓`); }
    } else if (act === "rate") { S.rate = Math.max(1, +el.value || 165); save(); render(); }
    else if (act === "import") importFile(el.files[0]);
  });
  let noteT;
  view.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.act === "note") { S.notes[el.dataset.id] = el.value; clearTimeout(noteT); noteT = setTimeout(save, 300); }
    else if (el.id === "cv-eur") $("#cv-jpy").value = Math.round((+el.value || 0) * S.rate);
    else if (el.id === "cv-jpy") $("#cv-eur").value = Math.round(((+el.value || 0) / S.rate) * 100) / 100;
  });
  view.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, act = f.dataset.act, fd = new FormData(f);
    if (act === "add-item") {
      const text = String(fd.get("t")).trim(); if (!text) return;
      (S.extra[f.dataset.id] ||= []).push({ id: "x-" + uid(), text });
    } else if (act === "add-task") {
      S.customTasks.push({ id: "c-" + uid(), title: String(fd.get("title")).trim(), due: fd.get("due"), detail: "" });
      toast("Tâche ajoutée");
    } else if (act === "add-exp") {
      const amount = parseFloat(fd.get("amount")); if (!(amount > 0)) return;
      S.expenses.push({ id: Date.now().toString(36), label: String(fd.get("label")).trim(), amount, currency: ui.cur, cat: fd.get("cat"), date: fd.get("date") || isoDay(today()) });
      toast("Dépense ajoutée");
    } else if (act === "add-pack") {
      const text = String(fd.get("t")).trim(); if (!text) return;
      (S.customPack[S.packCat] ||= []).push({ id: "x-" + uid(), text });
    } else return;
    save();
    const keep = act === "add-exp" ? { cat: f.elements.cat.value, date: f.elements.date.value } : null;
    f.reset();
    if (keep) { f.elements.cat.value = keep.cat; f.elements.date.value = keep.date; f.elements.label.focus(); }
    render();
  });
  view.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || ["INPUT", "FORM", "TEXTAREA"].includes(el.tagName)) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case "day": ui.open.has(id) ? ui.open.delete(id) : ui.open.add(id); break;
      case "toggle-all": if (ui.open.size) ui.open.clear(); else T.days.forEach((x) => ui.open.add(x.date)); break;
      case "block": ui.block = id; break;
      case "prep-filter": ui.prepFilter = id; break;
      case "cur": ui.cur = id; break;
      case "pack-cat": S.packCat = id; save(); break;
      case "fuji": S.fuji = S.fuji === id ? null : id; save(); if (S.fuji) burstAt(el, 30); break;
      case "jump": ui.focus = id; ui.open.add(id); if (ui.block !== "all" && T.days.find((x) => x.date === id).block + "" !== ui.block) ui.block = "all"; break;
      case "city": ui.focus = id; ui.open.add(id); ui.block = "all"; return go("#/itineraire");
      case "task-done": S.tasks[id] = true; save(); burstAt(el, 50); toast("Bien joué ✓"); break;
      case "rm-item":
        return leave(el.closest(".item-row"), () => {
          if (id.startsWith("x-")) S.extra[el.dataset.day] = (S.extra[el.dataset.day] || []).filter((x) => x.id !== id);
          else S.removed[id] = true;
          delete S.items[id]; save();
        });
      case "rm-task": return leave(el.closest(".task"), () => { S.customTasks = S.customTasks.filter((t) => t.id !== id); delete S.tasks[id]; save(); });
      case "rm-exp": return leave(el.closest(".row"), () => { S.expenses = S.expenses.filter((x) => x.id !== id); save(); toast("Dépense supprimée"); });
      case "rm-pack":
        return leave(el.closest(".row"), () => {
          if (id.startsWith("x-")) S.customPack[S.packCat] = (S.customPack[S.packCat] || []).filter((x) => x.id !== id);
          else S.removedPack[id] = true;
          delete S.packing[id]; save();
        });
      case "reset-pack": S.packing = {}; save(); toast("Valise remise à zéro"); break;
      case "theme": return toggleTheme(el);
      case "say": return say(T.phrases[+id].jp, el);
      case "export": return exportData();
      case "reset":
        if (el.dataset.armed) { const theme = S.theme; S = defaults(); S.theme = theme; save(); toast("Données réinitialisées"); break; }
        el.dataset.armed = "1"; el.textContent = "Confirmer la réinitialisation ?"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Tout réinitialiser"; } }, 4000);
        return;
      default: return;
    }
    render();
  });
  view.addEventListener("keydown", (e) => {
    const c = e.target.closest?.(".city");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); c.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });

  function say(text, el) {
    if (!("speechSynthesis" in window)) return toast("Synthèse vocale indisponible");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith("ja"));
    if (v) u.voice = v;
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
    file.text().then((txt) => {
      const data = JSON.parse(txt);
      if (typeof data !== "object" || !data) throw 0;
      S = { ...defaults(), ...data }; save(); render(); toast("Données importées");
    }).catch(() => toast("Fichier invalide"));
  }

  // ---------- search palette ----------
  const pal = $("#pal"), palQ = $("#pal-q"), palList = $("#pal-list");
  let palAll = [], palItems = [], palSel = 0;
  function palIndex() {
    const out = ROUTES.map((r) => ({ icon: ic(r.icon), title: r.label, sub: "Page", run: () => go("#/" + r.id) }));
    for (const day of T.days) {
      const goDay = () => { ui.focus = day.date; ui.open.add(day.date); ui.block = "all"; go("#/itineraire"); };
      out.push({ icon: day.kanji, title: `${fmt(day.date, { weekday: "short", day: "numeric" })} · ${day.title}`, sub: day.city, hay: day.tip, run: goDay });
      for (const it of dayItems(day)) out.push({ icon: ic(isPlace(it.text) ? "pin" : "map"), title: clean(it.text), sub: `${day.title} · ${fmt(day.date, { day: "numeric", month: "short" })}`, run: goDay });
    }
    for (const t of allTasks()) out.push({ icon: ic("check"), title: t.title, sub: `Prépa · ${fmt(t.due, { day: "numeric", month: "short", year: "numeric" })}`, hay: t.detail, run: () => { ui.prepFilter = "all"; go("#/prepa"); } });
    for (const p of T.packing) for (const it of packItems(p.cat)) out.push({ icon: ic("bag"), title: it.text, sub: `Valise · ${p.cat}`, run: () => { S.packCat = p.cat; save(); go("#/valise"); } });
    for (const p of T.phrases) out.push({ icon: "あ", title: `${p.ro} — ${p.fr}`, sub: p.jp, run: () => go("#/infos") });
    for (const tp of T.tips) for (const x of tp.items) out.push({ icon: ic("bulb"), title: x, sub: `Bon plan · ${tp.title}`, run: () => go("#/infos") });
    return out.map((o) => ({ ...o, n: norm(`${o.title} ${o.sub} ${o.hay || ""}`) }));
  }
  // Highlight the first match of each term (accent-insensitive, same length after NFD strip for Latin text).
  const hl = (text, terms) => {
    const n = norm(text);
    const marks = [];
    for (const t of terms) { const i = n.indexOf(t); if (i >= 0 && n.length === text.length) marks.push([i, i + t.length]); }
    marks.sort((a, b) => a[0] - b[0]);
    let out = "", pos = 0;
    for (const [a, b] of marks) { if (a < pos) continue; out += esc(text.slice(pos, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; pos = b; }
    return out + esc(text.slice(pos));
  };
  function palRender() {
    if (!palAll.length) palAll = palIndex();
    const terms = norm(palQ.value.trim()).split(/\s+/).filter(Boolean);
    palItems = terms.length ? palAll.filter((o) => terms.every((t) => o.n.includes(t))).slice(0, 40)
      : palAll.slice(0, 6).concat(allTasks().filter((t) => !S.tasks[t.id]).slice(0, 3).map((t) => palAll.find((o) => o.title === t.title && o.sub.startsWith("Prépa"))).filter(Boolean));
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.length ? palItems.map((o, i) => `<button class="pal-item ${i === palSel ? "sel" : ""}" data-i="${i}" role="option"><span class="pi">${o.icon}</span><span style="min-width:0"><b>${hl(o.title, terms)}</b><small>${esc(o.sub)}</small></span><kbd>↵</kbd></button>`).join("")
      : `<div class="pal-empty">Rien trouvé pour « ${esc(palQ.value)} »</div>`;
  }
  function palOpen() { palAll = palIndex(); pal.hidden = false; palQ.value = ""; palSel = 0; palRender(); palQ.focus(); }
  function palClose() { pal.hidden = true; }
  function palRun(i) { const o = palItems[i]; if (!o) return; palClose(); o.run(); }
  const palMark = () => { $$(".pal-item", palList).forEach((b, i) => b.classList.toggle("sel", i === palSel)); $(".pal-item.sel", palList)?.scrollIntoView({ block: "nearest" }); };
  palQ.addEventListener("input", () => { palSel = 0; palRender(); });
  palQ.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && palItems.length) {
      e.preventDefault(); palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + palItems.length) % palItems.length; palMark();
    } else if (e.key === "Enter") { e.preventDefault(); palRun(palSel); }
  });
  palList.addEventListener("click", (e) => { const b = e.target.closest(".pal-item"); if (b) palRun(+b.dataset.i); });
  palList.addEventListener("pointermove", (e) => { const b = e.target.closest(".pal-item"); if (b && +b.dataset.i !== palSel) { palSel = +b.dataset.i; $$(".pal-item", palList).forEach((x, i) => x.classList.toggle("sel", i === palSel)); } });
  pal.addEventListener("click", (e) => { if (e.target === pal) palClose(); });
  $$("[data-open-pal]").forEach((b) => b.addEventListener("click", palOpen));

  // ---------- theme ----------
  const themeBtn = $("#theme");
  function applyTheme() {
    const dark = S.theme ? S.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeBtn.innerHTML = `${ic(dark ? "sun" : "moon")}${dark ? "Mode clair" : "Mode sombre"}`;
  }
  function toggleTheme(from) {
    S.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; save();
    if (!document.startViewTransition || RM) return applyTheme();
    const r = (from || themeBtn).getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add("vt-theme");
    const vt = document.startViewTransition(applyTheme);
    vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" }));
    vt.finished.finally(() => document.documentElement.classList.remove("vt-theme"));
  }
  themeBtn.addEventListener("click", () => toggleTheme(themeBtn));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest?.("input,textarea,select");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); pal.hidden ? palOpen() : palClose(); }
    else if (e.key === "Escape" && !pal.hidden) palClose();
    else if (!typing && pal.hidden && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === "d") toggleTheme(themeBtn);
      else if (e.key >= "1" && e.key <= "6") go("#/" + ROUTES[+e.key - 1].id);
    }
  });

  // Open today's card when the trip is on.
  const t0 = isoDay(today());
  if (T.days.some((x) => x.date === t0)) ui.open.add(t0);

  applyTheme();
  addEventListener("hashchange", navigate);
  render();
  document.fonts?.ready.then(renderNav);
})();
