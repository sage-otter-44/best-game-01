// Lumen Orbit — make.fun best-game-01 entrypoint (Node 22, standard library
// only). The game is plain static files under game/ plus 3 screenshots; this
// program hands them in. It copies game/ and screenshots/ from beside this
// file into the output directory and writes /output/dossier.json with the
// vendored make.fun dossier library, so the judge can read the game.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program runs twice and must write the same bytes both times, so it
// writes nothing but the copies and the dossier, in a fixed order.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, as the kit's gate states them: at most 4 screenshots
// and 256 KiB each, at most 993 files and 48 MiB under game/, paths under
// 1000 bytes, and the dossier text capped at 160 KiB. buildDossier enforces
// the text cap itself; the file caps are checked here so a bad tree fails
// loudly instead of handing in something the scorer would refuse.
function checkTree(dir, label, maxFiles, maxBytes) {
  let files = 0;
  let bytes = 0;
  const walk = (path, rel) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(full, relPath);
      } else if (entry.isFile()) {
        files += 1;
        bytes += statSync(full).size;
        if (Buffer.byteLength(relPath) > 1000) throw new Error(`${label}: path too long: ${relPath}`);
      } else {
        throw new Error(`${label}: not a plain file: ${relPath}`);
      }
    }
  };
  walk(dir, '');
  if (files > maxFiles) throw new Error(`${label}: ${files} files, over the ${maxFiles} cap`);
  if (bytes > maxBytes) throw new Error(`${label}: ${bytes} bytes, over the ${maxBytes} cap`);
}

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(gameDir)) throw new Error('game/ is missing');
if (!existsSync(join(gameDir, 'index.html'))) throw new Error('game/index.html is missing');
checkTree(gameDir, 'game', 993, 48 * 1024 * 1024);

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/: need 3 or 4 images, found ${shots.length}`);
  }
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
