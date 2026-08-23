//region Metadata
import J_DropsControlPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.DROPS = {};

/**
 * The plugin umbrella that governs all extensions related to this plugin.
 */
J.DROPS.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.DROPS.Metadata = new J_DropsControlPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * All regular expressions used by this plugin.
 */
J.DROPS.RegExp = {};
J.DROPS.RegExp.ExtraDrop = /<drops:[ ]?(\[(i|item|w|weapon|a|armor),[ ]?(\d+),[ ]?(\d+)])>/i;
J.DROPS.RegExp.DropMultiplier = /<dropMultiplier:[ ]?(-?\d+)>/i;
J.DROPS.RegExp.GoldMultiplier = /<goldMultiplier:[ ]?(-?\d+)>/i;

/**
 * The rung above this row on its drop upgrade ladder.
 *
 * Authored on the lower row, naming the row it promotes into. Only the upward links are authored; the
 * downgrade direction is derived by inverting them at boot, so the two directions can never disagree.
 * The id is read against whichever table the tagged row lives in, which is what makes an armor
 * incapable of promoting into an item.
 *
 * <pre>
 * Structure:
 *  <dropUpgradeId:ID>
 *
 * Example:
 *  <dropUpgradeId:307>
 *
 * Translation:
 *  Promoting this row once yields row 307 of the same table.
 * </pre>
 * @type {RegExp}
 */
J.DROPS.RegExp.DropUpgradeId = /<dropUpgradeId:[ ]?(\d+)>/i;

/**
 * How many rungs to promote a drop along its ladder.
 *
 * Summed across every note source of the slain enemy and of its killer, so an affix on the target and
 * a harvesting tool on the killer add together rather than competing. Negative values walk the ladder
 * downward. Over-promoting is not an error- the walk simply stops at the end of the chain.
 *
 * <pre>
 * Structure:
 *  <dropUpgrade:AMOUNT>
 *
 * Example:
 *  <dropUpgrade:2>
 *
 * Translation:
 *  Drops from this kill are promoted two rungs up their ladder.
 * </pre>
 * @type {RegExp}
 */
J.DROPS.RegExp.DropUpgrade = /<dropUpgrade:[ ]?(-?\d+)>/gi;

/**
 * How many extra copies of each dropped item to grant.
 *
 * Summed like {@link J.DROPS.RegExp.DropUpgrade}, and applied once per distinct item that dropped
 * rather than once per drop entry- an enemy listing the same item four times has dropped one thing,
 * and the bonus lands on the thing. Negative values remove copies and may remove the last one, which
 * is what gives negative affixes teeth.
 *
 * <pre>
 * Structure:
 *  <dropQuantity:AMOUNT>
 *
 * Example:
 *  <dropQuantity:2>
 *
 * Translation:
 *  Two extra copies of each distinct item dropped by this kill.
 * </pre>
 * @type {RegExp}
 */
J.DROPS.RegExp.DropQuantity = /<dropQuantity:[ ]?(-?\d+)>/gi;

// natural growth tags for dor (temporary buffs).
J.DROPS.RegExp.DropRateBuffPlus = /<dorBuffPlus:\[([+\-*/ ().\w]+)]>/gi;
J.DROPS.RegExp.DropRateBuffRate = /<dorBuffRate:\[([+\-*/ ().\w]+)]>/gi;

// natural growth tags for dor (permanent growths).
J.DROPS.RegExp.DropRateGrowthPlus = /<dorGrowthPlus:\[([+\-*/ ().\w]+)]>/gi;
J.DROPS.RegExp.DropRateGrowthRate = /<dorGrowthRate:\[([+\-*/ ().\w]+)]>/gi;

/**
 * The collection of all aliased classes for extending.
 */
J.DROPS.Aliased = {
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),
  RPG_Enemy: new Map(),

  Scene_Boot: new Map(),
};
//endregion Introduction