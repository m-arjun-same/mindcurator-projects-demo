// MindCurator × Mubien UI — own code. Scroll-driven 3D ring carousel.
const SLIDES = [
  { title: "Café Breizh",        tile: "CB", theme: "dark",  href: "https://cafe-breizh.pages.dev" },
  { title: "CityPaws Grooming",  tile: "CP", theme: "dark",  href: "https://citypaws-grooming.pages.dev" },
  { title: "Videotheque",        tile: "V",  theme: "light", href: "https://videotheque-5da.pages.dev" },
  { title: "Mayuri Footwear",    tile: "M",  theme: "dark",  href: "https://m-arjun-same.github.io/mayuri-footwears/" },
  { title: "The Nursery Garden", tile: "NG", theme: "dark",  href: "https://m-arjun-same.github.io/nursery-garden/" },
];
const N = SLIDES.length;
const cards = [...document.querySelectorAll(".card")];
const videos = cards.map(c => c.querySelector("video"));
const body = document.body;
// phones get the light copies (1280px — still 3x a phone screen, a quarter of the decode work)
if (matchMedia("(max-width: 820px)").matches) videos.forEach(v => { v.src = v.getAttribute("src").replace("-hq", "-m"); });

/* ---------- LOADER ---------- */
let loaded = 0, shown = 0;
const bar = document.getElementById("loaderBar"), pct = document.getElementById("loaderPct");
videos.forEach(v => {
  const hit = () => { loaded++; };
  v.addEventListener("loadeddata", hit, { once: true });
  v.addEventListener("error", hit, { once: true });
});
const loadTick = setInterval(() => {
  const target = Math.round(loaded / N * 100);
  shown += Math.max(1, Math.round((target - shown) * 0.2));
  if (shown >= 100 && loaded >= 1) {
    shown = 100; clearInterval(loadTick);
    bar.style.width = "100%"; pct.textContent = "100%";
    setTimeout(() => document.getElementById("loader").classList.add("done"), 250);
    startVideos();
  }
  bar.style.width = shown + "%"; pct.textContent = shown + "%";
}, 90);
setTimeout(() => { // never trap the user behind the loader
  if (!document.getElementById("loader").classList.contains("done")) {
    clearInterval(loadTick); document.getElementById("loader").classList.add("done"); startVideos();
  }
}, 4500);

/* ---------- RING ENGINE ---------- */
let target = 0, current = 0, tourTimer = null;
const wrap = i => ((i % N) + N) % N;
const off = i => { let d = i - current; d -= Math.round(d / N) * N; return d; };

function startVideos() { syncVideos(); }
let userPaused = false;
function syncVideos() {
  const act = wrap(Math.round(current));
  videos.forEach((v, i) => {
    const d = Math.abs(off(i));
    if (d < 0.55 && !userPaused) { v.play().catch(() => {}); } else { v.pause(); } // only the centred video decodes — neighbours ride on posters (mobile perf)
  });
  return act;
}

