---
name: goat-hype-cut
description: Hype Cut · Хурдан хэмнэл. Cuts the user's phone clips fast on the beat into a dark, punchy 1080x1920 Reels/TikTok MP4 with a crushed-black contrast grade, zoom punches, a blurred fast pan, a slow heavy push after the drop, and on the drop a white flash, a shake and a red/blue split, with giant Mongolian words that slam in. Built on HyperFrames. The car-edit and barber "phonk edit" look. Best for barbers, auto (detailing, tuning, dealers), streetwear, sneakers, gadgets and gyms. Use whenever the user wants a fast, hype, beat-synced, phonk or car-edit style video, or types /goat-hype-cut, /хурдан-хэмнэл, or says "хурдан хэмнэлтэй болго", "бийтэд тааруулж тайра", "phonk edit хий", "make it hype", "cut it to the beat", even if they don't name the skill.
---

# Hype Cut · Хурдан хэмнэл

Dark, punchy footage cut on every beat. Shots punch in, a fast blurred pan feels like a speed-up, and on the drop the screen flashes white, shakes and splits into red and blue while a giant word slams in. After the drop a slow, heavy push feels like slow motion. It is the only GOAT look where speed itself is the effect.

**Good for:** barbers (fades, line-ups, the final reveal), auto (detailing, tuning, dealers, night drives with the `neon` grade), streetwear, sneakers, gadgets, gyms.
**Not for:** nails and lash (cuts are too short to see detail), luxury real estate (it feels cheap), health and coaching except gyms. If the user's business is one of these, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`. `goat` below means `node SKILL_DIR/scripts/goat.mjs`.

## 1. Setup check (first time on a machine)

Run `node --version` (needs 22 or newer) and `ffmpeg -version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install node ffmpeg`
- Windows: `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`, then close and reopen the terminal.

The words here are words the user writes, not speech, so this look needs no speech model. The first render downloads, once, a private copy of Chrome that draws the frames. Tell the user the first run takes a while; after that it starts at once. Nothing is uploaded: everything runs on their computer, with no account.

**Long steps:** the first `render` (the Chrome download) can run longer than a normal command timeout. Run it in the background, or with a 600000 ms timeout, and wait for it to end. Never stop it and start it again.

**Windows has not been tested yet.** If a step fails there, show the error to the user in plain words.

## 2. Collect the clips, the music and the words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips.** Drag them into the chat or copy them into `raw/`. Many short moves from several angles beat one long shot. Best: 1080p or 4K. For real slow motion, film in the phone's Slo-mo mode: those files already play slowly. Photos work too.
2. **The music,** if they have a track they are allowed to use in a file, and its tempo (BPM). Phonk and drift-house are usually 130–160. If they'll add a song in the Instagram/TikTok app instead, cut on an even 150 BPM grid.
3. **The words:** 1–3 words that slam in on the drop and after it ("ШИНЭ", "ЗАСАЛТ", "ЦАГ АВ"). Never invent a price, phone number or date. Ask.

If this folder was already edited with `goat-video-editor`, use `output/cut.mp4` as a clip.

Then run `goat probe raw/*`. It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans (when someone is talking).

To pick zoom targets, pull a frame with a grid from inside the part of the clip you'll use (between its `in` and `out`, e.g. their middle) and look at it:
`ffmpeg -y -loglevel error -ss 3.2 -i raw/IMG_0412.MOV -frames:v 1 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawgrid=w=108:h=192:t=2:c=red@0.7,scale=540:-2" output/look-3.2.jpg`
The red lines are every 0.1 of the width and height. The grade crushes the blacks, so **zoom into lit detail** (a face, a wheel, chrome, a fresh fade), never into a dark corner: it turns into a black screen.

## 3. Prepare

First work out the cut times on the beat. One beat lasts `60 / BPM` seconds:

| BPM | 120 | 130 | 140 | 150 | 160 | 170 |
|---|---|---|---|---|---|---|
| one beat (s) | 0.500 | 0.462 | 0.429 | 0.400 | 0.375 | 0.353 |

Cut number k goes at `round(k × beat × 30) / 30` seconds (whole frames, so the cuts never drift off the beat; at 170 BPM they fall 11, 10, 11, 10 … frames apart). This prints them for a 12 s video at 150 BPM (put the BPM and length in):
`node --input-type=module -e "import { pathToFileURL } from 'node:url'; const { beatGrid } = await import(pathToFileURL('SKILL_DIR/look.mjs')); console.log(beatGrid(150, 0, 12).map((t) => t.toFixed(3)).join(' '))"`
→ `0.000 0.400 0.800 1.200 …`. Each clip lasts from its cut to the next one (`out` − `in` = the gap): one beat per shot in build-ups, two beats on hero shots, four or more after the drop.

