// main.js — bootstrap: build the game, wire mouse and keyboard, run the loop.
// The loop renders every animation frame; in shot mode (?shot=play etc.) the
// game freezes on a fixed state so a screenshot is a deterministic render.

import { SpotGame, CANVAS_W, CANVAS_H } from './game.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const game = new SpotGame(canvas);
window.__game = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) game.applyShot(shot);

const statusLine = document.getElementById('status');
let lastAnnounced = '';

canvas.addEventListener('click', (event) => {
  game.handleClick(event.clientX, event.clientY);
});

window.addEventListener('keydown', (event) => {
  game.handleKey(event);
});

// Keep the screen-reader status line in step with the game's message.
function announce() {
  if (game.message !== lastAnnounced) {
    lastAnnounced = game.message;
    statusLine.textContent = lastAnnounced;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(100, now - last);
  last = now;
  game.update(dt);
  game.render();
  announce();
  window.requestAnimationFrame(frame);
}

game.render();
announce();
window.requestAnimationFrame(frame);
