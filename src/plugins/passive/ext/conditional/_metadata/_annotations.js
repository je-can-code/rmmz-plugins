//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Gates passives and auto-applies combat states (JABS map).
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Passive
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Passive
 * @orderAfter J-Passive-Affix
 * @orderAfter J-CriticalFactors
 * @orderAfter J-Pixelistics
 * @help
 * ============================================================================
 * OVERVIEW
 * Extends J-Passive so passive grants from a source can be gated and scaled.
 * Unconditional passives are simply grants with no rules.
 *
 * Tag families on database rows (skills, states, equip, class, actor, enemy, etc.):
 *  passiveSourceRule  — gates every passive from this source
 *  passiveStateRule   — gates one state id from this source
 *  passiveStateCount  — stack contribution for one state id from this source
 *  autoApplyState     — applies a real combat state on a timer or combat event
 *  autoExecuteSkill   — executes a map skill on a timer or combat event
 *
 * Map battlers re-check on a throttled timer; any passive refresh re-evaluates.
 * ============================================================================
 * GATE TAGS
 *  <passiveSourceRule:[KIND, PARAM?]>
 *  <passiveStateRule:[STATE_ID, KIND, PARAM?]>
 *
 * Threshold kinds use *Above (>=) and *Below (<=):
 *  hp/mp/tp — current resource percent; mhp/mmp/mtp — flat max values
 *  {registryKey}Above/Below — flat or hundred-scale per ParameterRegistry
 *  allAllies{Key}Above/Below — every allied JABS battler (incl. self) must pass
 *
 * Discrete kinds include alliesNearby, enemiesNearby, hasState, negativeStateCount,
 * slotOnCooldown, slotOffCooldown, allOnCooldown, allOffCooldown,
 * sinceLastMoved/Hit/Attacked, movedWithin/hitWithin/attackedWithin (frames).
 *
 * EXAMPLES:
 *  <passive:[12]>
 *  <passiveStateRule:[12, hpBelow, 25]>
 *  <passiveSourceRule:[allOffCooldown]>
 * ============================================================================
 * STACK COUNT TAG
 *  <passiveStateCount:[STATE_ID, KIND, PARAM]>
 *
 * Kinds: negativeStateCount, alliesNearby (excludes self), lessIsMoreHp/Mp/Tp,
 * moreIsMoreHp/Mp/Tp, per-{registryKey} (integer points per stack).
 * ============================================================================
 * AUTO-APPLY STATE TAG
 *  <autoApplyState:[STATE_ID, CONDITION, PARAM]>
 *
 * Applies a normal JABS state (shield, buff, etc.) — not a passive grant.
 * Do not also list the same state id in <passive:[...]> on the same row.
 * PARAM meaning depends on CONDITION (see below).
 *
 * CONDITIONS — PARAM is minimum FRAMES between applies (per source+state+condition):
 *  time            — periodic while on the ABS map (interval = PARAM)
 *  hpDmg / mpDmg / tpDmg — combat loss via gain* < 0 (not skill MP/TP pay)
 *  anyDmg          — when HP, MP, or TP takes combat damage
 *  whenCrit        — when THIS battler is critically hit (victim; not onCritApply)
 *  negaStateAdded  — when a <negative> (jabsNegative) state is added
 *  posiStateAdded  — when a non-negative state is added
 *  anyStateAdded   — when any combat state is added
 *  move            — PARAM = whole TILES per apply (Pixelistics updatePixelStepping; requires J-Pixelistics)
 *  stand           — PARAM = frames between applies while standing still on the map
 *
 * EXAMPLES:
 *  <autoApplyState:[50, time, 900]>
 *  <autoApplyState:[51, hpDmg, 60]>
 *  <autoApplyState:[52, anyDmg, 120]>
 *  <autoApplyState:[53, whenCrit, 120]>
 *  <autoApplyState:[54, negaStateAdded, 180]>
 *  <autoApplyState:[55, posiStateAdded, 180]>
 *  <autoApplyState:[56, anyStateAdded, 60]>
 *  <autoApplyState:[MOMENTUM_ID, move, 2]>
 *  <autoApplyState:[BUFF_ID, stand, 120]>
 * ============================================================================
 * AUTO-EXECUTE SKILL TAG
 *  <autoExecuteSkill:[SKILL_ID, CONDITION, PARAM]>
 *
 * Fires a map skill through JABS forceMapAction — no MP/TP cost, no skill cooldown.
 * Victims may parry and retaliate. Payload skill owns radius, hitbox, and formula.
 * Do not tag the payload skill with autoExecuteSkill (depth guard).
 * PARAM meaning matches autoApplyState CONDITIONS, plus:
 *  enemiesNearby — four- or five-value tuple:
 *    <autoExecuteSkill:[SKILL_ID, enemiesNearby, MIN_COUNT, FRAMES]>
 *    optional fifth TRIGGER_TILES overrides default-proximity-tiles for the gate only.
 *
 * EXAMPLES:
 *  <autoExecuteSkill:[1021, time, 60]>
 *  <autoExecuteSkill:[1022, enemiesNearby, 1, 60]>
 *  <autoExecuteSkill:[1023, move, 1]>
 *  <autoExecuteSkill:[1024, stand, 120]>
 * ============================================================================
 * REMOVE ON SKILL EXECUTION (state note only)
 *  <removeOnSkillExecution:[STYPE_ID, CHANCE]>
 *
 * On this battler executing a map skill, rolls CHANCE (1–100). STYPE_ID 0 = any type.
 * On success, peels stacks via decrementStateStacks (respects loseAllStacksAtOnce on
 * this state row). Tag lives on the state that may be removed — not on skills/equip.
 *
 * EXAMPLES:
 *  <removeOnSkillExecution:[7, 100]>
 *  <removeOnSkillExecution:[0, 25]>
 * ============================================================================
 * REMOVE ON SKILL RESOLUTION (state note only)
 *  <removeOnSkillResolution:[STYPE_ID, CHANCE]>
 *
 * When the action fired by this battler fully expires — after its last hit lands,
 * or after it travels its full duration without contacting any target — rolls CHANCE
 * (1–100). STYPE_ID 0 = any type. On success, peels stacks via decrementStateStacks
 * (respects loseAllStacksAtOnce on this state row). Tag lives on the state that may
 * be removed — not on skills/equip.
 *
 * Unlike removeOnSkillExecution, removal fires at action expiry (after damage is
 * already resolved), so state traits such as ATK bonuses are still present during
 * damage calculation.
 *
 * EXAMPLES:
 *  <removeOnSkillResolution:[7, 100]>
 *  <removeOnSkillResolution:[0, 25]>
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release. Passive gates (passiveSourceRule, passiveStateRule,
 *    passiveStateCount) with map reconcile and combat timestamps (movement, hit,
 *    attack, onHealHp/Mp/Tp). autoApplyState schedules real JABS states on time,
 *    hpDmg/mpDmg/tpDmg/anyDmg (combat gain* loss only, not skill pay), whenCrit
 *    (victim), negaStateAdded/posiStateAdded/anyStateAdded, move (whole tiles via
 *    Pixelistics updatePixelStepping), and stand (idle on map). removeOnSkillExecution on state
 *    rows (stype filter, chance, stack-aware decrementStateStacks). removeOnSkillResolution on
 *    state rows — same shape as removeOnSkillExecution but fires at action expiry so state
 *    traits are active during damage calculation.
 * ============================================================================
 *
 * @param parentConfigPassiveConditional
 * @text PASSIVE CONDITIONAL
 *
 * @param reconcile-delay-frames
 * @parent parentConfigPassiveConditional
 * @type number
 * @min 1
 * @max 600
 * @text Reconcile Delay (frames)
 * @desc Frames between passive rule re-checks per map battler.
 * @default 15
 *
 * @param default-proximity-tiles
 * @parent parentConfigPassiveConditional
 * @type number
 * @min 1
 * @max 99
 * @text Default Proximity (tiles)
 * @desc Tile radius for alliesNearby/enemiesNearby rules and stack counts.
 * @default 5
 *
 * @param auto-execute-skill-max-depth
 * @parent parentConfigPassiveConditional
 * @type number
 * @min 1
 * @max 8
 * @text Auto-Execute Max Depth
 * @desc Max nested autoExecuteSkill firings per synchronous call stack.
 * @default 1
 */
//endregion annotations
