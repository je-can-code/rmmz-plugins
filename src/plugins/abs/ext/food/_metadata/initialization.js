//region initialization
import JFood_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.12.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.ABS.EXT ||= {};

/**
 * The plugin umbrella for all things belonging to J-ABS-FOOD.
 */
J.ABS.EXT.FOOD ||= {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.FOOD.Metadata = new JFood_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.FOOD.Aliased = {
  JABS_Battler: new Map(),
  JABS_Engine: new Map(),
  JABS_SkillSlotManager: new Map(),
  Game_Actor: new Map(),
  Input: new Map(),
  Scene_Boot: new Map(),
  Window_JabsRemapActions: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.FOOD.RegExp = {
  /**
   * Marks an item as a food item and declares its food group type.
   * Value is the lowercase group key used to look up the chain plan in the registry.
   * Example: <food:protein>
   */
  Food: /<food:[ ]?([a-zA-Z]+)>/i,

  /**
   * Identifies which food group chain a state belongs to.
   * Value is the group type string, e.g. protein, vegetable, fruit.
   */
  FoodChain: /<foodChain:[ ]?([a-zA-Z]+)>/i,

  /**
   * The hex color for this state's segment in the food chain bar.
   * Value is a six-digit hex string, e.g. #44cc44.
   */
  FoodGroupColor: /<foodGroupColor:[ ]?(#[0-9A-Fa-f]{6})>/i,

  /**
   * Boolean tag: bearer is immune to triggering the Overstuffed chain on re-feed.
   * May live on any note-bearing database object readable via getAllNotes().
   */
  OverstuffedImpervious: /<overstuffedImpervious>/i,
};

/**
 * Canonical chain type key constants used throughout this plugin.
 * Using these constants avoids magic strings in the code.
 */
J.ABS.EXT.FOOD.ChainType = {
  /**
   * The chain type applied when a player eats mid-arc without overstuffed immunity.
   * @type {'overstuffed'}
   */
  Overstuffed: 'overstuffed',
};

//endregion initialization