//region PoseAssetPaths
/**
 * Whether a project-relative file exists under the game folder (desktop / NW.js).
 *
 * RMMZ's {@link StorageManager.localFileExists} only checks save slots (`save/name.rmmzsave`),
 * not arbitrary assets like `img/characters/...`. Engine {@link StorageManager} fs helpers
 * are save-oriented too. Poses is the sole consumer, so the check lives here — not in J-Base —
 * so the J-Base Vite ship does not bundle Node `fs` / Rolldown's `__commonJSMin` runtime.
 *
 * Incompatible with web-deployed builds (no local filesystem layout).
 *
 * @param {string} projectRelativePath Path from the game project root, e.g. `img/characters/Actor1.png`.
 * @returns {boolean} True when the file is present on disk.
 */
J.ABS.EXT.POSES.Helpers.gameAssetExists = function(projectRelativePath)
{
  const path = require('path');
  const fs = require('fs');

  // resolve against the NW.js project directory (same anchor StorageManager uses for saves).
  const gameRoot = path.dirname(process.mainModule.filename);
  const absolutePath = path.join(gameRoot, projectRelativePath);

  return fs.existsSync(absolutePath);
};
//endregion PoseAssetPaths