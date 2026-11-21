// levels.js — the three original scenes and every difference hidden in them.
// Each scene is painted twice from the same seed, once per panel: the base is
// identical, and only the listed differences change between the two panels.
// A difference draws its own element for a given side, so a "missing" thing is
// drawn on one side only and a "changed" thing is drawn differently per side.
//
// Panel space is 560 x 400. A difference has a centre (x, y) and a click
// radius r; the game accepts a click inside that circle on either panel.

import { range } from './rng.js';

const W = 560;
const H = 400;

// --- small shared drawing helpers -------------------------------------------

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function cloudShape(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y - 8 * s, 13 * s, 0, Math.PI * 2);
  ctx.arc(x + 36 * s, y, 15 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y + 6 * s, 14 * s, 0, Math.PI * 2);
  ctx.fill();
}

function birdShape(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - 10 * s, y);
  ctx.quadraticCurveTo(x - 4 * s, y - 8 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 8 * s, x + 10 * s, y);
  ctx.stroke();
}

function pineTree(ctx, x, y, s, dark) {
  ctx.fillStyle = dark ? '#14532d' : '#166534';
  ctx.beginPath();
  ctx.moveTo(x, y - 92 * s);
  ctx.lineTo(x - 34 * s, y - 30 * s);
  ctx.lineTo(x - 18 * s, y - 30 * s);
  ctx.lineTo(x - 42 * s, y + 18 * s);
  ctx.lineTo(x - 20 * s, y + 18 * s);
  ctx.lineTo(x - 48 * s, y + 62 * s);
  ctx.lineTo(x + 48 * s, y + 62 * s);
  ctx.lineTo(x + 20 * s, y + 18 * s);
  ctx.lineTo(x + 42 * s, y + 18 * s);
  ctx.lineTo(x + 18 * s, y - 30 * s);
  ctx.lineTo(x + 34 * s, y - 30 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 6 * s, y + 62 * s, 12 * s, 18 * s);
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
}

// --- Scene 1: Senja di Dermaga (dusk on the lake) ----------------------------

function paintLake(ctx, rng) {
  // Sky: orange dusk melting into purple.
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, '#7c3f58');
  sky.addColorStop(0.45, '#c96f4a');
  sky.addColorStop(0.75, '#f2a65a');
  sky.addColorStop(1, '#f7c873');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 240);
  // Low sun and its glow.
  ctx.fillStyle = '#fde68a';
  ellipse(ctx, 420, 168, 30, 30);
  ctx.fillStyle = 'rgba(253, 230, 138, 0.25)';
  ellipse(ctx, 420, 168, 52, 52);
  // Two shared clouds.
  ctx.fillStyle = 'rgba(255, 228, 196, 0.85)';
  cloudShape(ctx, 110, 52, 0.9);
  cloudShape(ctx, 470, 96, 0.7);
  // Distant hills.
  ctx.fillStyle = '#5b3a5e';
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.quadraticCurveTo(120, 150, 260, 225);
  ctx.quadraticCurveTo(400, 165, W, 230);
  ctx.lineTo(W, 240);
  ctx.closePath();
  ctx.fill();
  // The lake.
  const lake = ctx.createLinearGradient(0, 240, 0, H);
  lake.addColorStop(0, '#e8833a');
  lake.addColorStop(0.35, '#7a5a8a');
  lake.addColorStop(1, '#2c4a6e');
  ctx.fillStyle = lake;
  ctx.fillRect(0, 240, W, 160);
  // Sun glitter on the water, deterministic from the seed.
  ctx.fillStyle = 'rgba(253, 230, 138, 0.55)';
  for (let i = 0; i < 26; i++) {
    const x = 340 + range(rng, -90, 90);
    const y = 250 + range(rng, 0, 140);
    ctx.fillRect(x, y, range(rng, 8, 26), 2);
  }
  // Wooden pier.
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(150, 268, 150, 12);
  ctx.fillStyle = '#6d4525';
  ctx.fillRect(168, 280, 10, 60);
  ctx.fillRect(272, 280, 10, 60);
  ctx.fillStyle = '#a06a3d';
  for (let i = 0; i < 6; i++) ctx.fillRect(156 + i * 24, 268, 3, 12);
  // Little house on the left shore.
  ctx.fillStyle = '#f3e5c3';
  ctx.fillRect(48, 168, 84, 62);
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(40, 170);
  ctx.lineTo(90, 128);
  ctx.lineTo(140, 170);
  ctx.closePath();
  ctx.fill();
  // Door and a dark window (a difference lights it on one side).
  ctx.fillStyle = '#78350f';
  ctx.fillRect(80, 196, 20, 34);
  ctx.fillStyle = '#312e81';
  ctx.fillRect(108, 182, 16, 16);
  // Reeds and grass tufts along the shore.
  ctx.strokeStyle = '#3f6212';
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const x = range(rng, 8, W - 8);
    const y = 386 + range(rng, -8, 8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + range(rng, -6, 6), y - 22, x + range(rng, -10, 10), y - 30);
    ctx.stroke();
  }
  // Two shared birds in the sky.
  ctx.strokeStyle = '#3b2f2f';
  ctx.lineWidth = 2.5;
  birdShape(ctx, 96, 84, 1);
  birdShape(ctx, 210, 58, 0.8);
  // A pine on the right shore.
  pineTree(ctx, 520, 200, 0.55, false);
}

