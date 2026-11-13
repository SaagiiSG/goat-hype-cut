---
name: goat-hype-cut
description: Hype Cut · Хурдан хэмнэл. Cuts the user's phone clips fast on the beat into a dark, punchy 1080x1920 Reels/TikTok MP4 with a crushed-black contrast grade, zoom punches, a blurred fast pan, a slow heavy push after the drop, and on the drop a white flash, a shake and a red/blue split, with giant Mongolian words that slam in. The car-edit and barber "phonk edit" look. Best for barbers, auto (detailing, tuning, dealers), streetwear, sneakers, gadgets and gyms. Use whenever the user wants a fast, hype, beat-synced, phonk or car-edit style video, or types /goat-hype-cut, /хурдан-хэмнэл, or says "хурдан хэмнэлтэй болго", "бийтэд тааруулж тайра", "phonk edit хий", "make it hype", "cut it to the beat", even if they don't name the skill.
---

# Hype Cut · Хурдан хэмнэл

Dark, punchy footage cut on every beat. Shots punch in, a fast blurred pan feels like a speed-up, and on the drop the screen flashes white, shakes and splits into red and blue while a giant word slams in. After the drop a slow, heavy push feels like slow motion. It is the only GOAT look where speed itself is the effect.

**Good for:** barbers (fades, line-ups, the final reveal), auto (detailing, tuning, dealers, night drives with the `neon` grade), streetwear, sneakers, gadgets, gyms.
**Not for:** nails and lash (cuts are too short to see detail), luxury real estate (it feels cheap), health and coaching except gyms. If the user's business is one of these, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`.

## 1. Setup check (first time on a machine)

Run `ffmpeg -version` and `uv --version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install ffmpeg uv`
- Windows: `winget install Gyan.FFmpeg` and `winget install astral-sh.uv`, then close and reopen the terminal.

The first render downloads a small Python package (Pillow) once. After that it is instant.

## 2. Collect the clips, the music and the words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips.** Drag them into the chat or copy them into `raw/`. Many short moves from several angles beat one long shot. Best: 1080p or 4K. For real slow motion, film in the phone's Slo-mo mode: those files already play slowly.
2. **The music,** if they have a track they are allowed to use in a file, and its tempo (BPM). Phonk and drift-house are usually 130–160. If they'll add a song in the Instagram/TikTok app instead, cut on an even 150 BPM grid.
3. **The words:** 1–3 words that slam in on the drop ("ШИНЭ", "ЗАСАЛТ", "ЦАГ АВ"). Never invent a price, phone number or date. Ask.

Then run: `uv run SKILL_DIR/scripts/goatcut.py probe raw/*`
It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans.

To pick zoom targets, pull a frame with a grid and look at it:
`ffmpeg -y -loglevel error -ss SECONDS -i raw/IMG_0412.MOV -frames:v 1 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawgrid=w=108:h=192:t=2:c=red@0.7,scale=540:-2" output/look-1.jpg`
The red lines are every 0.1 of the width and height. The grade crushes the blacks, so **zoom into lit detail** (a face, a wheel, chrome, a fresh fade), never into a dark corner: it turns into a black screen.

## 3. Write plan.json

First work out the cut times on the beat. One beat lasts `60 / BPM` seconds:

| BPM | 120 | 130 | 140 | 150 | 160 |
|---|---|---|---|---|---|
| one beat (s) | 0.500 | 0.462 | 0.429 | 0.400 | 0.375 |

Put cut number k at `round(k × beat × 30) / 30` seconds (whole frames, so the cuts never drift off the beat). Each clip lasts from its cut to the next one: one beat per shot in build-ups, two beats on hero shots, four or more after the drop. Then write `plan.json` in the project folder. Paths are relative to it.

