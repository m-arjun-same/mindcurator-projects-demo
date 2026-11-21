// MindCurator showcase — Focus Pull carousel (own-code port of the effect):
// native scroll-snap track; the centre card is sharp and full size, neighbours
// blur, shrink, desaturate and fade by their distance from the centre.
const SLIDES = [
  { title: "Café Breizh",        caption: "French bakery · Las Vegas",   tile: "CB", href: "https://cafe-breizh.pages.dev" },
  { title: "CityPaws Grooming",  caption: "Dog grooming · Houston",      tile: "CP", href: "https://citypaws-grooming.pages.dev" },
  { title: "Videotheque",        caption: "Video rental store",          tile: "V",  href: "https://videotheque-5da.pages.dev" },
  { title: "Mayuri Footwear",    caption: "Footwear store",              tile: "M",  href: "https://m-arjun-same.github.io/mayuri-footwears/" },
  { title: "The Nursery Garden", caption: "Garden centre · Los Angeles", tile: "NG", href: "https://m-arjun-same.github.io/nursery-garden/" },
];
const N = SLIDES.length;
const track = document.getElementById("track");
const cards = [...track.children];
const videos = cards.map(c => c.querySelector("video"));
const body = document.body;
const BLUR = innerWidth < 820 ? 4 : 7;   // px of blur at one card away (lighter on phones)

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
    setTimeout(() => { document.getElementById("loader").classList.add("done"); videos[active].play().catch(() => {}); }, 250);
  }
  bar.style.width = shown + "%"; pct.textContent = shown + "%";
}, 90);
setTimeout(() => { // never trap the user behind the loader
  if (!document.getElementById("loader").classList.contains("done")) {
    clearInterval(loadTick); document.getElementById("loader").classList.add("done"); videos[active].play().catch(() => {});
  }
}, 4500);

/* ---------- FOCUS PULL ENGINE ---------- */
const wrap = i => ((i % N) + N) % N;
const pad2 = n => String(n).padStart(2, "0");
let active = 0, tourTimer = null;
const barFill = document.getElementById("barFill");

function focusOf(d) {           // how out of focus a card is, d in card widths from centre
  const a = Math.min(Math.abs(d), 1);
  return {
    scale: 1 - 0.14 * a,
    blur: Math.min(Math.abs(d), 2) * BLUR,
    opacity: 1 - 0.5 * a,
    saturate: 1 - 0.45 * a,
  };
}

function setActive(i) {
  if (i === active && cards[i].classList.contains("is-active")) return;
  active = i;
  videos.forEach((v, j) => {       // landing on a project restarts its video from 0:00 and plays it
    if (j === i) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); }
    else v.pause();
  });
  cards.forEach((c, j) => c.classList.toggle("is-active", j === i));
  const s = SLIDES[i];
  const cap = document.getElementById("capBox");
  cap.classList.remove("swap"); void cap.offsetWidth; cap.classList.add("swap");
  document.getElementById("ptitle").textContent = s.title;
  document.getElementById("capsub").textContent = s.caption;
  document.getElementById("cNow").textContent = pad2(i + 1);
  document.getElementById("pillTile").textContent = s.tile;
  document.getElementById("casePill").href = s.href;
}

function paint() {
  if (!cards.length) return;
  const mid = track.scrollLeft + track.clientWidth / 2;
  const w = cards[0].offsetWidth || 1;
  let best = 0, bestDist = Infinity;
  cards.forEach((c, i) => {
    const center = c.offsetLeft + c.offsetWidth / 2;
    const d = (center - mid) / w;
    const f = focusOf(d);
    c.style.transform = "scale(" + f.scale.toFixed(4) + ")";
    c.style.filter = f.blur > 0.05 ? "blur(" + f.blur.toFixed(2) + "px) saturate(" + f.saturate.toFixed(3) + ")" : "none";
    c.style.opacity = f.opacity.toFixed(3);
    if (Math.abs(center - mid) < bestDist) { bestDist = Math.abs(center - mid); best = i; }
  });
  const max = track.scrollWidth - track.clientWidth;
  barFill.style.transform = "scaleX(" + (max > 0 ? (track.scrollLeft / max).toFixed(4) : "0") + ")";
  if (best !== active) setActive(best);
}

let raf = 0;
track.addEventListener("scroll", () => {
  if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); });
}, { passive: true });
new ResizeObserver(() => paint()).observe(track);

function scrollToIndex(i, smooth = true) {
  const card = cards[wrap(i)];
  if (!card) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth && !reduce ? "smooth" : "auto" });
}
function stopTour() { if (tourTimer) { clearInterval(tourTimer); tourTimer = null; } }
track.addEventListener("pointerdown", stopTour);
track.addEventListener("wheel", stopTour, { passive: true });
track.addEventListener("touchstart", stopTour, { passive: true });

document.getElementById("prevBtn").onclick = () => { stopTour(); scrollToIndex(active - 1); };
document.getElementById("nextBtn").onclick = () => { stopTour(); scrollToIndex(active + 1); };
addEventListener("keydown", e => {
  if (body.classList.contains("panel-open")) { if (e.key === "Escape") closePanels(); return; }
  if (e.key === "ArrowRight" || e.key === "ArrowDown") { stopTour(); scrollToIndex(active + 1); }
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { stopTour(); scrollToIndex(active - 1); }
  if (e.key === "Escape") closePanels();
});

/* ---------- CARD CLICK: glide to that project (it autoplays on landing) ---------- */
cards.forEach((c, i) => {
  c.addEventListener("click", () => { if (i !== active) { stopTour(); scrollToIndex(i); } });
});

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
document.getElementById("homeBtn").onclick = e => { e.preventDefault(); stopTour(); scrollToIndex(0); };
menuPanel.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { stopTour(); scrollToIndex(+b.dataset.go); closePanels(); });
document.getElementById("reelBtn").onclick = () => {
  closePanels(); stopTour();
  tourTimer = setInterval(() => scrollToIndex(active + 1), 4200);
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

/* ---------- COOKIE + MISC ---------- */
const ck = document.getElementById("cookie");
document.getElementById("ckAccept").onclick = document.getElementById("ckReject").onclick = () => ck.classList.add("hide");
document.getElementById("ckSettings").onclick = () => openPanel(menuPanel);
document.getElementById("cTot").textContent = pad2(N);
cards[0].classList.add("is-active");
paint();