Then write `plan.json` in the project folder (paths are relative to it):

```json
{
  "output": "output/hype-cut.mp4",
  "clips": [
    {"src": "raw/car1.mov", "in": 2.0, "out": 2.4},
    {"src": "raw/car2.mov", "in": 0.0, "out": 0.4},
    {"src": "raw/car1.mov", "in": 3.0, "out": 3.4, "zoom": 2.4, "focus": [0.70, 0.42]},
    {"src": "raw/wheel.mov", "in": 1.0, "out": 1.4, "zoom": 2.5, "focus": [0.88, 0.52], "move": "punch"},
    {"src": "raw/car1.mov", "in": 5.0, "out": 5.8, "move": "pan"},
    {"src": "raw/car2.mov", "in": 1.0, "out": 1.4, "hit": "drop"},
    {"src": "raw/car1.mov", "in": 6.0, "out": 7.6, "move": "push"},
    {"src": "raw/wheel.mov", "in": 2.0, "out": 2.4, "hit": "flash", "move": "punch"}
  ],
  "texts": [
    {"role": "word", "text": "ШИНЭ", "start": 2.4, "end": 2.8},
    {"role": "word", "text": "ӨНГӨ", "start": 2.8, "end": 3.6}
  ],
  "music": {"src": "raw/song.mp3", "volume": 0.6},
  "look": {"grade": "punch"}
}
```

