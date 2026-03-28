//region Initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

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
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

//region plugin metadata
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.DIAG = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.DIAG.Metadata = {};
J.ABS.EXT.DIAG.Metadata.Name = `J-ABS-Diagonals`;
J.ABS.EXT.DIAG.Metadata.Version = '1.1.1';

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.DIAG.PluginParameters = PluginManager.parameters(J.ABS.EXT.DIAG.Metadata.Name);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.DIAG.Aliased = {};
J.ABS.EXT.DIAG.Aliased.Game_Event = new Map();
J.ABS.EXT.DIAG.Aliased.Game_Player = new Map();
J.ABS.EXT.DIAG.Aliased.JABS_Engine = new Map();
//endregion plugin metadata
//endregion Initialization