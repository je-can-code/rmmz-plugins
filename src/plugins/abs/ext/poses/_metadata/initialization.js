//region initialization

import J_PosesPluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks

(() =>

{

  // Check to ensure we have the minimum required version of the J-Base plugin.

  const requiredBaseVersion = '3.0.0';

  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);

  if (!hasBaseRequirement)

  {

    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);

  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.

  const requiredJabsVersion = '4.6.0';

  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);

  if (!hasJabsRequirement)

  {

    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);

  }

})();

//endregion version check

/**

 * The plugin umbrella that governs all things related to this plugin.

 */

J.ABS.EXT.POSES = {};

/**

 * The plugin umbrella that governs all extensions related to the parent.

 */

J.ABS.EXT.POSES.EXT ||= {};

/**

 * The metadata associated with this plugin.

 */

J.ABS.EXT.POSES.Metadata = new J_PosesPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**

 * A collection of all aliased methods for this plugin.

 */

J.ABS.EXT.POSES.Aliased = {};

J.ABS.EXT.POSES.Aliased.JABS_Battler = new Map();

J.ABS.EXT.POSES.Aliased.JABS_Engine = new Map();

/**

 * All regular expressions used by this plugin.

 */

J.ABS.EXT.POSES.RegExp = {};

J.ABS.EXT.POSES.RegExp.PoseSuffix = /<poseSuffix:[ ]?(\[[-_]?\w+,[ ]?\d+,[ ]?\d+])>/gi;

/**

 * Helpers that are only used by this extension (kept out of J-Base on purpose).

 */

J.ABS.EXT.POSES.Helpers = {};

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

//endregion initialization