// Lumen Orbit — entities. The ship, the shards it collects, the rocks it
// dodges, and the little bursts of light that make hits feel real.
// No drawing here; render.js owns every pixel.

import { CFG } from './config.js';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickAngle() {
  return Math.random() * Math.PI * 2;
}

// ---------------------------------------------------------------------------
// The skiff. It lives on a tether: an angle around the star and a radius.
// Angular velocity has inertia; the radius is reeled in and out directly.
// ---------------------------------------------------------------------------
export class Ship {
  constructor() {
    this.reset();
  }

  reset() {
    this.angle = CFG.angleStart;
    this.radius = CFG.orbitStart;
    this.angularVel = 0;
    this.radialVel = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invulnerable = 0;
    this.alive = true;
  }

  get x() {
    return CFG.centerX + Math.cos(this.angle) * this.radius;
  }

  get y() {
    return CFG.centerY + Math.sin(this.angle) * this.radius;
  }

  // Heading the nose points: tangent to the orbit, in the direction of spin.
  get heading() {
    const dir = this.angularVel >= 0 ? 1 : -1;
    return this.angle + (dir * Math.PI) / 2;
  }

  update(dt, input) {
    // Angular thrust: left/right (or A/D) spin the orbit up and down.
    if (input.down('ArrowLeft', 'KeyA')) this.angularVel -= CFG.angularAccel * dt;
    if (input.down('ArrowRight', 'KeyD')) this.angularVel += CFG.angularAccel * dt;
    // The mouse steers too: holding the button pulls the orbit toward the
    // side of the star the cursor sits on.
    if (input.mouseDown) {
      const mouseAngle = Math.atan2(input.mouseY - CFG.centerY, input.mouseX - CFG.centerX);
      let diff = mouseAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angularVel += Math.max(-1, Math.min(1, diff * 2.2)) * CFG.angularAccel * 0.9 * dt;
    }
    // Radial thrust: up/down (or W/S) reel the tether in and out.
    let radial = 0;
    if (input.down('ArrowUp', 'KeyW')) radial -= CFG.radialSpeed;
    if (input.down('ArrowDown', 'KeyS')) radial += CFG.radialSpeed;
    this.radialVel += (radial - this.radialVel) * Math.min(1, CFG.radialDamping * dt);

    // Dash: Space or a click bursts the angular speed for a moment.
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if ((input.pressed('Space') || input.clicked()) && this.dashCooldown <= 0) {
      const dir = this.angularVel >= 0 ? 1 : -1;
      this.angularVel += dir * CFG.dashBoost;
      this.dashTimer = CFG.dashTime;
      this.dashCooldown = CFG.dashCooldown;
    }

    // Integrate, with damping so the orbit settles instead of spinning away.
    this.angularVel *= Math.max(0, 1 - CFG.angularDamping * dt);
    this.angularVel = Math.max(-CFG.angularMax, Math.min(CFG.angularMax, this.angularVel));
    this.angle += this.angularVel * dt;
    this.radius += this.radialVel * dt;
    this.radius = Math.max(CFG.orbitMin, Math.min(CFG.orbitMax, this.radius));
    if (this.invulnerable > 0) this.invulnerable -= dt;
  }

  get dashReady() {
    return this.dashCooldown <= 0;
  }

  get dashFraction() {
    return 1 - this.dashCooldown / CFG.dashCooldown;
  }
}

// ---------------------------------------------------------------------------
// A lumen shard: drifts slowly toward the star and winks out if ignored.
// ---------------------------------------------------------------------------
export class Shard {
  constructor() {
    this.angle = pickAngle();
    this.radius = rand(130, 320);
    this.age = 0;
    this.pulse = Math.random() * Math.PI * 2;
  }

  get x() {
    return CFG.centerX + Math.cos(this.angle) * this.radius;
  }

  get y() {
    return CFG.centerY + Math.sin(this.angle) * this.radius;
  }

  update(dt) {
    this.age += dt;
    this.pulse += dt * 3;
    this.radius = Math.max(90, this.radius - CFG.shardDrift * dt);
    this.angle += dt * 0.05;
  }

  get expired() {
    return this.age > CFG.shardLifetime;
  }

  // Blinks faster as its lifetime runs out.
  get visible() {
    if (this.age < CFG.shardLifetime - 3) return true;
    return Math.floor(this.age * 8) % 2 === 0;
  }
}

// ---------------------------------------------------------------------------
// A void rock: a jagged lump that drifts straight across the field,
// spinning slowly. One hit costs a heart, then it shatters.
// ---------------------------------------------------------------------------
export class Rock {
  constructor(wave) {
    // Spawn just outside the field on a random edge, aimed across it.
    const edge = Math.floor(Math.random() * 4);
    const speed = CFG.rockBaseSpeed + CFG.rockSpeedPerWave * wave + rand(-8, 14);
    if (edge === 0) { this.x = -40; this.y = rand(0, CFG.height); }
    if (edge === 1) { this.x = CFG.width + 40; this.y = rand(0, CFG.height); }
    if (edge === 2) { this.x = rand(0, CFG.width); this.y = -40; }
    if (edge === 3) { this.x = rand(0, CFG.width); this.y = CFG.height + 40; }
    const tx = CFG.centerX + rand(-260, 260);
    const ty = CFG.centerY + rand(-200, 200);
    const len = Math.hypot(tx - this.x, ty - this.y) || 1;
    this.vx = ((tx - this.x) / len) * speed;
    this.vy = ((ty - this.y) / len) * speed;
    this.radius = rand(CFG.rockMinRadius, CFG.rockMaxRadius);
    this.rotation = rand(0, Math.PI * 2);
    this.spin = rand(-0.9, 0.9);
    // A fixed jagged outline, so each rock keeps its own shape.
    this.points = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      this.points.push(rand(0.72, 1.08));
    }
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.spin * dt;
  }

  get offscreen() {
    const m = 80;
    return this.x < -m || this.x > CFG.width + m || this.y < -m || this.y > CFG.height + m;
  }
}

// ---------------------------------------------------------------------------
// Particles and floating score text — pure feedback, no gameplay.
// ---------------------------------------------------------------------------
export class Particle {
  constructor(x, y, color, speed, life, size) {
    const a = Math.random() * Math.PI * 2;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(a) * speed * rand(0.3, 1);
    this.vy = Math.sin(a) * speed * rand(0.3, 1);
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life -= dt;
  }

  get dead() {
    return this.life <= 0;
  }
}

export class FloatText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.1;
  }

  update(dt) {
    this.y -= 42 * dt;
    this.life -= dt;
  }

  get dead() {
    return this.life <= 0;
  }
}

export function burst(particles, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color, speed, rand(0.4, 0.9), rand(2, 5)));
  }
}
