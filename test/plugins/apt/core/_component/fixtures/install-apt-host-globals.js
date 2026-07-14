//region plugins/apt/core/_component/fixtures/install-apt-host-globals.js
import { installJBaseHostGlobals } from '../../../../_base/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * Globals required for J-Aptitude `src/plugins/apt/core/**` files to evaluate when imported
 * directly into the real Vitest realm (as opposed to the vm-based {@link loadAptPluginVm} harness).
 *
 * Builds on {@link installJBaseHostGlobals} for the shared RMMZ placeholder constructors and
 * `$data*` arrays, then layers on the two prerequisite plugins' real boot-time initialization
 * (`J.BASE` via `_base/_metadata/initialization.js`, `J.APT` via `apt/core/_metadata/initialization.js`)
 * so that bare identifiers like `RPGManager`, `J.APT.RegExp`, and `J.APT.Aliased` resolve exactly as
 * they do in the shipped plugin.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [aptPluginParameterStrings] `PluginManager.parameters('J-Aptitude')` shape;
 * defaults to empty (matching every existing caller) so J.APT.Metadata falls back to its own defaults.
 * @returns {Promise<void>} Resolves once both plugins' initialization modules have been imported.
 */
export async function installAptHostGlobals(sandbox = globalThis, aptPluginParameterStrings = {})
{
  // J-Aptitude's boot check requires J-Base to report a version satisfying >= 3.0.0; the shared
  // fixture's default ('0.0.0-test') would fail that check, so set it before installing.
  sandbox.__PLUGIN_VERSION__ ??= '3.0.0';

  // lay down the shared RMMZ placeholder constructors, $data arrays, and engine singletons.
  installJBaseHostGlobals(sandbox);

  // must run after installJBaseHostGlobals (which unconditionally overwrites PluginManager) and
  // before apt/core/_metadata/initialization.js consumes PluginManager.parameters('J-Aptitude').
  installPluginManagerWithParams(sandbox, 'J-Aptitude', aptPluginParameterStrings);

  // Game_Troop isn't part of J-Base's placeholder set (J-Base itself doesn't patch it), but
  // apt/core/objects/Game_Troop.js does, so provide a minimal placeholder here.
  if (typeof sandbox.Game_Troop !== 'function')
  {
    function Game_Troop()
    {
    }

    sandbox.Game_Troop = Game_Troop;
  }

  // several _models/*.js files call SerializableRegistry.register(...) as an import-time side
  // effect (so JsonEx restores keep prototype methods after a save load). Stub it for anything
  // this fixture's callers transitively import.
  sandbox.SerializableRegistry ??= { register() {} };

  // J-Aptitude's boot check requires J.ABS to already exist with a satisfying version.
  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = sandbox.J.ABS || {
    Metadata: {
      version: {
        version()
        {
          return '4.12.1';
        },
      },
    },
  };

  // __PLUGIN_NAME__/__PLUGIN_VERSION__ are bare identifiers read once, at import time, by
  // _base/_metadata/initialization.js.
  sandbox.__PLUGIN_NAME__ = 'J-Base';

  // real production code- establishes J.BASE.Helpers, J.BASE.Metadata, and RPGManager's dependents.
  await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

  // real production code- exposes RPGManager.getArraysFromNotesByRegex/getSumFromAllNotesByRegex/etc.
  const { default: RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js');
  sandbox.RPGManager = RPGManager;

  // J-Aptitude's own metadata model (JAptitude_PluginMetadata) extends the bare `PluginMetadata`
  // global the shipped build provides after J-Base loads.
  const { default: PluginMetadata } = await import('../../../../../../src/plugins/_base/models/PluginMetadata.js');
  sandbox.PluginMetadata = PluginMetadata;

  // flip the bare __PLUGIN_NAME__ to J-Aptitude's own identity before its initialization.js reads it.
  sandbox.__PLUGIN_NAME__ = 'J-Aptitude';

  // real production code- establishes J.APT.Metadata, J.APT.Aliased maps, and J.APT.RegExp patterns.
  await import('../../../../../../src/plugins/apt/core/_metadata/initialization.js');
}
//endregion plugins/apt/core/_component/fixtures/install-apt-host-globals.js
