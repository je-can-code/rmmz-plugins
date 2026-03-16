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
  const requiredJabsVersion = '4.5.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

/**
 * The over-arching extensions collection for JABS.
 */
J.ABS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.ABS.EXT.CYCLE = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.CYCLE.Metadata = {
  /**
   * The name of this plugin.
   */
  Name: `J-ABS-CycloneAdapter`,

  /**
   * The version of this plugin.
   */
  Version: '1.0.0',
};

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.CYCLE.PluginParameters = PluginManager.parameters(J.ABS.EXT.CYCLE.Metadata.Name);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.CYCLE.Aliased = {
  Game_Character: new Map(),
  Game_Event: new Map(),
  Game_Follower: new Map(),
  Game_Player: new Map(),
  JABS_Action: new Map(),
  JABS_Battler: new Map(),
};
//endregion Introduction