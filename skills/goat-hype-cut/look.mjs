// 07 Hype Cut: dark, punchy footage cut on the beat. Per shot a zoom punch, a slow heavy push or a fast
// blurred pan; on the drop a white flash, a shake and a red/blue split; giant Tektur words slam in.
// The grade (crushed blacks, or neon for night shots) is baked by ffmpeg in prep; the rest is the template.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { missing } from "./scripts/fonts.mjs";
await import("./scripts/goat-lib.js"); // GOAT.spaced, the same one the template uses

export const NAME = "hype-cut";
export const TALKS = false;

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const TEKTUR = "Tektur[wdth,wght].ttf";
const GRADES = {
  punch: "eq=contrast=1.25:saturation=0.9,curves=master='0/0 0.15/0.02 1/1'", // crushed blacks
  neon: "eq=contrast=1.25:saturation=1.6:gamma=0.9", // night shots with real lights
};
const MOVES = ["still", "punch", "push", "pan"];
// A word is 1 or 2 rows (split with \n), sized together to fill 800 px (the preview's 74% of the width, inside
// the safe box), from 420 px type (236 px for 2 rows, so they end above y 840) down to a 64 px floor. Row limit,
// from HarfBuzz widths of Tektur at weight 900 with -0.01 em spacing: real Mongolian rows run 0.56-0.68 em a
// letter (ШИНЭЧЛЭЛ is the widest seen), so 17 letters at up to 0.72 em fit 800 px at 64 px (783 px);
// ЭРЭГТЭЙ ҮСЧИН comes out at 106 px, ШИНЭ ЗАГВАР ИРЛЭЭ at 78. Rows packed with the widest letters
// (Ш Щ Ж Ю, about 1 em) or symbols such as № can run past 800 px at the floor.
const ROW = 17, ROWS = 2;
const GAP = 1 / 3; // seizure safety (WCAG 2.3.1): no two flashes start within 1/3 s, so at most 3 a second

const isNum = (n) => typeof n === "number" && Number.isFinite(n);

export function validate(plan) {
  const grade = plan.look?.grade;
  if (grade !== undefined && !(grade in GRADES)) throw new Error('look "grade" must be "punch" or "neon"');
  for (const [i, c] of (plan.clips ?? []).entries()) {
    const n = i + 1;
    if (c.move !== undefined && !MOVES.includes(c.move)) throw new Error(`clip ${n}: move must be one of ${MOVES.join(", ")}`);
    if (c.hit !== undefined && c.hit !== "drop" && c.hit !== "flash") throw new Error(`clip ${n}: hit must be "drop" or "flash"`);
    if (c.hit !== undefined && i === 0)
      throw new Error('clip 1 can\'t have a "hit": its first frame is the video\'s first frame, the thumbnail. ' +
        "Put the drop or flash on a later clip.");
    if (c.zoom !== undefined && !(isNum(c.zoom) && c.zoom >= 1 && c.zoom <= 4))
      throw new Error(`clip ${n}: zoom must be between 1 (whole frame) and 4`);
    const f = c.focus;
    if (f !== undefined && !(Array.isArray(f) && f.length === 2 && f.every((v) => isNum(v) && v >= 0 && v <= 1)))
      throw new Error(`clip ${n}: focus must be [x, y] between 0 and 1, e.g. [0.5, 0.3]`);
  }
  for (const t of plan.texts ?? []) {
    if (t.role !== "word") throw new Error(`text role "${t.role}" is not used by this look. Use "word".`);
    const text = String(t.text ?? "").trim();
    if (!text) throw new Error('a "word" text is empty');
    const rows = String(t.text).split("\n").map((r) => r.trim());
    if (t.start !== undefined && !(isNum(t.start) && t.start >= 0)) throw new Error(`"${text}": "start" must be seconds, 0 or more`);
    if (t.end !== undefined && !(isNum(t.end) && t.end > Number(t.start ?? 0))) throw new Error(`"${text}" must end after it starts`);
    if (rows.length > ROWS) throw new Error(`${JSON.stringify(text)} has ${rows.length} rows: a word takes ${ROWS} rows at most`);
    if (rows.some((r) => !r)) throw new Error(`${JSON.stringify(String(t.text))} has an empty row: remove the extra \\n`);
    for (const row of rows)
      if ([...row].length > ROW)
        throw new Error(`"${row}" is too long for one row (${ROW} characters at most): shorten it, ` +
          "or split it into 2 rows with \\n");
    const bad = missing(text, join(SKILL_DIR, "fonts", TEKTUR));
    if (bad.length) throw new Error(`"${text}" uses ${bad.join(" ")}, which Tektur can't draw`);
  }
}

