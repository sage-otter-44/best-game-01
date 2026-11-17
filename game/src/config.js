// Lumen Orbit — tuning constants. One place for every number the game
// balances on, so the feel can be tuned without touching the logic.

export const CFG = {
  // Logical playfield. The canvas is always this size; CSS scales it.
  width: 1280,
  height: 720,
  centerX: 640,
  centerY: 360,

  // The Ember Sun at the middle of the field.
  starRadius: 54,

  // The skiff's tether orbit.
  orbitMin: 112,
  orbitMax: 330,
  orbitStart: 215,
  angleStart: -Math.PI / 2,
  angularAccel: 2.6, // rad/s^2 from keys
  angularDamping: 0.55, // per second, keeps the orbit from spinning away
  angularMax: 3.4, // rad/s
  radialSpeed: 150, // px/s reeling in/out
  radialDamping: 4.0,
  shipRadius: 15,

  // Dash: a burst of angular speed, on Space or mouse click.
  dashBoost: 2.6,
  dashCooldown: 1.4, // seconds
  dashTime: 0.22, // seconds the boost lasts

  // Shards (the things you collect).
  shardRadius: 11,
  shardCollectRadius: 30,
  shardValue: 10,
  shardLifetime: 14, // seconds before a shard winks out
  shardDrift: 6, // px/s inward drift
  comboWindow: 3.5, // seconds between pickups to keep the combo alive
  comboMax: 8,

  // Rocks (the things that hurt).
  rockMinRadius: 13,
  rockMaxRadius: 30,
  rockBaseSpeed: 42,
  rockSpeedPerWave: 7,

  // Lives and waves.
  startHearts: 3,
  invulnerableTime: 1.6, // seconds of blinking after a hit
  shardsPerWave: (wave) => 6 + 2 * wave,
  waveClearBonus: (wave) => 100 * wave,
  crownWave: 5, // clearing this wave earns the Solar Crown
  crownBonus: 500,
  maxRocks: (wave) => Math.min(4 + wave, 12),
  rockSpawnEvery: (wave) => Math.max(2.6 - wave * 0.18, 1.1),

  // Scoring helpers.
  bestKey: 'lumen-orbit-best',

  // Palette — one coherent deep-space set, used by every draw call.
  colors: {
    spaceTop: '#0a0e24',
    spaceBottom: '#131a3d',
    starCore: '#ffe9a3',
    starMid: '#ffc94d',
    starGlow: '#ff9a3d',
    tether: 'rgba(255, 201, 77, 0.45)',
    shipBody: '#e8f4ff',
    shipTrim: '#4de3ff',
    shipFlame: '#ffb347',
    shard: '#4de3ff',
    shardCore: '#d8fbff',
    rock: '#8a4a5e',
    rockDark: '#5d2f3e',
    rockGlow: '#ff5a6e',
    heart: '#ff5a6e',
    heartEmpty: 'rgba(255, 255, 255, 0.18)',
    text: '#f2f5ff',
    textDim: '#9aa7d0',
    gold: '#ffc94d',
  },
};
