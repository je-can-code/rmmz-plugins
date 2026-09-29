//region metadata
import J_DiffPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '4.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The umbrella for extensions of J-Passive, which this plugin is one of. Declared rather than
 * assumed, because no other extension of J-Passive is required to have loaded first.
 */
J.PASSIVE.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PASSIVE.EXT.DIFFICULTY = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.PASSIVE.EXT.DIFFICULTY.Metadata = new J_DiffPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.PASSIVE.EXT.DIFFICULTY.PluginParameters = PluginManager.parameters(J.PASSIVE.EXT.DIFFICULTY.Metadata.name);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.DIFFICULTY.Aliased = {
  DataManager: new Map(),

  Game_Actor: new Map(),
  Game_Enemy: new Map(),
  Game_Event: new Map(),
  Game_System: new Map(),
  Game_Temp: new Map(),

  JPassiveAffix_PluginMetadata: new Map(),

  Scene_Boot: new Map(),
};
//endregion metadata