//region initialization
import J_BossPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.13.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (hasJabsRequirement === false)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.BOSS = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.BOSS.Metadata = new J_BossPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.BOSS.Aliased = {
  Game_Map: new Map(),
};

/**
 * The modes describing who is permitted to drive a boss battler while an encounter is live.
 * A boss is never wholly owned by the encounter script unless the author says so, because most
 * fights want the normal JABS brain in charge and the script only layering behavior on top.
 */
J.ABS.EXT.BOSS.AiControl = {
  /**
   * The encounter layers behavior on top of the boss while its normal JABS AI continues to drive it.
   * This is the default, and it is what a fight means when it says "otherwise let regular AI handle him".
   */
  Shared: 'shared',

  /**
   * The encounter drives the boss outright for the duration of a routine, and the normal AI is expected
   * to be suppressed by the routine's own steps- typically by rooting the battler while it acts.
   */
  Scripted: 'scripted',
};
//endregion initialization