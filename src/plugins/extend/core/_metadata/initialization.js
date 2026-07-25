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
  const requiredBaseVersion = '3.2.0';
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
 * The structure of a type-based extension tag.
 *
 * <pre>
 * Structure:
 *  <extendType:TYPE>
 *
 * Example (on a state):
 *  <extendType:poison>
 *
 * Example (on a skill):
 *  <extendType:low-effort>
 *
 * Translation:
 *  Extends every currently-active state (or every known skill) bearing the {@code <type:TYPE>}
 *  classifier "poison"/"low-effort", without listing each target id individually.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ExtendType = /<extendType:[ ]?(.+?)>/i;

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
 * The structure of an on-cast force-execute-skill tag. Fires once at press-time, same as the rest
 * of the on-cast family — not per target hit. Repeatable: a skill may carry several of these tags,
 * each rolled and dispatched independently, so one cast can chain into multiple follow-up skills.
 *
 * <pre>
 * Structure:
 *  <onCastExecuteSkill:[SKILL_ID, CHANCE]>
 *
 * Example:
 *  <onCastExecuteSkill:[1026, 100]>
 *  <onCastExecuteSkill:[1027, 50]>
 *
 * Translation:
 *  On cast, always force-execute skill id 1026, and separately roll a 50% chance to also
 *  force-execute skill id 1027.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastExecuteSkill = /<onCastExecuteSkill:[ ]?(\[\d+,[ ]?\d+])>/gi;

/**
 * The structure of a conditional on-cast force-execute-skill tag.
 * Force-executes a payload skill only if the caster already has a required state active — the
 * <onCastSelfStateIfAfflicted> gate pattern, applied to <onCastExecuteSkill> instead of a self-state.
 *
 * <pre>
 * Structure:
 *  <onCastExecuteSkillIfAfflicted:[SKILL_ID, CHANCE, STATE_REQUIREMENT]>
 *
 * Example:
 *  <onCastExecuteSkillIfAfflicted:[267, 100, 134]>
 *
 * Translation:
 *  On cast, if the caster has state id 134 active, force-execute skill id 267 at 100% chance.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.OnCastExecuteSkillIfAfflicted = /<onCastExecuteSkillIfAfflicted:[ ]?(\[\d+,[ ]?\d+,[ ]?\d+])>/gi;

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
 *  When DURATION is omitted or {@code 0}, the state's own jabsStateDurationFrames value
 *  (and its own indefiniteState/duration tags) is used, unchanged.
 *  When DURATION is {@code -1}, the state is forced indefinite regardless of its own tags.
 *  Any other DURATION value forces that exact finite duration, also regardless of the
 *  state's own tags (including <indefiniteState>).
 *  When STACKS is omitted, the state's own jabsStateStacksApplied value is used.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ThisApplyState = /<thisApplyState:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?-?\d+(?:,[ ]?\d+)?)?])>/gi;

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
 *  When DURATION is omitted or {@code 0}, the state's own jabsStateDurationFrames value
 *  (and its own indefiniteState/duration tags) is used, unchanged.
 *  When DURATION is {@code -1}, the state is forced indefinite regardless of its own tags.
 *  Any other DURATION value forces that exact finite duration, also regardless of the
 *  state's own tags (including <indefiniteState>).
 *  When STACKS is omitted, the state's own jabsStateStacksApplied value is used.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ApplyState = /<applyState:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?-?\d+(?:,[ ]?\d+)?)?])>/gi;

/**
 * The structure of a skill-scoped toggle-state tag. Reads from the executing skill only
 * ({@code this.item()}). Fires once at press-time (same as the on-cast self-state tags), not on hit.
 *
 * <pre>
 * Structure:
 *  <toggleOnExecute:STATE_ID>
 *
 * Example (a stance skill that flips two states at once):
 *  <toggleOnExecute:12>
 *  <toggleOnExecute:13>
 *
 * Translation:
 *  On execution, for each tagged STATE_ID: if the caster already has it, remove it;
 *  if the caster does not have it, add it. Repeatable — one STATE_ID per tag/line, each
 *  toggled independently. No chance roll; this always triggers.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ToggleOnExecute = /<toggleOnExecute:[ ]?(\d+)>/gi;

/**
 * The structure of a skill-scoped cycle-group toggle tag. Reads from the executing skill only
 * ({@code this.item()}). Fires once at press-time, same as {@link J.EXTEND.RegExp.ToggleOnExecute}.
 * Unlike the scalar form, the ids in one group are coupled: exactly one is treated as "active"
 * and execution advances to the next id in the list, wrapping back to the first after the last.
 *
 * <pre>
 * Structure:
 *  <toggleGroupOnExecute:[STATE_ID, STATE_ID, ...]>
 *
 * Example (a two-state stance swap):
 *  <toggleGroupOnExecute:[12, 13]>
 *
 * Example (a three-state cycle):
 *  <toggleGroupOnExecute:[12, 13, 14]>
 *
 * Translation:
 *  On execution, find which id in the list the caster currently has. If none, add the first
 *  id. If exactly one, remove it and add the next id in the list (wrapping to the first after
 *  the last). If more than one is somehow active at once, remove all of them and add the first
 *  id, resyncing the group back to a single active state. A skill may carry multiple
 *  <toggleGroupOnExecute> tags to cycle several independent groups in one execution.
 * </pre>
 * @type {RegExp}
 */
J.EXTEND.RegExp.ToggleGroupOnExecute = /<toggleGroupOnExecute:[ ]?(\[[^\]]+])>/gi;
//endregion Metadata