let lastActive = -1, expand = 0, shrinkF = 1;
const topEl = document.querySelector(".chrome.top");
const titleWrap = document.getElementById("titleWrap");
const counterEl = document.getElementById("counterEl");
const mouseEl = document.getElementById("mouseEl");
const playBtn = document.getElementById("playBtn");
function frame() {
  current += (target - current) * 0.062;
  if (Math.abs(target - current) < 0.0004) current = target;
  const moving = Math.abs(target - current) > 0.015;
  body.classList.toggle("is-moving", moving);
  // reference two-phase motion: ring while moving, active card expands to full screen when settled
  expand += ((moving ? 0 : 1) - expand) * 0.048;
  if (expand < 0.001) expand = moving ? expand : 0;
  shrinkF += ((moving ? 0.72 : 1) - shrinkF) * 0.09; // every video shrinks while the user scrolls
  const dock = innerWidth < 640 ? 0.68 : 0.44;   // ring-phase centre card size

  cards.forEach((c, i) => {
    const d = off(i), a = Math.abs(d), sgn = Math.sign(d) || 1;
    const act = Math.max(0, 1 - a);              // 1 = centred card
    const e = expand * act;                      // this card's full-screen blend
    let x, s, ry;
    if (a <= 1) { x = d * 54; s = dock * (1 - a * 0.22); ry = d * -30; }
    else { x = sgn * (54 + (a - 1) * 19); s = dock * Math.max(0.16, 0.78 - (a - 1) * 0.30); ry = sgn * -52; }
    s *= shrinkF;
    s = s + (1 - s) * e;
    x *= (1 - e); ry *= (1 - e);
    c.style.transform = `translate(-50%,-50%) translateX(${x}%) rotateY(${ry}deg) scale(${s})`;
    c.style.borderRadius = (20 * (1 - e)) + "px";
    c.style.zIndex = String(100 - Math.round(a * 10) + (act > 0.9 ? 40 : 0));
    const op = (a > 2.9 ? 0 : 1) * (1 - expand * (1 - act) * 0.94);
    c.style.opacity = op.toFixed(3);
    c.style.visibility = op <= 0.01 ? "hidden" : "visible";
  });

  // chrome phases: header / title / counter / mouse button exist only in full-screen phase
  const co = Math.pow(expand, 1.4).toFixed(3);
  topEl.style.opacity = co; titleWrap.style.opacity = co;
  counterEl.style.opacity = co; mouseEl.style.opacity = co; playBtn.style.opacity = co;
  body.classList.toggle("full", expand > 0.5);
  const pe = expand > 0.5 ? "auto" : "none";
  topEl.style.pointerEvents = pe; titleWrap.style.pointerEvents = pe; playBtn.style.pointerEvents = pe;

  const act = syncVideos();
  if (act !== lastActive) {
    lastActive = act;
    userPaused = false; body.classList.remove("vid-paused");
    const av = videos[act];               // every video starts from the beginning when scrolled to
    try { av.currentTime = 0; } catch (e) {}
    av.play().catch(() => {});
    const s = SLIDES[act];
    const t = document.getElementById("ptitle");
    t.style.opacity = "0";
    setTimeout(() => { t.textContent = s.title; t.style.opacity = "1"; }, 160);
    document.getElementById("cNow").textContent = String(act + 1).padStart(2, "0");
    document.getElementById("pillTile").textContent = s.tile;
    document.getElementById("casePill").href = s.href;
    body.dataset.theme = s.theme;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- INPUT ---------- */
function stopTour() { if (tourTimer) { clearInterval(tourTimer); tourTimer = null; } }
let lastStep = 0;
addEventListener("wheel", e => {
  if (body.classList.contains("panel-open")) return;
  stopTour();
  const now = performance.now();
  // one gesture = one project: locked until the ring settles (reference behaviour)
  if (now - lastStep > 850 && Math.abs(target - current) < 0.08 && Math.abs(e.deltaY) > 6) {
    target = Math.round(target) + Math.sign(e.deltaY);
    lastStep = now;
  }
}, { passive: true });
addEventListener("keydown", e => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") { stopTour(); target = Math.round(target) + 1; }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") { stopTour(); target = Math.round(target) - 1; }
  if (e.key === "Escape") closePanels();
});
let touchY = null, touchBase = 0, touchStart = 0;
addEventListener("touchstart", e => { touchY = touchStart = e.touches[0].clientY; touchBase = Math.round(target); }, { passive: true });
addEventListener("touchmove", e => {
  if (touchY === null || body.classList.contains("panel-open")) return;
  stopTour();
  const y = e.touches[0].clientY;
  target += (touchY - y) * 0.005;
  target = Math.max(touchBase - 1, Math.min(touchBase + 1, target)); // one swipe = max one project
  touchY = y;
}, { passive: true });
function touchDone(e) {
  if (touchY === null) return;
  const dy = touchStart - (e.changedTouches[0].clientY);
  target = Math.abs(dy) > 34 ? touchBase + Math.sign(dy) : Math.round(target); // a real flick always lands one project over
  touchY = null;
}
addEventListener("touchend", touchDone);
addEventListener("touchcancel", () => { touchY = null; target = Math.round(target); });
const rh = document.getElementById("rotateHint");
if (rh) rh.addEventListener("click", () => rh.classList.add("hide"));


/* ---------- PANELS ---------- */
const menuPanel = document.getElementById("menuPanel"), contactPanel = document.getElementById("contactPanel");
function openPanel(p) { closePanels(true); p.classList.add("open"); body.classList.add("panel-open"); }
function closePanels(keep) {
  menuPanel.classList.remove("open"); contactPanel.classList.remove("open");
  if (!keep) body.classList.remove("panel-open");
}
document.getElementById("menuBtn").onclick = () => openPanel(menuPanel);
document.getElementById("menuClose").onclick = () => closePanels();
document.getElementById("contactClose").onclick = () => closePanels();
document.getElementById("scrim").onclick = () => closePanels();
document.getElementById("contactBtn").onclick = () => openPanel(contactPanel);
document.getElementById("homeBtn").onclick = e => { e.preventDefault(); stopTour(); target = Math.round(target / N) * N; };
menuPanel.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { stopTour(); target = Math.round(target / N) * N + (+b.dataset.go); closePanels(); });
document.getElementById("reelBtn").onclick = () => {
  closePanels(); stopTour();
  tourTimer = setInterval(() => { target = Math.round(target) + 1; }, 4200);
};
playBtn.onclick = () => {
  const v = videos[wrap(Math.round(current))];
  if (v.paused) { userPaused = false; v.play().catch(() => {}); }
  else { userPaused = true; v.pause(); }
  body.classList.toggle("vid-paused", userPaused);
};
document.getElementById("copyMail").onclick = e => {
  navigator.clipboard && navigator.clipboard.writeText("themindcuratorstudio@gmail.com");
  e.target.textContent = "Copied!"; setTimeout(() => e.target.textContent = "Copy", 1600);
};

/* ---------- CLOCKS ---------- */
function tickClocks() {
  const fmt = tz => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date());
  document.getElementById("clkHyd").textContent = fmt("Asia/Kolkata");
  document.getElementById("clkLv").textContent = fmt("America/Los_Angeles");
}
tickClocks(); setInterval(tickClocks, 10000);

/* ---------- COOKIE ---------- */
const ck = document.getElementById("cookie");
document.getElementById("ckAccept").onclick = document.getElementById("ckReject").onclick = () => ck.classList.add("hide");
document.getElementById("ckSettings").onclick = () => openPanel(menuPanel);
document.getElementById("cTot").textContent = String(N).padStart(2, "0");
