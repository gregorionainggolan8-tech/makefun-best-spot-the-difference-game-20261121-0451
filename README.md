[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/gregorionainggolan8-tech/makefun-best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/gregorionainggolan8-tech/makefun-best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Danau Senja — Cari Perbedaannya

A complete, original spot-the-difference game that runs offline in a desktop
browser from static files. Two near-identical hand-drawn scenes sit side by
side; click every difference before the timer runs out.

## How to play

- **Mouse:** click a difference in either panel. A green ring marks each find.
- **Keyboard:** arrow keys move the crosshair, Enter/Space clicks, `H` uses a
  hint, `M` toggles sound, `R` restarts the level, `Esc` returns to the menu.
- A wrong click costs 5 seconds and 10 points. A hint costs 50 points and
  rings one still-hidden difference for 3 seconds.
- 3 levels, rising difficulty: *Senja di Dermaga* (7 differences),
  *Pasar Pagi* (8), *Malam di Hutan Pinus* (9). Clear a level for a time
  bonus; clear all three to win.

## Run it

```sh
node serve.ts            # game/ on http://localhost:8080
```

Open the page in desktop Chrome. No build step, no network request: every
scene is drawn on canvas at run time and every sound is synthesised with
WebAudio.

## Screenshots

`shots.json` lists the four shots and the `?shot=` state each one renders:
`1-play.jpg` (mid-hunt, level 1), `2-start.jpg` (title), `3-market.jpg`
(mid-hunt, level 2), `4-win.jpg` (victory).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` — the page and canvas
- `game/src/main.js` — bootstrap and animation loop
- `game/src/game.js` — state, input, timer, hints, scoring, HUD
- `game/src/levels.js` — the three scenes and every hidden difference
- `game/src/rng.js` — seeded random, so both panels share their decoration
- `game/src/audio.js` — synthesised sounds (WebAudio, no audio files)
- `game/src/style.css` — page chrome around the canvas
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `serve.ts` — a tiny static server for local play
- `shots.json` — the screenshot states
