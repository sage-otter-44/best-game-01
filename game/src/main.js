// Lumen Orbit — the game itself. A state machine (title / playing / paused /
// game over) over one update loop, with the scoring, waves, collisions and
// the little debug handle the screenshots use to stage a game-over shot.

import { CFG } from './config.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { Ship, Shard, Rock, FloatText, burst } from './entities.js';
import {
  drawBackground,
  drawStar,
  drawTether,
  drawShip,
  drawShard,
  drawRock,
  drawParticles,
  drawFloatTexts,
  drawHud,
  drawTitle,
  drawGameOver,
  drawPaused,
  drawWaveBanner,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input(canvas);
const sound = new SoundEngine();

const game = {
  state: 'title', // title | playing | paused | gameover
  time: 0,
  score: 0,
  best: 0,
  wave: 1,
  hearts: CFG.startHearts,
  combo: 0,
  comboTimer: 0,
  waveCollected: 0,
  totalCollected: 0,
  shake: 0,
  banner: null, // { text, subtext, timer, duration }
  crownEarned: false,
  ship: new Ship(),
  shards: [],
  rocks: [],
  particles: [],
  texts: [],
  rockTimer: 0,
};

try {
  game.best = Number(window.localStorage.getItem(CFG.bestKey) || 0) || 0;
} catch (err) {
  game.best = 0;
}

function saveBest() {
  if (game.score > game.best) {
    game.best = game.score;
    try {
      window.localStorage.setItem(CFG.bestKey, String(game.best));
    } catch (err) {
      // Private mode: the best score just lives for this session.
    }
  }
}

function showBanner(text, subtext, duration = 2.2) {
  game.banner = { text, subtext, timer: duration, duration };
}

function resetRun() {
  game.score = 0;
  game.wave = 1;
  game.hearts = CFG.startHearts;
  game.combo = 0;
  game.comboTimer = 0;
  game.waveCollected = 0;
  game.totalCollected = 0;
  game.crownEarned = false;
  game.ship.reset();
  game.shards = [];
  game.rocks = [];
  game.particles = [];
  game.texts = [];
  game.rockTimer = 1.2;
  game.shake = 0;
  spawnShards(3);
  showBanner('WAVE 1', 'collect 8 shards to clear the wave');
  game.state = 'playing';
}

function spawnShards(count) {
  for (let i = 0; i < count; i++) game.shards.push(new Shard());
}

function spawnRock() {
  game.rocks.push(new Rock(game.wave));
}

function collectShard(shard) {
  game.combo = Math.min(CFG.comboMax, game.combo + 1);
  game.comboTimer = CFG.comboWindow;
  const gained = CFG.shardValue * game.combo;
  game.score += gained;
  game.waveCollected += 1;
  game.totalCollected += 1;
  game.texts.push(new FloatText(shard.x, shard.y - 14, `+${gained}`, CFG.colors.shard));
  burst(game.particles, shard.x, shard.y, CFG.colors.shard, 14, 180);
  sound.pickup(game.combo);
  spawnShards(1); // the field always offers something to chase
  if (game.waveCollected >= CFG.shardsPerWave(game.wave)) clearWave();
}

function clearWave() {
  const bonus = CFG.waveClearBonus(game.wave);
  game.score += bonus;
  sound.waveClear();
  if (game.wave === CFG.crownWave && !game.crownEarned) {
    game.crownEarned = true;
    game.score += CFG.crownBonus;
    showBanner('★ SOLAR CROWN ★', `wave ${CFG.crownWave} cleared! +${bonus + CFG.crownBonus} bonus`, 2.8);
  } else {
    showBanner(`WAVE ${game.wave} CLEAR`, `+${bonus} bonus — the dark grows thicker`, 2.2);
  }
  game.wave += 1;
  game.waveCollected = 0;
  burst(game.particles, CFG.centerX, CFG.centerY, CFG.colors.gold, 40, 260);
}

function hitRock(rock) {
  if (game.ship.invulnerable > 0) return;
  game.rocks.splice(game.rocks.indexOf(rock), 1);
  game.hearts -= 1;
  game.combo = 0;
  game.comboTimer = 0;
  game.ship.invulnerable = CFG.invulnerableTime;
  game.shake = 14;
  burst(game.particles, game.ship.x, game.ship.y, CFG.colors.rockGlow, 26, 300);
  burst(game.particles, rock.x, rock.y, CFG.colors.rock, 18, 220);
  sound.hit();
  if (game.hearts <= 0) {
    gameOver();
  }
}

function gameOver() {
  game.state = 'gameover';
  saveBest();
  sound.gameOver();
  burst(game.particles, game.ship.x, game.ship.y, CFG.colors.shipBody, 40, 320);
}

function updatePlaying(dt) {
  const ship = game.ship;
  const wasDashing = ship.dashCooldown > 0 && ship.dashTimer > 0;
  ship.update(dt, input);
  if (!wasDashing && ship.dashTimer > 0) sound.dash();

  // Combo timer drains; when it runs out the combo resets.
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }

  // Shards drift, expire, and get collected on contact.
  for (let i = game.shards.length - 1; i >= 0; i--) {
    const shard = game.shards[i];
    shard.update(dt);
    if (shard.expired) {
      game.shards.splice(i, 1);
      continue;
    }
    const dx = shard.x - ship.x;
    const dy = shard.y - ship.y;
    if (dx * dx + dy * dy < CFG.shardCollectRadius * CFG.shardCollectRadius) {
      game.shards.splice(i, 1);
      collectShard(shard);
    }
  }

  // Rocks drift in on a timer that quickens with the wave.
  game.rockTimer -= dt;
  if (game.rockTimer <= 0 && game.rocks.length < CFG.maxRocks(game.wave)) {
    spawnRock();
    game.rockTimer = CFG.rockSpawnEvery(game.wave);
  }
  for (let i = game.rocks.length - 1; i >= 0; i--) {
    const rock = game.rocks[i];
    rock.update(dt);
    if (rock.offscreen) {
      game.rocks.splice(i, 1);
      continue;
    }
    const dx = rock.x - ship.x;
    const dy = rock.y - ship.y;
    const rr = rock.radius + CFG.shipRadius - 4;
    if (dx * dx + dy * dy < rr * rr) hitRock(rock);
    if (game.state !== 'playing') return;
  }

  // Particles and floating text always age, whatever the state.
  for (let i = game.particles.length - 1; i >= 0; i--) {
    game.particles[i].update(dt);
    if (game.particles[i].dead) game.particles.splice(i, 1);
  }
  for (let i = game.texts.length - 1; i >= 0; i--) {
    game.texts[i].update(dt);
    if (game.texts[i].dead) game.texts.splice(i, 1);
  }
  if (game.banner) {
    game.banner.timer -= dt;
    if (game.banner.timer <= 0) game.banner = null;
  }
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 26);
}