// --- Scene 2: Pasar Pagi (morning market) ------------------------------------

function stripedAwning(ctx, x, y, w, h, c1, c2) {
  const stripes = 7;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? c1 : c2;
    ctx.fillRect(x + (w / stripes) * i, y, w / stripes + 1, h);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y + h - 6, w, 6);
}

function paintMarket(ctx, rng) {
  // Morning sky and sun.
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#bae6fd');
  sky.addColorStop(0.6, '#fef3c7');
  sky.addColorStop(1, '#fde68a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 260);
  ctx.fillStyle = '#fbbf24';
  ellipse(ctx, 500, 52, 26, 26);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
  ellipse(ctx, 500, 52, 44, 44);
  // Back wall of the market and the ground.
  ctx.fillStyle = '#d6a86c';
  ctx.fillRect(0, 210, W, 60);
  ctx.fillStyle = '#b98d54';
  ctx.fillRect(0, 268, W, 132);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 8; i++) ctx.fillRect(0, 292 + i * 12, W, 2);
  // Left stall with a red awning.
  ctx.fillStyle = '#92400e';
  ctx.fillRect(28, 150, 190, 150);
  stripedAwning(ctx, 18, 118, 210, 34, '#dc2626', '#fef3c7');
  ctx.fillStyle = '#78350f';
  ctx.fillRect(24, 148, 6, 152);
  ctx.fillRect(218, 148, 6, 152);
  // Right stall with a teal awning.
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(330, 150, 200, 150);
  stripedAwning(ctx, 320, 118, 220, 34, '#0d9488', '#fef3c7');
  ctx.fillStyle = '#134e4a';
  ctx.fillRect(326, 148, 6, 152);
  ctx.fillRect(528, 148, 6, 152);
  // Fruit baskets on the left stall.
  ctx.fillStyle = '#a16207';
  ellipse(ctx, 90, 292, 42, 14);
  ctx.fillStyle = '#ea580c';
  for (const [ox, oy] of [[-22, -6], [0, -12], [22, -6], [-10, -16], [12, -16]]) {
    ellipse(ctx, 90 + ox, 284 + oy, 9, 8);
  }
  ctx.fillStyle = '#a16207';
  ellipse(ctx, 176, 292, 36, 12);
  ctx.fillStyle = '#16a34a';
  for (const [ox, oy] of [[-16, -6], [2, -12], [18, -6]]) {
    ellipse(ctx, 176 + ox, 286 + oy, 10, 9);
  }
  // Baskets on the right stall.
  ctx.fillStyle = '#a16207';
  ellipse(ctx, 400, 292, 44, 14);
  ctx.fillStyle = '#dc2626';
  for (const [ox, oy] of [[-24, -6], [-4, -12], [16, -6], [6, -18]]) {
    ellipse(ctx, 400 + ox, 284 + oy, 9, 8);
  }
  ctx.fillStyle = '#a16207';
  ellipse(ctx, 486, 292, 36, 12);
  ctx.fillStyle = '#eab308';
  for (const [ox, oy] of [[-14, -6], [4, -12], [18, -6]]) {
    ellipse(ctx, 486 + ox, 286 + oy, 9, 8);
  }
  // The vendor behind the left stall.
  ctx.fillStyle = '#fcd34d';
  ellipse(ctx, 130, 178, 26, 30); // head wrap
  ctx.fillStyle = '#92400e';
  ctx.fillRect(104, 176, 52, 8);
  ctx.fillStyle = '#f9a8d4';
  ellipse(ctx, 130, 208, 14, 14); // face
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(108, 222, 44, 62); // apron
  // Two shared hanging lanterns.
  ctx.fillStyle = '#b91c1c';
  ellipse(ctx, 268, 96, 12, 15);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(264, 78, 8, 5);
  ctx.fillStyle = '#b91c1c';
  ellipse(ctx, 300, 96, 12, 15);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(296, 78, 8, 5);
  // Crates on the ground, deterministic scatter of straw.
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(30, 330, 70, 40);
  ctx.fillRect(460, 330, 70, 40);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const x = range(rng, 20, W - 20);
    ctx.beginPath();
    ctx.moveTo(x, 392);
    ctx.lineTo(x + range(rng, -8, 8), 384);
    ctx.stroke();
  }
}