**clips** play in order with hard cuts. `in`/`out` trim a video (seconds); `dur` sets how long a photo shows. The same file can appear many times with different `in`/`out`. `cx`/`cy` (0–1, default 0.5) choose which part of a wider frame (a landscape clip, or a photo of another shape) the phone screen keeps; an upright 9:16 phone clip is kept whole. Add `"sound": false` to mute one clip (usual when music plays). Per clip:
- `zoom`: 1 (whole frame, default) to 4. 2.4 = a tight detail shot.
- `focus`: [x, y], the point to zoom into (0–1 of the frame, default [0.5, 0.5]). Near an edge the zoom slides back inside the frame.
- `move`: `still` (default); `punch` (snaps in 3% a frame for 6 frames and holds, on snares); `pan` (a fast sideways sweep with motion blur across a 1.8x zoom, or the clip's own `zoom`: the speed-up feel); `push` (a slow, heavy push from 108% to 115%: the slow-motion feel, right after a drop).
- `hit`: `drop` (on the drop: 2 white flash frames, a shake that dies out over 8 frames, a red/blue split for 5 frames, and the shot held at 108% so the shake never shows an edge) or `flash` (just the 2 white frames, for downbeats). The first clip can't have a hit: its first frame is the thumbnail.

Then run these in order. Each one says what to run first if a step is missing.
1. `goat prep plan.json`: crops every clip to the full 1080x1920 screen, grades it (`punch`: contrast 1.25 with crushed blacks; `neon`: contrast and strong colour) and joins them into `.work-hype-cut/main.mp4`. **Run it again whenever `clips` change.**
2. `goat cut plan.json`: this look never cuts pauses; the step only readies the video (`.work-hype-cut/cut.mp4`) and takes a second.

## 4. Write the words

**texts:** `word` slams in at `start` (140% → 97% → 100% over three frames) and cuts out at `end` (default: the next word's start, or the end of the video). One word shows at a time: start the first word on the drop, the next ones on the following beats. Each `word` is 1–3 words, on 1 or 2 rows: break the line yourself with `\n` (e.g. `"ШИНЭ ЗАГВАР\nИРЛЭЭ"`); **at most 17 characters a row** (spaces count). A longer row, an empty row or a third row is refused with a message. It sits in the top band of the screen, its top at y 346 of 1920 (18%), centred, in white Tektur Black, its rows sized together so the longer one fills 800 px of the width: a 4-letter word comes out at about 280–330 px type, "ЭРЭГТЭЙ ҮСЧИН" at about 106 px, a full 17-character row at about 70–85 px (rows of Ш Щ Ж Ю run wider and get smaller type, down to 64 px). Two rows are 236 px type at most. Short words hit hardest: one word per beat beats one long phrase. On its first frame the word is 140% wide and runs off the screen's edges for that one frame: that is the slam (2 rows slam as one block). A word at `"start": 0` is already there, at rest, on the first frame.

One row covers the screen from y 346 down to about y 420 (17 letters) to y 680 (4 letters), or y 770 for a 2-letter word; two rows reach about y 590 ("ШИНЭ ЗАГВАР\nИРЛЭЭ") to y 840 ("ЦАГ\nАВ"). If a face is there in the word's shot, move it down: zoom in a little with the focus at the top edge (e.g. `"zoom": 1.2, "focus": [0.5, 0]`); the top of the frame stays put and everything below it moves down and grows.

**look** options:
- `grade`: `punch` (default: contrast 1.25, crushed blacks, saturation 0.9) or `neon` (saturated and dark, only for night footage with real lights; on daylight it looks fake).

**Auto sound effects** (soft, so they sit under the music; raise them with `"sfx": {"volume": 1.5}`): a riser that builds into the first drop; a boom and a hit on each drop; a hit on each `punch` and each word slam; a whoosh into each `pan`; a soft swish into the other cuts. Never two closer than 0.4 s, so fast cuts don't machine-gun.

**music:** the cuts only land on the beat if the song's first beat is at its very start. If it isn't, trim it once: `ffmpeg -y -loglevel error -ss FIRST_BEAT_SECONDS -i raw/song.mp3 raw/song-start.mp3` and use that file.

**Flashes (seizure safety):** never more than 3 a second. A drop and a flash each count as one flash, and no two start within 1/3 s (10 frames) of each other: drops are kept first, then any flash that keeps 1/3 s from them and from the flash before it. A skipped hit is a plain cut, and `render` prints a note naming its clip. At 170 BPM every beat can still carry a hit (beats are 10–11 frames apart); shots under 1/3 s can't all flash.

**Shape of a good edit (7–15 s):** 4–6 one-beat cuts with zooms → a `pan` → the `drop` with the first word → a long `push` with the second word → a few fast cuts with `flash` on downbeats → the hero shot held still at the end.

Before rendering, tell the user the plan in plain words (the shots in order, where the drop is, the words, the grade) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio-node.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `node SKILL_DIR/scripts/goat.mjs probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 5. Render and check

`goat render plan.json`

It draws the moves, flashes, shake, split and words over the graded footage, mixes the sound and writes the MP4 plus a contact sheet (one frame per second) at `.work-hype-cut/sheet.jpg`. On our test Mac a 9.5 s video with 12 shots took 14–20 s to render and 5–7 s to prep (a 6.7 s video with 15 shots at 170 BPM: 13–15 s and 5–7 s). Longer videos take longer. Run the next render only after the last one ends.

Fast cuts slip between the contact sheet's frames, so also make a quick sheet with a picture every 6 frames (80 pictures: 16 s; for a longer video add rows, e.g. `tile=10x12` for 24 s) and read it:
`ffmpeg -y -loglevel error -i output/hype-cut.mp4 -vf "select='not(mod(n\,6))',scale=180:-2,tile=10x8" -frames:v 1 -fps_mode vfr output/check.jpg`
Then read the first frame and full-size frames inside each shot of 0.5 s or more: 0.4 s after it starts (after its flash, shake and split) and 0.1 s before it ends. Skip shots under 0.5 s; the quick sheet shows them. For the example plan (the pan runs 1.6 to 2.4 s, the push 2.8 to 4.4 s):
`ffmpeg -y -loglevel error -i output/hype-cut.mp4 -frames:v 1 output/check-0.jpg`
`ffmpeg -y -loglevel error -ss 2.0 -i output/hype-cut.mp4 -frames:v 1 output/check-2.0.jpg` (the pan, blurred sideways)
`ffmpeg -y -loglevel error -ss 3.2 -i output/hype-cut.mp4 -frames:v 1 output/check-3.2.jpg` (the push, with "ӨНГӨ"; one more at 4.3)
Check that:
- the first frame (the thumbnail) shows the footage (or a word at 0);
- no zoomed shot is a black or blurry blob (move `focus` onto lit detail);
- each word is whole and readable and doesn't sit on a face (see section 4);
- the drop lands where you meant (the white frames in the quick sheet).

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 6. Hand over

Tell the user where the file is (`output/hype-cut.mp4`) and that it is ready to post. If they add the song in the app, tell them to line its drop up with the white flash.

## Rules

- Never more than 3 flashes a second. The look enforces it (see "Flashes" above); don't try to get round it.
- Words sit in the top band (top at y 346), inside the area no app buttons cover. 1–3 words at a time, up to 2 rows of 17 characters.
- Use only the fonts bundled in `SKILL_DIR/fonts` (Tektur has Ө ө Ү ү and ₮). Don't swap in other fonts. Emoji and symbols such as ★ can't be drawn.
- Music must be licensed for use in a file. If unsure, leave it out and let the user add it in the app.
- The output is 1080x1920, 30 fps, H.264. With music, the music and the clips' own sound are brought to -14 LUFS together (Instagram/TikTok level) and the effects play on top (our music test came out at -13.6 LUFS). Without music, the clips' own sound is brought to -14 LUFS; silent clips stay silent under the effects, so such a reel is quieter than that.
