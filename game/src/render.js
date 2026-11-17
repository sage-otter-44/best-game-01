// Lumen Orbit — rendering. Every pixel the player sees is drawn here with
// the 2D canvas: no images, no fonts loaded from anywhere, just shapes,
// gradients and the system font stack.

import { CFG } from './config.js';

// A fixed starfield, generated once, so the sky does not shimmer.
const stars = [];
for (let i = 0; i < 130; i++) {
  stars.push({
    x: Math.random() * CFG.width,
    y: Math.random() * CFG.height,
    r: Math.random() * 1.6 + 0.4,
    twinkle: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 1.2,
    depth: 0.2 + Math.random() * 0.6, // parallax: far stars drift slower
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBackground(ctx, time, shakeX, shakeY) {
  const c = CFG.colors;
  const grad = ctx.createLinearGradient(0, 0, 0, CFG.height);
  grad.addColorStop(0, c.spaceTop);
  grad.addColorStop(1, c.spaceBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  // A faint nebula wash, drawn as two soft radial glows.
  const nebula = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  nebula(240, 150, 320, 'rgba(77, 120, 255, 0.10)');
  nebula(1060, 580, 340, 'rgba(255, 90, 110, 0.07)');

  // Parallax starfield: stars drift slowly left, twinkling.
  for (const s of stars) {
    const x = (((s.x - time * 4 * s.depth) % CFG.width) + CFG.width) % CFG.width;
    const alpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(time * s.speed + s.twinkle));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#dfe8ff';
    ctx.beginPath();
    ctx.arc(x + shakeX * s.depth, s.y + shakeY * s.depth, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawStar(ctx, time) {
  const c = CFG.colors;
  const cx = CFG.centerX;
  const cy = CFG.centerY;
  const pulse = 1 + 0.04 * Math.sin(time * 2.2);

  // Glow.
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CFG.starRadius * 3.1);
  glow.addColorStop(0, 'rgba(255, 154, 61, 0.34)');
  glow.addColorStop(0.55, 'rgba(255, 154, 61, 0.10)');
  glow.addColorStop(1, 'rgba(255, 154, 61, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.starRadius * 3.1, 0, Math.PI * 2);
  ctx.fill();

  // Body.
  const body = ctx.createRadialGradient(cx - 12, cy - 14, 4, cx, cy, CFG.starRadius * pulse);
  body.addColorStop(0, c.starCore);
  body.addColorStop(0.55, c.starMid);
  body.addColorStop(1, c.starGlow);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.starRadius * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Orbit guide rings, faint, so the player reads the tether range.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.orbitMin, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.orbitMax, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawTether(ctx, ship) {
  const c = CFG.colors;
  ctx.strokeStyle = c.tether;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CFG.centerX, CFG.centerY);
  ctx.lineTo(ship.x, ship.y);
  ctx.stroke();
  // A small anchor ring where the tether meets the ship.
  ctx.strokeStyle = 'rgba(255, 201, 77, 0.8)';
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, CFG.shipRadius + 5, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawShip(ctx, ship, time) {
  const c = CFG.colors;
  const blink = ship.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.heading);
  if (blink) ctx.globalAlpha = 0.35;

  // Engine flame while dashing.
  if (ship.dashTimer > 0) {
    const flame = ctx.createLinearGradient(-14, 0, -34, 0);
    flame.addColorStop(0, 'rgba(255, 179, 71, 0.95)');
    flame.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-34 - Math.random() * 8, 0);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();
  }

  // Hull: a little dart with a cyan canopy.
  ctx.fillStyle = c.shipBody;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-11, -10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.shipTrim;
  ctx.beginPath();
  ctx.arc(4, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawShard(ctx, shard) {
  if (!shard.visible) return;
  const c = CFG.colors;
  const pulse = 1 + 0.14 * Math.sin(shard.pulse);
  const r = CFG.shardRadius * pulse;
  ctx.save();
  ctx.translate(shard.x, shard.y);
  ctx.rotate(shard.pulse * 0.4);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  glow.addColorStop(0, 'rgba(77, 227, 255, 0.5)');
  glow.addColorStop(1, 'rgba(77, 227, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  // A four-pointed lumen diamond.
  ctx.fillStyle = c.shard;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.62, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.62, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.shardCore;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.45);
  ctx.lineTo(r * 0.28, 0);
  ctx.lineTo(0, r * 0.45);
  ctx.lineTo(-r * 0.28, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawRock(ctx, rock) {
  const c = CFG.colors;
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.rotation);
  const glow = ctx.createRadialGradient(0, 0, rock.radius * 0.4, 0, 0, rock.radius * 1.9);
  glow.addColorStop(0, 'rgba(255, 90, 110, 0.22)');
  glow.addColorStop(1, 'rgba(255, 90, 110, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, rock.radius * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.rock;
  ctx.strokeStyle = c.rockDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < rock.points.length; i++) {
    const a = (i / rock.points.length) * Math.PI * 2;
    const r = rock.radius * rock.points[i];
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Two ember cracks so rocks read as dangerous at a glance.
  ctx.strokeStyle = c.rockGlow;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-rock.radius * 0.4, -rock.radius * 0.2);
  ctx.lineTo(0, rock.radius * 0.1);
  ctx.lineTo(rock.radius * 0.35, -rock.radius * 0.3);
  ctx.stroke();
  ctx.restore();
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawFloatTexts(ctx, texts) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
  for (const t of texts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// HUD: score, best, wave, hearts, combo, wave progress, dash.
// ---------------------------------------------------------------------------
export function drawHud(ctx, game) {
  const c = CFG.colors;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = c.text;
  ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`SCORE ${game.score}`, 24, 44);
  ctx.fillStyle = c.textDim;
  ctx.font = '16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`BEST ${game.best}`, 24, 68);

  ctx.textAlign = 'center';
  ctx.fillStyle = c.text;
  ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.wave}`, CFG.width / 2, 42);
  // Wave progress: shards collected toward this wave's target.
  const target = CFG.shardsPerWave(game.wave);
  const frac = Math.min(1, game.waveCollected / target);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(ctx, CFG.width / 2 - 90, 52, 180, 8, 4);
  ctx.fill();
  ctx.fillStyle = c.shard;
  if (frac > 0) {
    roundRect(ctx, CFG.width / 2 - 90, 52, 180 * frac, 8, 4);
    ctx.fill();
  }
  ctx.fillStyle = c.textDim;
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${game.waveCollected}/${target} shards`, CFG.width / 2, 78);

  // Hearts, top right.
  const hx = CFG.width - 24;
  for (let i = 0; i < CFG.startHearts; i++) {
    const x = hx - i * 36;
    ctx.fillStyle = i < game.hearts ? c.heart : c.heartEmpty;
    ctx.beginPath();
    ctx.moveTo(x, 44);
    ctx.bezierCurveTo(x - 11, 32, x - 22, 42, x, 58);
    ctx.bezierCurveTo(x + 22, 42, x + 11, 32, x, 44);
    ctx.fill();
  }

  // Combo meter, under the score.
  if (game.combo > 1) {
    ctx.textAlign = 'left';
    ctx.fillStyle = c.gold;
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`COMBO x${game.combo}`, 24, 104);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(ctx, 24, 112, 120, 6, 3);
    ctx.fill();
    ctx.fillStyle = c.gold;
    roundRect(ctx, 24, 112, 120 * (game.comboTimer / CFG.comboWindow), 6, 3);
    ctx.fill();
  }

  // Dash readiness, bottom left.
  ctx.textAlign = 'left';
  ctx.fillStyle = game.ship.dashReady ? c.shipTrim : c.textDim;
  ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(game.ship.dashReady ? 'DASH READY  [SPACE / CLICK]' : 'DASH …', 24, CFG.height - 22);
  if (!game.ship.dashReady) {
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(ctx, 24, CFG.height - 16, 90, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = c.shipTrim;
    roundRect(ctx, 24, CFG.height - 16, 90 * game.ship.dashFraction, 5, 2.5);
    ctx.fill();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = c.textDim;
  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('P pause · M mute', CFG.width - 24, CFG.height - 22);
}

// ---------------------------------------------------------------------------
// Screens.
// ---------------------------------------------------------------------------
function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(6, 9, 22, ${alpha})`;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
}

export function drawTitle(ctx, game, time) {
  dim(ctx, 0.45);
  const c = CFG.colors;
  ctx.textAlign = 'center';
  const bob = Math.sin(time * 1.4) * 6;

  ctx.fillStyle = c.gold;
  ctx.font = 'bold 84px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('LUMEN ORBIT', CFG.width / 2, 210 + bob);
  ctx.fillStyle = c.text;
  ctx.font = '26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Ride the tether. Gather the light. Dodge the dark.', CFG.width / 2, 258 + bob);

  ctx.fillStyle = c.textDim;
  ctx.font = '19px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('← → steer the orbit · ↑ ↓ reel the tether in and out', CFG.width / 2, 330);
  ctx.fillText('SPACE or CLICK to dash · mouse steers while held', CFG.width / 2, 360);
  ctx.fillText('Collect shards to clear each wave · rocks cost a heart · 3 hearts and the run ends', CFG.width / 2, 390);
  ctx.fillText('Clear wave 5 to earn the Solar Crown', CFG.width / 2, 420);

  const pulse = 0.65 + 0.35 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = c.shard;
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO START', CFG.width / 2, 500);
  ctx.globalAlpha = 1;

  if (game.best > 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`BEST SCORE ${game.best}`, CFG.width / 2, 548);
  }
}

export function drawGameOver(ctx, game) {
  dim(ctx, 0.55);
  const c = CFG.colors;
  ctx.textAlign = 'center';
  ctx.fillStyle = c.rockGlow;
  ctx.font = 'bold 72px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('THE LIGHT FADES', CFG.width / 2, 220);
  ctx.fillStyle = c.text;
  ctx.font = 'bold 40px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`SCORE ${game.score}`, CFG.width / 2, 300);
  ctx.fillStyle = c.textDim;
  ctx.font = '22px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.wave} · ${game.totalCollected} shards gathered`, CFG.width / 2, 344);
  if (game.score >= game.best && game.score > 0) {
    ctx.fillStyle = c.gold;
    ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', CFG.width / 2, 388);
  } else {
    ctx.fillStyle = c.textDim;
    ctx.font = '20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`BEST ${game.best}`, CFG.width / 2, 388);
  }
  ctx.fillStyle = c.shard;
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO FLY AGAIN', CFG.width / 2, 470);
}

export function drawPaused(ctx) {
  dim(ctx, 0.5);
  const c = CFG.colors;
  ctx.textAlign = 'center';
  ctx.fillStyle = c.text;
  ctx.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('PAUSED', CFG.width / 2, CFG.height / 2 - 10);
  ctx.fillStyle = c.textDim;
  ctx.font = '20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Press P to resume', CFG.width / 2, CFG.height / 2 + 34);
}

export function drawWaveBanner(ctx, text, subtext, alpha) {
  const c = CFG.colors;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.fillStyle = c.gold;
  ctx.font = 'bold 52px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(text, CFG.width / 2, 300);
  if (subtext) {
    ctx.fillStyle = c.text;
    ctx.font = '24px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(subtext, CFG.width / 2, 344);
  }
  ctx.restore();
}