// --- Scene 3: Malam di Hutan Pinus (night in the pine forest) ----------------

function paintForest(ctx, rng) {
  // Night sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#0f172a');
  sky.addColorStop(0.6, '#1e293b');
  sky.addColorStop(1, '#334155');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 300);
  // Moon.
  ctx.fillStyle = '#fef9c3';
  ellipse(ctx, 470, 58, 26, 26);
  ctx.fillStyle = 'rgba(254, 249, 195, 0.22)';
  ellipse(ctx, 470, 58, 44, 44);
  // Deterministic stars.
  ctx.fillStyle = '#fefce8';
  for (let i = 0; i < 46; i++) {
    star(ctx, range(rng, 10, W - 10), range(rng, 10, 190), range(rng, 1.5, 3.5));
  }
  // Pine forest, back row then front row.
  pineTree(ctx, 60, 250, 0.9, true);
  pineTree(ctx, 170, 265, 1.05, true);
  pineTree(ctx, 300, 250, 0.85, true);
  pineTree(ctx, 420, 260, 1.0, true);
  pineTree(ctx, 520, 250, 0.9, true);
  // Ground.
  ctx.fillStyle = '#1c2a1a';
  ctx.fillRect(0, 290, W, 110);
  ctx.fillStyle = '#24361f';
  ellipse(ctx, 280, 392, 260, 14);
  // Tent on the left.
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(90, 356);
  ctx.lineTo(150, 272);
  ctx.lineTo(210, 356);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.moveTo(150, 272);
  ctx.lineTo(210, 356);
  ctx.lineTo(150, 356);
  ctx.closePath();
  ctx.fill();
  // Campfire: stones and logs (the flame is a difference on one side).
  ctx.fillStyle = '#78716c';
  for (const [sx, sy] of [[252, 352], [268, 356], [300, 356], [314, 352]]) {
    ellipse(ctx, sx, sy, 9, 7);
  }
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(258, 348);
  ctx.lineTo(306, 336);
  ctx.moveTo(306, 348);
  ctx.lineTo(258, 336);
  ctx.stroke();
  // A small firewood stack beside the tent (one more log is a difference).
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(178, 356);
  ctx.lineTo(216, 350);
  ctx.moveTo(180, 366);
  ctx.lineTo(218, 360);
  ctx.stroke();
  // Sleeping bag on the right.
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.moveTo(380, 358);
  ctx.quadraticCurveTo(380, 322, 420, 322);
  ctx.quadraticCurveTo(460, 322, 460, 358);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(380, 340, 80, 6);
  // Fireflies, deterministic.
  ctx.fillStyle = '#bef264';
  for (let i = 0; i < 9; i++) {
    ellipse(ctx, range(rng, 30, 530), range(rng, 210, 330), 3, 3);
  }
}

// --- The levels ---------------------------------------------------------------

