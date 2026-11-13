# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["pillow>=10.4", "numpy>=1.26"]
# ///
"""Hype Cut · Хурдан хэмнэл.

Dark, punchy footage cut on the beat: zoom punches, a blurred fast pan, a slow push after the drop,
and on the drop a white flash, a shake and a red/blue split, with giant words that slam in.
Usage: uv run render.py plan.json
"""
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import goatcut as g  # noqa: E402
from PIL import Image  # noqa: E402

NAME = "hype-cut"
GRADES = {
    "punch": "eq=contrast=1.25:saturation=0.9,curves=master='0/0 0.15/0.02 1/1'",  # crushed blacks
    "neon": "eq=contrast=1.25:saturation=1.6:gamma=0.9",                           # night shots with real lights
}
MOVES = ("still", "punch", "push", "pan")
HITS = ("drop", "flash")
FONT = "Tektur[wdth,wght].ttf"
SHAKE, SPLIT = 8, 5        # frames of shake and of red/blue split on a drop
FLASH = 2                  # white frames per flash (67 ms)
W, H, FPS = g.W, g.H, g.FPS


def GRADE(ctx):
    name = ctx.opt("grade", "punch")
    if name not in GRADES:
        g.die(f'look.grade must be one of {", ".join(GRADES)}')
    return GRADES[name]


def setup(ctx):
    for i, c in enumerate(ctx.clips):
        if c.get("move", "still") not in MOVES:
            g.die(f'clip {i + 1}: move must be one of {", ".join(MOVES)}')
        if c.get("hit") not in (None, *HITS):
            g.die(f'clip {i + 1}: hit must be "drop" or "flash"')
        if not 1 <= float(c.get("zoom", 1)) <= 4:
            g.die(f"clip {i + 1}: zoom must be between 1 (whole frame) and 4")
        f = c.get("focus", [0.5, 0.5])
        if not (isinstance(f, list) and len(f) == 2 and all(0 <= v <= 1 for v in f)):
            g.die(f"clip {i + 1}: focus must be [x, y] between 0 and 1, e.g. [0.5, 0.3]")
    # Seizure safety: never more than 3 flashes a second, so drop any flash closer than 1/3 s to the last.
    ctx.flash, last = set(), -1.0
    for i, c in enumerate(ctx.clips):
        if c.get("hit") in HITS:
            if ctx.cuts[i] - last >= 1 / 3 - 1e-3:
                ctx.flash.add(i)
                last = ctx.cuts[i]
            else:
                print(f"[hype-cut] clip {i + 1}: flash skipped, it comes less than 1/3 s after the last one")
    for item in ctx.texts():
        if item.get("role") != "word":
            g.die(f'text role "{item.get("role")}" is not used by this look: use "word"')


