// 07 Hype Cut. Reads window.PLAN (look.mjs works out each shot's move, zoom and kept hit) and builds one
// paused GSAP timeline. Every effect stays inside its own shot, so nothing runs on into the next cut.
const P = window.PLAN;
const $ = (s) => document.querySelector(s);
const tl = gsap.timeline({ paused: true });
const W = 1080, H = 1920, F = 1 / 30;
const at = (t) => Math.max(0, t - 0.001); // frame-exact events land on their frame, not one late
const SHAKE = 8, SPLIT = 5, FLASH = 2; // frames, as v1

// Zooming by z about this origin shows the box of 1/z the size centred on the focus point f (0-1), slid
// back inside the frame at the edges (v1's clamp). An origin inside the frame never shows an edge.
function origin(f, z, size) {
  if (z <= 1.0001) return size / 2;
  const x0 = Math.min(Math.max(f * size - size / (2 * z), 0), size - size / z);
  return (x0 * z) / (z - 1);
}

P.shots.forEach((s, i) => {
  const len = s.end - s.at, n = Math.max(1, Math.round(len * 30)), z = s.zoom;
  const pan = s.move === "pan", drop = s.hit === "drop";
  const oy = origin(s.focus[1], z, H);
  // #cam: the zoom, then the move
  tl.set("#cam", { scale: z, x: 0, transformOrigin: `${pan ? W / 2 : origin(s.focus[0], z, W)}px ${oy}px`, force3D: false }, at(s.at));
  if (s.move === "punch") // +3% a frame for 6 frames, then held: a snap in on the snare
    tl.fromTo("#cam", { scale: z }, { scale: z * 1.18, duration: Math.min(6, n) * F, ease: "none", force3D: false, immediateRender: false }, s.at);
  if (s.move === "push") // 108% to 115% over the shot: the slow, heavy push after a drop
    tl.fromTo("#cam", { scale: z * 1.08 }, { scale: z * 1.15, duration: len, ease: "power1.out", force3D: false, immediateRender: false }, s.at);
  // a sweep from the left of the zoomed frame to its right, stopping 72 px (3 blur radii) short of its edges, so
  // the blur pulls in footage, not black, at the screen's edges (a pan zoomed under 1.14 has no room: no sweep)
  const sweep = Math.max(0, ((z - 1) * W) / 2 - 72);
  if (pan) tl.fromTo("#cam", { x: sweep }, { x: -sweep, duration: len, ease: "none", force3D: false, immediateRender: false }, s.at);

  // #fx: the pan's motion blur for the whole shot; a drop's red/blue split takes its first 5 frames
  const still = pan ? "url(#blur)" : "none";
  tl.set("#fx", { filter: drop ? "url(#split)" : still }, at(s.at));
  if (drop && n > SPLIT) tl.set("#fx", { filter: still }, at(s.at + SPLIT * F));

  // #shake: a drop holds 108% (room to shake) and jitters for 8 frames, dying out; seeded, so renders repeat
  tl.set("#shake", { scale: drop ? 1.08 : 1, x: 0, y: 0, force3D: false }, at(s.at));
  if (drop) {
    const r = GOAT.rng(1000 + i);
    for (let k = 0; k < Math.min(SHAKE, n); k++) {
      const a = 24 * (1 - k / SHAKE);
      tl.set("#shake", { x: (k % 2 ? -1 : 1) * a * (0.6 + 0.4 * r()), y: (r() * 2 - 1) * a, force3D: false }, at(s.at + k * F));
    }
    if (n > SHAKE) tl.set("#shake", { x: 0, y: 0, force3D: false }, at(s.at + SHAKE * F));
  }

  // the white flash: 2 frames, full white on a drop, 90% on a flash hit
  if (s.hit) {
    tl.set("#flash", { opacity: drop ? 1 : 0.9 }, at(s.at));
    if (n > FLASH) tl.set("#flash", { opacity: 0 }, at(s.at + FLASH * F));
    else tl.set("#flash", { opacity: 0 }, at(s.end));
  }
});

// Words: one at a time (a later one ends the one before). Each slams in 140% -> 97% -> 100% over three
// frames, its 1 or 2 rows as one block, and cuts out at its end. A word at 0 is already at rest on frame 0,
// the thumbnail.
const words = P.texts.filter((t) => t.role === "word").sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
const els = words.map((t, i) => {
  const start = t.start ?? 0, end = Math.min(t.end ?? P.dur, words[i + 1]?.start ?? P.dur);
  const el = $("#words").appendChild(document.createElement("div"));
  for (const row of String(t.text).trim().split("\n")) el.appendChild(document.createElement("div")).textContent = row.trim();
  gsap.set(el, { xPercent: -50, scale: 1, force3D: false });
  if (start < F) gsap.set(el, { opacity: 1 });
  else {
    tl.set(el, { opacity: 1, scale: 1.4, force3D: false }, at(start));
    tl.set(el, { scale: 0.97, force3D: false }, at(start + F));
    tl.set(el, { scale: 1, force3D: false }, at(start + 2 * F));
  }
  if (end < P.dur - 0.01) tl.set(el, { opacity: 0 }, at(end));
  return el;
});

tl.set({}, {}, P.dur);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;

// Sizes need the real font; the renderer waits for document.fonts.ready before the first frame.
// Each word's rows are sized together to fill 800 px (the preview's 74% of the width, inside the safe box), up to
// 420 px type, or 236 px for 2 rows so the block (2.08 em with the row gap) ends above y 840; down to 64 px, where
// 17 letters of real Mongolian text fit (look.mjs).
function layout() {
  for (const el of els) GOAT.fit(el, 800, el.children.length > 1 ? 236 : 420, 64);
}
layout();
document.fonts.ready.then(layout);