export const LEVELS = [
  {
    id: 'danau-senja',
    name: 'Senja di Dermaga',
    subtitle: 'Danau tenang, matahari turun — ada 7 yang berubah.',
    timeLimit: 150,
    seed: 20261121,
    paint: paintLake,
    differences: [
      {
        id: 'perahu',
        label: 'Perahu di danau',
        x: 392, y: 306, r: 30,
        draw(ctx) {
          ctx.fillStyle = '#7c2d12';
          ctx.beginPath();
          ctx.moveTo(356, 302);
          ctx.lineTo(428, 302);
          ctx.lineTo(414, 318);
          ctx.lineTo(370, 318);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(392, 302);
          ctx.lineTo(392, 272);
          ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.moveTo(392, 274);
          ctx.lineTo(392, 300);
          ctx.lineTo(416, 300);
          ctx.closePath();
          ctx.fill();
        },
      },
      {
        id: 'burung-ketiga',
        label: 'Burung ketiga di langit',
        x: 150, y: 70, r: 16,
        draw(ctx) {
          ctx.strokeStyle = '#3b2f2f';
          ctx.lineWidth = 2.5;
          birdShape(ctx, 150, 70, 0.9);
        },
      },
      {
        id: 'jendela-menyala',
        label: 'Jendela rumah menyala',
        x: 116, y: 190, r: 18,
        draw(ctx) {
          ctx.fillStyle = '#fde047';
          ctx.fillRect(108, 182, 16, 16);
          ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
          ellipse(ctx, 116, 190, 24, 24);
        },
      },
      {
        id: 'ikan-melompat',
        label: 'Ikan melompat',
        x: 470, y: 326, r: 22,
        draw(ctx, side) {
          if (side !== 'right') return;
          ctx.fillStyle = '#93c5fd';
          ctx.beginPath();
          ctx.moveTo(452, 332);
          ctx.quadraticCurveTo(470, 306, 488, 332);
          ctx.quadraticCurveTo(470, 322, 452, 332);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(470, 336, 12, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        },
      },
      {
        id: 'bunga',
        label: 'Warna bunga di tepi danau',
        x: 520, y: 368, r: 16,
        draw(ctx, side) {
          ctx.fillStyle = side === 'left' ? '#dc2626' : '#eab308';
          for (const [px, py] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) {
            ellipse(ctx, 520 + px, 368 + py, 5, 5);
          }
          ctx.fillStyle = '#fde047';
          ellipse(ctx, 520, 368, 4, 4);
        },
      },
      {
        id: 'awan-hilang',
        label: 'Awan di atas matahari',
        x: 300, y: 58, r: 24,
        draw(ctx, side) {
          if (side !== 'left') return;
          ctx.fillStyle = 'rgba(255, 228, 196, 0.85)';
          cloudShape(ctx, 282, 58, 0.8);
        },
      },
      {
        id: 'bendera',
        label: 'Bendera di dermaga',
        x: 306, y: 248, r: 20,
        draw(ctx, side) {
          if (side !== 'left') return;
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(300, 268);
          ctx.lineTo(300, 232);
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(300, 232);
          ctx.lineTo(324, 240);
          ctx.lineTo(300, 248);
          ctx.closePath();
          ctx.fill();
        },
      },
    ],
  },
  {
    id: 'pasar-pagi',
    name: 'Pasar Pagi',
    subtitle: 'Kios ramai, dagangan segar — ada 8 yang berubah.',
    timeLimit: 150,
    seed: 77031,
    paint: paintMarket,
    differences: [
      {
        id: 'kucing',
        label: 'Kucing tidur di peti',
        x: 65, y: 342, r: 22,
        draw(ctx, side) {
          if (side !== 'left') return;
          ctx.fillStyle = '#f97316';
          ellipse(ctx, 65, 350, 26, 12);
          ellipse(ctx, 47, 342, 10, 9);
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(41, 336);
          ctx.lineTo(43, 326);
          ctx.lineTo(49, 334);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(51, 334);
          ctx.lineTo(55, 325);
          ctx.lineTo(58, 334);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#c2410c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(86, 350);
          ctx.quadraticCurveTo(98, 344, 94, 332);
          ctx.stroke();
        },
      },
      {
        id: 'lampion',
        label: 'Warna lampion gantung',
        x: 300, y: 96, r: 18,
        draw(ctx, side) {
          ctx.fillStyle = side === 'left' ? '#b91c1c' : '#15803d';
          ellipse(ctx, 300, 96, 12, 15);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(296, 78, 8, 5);
        },
      },
      {
        id: 'jeruk',
        label: 'Jumlah jeruk di keranjang',
        x: 408, y: 280, r: 30,
        draw(ctx, side) {
          ctx.fillStyle = '#dc2626';
          for (const [ox, oy] of [[-24, -6], [-4, -12], [16, -6], [6, -18]]) {
            ellipse(ctx, 400 + ox, 284 + oy, 9, 8);
          }
          if (side === 'left') ellipse(ctx, 424, 278, 9, 8);
        },
      },
      {
        id: 'harga',
        label: 'Angka di papan harga',
        x: 210, y: 258, r: 18,
        draw(ctx, side) {
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(192, 244, 36, 26);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.strokeRect(192, 244, 36, 26);
          ctx.fillStyle = '#1f2937';
          ctx.font = 'bold 16px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(side === 'left' ? '10' : '15', 210, 258);
        },
      },
      {
        id: 'payung',
        label: 'Payung di atas kios kanan',
        x: 480, y: 178, r: 26,
        draw(ctx, side) {
          if (side !== 'left') return;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(480, 210);
          ctx.lineTo(480, 168);
          ctx.stroke();
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.moveTo(436, 168);
          ctx.quadraticCurveTo(480, 128, 524, 168);
          ctx.closePath();
          ctx.fill();
        },
      },
      {
        id: 'burung-atap',
        label: 'Burung di atap kios',
        x: 90, y: 116, r: 16,
        draw(ctx, side) {
          if (side !== 'right') return;
          ctx.fillStyle = '#334155';
          ellipse(ctx, 90, 116, 12, 8);
          ellipse(ctx, 80, 110, 6, 6);
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(74, 110);
          ctx.lineTo(68, 112);
          ctx.lineTo(74, 114);
          ctx.closePath();
          ctx.fill();
        },
      },
      {
        id: 'peti',
        label: 'Isi peti di tanah',
        x: 495, y: 350, r: 24,
        draw(ctx, side) {
          if (side === 'left') {
            ctx.fillStyle = '#16a34a';
            ellipse(ctx, 482, 332, 12, 10);
            ellipse(ctx, 508, 332, 12, 10);
            ellipse(ctx, 495, 322, 12, 10);
          } else {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(466, 330, 58, 10);
          }
        },
      },
      {
        id: 'jam',
        label: 'Jarum jam di tiang kios',
        x: 40, y: 90, r: 18,
        draw(ctx, side) {
          ctx.fillStyle = '#fef3c7';
          ellipse(ctx, 40, 90, 16, 16);
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(40, 90, 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(40, 90);
          ctx.lineTo(40, 78);
          ctx.moveTo(40, 90);
          if (side === 'left') ctx.lineTo(28, 90);
          else ctx.lineTo(50, 96);
          ctx.stroke();
        },
      },
    ],
  },
  {
    id: 'hutan-pinus',
    name: 'Malam di Hutan Pinus',
    subtitle: 'Api unggun, tenda, dan bintang — ada 9 yang berubah.',
    timeLimit: 150,
    seed: 44519,
    paint: paintForest,
    differences: [
      {
        id: 'burung-hantu',
        label: 'Burung hantu di dahan',
        x: 90, y: 112, r: 22,
        draw(ctx, side) {
          if (side !== 'left') return;
          // A bare branch holds the owl on this side only.
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(58, 138);
          ctx.lineTo(126, 138);
          ctx.stroke();
          ctx.fillStyle = '#92400e';
          ellipse(ctx, 90, 118, 16, 20);
          ellipse(ctx, 76, 102, 9, 9);
          ellipse(ctx, 104, 102, 9, 9);
          ctx.fillStyle = '#fef3c7';
          ellipse(ctx, 84, 114, 5, 6);
          ellipse(ctx, 96, 114, 5, 6);
          ctx.fillStyle = '#111827';
          ellipse(ctx, 84, 114, 2.5, 3);
          ellipse(ctx, 96, 114, 2.5, 3);
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(88, 122);
          ctx.lineTo(92, 122);
          ctx.lineTo(90, 127);
          ctx.closePath();
          ctx.fill();
        },
      },
      {
        id: 'api-unggun',
        label: 'Api di unggun',
        x: 282, y: 326, r: 24,
        draw(ctx, side) {
          if (side !== 'left') return;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(282, 300);
          ctx.quadraticCurveTo(296, 318, 296, 332);
          ctx.quadraticCurveTo(296, 344, 282, 344);
          ctx.quadraticCurveTo(268, 344, 268, 332);
          ctx.quadraticCurveTo(268, 318, 282, 300);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(282, 318);
          ctx.quadraticCurveTo(290, 330, 290, 338);
          ctx.quadraticCurveTo(290, 346, 282, 346);
          ctx.quadraticCurveTo(274, 346, 274, 338);
          ctx.quadraticCurveTo(274, 330, 282, 318);
          ctx.closePath();
          ctx.fill();
        },
      },
      {
        id: 'bintang-jatuh',
        label: 'Bintang jatuh',
        x: 420, y: 70, r: 20,
        draw(ctx, side) {
          if (side !== 'right') return;
          ctx.strokeStyle = 'rgba(254, 249, 195, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(392, 52);
          ctx.lineTo(436, 82);
          ctx.stroke();
          ctx.fillStyle = '#fef9c3';
          star(ctx, 440, 84, 5);
        },
      },
      {
        id: 'kunang',
        label: 'Kunang-kunang di semak',
        x: 480, y: 200, r: 16,
        draw(ctx, side) {
          if (side !== 'left') return;
          ctx.fillStyle = '#bef264';
          ellipse(ctx, 480, 200, 4, 4);
          ctx.fillStyle = 'rgba(190, 242, 100, 0.3)';
          ellipse(ctx, 480, 200, 10, 10);
        },
      },
      {
        id: 'pintu-tenda',
        label: 'Pintu tenda',
        x: 150, y: 322, r: 22,
        draw(ctx, side) {
          if (side === 'left') {
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.moveTo(150, 288);
            ctx.lineTo(178, 356);
            ctx.lineTo(122, 356);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(150, 288);
            ctx.lineTo(178, 356);
            ctx.lineTo(122, 356);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#9a3412';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(150, 288);
            ctx.lineTo(150, 356);
            ctx.stroke();
          }
        },
      },
      {
        id: 'kawah-bulan',
        label: 'Kawah di bulan',
        x: 470, y: 58, r: 20,
        draw(ctx, side) {
          if (side !== 'right') return;
          ctx.fillStyle = '#d9d29a';
          ellipse(ctx, 462, 50, 5, 5);
          ellipse(ctx, 478, 64, 4, 4);
          ellipse(ctx, 474, 46, 3, 3);
        },
      },
      {
        id: 'ransel',
        label: 'Warna ransel',
        x: 500, y: 348, r: 22,
        draw(ctx, side) {
          ctx.fillStyle = side === 'left' ? '#1d4ed8' : '#b91c1c';
          ctx.beginPath();
          ctx.moveTo(482, 358);
          ctx.quadraticCurveTo(482, 330, 500, 330);
          ctx.quadraticCurveTo(518, 330, 518, 358);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(486, 340, 28, 5);
        },
      },
      {
        id: 'kayu-bakar',
        label: 'Kayu bakar di tumpukan',
        x: 196, y: 358, r: 18,
        draw(ctx, side) {
          if (side !== 'right') return;
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(182, 348);
          ctx.lineTo(212, 356);
          ctx.stroke();
        },
      },
      {
        id: 'jejak',
        label: 'Jejak kaki di tanah',
        x: 320, y: 382, r: 20,
        draw(ctx, side) {
          if (side !== 'right') return;
          ctx.fillStyle = 'rgba(214, 186, 150, 0.85)';
          ellipse(ctx, 306, 378, 6, 4);
          ellipse(ctx, 320, 384, 6, 4);
          ellipse(ctx, 334, 378, 6, 4);
        },
      },
    ],
  },
];
