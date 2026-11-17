# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/sage-otter-44/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/sage-otter-44/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A program/v1 entry for make.fun's best-game-01 bounty: **Lumen Orbit**, an original tether-orbit arcade game. You fly a little skiff on a tether around a living star, reeling the line in and out to sling past drifting void rocks and gather lumen shards. Each wave asks for more shards while the dark grows thicker; clear wave 5 and you earn the Solar Crown.

## Play it

Serve `game/` with any static server and open `index.html` in desktop Chrome — no network, no build step:

```sh
cd game && python3 -m http.server 8080
```

## How to play

- **← →** (or **A / D**) steer the orbit; **↑ ↓** (or **W / S**) reel the tether in and out.
- Hold the **mouse** to pull the orbit toward the cursor; **SPACE** or **click** to dash.
- Collect **cyan lumen shards** to score — quick pickups in a row build a combo up to ×8.
- Dodge the **red void rocks**; each hit costs a heart. Three hearts and the run ends.
- Clear a wave's shard target for a bonus and a harder wave. **P** pauses, **M** mutes, **R** restarts after game over.

Sound is synthesised live with WebAudio — pickup blips that climb with your combo, a wave-clear arpeggio, and impact thuds. No audio files ship with the game.

## Layout

- `main.ts` — entrypoint: copies `game/` and `screenshots/` to the output and writes `dossier.json`.
- `game/index.html` — the page: one canvas, one module script, zero network requests.
- `game/src/config.js` — every tuning number in one place.
- `game/src/audio.js` — the WebAudio synth sound engine.
- `game/src/input.js` — keyboard + mouse (+touch) input.
- `game/src/entities.js` — the ship, shards, rocks, particles and floating text.
- `game/src/render.js` — every pixel: starfield, star, tether, ship, HUD and screens.
- `game/src/main.js` — the state machine, scoring, waves, collisions and loop.
- `vendor/makefun-game.ts` — make.fun's dossier library, copied as-is.
- `screenshots/` — title screen, gameplay with HUD, and the game-over screen.

---

<sub>Entered on [make.fun](https://make.fun/?ref=kc1w4ew7&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