def stacked(text, font, gap, **kw):
    """Centred multi-line sprite, one text_sprite per line (core text_sprite crashes on centred multi-line text)."""
    rows = [g.text_sprite(ln, font, **kw) for ln in text.split("\n")]
    w = max(r.width for r in rows)
    out = Image.new("RGBA", (w, sum(r.height for r in rows) + gap * (len(rows) - 1)), (0, 0, 0, 0))
    y = 0
    for r in rows:
        out.alpha_composite(r, ((w - r.width) // 2, y))
        y += r.height + gap
    return out


def SFX(ctx):
    # A riser into the first drop, a boom + hit on each drop, a hit on punches and word slams,
    # a whoosh through pans and a swish into the other cuts, never closer than 0.4 s (no machine-gun).
    drops = [ctx.cuts[i] for i, c in enumerate(ctx.clips) if c.get("hit") == "drop"]
    ev = [{"sound": s, "at": t} for t in drops for s in ("boom", "hit")]
    if drops and drops[0] >= 0.6:
        d = min(1.5, drops[0])
        ev.append({"sound": "riser", "at": drops[0] - d, "dur": d, "volume": 0.8})
    hits = {round(ctx.cuts[i], 3) for i, c in enumerate(ctx.clips) if c.get("move") == "punch"}
    hits |= {round(x.get("start", 0), 3) for x in ctx.texts("word")}  # rounded: cut times carry float dust
    last = -1.0
    for t in sorted(hits | {round(c, 3) for c in ctx.cuts[1:]}):
        if t - last < 0.399 or any(abs(t - d) < 0.399 for d in drops):
            continue
        last = t
        if t in hits:
            ev.append({"sound": "hit", "at": t, "volume": 0.7})
        elif ctx.clips[ctx.clip_at(t)[0]].get("move") == "pan":
            ev.append({"sound": "whoosh", "at": t})
        else:
            ev.append({"sound": "swish", "at": max(0, t - 0.17), "volume": 0.7})  # its peak lands on the cut
    return ev


def word_sprite(ctx, text):
    f = ctx.fit(text, FONT, 800, 420, 60, axes={"wght": 900})  # short words grow to fill 800 px, like the preview
    return stacked(text, f, f.size // 12, shadow=(0, 0, 20, (0, 0, 0, 90)))


def frame(img, t, ctx):
    i, lt = ctx.clip_at(t)
    c, n = ctx.clips[i], int(round(lt * FPS))
    move, drop = c.get("move", "still"), c.get("hit") == "drop"
    z = float(c.get("zoom", 1.8 if move == "pan" else 1))
    fx, fy = c.get("focus", [0.5, 0.5])
    if move == "punch":
        z *= 1 + 0.03 * min(n, 6)                   # +3% a frame for 6 frames, then hold
    elif move == "push":
        z *= 1.08 + 0.07 * g.clamp(lt / c["dur"])   # the slow, heavy push after a drop
    if drop:
        z *= 1.08                                   # room for the shake, kept for the whole shot
    cw, ch = W / z, H / z
    x0 = g.clamp(fx * W - cw / 2, 0, W - cw)
    y0 = g.clamp(fy * H - ch / 2, 0, H - ch)
    if move == "pan":
        x0 = (W - cw) * g.clamp(lt / c["dur"])      # sweep across the frame, left to right
    if drop and n < SHAKE:
        r, a = random.Random(i * 100 + n), 20 * (1 - n / SHAKE) / z
        x0 = g.clamp(x0 + r.uniform(-a, a), 0, W - cw)
        y0 = g.clamp(y0 + r.uniform(-a, a), 0, H - ch)
    box = (x0, y0, x0 + cw, y0 + ch)
    if drop and n < SPLIT:                          # red/blue split: each colour cut from a shifted box
        d = 11 / z
        rr, gg, bb = img.split()
        out = Image.merge("RGB", [ch_.resize((W, H), Image.BILINEAR, box=(box[0] + dx, box[1], box[2] + dx, box[3]))
                                  for ch_, dx in ((rr, min(d, W - box[2])), (gg, 0), (bb, -min(d, box[0])))])
    elif move == "pan":                             # sideways motion blur: squash the width, stretch it back
        out = img.resize((W // 14, H), Image.BILINEAR, box=box).resize((W, H), Image.BILINEAR)
    elif z > 1.001:
        out = img.resize((W, H), Image.BILINEAR, box=box)
    else:
        out = img
    if i in ctx.flash and n < FLASH:
        out = Image.blend(out, Image.new("RGB", (W, H), (255, 255, 255)), 1.0 if drop else 0.9)

    words = ctx.active(t, "word")[-1:]
    if not words:
        return out
    canvas = out.convert("RGBA")
    item = words[0]
    base = ctx.cache(("w", item["text"]), lambda: word_sprite(ctx, item["text"]))
    s, k = base, int((t - item.get("start", 0)) * FPS)
    if k < 2:                                       # slam: 140% -> 97% -> 100% over three frames
        sc = (1.4, 0.97)[k]
        s = ctx.cache(("w", item["text"], k),
                      lambda: base.resize((int(base.width * sc), int(base.height * sc)), Image.BILINEAR))
    g.paste(canvas, s, W / 2, 346 + base.height / 2, anchor="mm")  # top of the word at 18% of the screen
    return canvas


if __name__ == "__main__":
    g.run(sys.modules[__name__])
