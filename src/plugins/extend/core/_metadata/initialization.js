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
 * A namespace for all J.EXTEND extension plugins.
 */
J.EXTEND.EXT = {};

/**
 * All regular expressions used by this plugin.
 */
J.EXTEND.RegExp = {};

/**
 * The structure of a skill or state extension tag.
 *
 * <pre>
 * Structure:
 *  <extend:[ID,...]>
 *
 * Example (on a skill):
 *  <extend:[7, 8, 9]>
 *
 * Translation:
 *  Extends skill/state id 7.
 *  Extends skill/state id 8.
 *  Extends skill/state id 9.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.Extend = /<extend:[ ]?(\[[ ]?\d+(?:,[ ]?\d+)*[ ]?])>/i;

/**
 * The structure of a state-type extension tag.
 *
 * <pre>
 * Structure:
 *  <extendStateType:TYPE>
 *
 * Example:
 *  <extendStateType:poison>
 *
 * Translation:
 *  Extends all states bearing the type classifier "poison".
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.StateExtendType = /<extendStateType:[ ]?(.+?)>/i;

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
 * The structure of a conditional on-cast self-state tag.
 * Applies a state to oneself only if the caster already has a required state active.
 *
 * <pre>
 * Structure:
 *  <onCastSelfStateIfAfflicted:[STATE_TO_APPLY, CHANCE, STATE_REQUIREMENT]>
 *
 * Example:
 *  <onCastSelfStateIfAfflicted:[42, 100, 19]>
 *
 * Translation:
 *  On cast, if the caster has state id 19 active, apply state id 42 to oneself at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastSelfStateIfAfflicted = /<onCastSelfStateIfAfflicted:[ ]?(\[\d+,[ ]?\d+,[ ]?\d+])>/gi;

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

/**
 * The structure of a skill-scoped on-hit apply-state tag with optional duration and stack overrides.
 * Reads from the executing skill only ({@code this.item()}).
 *
 * <pre>
 * Structure:
 *  <thisApplyState:[STATE_ID, CHANCE]>
 *  <thisApplyState:[STATE_ID, CHANCE, DURATION]>
 *  <thisApplyState:[STATE_ID, CHANCE, DURATION, STACKS]>
 *
 * Example (duration override only):
 *  <thisApplyState:[8, 25, 240]>
 *
 * Translation:
 *  On hit, 25% chance to apply state id 8 for 240 frames (4 seconds at 60fps).
 *  When DURATION is omitted, the state's own jabsStateDurationFrames value is used.
 *  When STACKS is omitted, the state's own jabsStateStacksApplied value is used.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ThisApplyState = /<thisApplyState:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+){0,2}])>/gi;

/**
 * The structure of a caster-wide on-hit apply-state tag with optional duration and stack overrides.
 * Reads from all of the caster's notes ({@code getAllNotes()}), so it can live on states, equips,
 * actor data, or skills — wherever the caster's notes are sourced from.
 *
 * <pre>
 * Structure:
 *  <applyState:[STATE_ID, CHANCE]>
 *  <applyState:[STATE_ID, CHANCE, DURATION]>
 *  <applyState:[STATE_ID, CHANCE, DURATION, STACKS]>
 *
 * Example (passive state that applies poison for 10 seconds on hit):
 *  <applyState:[12, 100, 600]>
 *
 * Translation:
 *  On hit, always apply state id 12 for 600 frames (10 seconds at 60fps).
 *  When DURATION is omitted, the state's own jabsStateDurationFrames value is used.
 *  When STACKS is omitted, the state's own jabsStateStacksApplied value is used.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ApplyState = /<applyState:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+){0,2}])>/gi;
//endregion Metadata