// The v1 grades, unchanged.
export async function clipFilter(clip, ctx) {
  return GRADES[ctx.plan.look?.grade ?? "punch"];
}

// Cut times on the beat: the k-th beat after `offset`, rounded to a whole frame, so a long edit never drifts.
export function beatGrid(bpm, offset, dur) {
  if (!(isNum(bpm) && bpm > 0)) throw new Error("the BPM must be a number above 0");
  if (!(isNum(offset) && offset >= 0)) throw new Error("the first beat (offset) must be seconds, 0 or more");
  if (!(isNum(dur) && dur > 0)) throw new Error("the video's length must be seconds, more than 0");
  const out = [];
  for (let k = 0; ; k++) {
    const t = Math.round((offset + (k * 60) / bpm) * 30) / 30;
    if (t >= dur - 1e-9) return out;
    out.push(t);
  }
}

// The cuts that flash. A drop (2 white frames, then the shake and split) and a flash hit are one flash each.
// Drops are spaced first, then flash hits that keep 1/3 s from every drop and from each other, so no two
// start within 1/3 s (10 frames): one hit's 8-frame shake and 5-frame split end before the next begins.
export function hitTimes(clips, cuts) {
  const at = (hit) => clips.flatMap((c, i) => (c.hit === hit ? [cuts[i]] : []));
  const drops = GOAT.spaced(at("drop"), GAP);
  const flashes = GOAT.spaced(at("flash").filter((t) => drops.every((d) => Math.abs(t - d) >= GAP - 1e-9)), GAP);
  return { drops, flashes };
}

export function shots(clips, cuts, dur) {
  const { drops, flashes } = hitTimes(clips, cuts);
  return clips.map((c, i) => ({
    at: cuts[i], end: cuts[i + 1] ?? dur, move: c.move ?? "still",
    zoom: c.zoom ?? (c.move === "pan" ? 1.8 : 1), focus: c.focus ?? [0.5, 0.5],
    hit: drops.includes(cuts[i]) ? "drop" : flashes.includes(cuts[i]) ? "flash" : null,
  }));
}

export async function prepare(ctx) {
  const clips = ctx.plan.clips ?? [], list = shots(clips, ctx.cuts, ctx.dur);
  for (const [i, s] of list.entries())
    if (clips[i].hit && !s.hit)
      console.log(`[goat] note: clip ${i + 1}'s ${clips[i].hit} is skipped: it comes less than 1/3 s from another hit.`);
  return { shots: list };
}

const ms = (t) => Math.round(t * 1000) / 1000;

// v1's events at half its levels (Saagii, 14 Nov: "tone down"); members raise them with "sfx": {"volume": …}.
// A riser into the first drop, a boom and a hit on each drop, a hit on each punch and word slam, a whoosh into
// each pan and a swish into the other cuts, never two closer than 0.4 s, so fast cuts don't machine-gun.
export function sfx(plan, ctx) {
  const clips = plan.clips ?? [], cuts = ctx.cuts;
  const { drops } = hitTimes(clips, cuts);
  const ev = drops.flatMap((at) => [{ sound: "boom", at, volume: 0.5 }, { sound: "hit", at, volume: 0.5 }]);
  if (drops.length && drops[0] >= 0.6) {
    const d = Math.min(1.5, drops[0]);
    ev.push({ sound: "riser", at: ms(drops[0] - d), dur: d, volume: 0.4 });
  }
  const hits = new Set([...cuts.filter((_, i) => clips[i]?.move === "punch"),
    ...(plan.texts ?? []).filter((t) => t.role === "word").map((t) => t.start ?? 0)].map(ms));
  let last = -1;
  for (const t of [...new Set([...hits, ...cuts.slice(1).map(ms)])].sort((a, b) => a - b)) {
    if (t - last < 0.399 || drops.some((d) => Math.abs(t - d) < 0.399)) continue;
    last = t;
    const shot = cuts.findLastIndex((c) => c <= t + 1e-6);
    if (hits.has(t)) ev.push({ sound: "hit", at: t, volume: 0.35 });
    else if (clips[shot]?.move === "pan") ev.push({ sound: "whoosh", at: t, volume: 0.5 });
    else ev.push({ sound: "swish", at: ms(Math.max(0, t - 0.17)), volume: 0.35 }); // its peak lands on the cut
  }
  return ev;
}
