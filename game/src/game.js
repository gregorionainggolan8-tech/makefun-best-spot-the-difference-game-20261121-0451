// game.js — the spot-the-difference engine: state, input, timer, hints,
// scoring, markers and all the drawing of the frame around the two panels.
// The scenes themselves live in levels.js; the sounds in audio.js.
//
// Canvas space is fixed at 1280 x 800 and scaled by CSS to fit the window.
// Left panel:  (40, 110) .. (600, 510).  Right panel: (680, 110) .. (1240, 510).
// Panel space is 560 x 400.

import { LEVELS } from './levels.js';
import { makeRng } from './rng.js';
import {
  isMuted,
  toggleMuted,
  playClick,
  playFound,
  playLevelClear,
  playTick,
  playVictory,
  playWrong,
} from './audio.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
const PANEL_W = 560;
const PANEL_H = 400;
const PANEL_Y = 110;
const LEFT_X = 40;
const RIGHT_X = 680;
const CLICK_SLACK = 10;

const HINTS_PER_LEVEL = 3;
const POINTS_PER_FIND = 100;
const WRONG_TIME_PENALTY = 5;
const WRONG_POINTS_PENALTY = 10;
const HINT_POINTS_COST = 50;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export class SpotGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screen = 'title';
    this.levelIndex = 0;
    this.found = new Set();
    this.score = 0;
    this.timeLeft = LEVELS[0].timeLimit;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.crosshair = { x: CANVAS_W / 2, y: 320, visible: false };
    this.lastFind = null; // { id, at }
    this.wrongFlash = null; // { x, y, at }
    this.hintMark = null; // { id, until }
    this.message = 'Klik perbedaan di panel kiri atau kanan.';
    this.shotMode = false;
    this.frozenNow = 0;
    this.lastTickSecond = -1;
    this.levelClearBonus = 0;
    this.totalFound = 0;
    this.buttons = [];
  }

  get level() {
    return LEVELS[this.levelIndex];
  }

  get remaining() {
    return this.level.differences.length - this.found.size;
  }

  now() {
    return this.shotMode ? this.frozenNow : performance.now();
  }

  startLevel(index) {
    this.levelIndex = index;
    this.found = new Set();
    this.timeLeft = this.level.timeLimit;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.lastFind = null;
    this.wrongFlash = null;
    this.hintMark = null;
    this.screen = 'playing';
    this.message = `${this.level.name}: cari ${this.level.differences.length} perbedaan!`;
  }

  startGame() {
    this.score = 0;
    this.totalFound = 0;
    this.startLevel(0);
  }

  toTitle() {
    this.screen = 'title';
    this.buttons = [];
    this.message = 'Klik perbedaan di panel kiri atau kanan.';
  }

  // --- input ---------------------------------------------------------------

  canvasPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  panelAt(x, y) {
    if (y < PANEL_Y || y > PANEL_Y + PANEL_H) return null;
    if (x >= LEFT_X && x <= LEFT_X + PANEL_W) return { side: 'left', px: x - LEFT_X, py: y - PANEL_Y };
    if (x >= RIGHT_X && x <= RIGHT_X + PANEL_W) return { side: 'right', px: x - RIGHT_X, py: y - PANEL_Y };
    return null;
  }

  handleClick(clientX, clientY) {
    const p = this.canvasPoint(clientX, clientY);
    // Buttons first (they live in the footer row).
    for (const b of this.buttons) {
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        this.pressButton(b.id);
        return;
      }
    }
    if (this.screen === 'title') {
      playClick();
      this.startGame();
      return;
    }
    if (this.screen === 'levelClear') {
      playClick();
      this.nextLevel();
      return;
    }
    if (this.screen === 'timeUp') {
      playClick();
      this.startLevel(this.levelIndex);
      return;
    }
    if (this.screen === 'victory') {
      playClick();
      this.startGame();
      return;
    }
    if (this.screen !== 'playing') return;
    const hit = this.panelAt(p.x, p.y);
    if (!hit) return;
    this.tryFindAt(hit.px, hit.py, p.x, p.y);
  }

  tryFindAt(px, py, canvasX, canvasY) {
    for (const diff of this.level.differences) {
      if (this.found.has(diff.id)) continue;
      const dx = px - diff.x;
      const dy = py - diff.y;
      if (dx * dx + dy * dy <= (diff.r + CLICK_SLACK) * (diff.r + CLICK_SLACK)) {
        this.found.add(diff.id);
        this.totalFound += 1;
        this.score += POINTS_PER_FIND;
        this.lastFind = { id: diff.id, at: this.now() };
        this.message = `Ketemu! ${diff.label}  +${POINTS_PER_FIND}`;
        playFound();
        if (this.found.size === this.level.differences.length) {
          this.levelClearBonus = Math.round(this.timeLeft) * 2;
          this.score += this.levelClearBonus;
          this.screen = 'levelClear';
          if (this.levelIndex === LEVELS.length - 1) {
            this.screen = 'victory';
            playVictory();
          } else {
            playLevelClear();
          }
        }
        return;
      }
    }
    // Nothing there: a miss costs time and a few points.
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_TIME_PENALTY);
    this.score = Math.max(0, this.score - WRONG_POINTS_PENALTY);
    this.wrongFlash = { x: canvasX, y: canvasY, at: this.now() };
    this.message = `Bukan di situ… -${WRONG_TIME_PENALTY} detik`;
    playWrong();
  }

  useHint() {
    if (this.screen !== 'playing') return;
    if (this.hintsLeft <= 0) {
      this.message = 'Petunjuk habis untuk level ini.';
      return;
    }
    const remaining = this.level.differences.filter((d) => !this.found.has(d.id));
    if (remaining.length === 0) return;
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - HINT_POINTS_COST);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintMark = { id: pick.id, until: this.now() + 3000 };
    this.message = `Petunjuk: cari di sekitar ${pick.label.toLowerCase()}… -${HINT_POINTS_COST} poin`;
    playClick();
  }

  pressButton(id) {
    if (id === 'hint') this.useHint();
    else if (id === 'sound') {
      toggleMuted();
      this.message = isMuted() ? 'Suara dimatikan.' : 'Suara dinyalakan.';
    } else if (id === 'restart') {
      if (this.screen === 'playing' || this.screen === 'timeUp') {
        playClick();
        this.startLevel(this.levelIndex);
      }
    } else if (id === 'menu') {
      playClick();
      this.toTitle();
    }
  }

  nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) this.startLevel(this.levelIndex + 1);
    else this.toTitle();
  }

  handleKey(event) {
    const key = event.key;
    if (this.screen === 'title' && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      playClick();
      this.startGame();
      return;
    }
    if ((this.screen === 'levelClear' || this.screen === 'victory') && (key === 'Enter' || key === 'n' || key === 'N')) {
      event.preventDefault();
      playClick();
      if (this.screen === 'victory') this.startGame();
      else this.nextLevel();
      return;
    }
    if (this.screen === 'timeUp' && (key === 'Enter' || key === 'r' || key === 'R')) {
      event.preventDefault();
      playClick();
      this.startLevel(this.levelIndex);
      return;
    }
    if (key === 'Escape') {
      this.toTitle();
      return;
    }
    if (this.screen !== 'playing') return;
    if (key === 'h' || key === 'H') {
      this.useHint();
      return;
    }
    if (key === 'm' || key === 'M') {
      this.pressButton('sound');
      return;
    }
    if (key === 'r' || key === 'R') {
      this.pressButton('restart');
      return;
    }
    const step = event.shiftKey ? 40 : 12;
    let moved = false;
    if (key === 'ArrowLeft') { this.crosshair.x = Math.max(0, this.crosshair.x - step); moved = true; }
    if (key === 'ArrowRight') { this.crosshair.x = Math.min(CANVAS_W, this.crosshair.x + step); moved = true; }
    if (key === 'ArrowUp') { this.crosshair.y = Math.max(0, this.crosshair.y - step); moved = true; }
    if (key === 'ArrowDown') { this.crosshair.y = Math.min(CANVAS_H, this.crosshair.y + step); moved = true; }
    if (moved) {
      event.preventDefault();
      this.crosshair.visible = true;
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.crosshair.visible = true;
      const hit = this.panelAt(this.crosshair.x, this.crosshair.y);
      if (hit) this.tryFindAt(hit.px, hit.py, this.crosshair.x, this.crosshair.y);
    }
  }

  // --- update ---------------------------------------------------------------

  update(dtMs) {
    if (this.shotMode) return;
    if (this.screen !== 'playing') return;
    this.timeLeft -= dtMs / 1000;
    const whole = Math.ceil(this.timeLeft);
    if (whole <= 10 && whole > 0 && whole !== this.lastTickSecond) {
      this.lastTickSecond = whole;
      playTick();
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.screen = 'timeUp';
      this.message = 'Waktu habis! Coba lagi level ini.';
      playWrong();
    }
    if (this.hintMark && this.now() > this.hintMark.until) this.hintMark = null;
  }

  // --- shot mode: fixed states for the screenshots --------------------------

  applyShot(shot) {
    this.shotMode = true;
    this.frozenNow = 1000;
    if (shot === 'start') {
      this.toTitle();
      return;
    }
    if (shot === 'market') {
      this.score = 740;
      this.startLevel(1);
      this.found = new Set(['kucing', 'lampion', 'jeruk', 'harga']);
      this.timeLeft = 87;
      this.hintsLeft = 2;
      this.lastFind = { id: 'harga', at: 700 };
      this.message = 'Ketemu! Angka di papan harga  +100';
      this.totalFound = 4;
      return;
    }
    if (shot === 'win') {
      this.score = 2840;
      this.totalFound = 24;
      this.screen = 'victory';
      return;
    }
    // Default: 'play' — level 1 mid-hunt, three found, four still hidden.
    this.score = 350;
    this.startLevel(0);
    this.found = new Set(['perahu', 'burung-ketiga', 'jendela-menyala']);
    this.timeLeft = 98;
    this.hintsLeft = 3;
    this.lastFind = { id: 'jendela-menyala', at: 700 };
    this.message = 'Ketemu! Jendela rumah menyala  +100';
    this.totalFound = 3;
  }

  // --- drawing ---------------------------------------------------------------

  drawPanel(level, side, originX) {
    const ctx = this.ctx;
    const now = this.now();
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, originX, PANEL_Y, PANEL_W, PANEL_H, 10);
    ctx.clip();
    ctx.translate(originX, PANEL_Y);
    level.paint(ctx, makeRng(level.seed));
    for (const diff of level.differences) diff.draw(ctx, side);
    // Markers on every difference already found.
    for (const diff of level.differences) {
      if (!this.found.has(diff.id)) continue;
      const fresh = this.lastFind && this.lastFind.id === diff.id;
      const age = now - (this.lastFind ? this.lastFind.at : 0);
      const pulse = fresh && age < 400 ? 1 + (1 - age / 400) * 0.35 : 1;
      const r = (diff.r + 8) * pulse;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(diff.x, diff.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(diff.x, diff.y, r - 3, 0, Math.PI * 2);
      ctx.stroke();
      // Check mark in the middle of the ring.
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(diff.x - 9, diff.y);
      ctx.lineTo(diff.x - 2, diff.y + 7);
      ctx.lineTo(diff.x + 10, diff.y - 7);
      ctx.stroke();
    }
    // Hint: a pulsing amber ring around one still-hidden difference.
    if (this.hintMark && this.screen === 'playing') {
      const diff = level.differences.find((d) => d.id === this.hintMark.id);
      if (diff) {
        const wobble = 1 + Math.sin(now / 180) * 0.12;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 7]);
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, (diff.r + 10) * wobble, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundRect(ctx, originX, PANEL_Y, PANEL_W, PANEL_H, 10);
    ctx.stroke();
  }

  drawHeader() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    grad.addColorStop(0, '#1e3a5f');
    grad.addColorStop(0.5, '#274b73');
    grad.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, 80);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Danau Senja', 40, 34);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('Cari Perbedaannya', 40, 62);
    // Level name and dots.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`Level ${this.levelIndex + 1}: ${this.level.name}`, CANVAS_W / 2, 30);
    for (let i = 0; i < LEVELS.length; i++) {
      ctx.fillStyle = i < this.levelIndex ? '#22c55e' : i === this.levelIndex ? '#fde68a' : 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2 - 30 + i * 32, 58, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Timer bar, left of the score block so the two never overlap.
    const barW = 180;
    const barX = CANVAS_W - 460;
    const frac = Math.max(0, this.timeLeft / this.level.timeLimit);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, barX, 18, barW, 18, 9);
    ctx.fill();
    ctx.fillStyle = frac > 0.25 ? '#4ade80' : '#f87171';
    if (frac > 0) {
      roundRect(ctx, barX, 18, barW * frac, 18, 9);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${formatTime(this.timeLeft)}`, barX, 52);
    // Score and the remaining counter.
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(`Skor ${this.score}`, CANVAS_W - 40, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(`Tersisa ${this.remaining} dari ${this.level.differences.length}`, CANVAS_W - 40, 58);
  }

  drawButtons() {
    const ctx = this.ctx;
    this.buttons = [];
    const defs = [
      { id: 'hint', label: `Petunjuk (H) · ${this.hintsLeft} lagi`, w: 240 },
      { id: 'sound', label: isMuted() ? 'Suara: Mati (M)' : 'Suara: Nyala (M)', w: 210 },
      { id: 'restart', label: 'Ulang Level (R)', w: 190 },
      { id: 'menu', label: 'Menu (Esc)', w: 150 },
    ];
    let x = 40;
    const y = 566;
    for (const d of defs) {
      const disabled = d.id === 'hint' && (this.screen !== 'playing' || this.hintsLeft <= 0);
      ctx.fillStyle = disabled ? '#6b7280' : '#274b73';
      roundRect(ctx, x, y, d.w, 44, 10);
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, d.w, 44, 10);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, x + d.w / 2, y + 23);
      this.buttons.push({ id: d.id, x, y, w: d.w, h: 44 });
      x += d.w + 16;
    }
  }

  drawFoundChips() {
    const ctx = this.ctx;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('Sudah ketemu:', 40, 646);
    let x = 180;
    for (const diff of this.level.differences) {
      if (!this.found.has(diff.id)) continue;
      ctx.font = '15px Georgia, serif';
      const w = ctx.measureText(diff.label).width + 24;
      if (x + w > CANVAS_W - 40) break;
      ctx.fillStyle = '#14532d';
      roundRect(ctx, x, 628, w, 34, 17);
      ctx.fill();
      ctx.fillStyle = '#bbf7d0';
      ctx.textAlign = 'center';
      ctx.fillText(`✓ ${diff.label}`, x + w / 2, 646);
      ctx.textAlign = 'left';
      x += w + 10;
    }
    if (this.found.size === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px Georgia, serif';
      ctx.fillText('— belum ada —', 180, 646);
    }
  }

  drawFooter() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 700, CANVAS_W, 100);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Klik perbedaan di panel kiri atau kanan  •  Panah + Enter untuk keyboard  •  H = petunjuk  •  Klik salah −5 detik', CANVAS_W / 2, 726);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(this.level.subtitle, CANVAS_W / 2, 756);
  }

  drawStatusLine() {
    const ctx = this.ctx;
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.message, CANVAS_W / 2, 538);
  }

  drawOverlay(title, lines, buttonLabel) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, 340, 220, 600, 340, 18);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    roundRect(ctx, 340, 220, 600, 340, 18);
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, CANVAS_W / 2, 288);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '20px Georgia, serif';
    lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 348 + i * 36));
    ctx.fillStyle = '#274b73';
    roundRect(ctx, 490, 478, 300, 52, 12);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    roundRect(ctx, 490, 478, 300, 52, 12);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(buttonLabel, CANVAS_W / 2, 505);
  }

  drawTitle() {
    const ctx = this.ctx;
    // The first scene, dimmed, behind the title.
    const level = LEVELS[0];
    this.drawPanel(level, 'left', LEFT_X);
    this.drawPanel(level, 'right', RIGHT_X);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.66)';
    ctx.fillRect(0, 80, CANVAS_W, 470);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Danau Senja', CANVAS_W / 2, 240);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText('Cari Perbedaannya', CANVAS_W / 2, 300);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '20px Georgia, serif';
    ctx.fillText('Dua gambar nyaris sama. Temukan semua perbedaannya sebelum waktu habis.', CANVAS_W / 2, 360);
    ctx.fillText('3 level: dermaga saat senja, pasar pagi, dan hutan pinus di malam hari.', CANVAS_W / 2, 392);
    ctx.fillStyle = '#274b73';
    roundRect(ctx, 490, 430, 300, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    roundRect(ctx, 490, 430, 300, 56, 12);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('▶  Mulai Bermain', CANVAS_W / 2, 459);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('Mouse atau keyboard (panah + Enter)  •  H = petunjuk  •  M = suara', CANVAS_W / 2, 520);
  }

  drawCrosshair() {
    if (!this.crosshair.visible || this.screen !== 'playing') return;
    const ctx = this.ctx;
    const { x, y } = this.crosshair;
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + 16, y);
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawWrongFlash() {
    if (!this.wrongFlash) return;
    const age = this.now() - this.wrongFlash.at;
    if (age > 500) {
      this.wrongFlash = null;
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 1 - age / 500;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const { x, y } = this.wrongFlash;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 12);
    ctx.lineTo(x + 12, y + 12);
    ctx.moveTo(x + 12, y - 12);
    ctx.lineTo(x - 12, y + 12);
    ctx.stroke();
    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (this.screen === 'title') {
      this.drawTitle();
      this.drawFooter();
      return;
    }
    this.drawHeader();
    // Panel tags.
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Panel A', LEFT_X, 96);
    ctx.textAlign = 'right';
    ctx.fillText('Panel B', RIGHT_X + PANEL_W, 96);
    this.drawPanel(this.level, 'left', LEFT_X);
    this.drawPanel(this.level, 'right', RIGHT_X);
    this.drawStatusLine();
    this.drawButtons();
    this.drawFoundChips();
    this.drawFooter();
    this.drawCrosshair();
    this.drawWrongFlash();
    if (this.screen === 'levelClear') {
      this.drawOverlay('Level Selesai!', [
        `Semua ${this.level.differences.length} perbedaan ketemu.`,
        `Bonus waktu: +${this.levelClearBonus} poin`,
        `Skor sekarang: ${this.score}`,
      ], 'Level Berikutnya  ▶');
    } else if (this.screen === 'timeUp') {
      this.drawOverlay('Waktu Habis!', [
        `Kamu menemukan ${this.found.size} dari ${this.level.differences.length} perbedaan.`,
        'Coba lagi — perbedaannya tetap di tempat yang sama.',
      ], 'Coba Lagi  ↻');
    } else if (this.screen === 'victory') {
      this.drawOverlay('Kamu Menang!', [
        `Semua 3 level selesai — ${this.totalFound} perbedaan ditemukan.`,
        `Skor akhir: ${this.score}`,
        'Terima kasih sudah bermain di Danau Senja.',
      ], 'Main Lagi  ↻');
    }
  }
}
