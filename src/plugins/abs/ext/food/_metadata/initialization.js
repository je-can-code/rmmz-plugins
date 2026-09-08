//region initialization
import JFood_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.13.0';
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
   * Boolean tag: executing this skill ends the caster's active food chain.
   *
   * This is what makes a metabolize skill cost the meal. Its absence is a design choice rather
   * than an oversight. A skill that burns fuel without consuming the arc is an endurance move,
   * bounded by the chain's own duration instead of by a single use.
   *
   * <pre>
   * Structure:
   *  <endFoodChain>
   *
   * Example:
   *  <endFoodChain>
   *
   * Translation:
   *  when this skill executes, whatever food arc the caster is in ends immediately
   * </pre>
   * @type {RegExp}
   */
  EndFoodChain: /<endFoodChain>/i,

  /**
   * Boolean tag: the bearer's food chains never end from {@link #EndFoodChain}.
   *
   * The bearer still executes the skill and still receives everything it does; they simply keep
   * the arc they were in. May live on any note-bearing database object readable via
   * {@code getAllNotes()}: passive, equip, state, class or the battler's own row.
   *
   * <pre>
   * Structure:
   *  <foodChainImpervious>
   *
   * Example:
   *  <foodChainImpervious>
   *
   * Translation:
   *  this bearer metabolizes without ever spending the meal
   * </pre>
   * @type {RegExp}
   */
  FoodChainImpervious: /<foodChainImpervious>/i,
};

//endregion initialization