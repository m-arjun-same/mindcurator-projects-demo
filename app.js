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
}, 6000);

/* ---------- RING ENGINE ---------- */
let target = 0, current = 0, tourTimer = null;
const wrap = i => ((i % N) + N) % N;
const off = i => { let d = i - current; d -= Math.round(d / N) * N; return d; };

function startVideos() { syncVideos(); }
function syncVideos() {
  const act = wrap(Math.round(current));
  videos.forEach((v, i) => {
    const d = Math.abs(off(i));
    if (d < 1.6) { v.play().catch(() => {}); } else { v.pause(); }
  });
  return act;
}

let lastActive = -1;
function frame() {
  current += (target - current) * 0.062;
  if (Math.abs(target - current) < 0.0004) current = target;
  const moving = Math.abs(target - current) > 0.015;
  body.classList.toggle("is-moving", moving);

  cards.forEach((c, i) => {
    const d = off(i), a = Math.abs(d);
    const x = d * 58;                       // % of viewport sideways
    const ry = d * -34;                     // deg, turned toward viewer
    const s = Math.max(0.72, 1 - a * 0.13);
    c.style.transform = `translateX(${x}%) rotateY(${ry}deg) scale(${s})`;
    c.style.zIndex = String(100 - Math.round(a * 10));
    c.style.opacity = a > 2.4 ? "0" : "1";
    c.style.visibility = a > 2.6 ? "hidden" : "visible";
  });

  const act = syncVideos();
  if (act !== lastActive) {
    lastActive = act;
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
addEventListener("wheel", e => {
  if (body.classList.contains("panel-open")) return;
  stopTour();
  target += e.deltaY * 0.0016;
}, { passive: true });
addEventListener("keydown", e => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") { stopTour(); target = Math.round(target) + 1; }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") { stopTour(); target = Math.round(target) - 1; }
  if (e.key === "Escape") closePanels();
});
let touchY = null;
addEventListener("touchstart", e => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener("touchmove", e => {
  if (touchY === null || body.classList.contains("panel-open")) return;
  stopTour();
  target += (touchY - e.touches[0].clientY) * 0.004;
  touchY = e.touches[0].clientY;
}, { passive: true });
addEventListener("touchend", () => { touchY = null; target = Math.round(target); });
// settle: snap to nearest slide when input goes quiet
let snapT;
addEventListener("wheel", () => { clearTimeout(snapT); snapT = setTimeout(() => { target = Math.round(target); }, 140); }, { passive: true });

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
