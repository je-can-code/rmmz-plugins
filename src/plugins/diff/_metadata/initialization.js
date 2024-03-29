//region metadata
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.3';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.DIFFICULTY = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.DIFFICULTY.Metadata = new J_DiffPluginMetadata('J-Difficulty', '3.0.0');

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.DIFFICULTY.PluginParameters = PluginManager.parameters(J.DIFFICULTY.Metadata.name);

/**
 * A collection of all aliased methods for this plugin.
 */
J.DIFFICULTY.Aliased = {
  DataManager: new Map(),

  Game_Actor: new Map(),
  Game_Enemy: new Map(),
  Game_Map: new Map(),
  Game_System: new Map(),
  Game_Temp: new Map(),

  Scene_Map: new Map(),
};
//endregion metadata