function draw() {
  const shakeX = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
  const shakeY = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground(ctx, game.time, shakeX, shakeY);
  drawStar(ctx, game.time);
  if (game.state !== 'title') drawTether(ctx, game.ship);
  for (const shard of game.shards) drawShard(ctx, shard);
  for (const rock of game.rocks) drawRock(ctx, rock);
  if (game.state !== 'title') drawShip(ctx, game.ship, game.time);
  drawParticles(ctx, game.particles);
  drawFloatTexts(ctx, game.texts);
  ctx.restore();

  if (game.state === 'playing' || game.state === 'paused') drawHud(ctx, game);
  if (game.banner && game.state === 'playing') {
    const alpha = Math.min(1, (game.banner.timer / game.banner.duration) * 2);
    drawWaveBanner(ctx, game.banner.text, game.banner.subtext, alpha);
  }
  if (game.state === 'title') drawTitle(ctx, game, game.time);
  if (game.state === 'gameover') drawGameOver(ctx, game);
  if (game.state === 'paused') drawPaused(ctx);
}

// The title screen is alive behind its overlay: a demo skiff orbits and
// shards drift, so the cover screenshot shows the game in motion.
function updateTitle(dt) {
  game.ship.angle += dt * 0.55;
  game.ship.radius = CFG.orbitStart + Math.sin(game.time * 0.5) * 30;
  if (game.shards.length < 4) spawnShards(1);
  for (let i = game.shards.length - 1; i >= 0; i--) {
    game.shards[i].update(dt);
    if (game.shards[i].expired) game.shards.splice(i, 1);
  }
  for (let i = game.particles.length - 1; i >= 0; i--) {
    game.particles[i].update(dt);
    if (game.particles[i].dead) game.particles.splice(i, 1);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;

  if (input.pressed('KeyM')) sound.toggleMute();

  if (game.state === 'title') {
    updateTitle(dt);
    if (input.pressed('Enter', 'Space') || input.clicked()) {
      sound.unlock();
      sound.click();
      resetRun();
    }
  } else if (game.state === 'playing') {
    if (input.pressed('KeyP', 'Escape')) {
      game.state = 'paused';
    } else {
      updatePlaying(dt);
    }
  } else if (game.state === 'paused') {
    if (input.pressed('KeyP', 'Escape', 'Enter')) game.state = 'playing';
  } else if (game.state === 'gameover') {
    // The wreckage keeps drifting while the player reads the score.
    for (let i = game.particles.length - 1; i >= 0; i--) {
      game.particles[i].update(dt);
      if (game.particles[i].dead) game.particles.splice(i, 1);
    }
    if (input.pressed('KeyR', 'Enter', 'Space') || input.clicked()) {
      sound.unlock();
      sound.click();
      resetRun();
    }
  }

  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

// A small handle for automated play-testing and screenshots: it lets a test
// drive the game into a chosen state and then watch the real render. It
// changes nothing about how the game plays for a person.
window.__lumen = {
  game,
  state: () => game.state,
  score: () => game.score,
  start: () => { sound.unlock(); resetRun(); },
  setHearts: (n) => { game.hearts = n; },
  dropRockOnShip: () => {
    const rock = new Rock(game.wave);
    rock.x = game.ship.x;
    rock.y = game.ship.y;
    rock.vx = 0;
    rock.vy = 0;
    rock.radius = 20;
    game.rocks.push(rock);
  },
  collectSome: (n) => {
    for (let i = 0; i < n; i++) {
      const shard = new Shard();
      shard.angle = game.ship.angle;
      shard.radius = game.ship.radius;
      game.shards.push(shard);
    }
  },
};

spawnShards(4);
requestAnimationFrame(frame);
