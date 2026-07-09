//region rmmz-engine-loader
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from './repo-root.js';

// order matters: rmmz_objects.js wires its inheritance chains (e.g.
// `Game_Battler.prototype = Object.create(Game_BattlerBase.prototype)`) at top level against
// whatever core.js already declared, so core.js must run first.
const ENGINE_FILES = [
  'project/js/rmmz_core.js',
  'project/js/rmmz_objects.js',
];

// rmmz_core.js declares its Point/Rectangle/Sprite/Container/etc classes as `Object.create(PIXI.X.prototype)`
// at top level, so the real PIXI library (not RPG Maker's own code) has to exist before that file can even
// parse-execute. This is a shape-only stub of the handful of PIXI classes core.js reaches for at load time-
// unlike the Game_*/Scene_* placeholders this loader replaces, nothing here is a guess at first-party engine
// behavior, since no plugin under test calls into PIXI's actual rendering.
function installMinimalPixiStub()
{
  if (globalThis.PIXI !== undefined)
  {
    return;
  }

  const stubClassNames = [ 'Point', 'Rectangle', 'Sprite', 'Container', 'TilingSprite', 'ObjectRenderer', 'Filter' ];

  globalThis.PIXI = {};

  for (const name of stubClassNames)
  {
    globalThis.PIXI[name] = function() {};
  }

  // rmmz_core.js registers its custom tilemap renderer with PIXI's renderer plugin system at top
  // level (`PIXI.Renderer.registerPlugin("rpgtilemap", Tilemap.Renderer)`)- a real side effect the
  // file performs on load, so it needs a real (no-op) target to call into.
  globalThis.PIXI.Renderer = { registerPlugin() {} };
}

/**
 * Executes the real, vendored RPG Maker MZ engine scripts (`project/js/rmmz_core.js` and
 * `rmmz_objects.js`) against real `globalThis`, so tests get the actual `Game_Battler`,
 * `Game_Actor`, `Game_BattlerBase`, etc. classes instead of hand-rolled placeholders. This only
 * reads the reference engine copy kept in this repo for tooling like this- it never touches how
 * the game is built or shipped from /ca.
 *
 * Safe to call once per test file; a repeat call in the same realm is a no-op.
 */
export function installRealRmmzEngine()
{
  if (globalThis.__rmmzEngineInstalled === true)
  {
    return;
  }

  globalThis.__rmmzEngineInstalled = true;

  installMinimalPixiStub();

  for (const relativePath of ENGINE_FILES)
  {
    const absolutePath = path.join(repoRoot, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf-8');

    // vm.runInThisContext (no vm.createContext sandbox) runs against the real Node global object,
    // so top-level `function Foo() {}` declarations land as real ambient globals- the same shape
    // RPG Maker's own concatenated <script> tag loading produces at runtime.
    vm.runInThisContext(source, { filename: absolutePath });
  }
}
//endregion rmmz-engine-loader