```json
{
  "output": "output/hype-cut.mp4",
  "clips": [
    {"src": "raw/car1.mov", "in": 2.0, "out": 2.4},
    {"src": "raw/car2.mov", "in": 0.0, "out": 0.4},
    {"src": "raw/car1.mov", "in": 3.0, "out": 3.4, "zoom": 2.4, "focus": [0.70, 0.42]},
    {"src": "raw/wheel.mov", "in": 1.0, "out": 1.4, "zoom": 2.5, "focus": [0.88, 0.52]},
    {"src": "raw/car1.mov", "in": 5.0, "out": 5.8, "move": "pan"},
    {"src": "raw/car2.mov", "in": 1.0, "out": 1.4, "hit": "drop"},
    {"src": "raw/car1.mov", "in": 6.0, "out": 7.6, "move": "push"},
    {"src": "raw/wheel.mov", "in": 2.0, "out": 2.4, "hit": "flash", "move": "punch"}
  ],
  "texts": [
    {"role": "word", "text": "ШИНЭ", "start": 2.4, "end": 2.8},
    {"role": "word", "text": "ӨНГӨ", "start": 2.8, "end": 3.2}
  ],
  "music": {"src": "raw/song.mp3", "volume": 0.6},
  "look": {"grade": "punch"}
}
```

**clips** play in order with hard cuts. `in`/`out` trim a video (seconds); `dur` sets how long a photo shows. The same file can appear many times with different `in`/`out`. `cx`/`cy` (0–1, default 0.5) choose which part of a wide frame is kept. Add `"sound": false` to mute one clip (usual when music plays). Per clip:
- `zoom`: 1 (whole frame, default) to 4. 2.4 = a tight detail shot.
- `focus`: [x, y], the point to zoom into (0–1 of the frame, default [0.5, 0.5]).
- `move`: `still` (default); `punch` (snaps in 3% a frame for 6 frames, on snares); `pan` (a fast sideways sweep with motion blur across a 1.8x zoom: the speed-up feel); `push` (a slow, heavy push from 108% to 115%: the slow-motion feel, right after a drop).
- `hit`: `drop` (on the drop: 2 white flash frames, a shake that dies out, a red/blue split for 5 frames) or `flash` (just the white flash, for downbeats). Flashes closer than 1/3 s to the last one are skipped automatically (seizure safety: never more than 3 a second).

**texts:** `word` slams in at `start` (140% → 97% → 100% in three frames) at the top of the screen and cuts out at `end`. 1–3 words; use `\n` for two lines. Short words grow to fill the width, long ones shrink to fit. One word shows at a time: start the first word on the drop.

**Auto sound effects:** a riser that builds into the first drop; a boom and a hit on each drop; a hit on each `punch` and each word slam; a whoosh through each `pan`; a soft swish into every other cut. Never two closer than 0.4 s, so fast cuts don't machine-gun.

**music:** the cuts only land on the beat if the song's first beat is at its very start. If it isn't, trim it once: `ffmpeg -y -loglevel error -ss FIRST_BEAT_SECONDS -i raw/song.mp3 raw/song-start.mp3` and use that file.

**look** options:
- `grade`: `punch` (default: contrast 1.25, crushed blacks, saturation 0.9) or `neon` (saturated and dark, only for night footage with real lights; on daylight it looks fake).

**Shape of a good edit (7–15 s):** 4–6 one-beat cuts with zooms → a `pan` → the `drop` with the first word → a long `push` with the second word → a few fast cuts with `flash` on downbeats → the hero shot held still at the end.

Before rendering, tell the user the plan in plain words (the shots in order, where the drop is, the words, the grade) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `goatcut.py probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 4. Render and check

`uv run SKILL_DIR/scripts/render.py plan.json`

A 30 s video takes about 30–60 s. Then check the cuts with a contact sheet (one picture every 6 frames):
`ffmpeg -y -loglevel error -i output/hype-cut.mp4 -vf "select='not(mod(n\,6))',scale=180:-2,tile=8x4" -frames:v 1 -fps_mode vfr output/check.jpg`
Read it. Check that no zoomed shot is a black or blurry blob (move `focus` onto lit detail), the words are not cut off, and the drop lands where you meant.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 5. Hand over

Tell the user where the file is (`output/hype-cut.mp4`) and that it is ready to post. If they add the song in the app, tell them to line its drop up with the white flash.

## Rules

- Never more than 3 flashes a second. The renderer enforces it; don't try to get round it.
- Words sit in the top band (y 270–840), inside the area no app buttons cover. Keep them to 1–3 words.
- Use only the fonts bundled in `SKILL_DIR/fonts` (Tektur, it has Ө ө Ү ү). Don't swap in other fonts.
- Music must be licensed for use in a file. If unsure, leave it out and let the user add it in the app.
- The output is 1080x1920, 30 fps, H.264, sound normalised to -14 LUFS (Instagram/TikTok level).
