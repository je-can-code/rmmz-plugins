//region Metadata
import J_SkillExtendPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.EXTEND = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.EXTEND.Metadata = new J_SkillExtendPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.EXTEND.Aliased = {};
J.EXTEND.Aliased.DataManager = new Map();
J.EXTEND.Aliased.Game_Action = new Map();
J.EXTEND.Aliased.Game_Actor = new Map();
J.EXTEND.Aliased.Game_Enemy = new Map();
J.EXTEND.Aliased.Game_Item = new Map();
J.EXTEND.Aliased.JABS_SkillSlotManager = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.EXTEND.RegExp = {};

/**
 * The structure of a skill extension tag.
 *
 * <pre>
 * Structure:
 *  <skillExtend:[BASE_SKILL_ID,...]>
 *
 * Example:
 *  <skillExtend:[7, 8, 9]>
 *
 * Translation:
 *  Extends skill id 7.
 *  Extends skill id 8.
 *  Extends skill id 9.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.SkillExtend = /<skillExtend:[ ]?(\[[ ]?\d+(?:,[ ]?\d+)*[ ]?])>/i;

/**
 * The structure of an on-hit self-state application tag.
 *
 * <pre>
 * Structure:
 *  <onHitSelfState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onHitSelfState:[19, 100]>
 *
 * Translation:
 *  On hit, apply state id 19 to oneself at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnHitSelfState = /<onHitSelfState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-hit self-state loss tag.
 *
 * <pre>
 * Structure:
 *  <onHitLoseState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onHitLoseState:[19, 100]>
 *
 * Translation:
 *  On hit, lose one stack of state id 19 from oneself at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnHitLoseState = /<onHitLoseState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-hit target-state stripping tag.
 *
 * <pre>
 * Structure:
 *  <onHitStripState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onHitStripState:[19, 100]>
 *
 * Translation:
 *  On hit, strip one stack of state id 19 from the target at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnHitStripState = /<onHitStripState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-hit target-state removal tag.
 *
 * <pre>
 * Structure:
 *  <onHitRemoveState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onHitRemoveState:[19, 100]>
 *
 * Translation:
 *  On hit, fully remove state id 19 from the target at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnHitRemoveState = /<onHitRemoveState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-cast self-state application tag.
 *
 * <pre>
 * Structure:
 *  <onCastSelfState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onCastSelfState:[19, 100]>
 *
 * Translation:
 *  On cast, apply state id 19 to oneself at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastSelfState = /<onCastSelfState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-cast self-state loss tag.
 *
 * <pre>
 * Structure:
 *  <onCastLoseState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onCastLoseState:[19, 100]>
 *
 * Translation:
 *  On cast, lose one stack of state id 19 from oneself at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastLoseState = /<onCastLoseState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-cast target-state stripping tag.
 *
 * <pre>
 * Structure:
 *  <onCastStripState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onCastStripState:[19, 100]>
 *
 * Translation:
 *  On cast, strip one stack of state id 19 from the target at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastStripState = /<onCastStripState:[ ]?(\[\d+,[ ]?\d+])>/i;

/**
 * The structure of an on-cast target-state removal tag.
 *
 * <pre>
 * Structure:
 *  <onCastRemoveState:[STATE_ID, CHANCE]>
 *
 * Example:
 *  <onCastRemoveState:[19, 100]>
 *
 * Translation:
 *  On cast, fully remove state id 19 from the target at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastRemoveState = /<onCastRemoveState:[ ]?(\[\d+,[ ]?\d+])>/i;
//endregion Metadata