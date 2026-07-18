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
 *  passiveSourceRule       — gates every passive from this source
 *  passiveStateRule        — gates one state id from this source
 *  passiveStateCount       — stack contribution for one state id from this source
 *  autoApplyState          — applies a real combat state on a timer or combat event
 *  autoApplyStateOnNearby  — same as autoApplyState, but aura-style onto nearby battlers instead of the bearer
 *  autoExecuteSkill        — executes a map skill on a timer or combat event
 *  autoModifyCooldowns     — modifies one or more of the bearer's own active skill-slot cooldowns on a timer or combat event
 *  autoInflictState        — applies a real combat state onto whoever this battler just inflicted a state upon
 *  removeOnSkillExecution  — chance to strip a stack from this state when the bearer executes a map skill
 *  removeOnSkillResolution — chance to strip a stack from this state when the bearer's fired action expires
 *  removeStateOnMove       — strips this state the instant the bearer moves (pairs with autoApplyState's "stand")
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
 * Discrete kinds include alliesNearby, enemiesNearby, alliesNearbyBelow, enemiesNearbyBelow,
 * enemiesTargetingMe, enemiesTargetingMeBelow, hasState, negativeStateCount, slotOnCooldown,
 * slotOffCooldown, allOnCooldown, allOffCooldown, sinceLastMoved/Hit/Attacked,
 * movedWithin/hitWithin/attackedWithin (frames).
 *
 * alliesNearby/enemiesNearby pass at COUNT or more in range (>=); the *Below counterparts pass
 * under COUNT (<) — use them for "nobody nearby" gates, e.g. [enemiesNearbyBelow, 1, 1] for
 * "no enemies within melee range" (1 tile).
 *
 * enemiesTargetingMe/enemiesTargetingMeBelow work the same way but are NOT proximity-scoped-
 * they count opposing battlers that currently have this battler as their live AI target,
 * regardless of tile distance. No radius param; PARAM is just the count threshold.
 *
 * EXAMPLES:
 *  <passive:[12]>
 *  <passiveStateRule:[12, hpBelow, 25]>
 *  <passiveSourceRule:[allOffCooldown]>
 *  <passiveSourceRule:[enemiesNearbyBelow, 1, 1]>
 *  <passiveSourceRule:[enemiesTargetingMe, 1]>
 *    Only grants this source's passives while at least one enemy has this battler targeted.
 * ============================================================================
 * STACK COUNT TAG
 *  <passiveStateCount:[STATE_ID, KIND, PARAM]>
 *
 * Kinds: negativeStateCount, alliesNearby (excludes self), enemiesNearby, enemiesTargetingMe
 * (not proximity-scoped- see above), lessIsMoreHp/Mp/Tp, moreIsMoreHp/Mp/Tp, per-{registryKey}
 * (integer points per stack).
 *
 * EXAMPLE:
 *  <passiveStateCount:[70, enemiesTargetingMe, 1]>
 *    State 70 gains 1 stack per enemy currently targeting this battler- pair with a state
 *  carrying a flat pdr/mdr param-rate trait so each stack chips away at incoming damage.
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
 *  onHealHp/Mp/Tp  — when this battler's own HP/MP/TP is restored (onSelfHeal)
 *  onAllyHeal      — when a battler within proximity of THIS battler is healed (any resource)
 *  onKill          — when this battler defeats an enemy (JABS_Engine#handleDefeatedEnemy)
 *  onDamageDealt   — when this battler lands damage on an opposing battler (JABS_Engine#postExecuteSkillEffects)
 *  onWeaponHit     — narrower onDamageDealt: only Mainhand/Offhand-slot hits qualify (basic attack
 *    or its combo chain); skills fired from any other slot do not trigger this condition
 *  move            — PARAM = whole TILES per apply (Pixelistics updatePixelStepping; requires J-Pixelistics)
 *  stand           — PARAM = frames between applies while standing still on the map
 *  enemiesNearby / alliesNearby / enemiesNearbyBelow / alliesNearbyBelow — 4/5-value proximity
 *    tuples, same shape and semantics as autoExecuteSkill's proximity form below.
 *
 * EXAMPLES:
 *  <autoApplyState:[50, time, 900]>
 *  <autoApplyState:[51, hpDmg, 60]>
 *  <autoApplyState:[52, anyDmg, 120]>
 *  <autoApplyState:[53, whenCrit, 120]>
 *  <autoApplyState:[54, negaStateAdded, 180]>
 *  <autoApplyState:[55, posiStateAdded, 180]>
 *  <autoApplyState:[56, anyStateAdded, 60]>
 *  <autoApplyState:[57, onKill, 0]>
 *  <autoApplyState:[58, onDamageDealt, 0]>
 *  <autoApplyState:[59, onAllyHeal, 0]>
 *  <autoApplyState:[MOMENTUM_ID, move, 2]>
 *  <autoApplyState:[BUFF_ID, stand, 120]>
 *  <autoApplyState:[ACCURACY_BUFF_ID, enemiesNearbyBelow, 1, 30, 1]>
 *    Every 30 frames, apply the accuracy buff while no enemy is within 1 tile (melee range).
 * ============================================================================
 * AUTO-APPLY STATE ON NEARBY TAG
 *  <autoApplyStateOnNearby:[STATE_ID, KIND, MIN_COUNT, COOLDOWN_FRAMES, TRIGGER_TILES?]>
 *
 * Aura-style sibling of autoApplyState: instead of applying STATE_ID to the rule bearer,
 * it redirects onto every battler currently in proximity- enemies or allies depending on
 * KIND. Good fit for "afflicts nearby enemies" or "buffs nearby allies" passive auras.
 *
 * Only four KIND values do anything here (every other autoApplyState CONDITION has no
 * proximity set to iterate and simply won't fire):
 *  enemiesNearby      — targets nearby enemy JABS battlers
 *  alliesNearby       — targets nearby allied JABS battlers, excluding the bearer itself
 *  enemiesNearbyBelow — same target set as enemiesNearby, gate inverted (see below)
 *  alliesNearbyBelow  — same target set as alliesNearby, gate inverted (see below)
 *
 * MIN_COUNT is the count threshold that gates the pulse. For enemiesNearby/alliesNearby the
 * pulse fires at MIN_COUNT or more in range; for the Below variants it fires strictly UNDER
 * MIN_COUNT. Either way the pulse then hits everyone CURRENTLY in range, not just MIN_COUNT
 * of them- so a Below rule with MIN_COUNT 1 (the "nothing nearby" case) can gate-pass while
 * resolving zero targets, applying to nobody that tick. MIN_COUNT 2+ still lands on whatever
 * stragglers remain under the threshold.
 * COOLDOWN_FRAMES is tracked on the bearer, so the pulse cadence is consistent regardless
 * of how many targets are currently in range.
 * The optional fifth TRIGGER_TILES overrides the plugin's default proximity radius for
 * this rule's gate only.
 *
 * EXAMPLES:
 *  <autoApplyStateOnNearby:[60, enemiesNearby, 1, 120]>
 *    Every 120 frames, if at least 1 enemy is within the default proximity radius, apply
 *    state 60 to every nearby enemy.
 *
 *  <autoApplyStateOnNearby:[61, alliesNearby, 2, 300, 8]>
 *    Every 300 frames, if at least 2 allies (excluding the bearer) are within 8 tiles,
 *    apply state 61 to every nearby ally.
 *
 *  <autoApplyStateOnNearby:[62, enemiesNearbyBelow, 3, 120]>
 *    Every 120 frames, if fewer than 3 enemies are within range, apply state 62 to
 *    whichever enemies (0-2 of them) are still around.
 * ============================================================================
 * AUTO-EXECUTE SKILL TAG
 *  <autoExecuteSkill:[SKILL_ID, CONDITION, PARAM]>
 *
 * Fires a map skill through JABS forceMapAction — no MP/TP cost, no skill cooldown.
 * Victims may parry and retaliate. Payload skill owns radius, hitbox, and formula.
 * Do not tag the payload skill with autoExecuteSkill (depth guard).
 * PARAM meaning matches autoApplyState CONDITIONS, plus:
 *  enemiesNearby / alliesNearby / enemiesNearbyBelow / alliesNearbyBelow — four- or
 *  five-value tuple:
 *    <autoExecuteSkill:[SKILL_ID, KIND, COUNT, FRAMES]>
 *    optional fifth TRIGGER_TILES overrides default-proximity-tiles for the gate only.
 *    enemiesNearby/alliesNearby fire at or above COUNT; the Below variants fire strictly
 *    under COUNT.
 *
 * EXAMPLES:
 *  <autoExecuteSkill:[1021, time, 60]>
 *  <autoExecuteSkill:[1022, enemiesNearby, 1, 60]>
 *  <autoExecuteSkill:[1023, move, 1]>
 *  <autoExecuteSkill:[1024, stand, 120]>
 *  <autoExecuteSkill:[1025, enemiesNearbyBelow, 1, 60, 1]>
 *    Casts skill 1025 every 60 frames while no enemy is within 1 tile.
 *  <autoExecuteSkill:[1026, onWeaponHit, 0]>
 *    Magic-knight style: every basic-attack (or combo) hit also fires skill 1026 on the target.
 * ============================================================================
 * AUTO-MODIFY COOLDOWNS TAG
 *  <autoModifyCooldowns:[AMOUNT, CONDITION, THROTTLE_FRAMES, UNIT, RANGE?, TARGET_KEY?]>
 *
 * Directly modifies one or more of the bearer's own active skill-slot cooldowns- no skill or state
 * is executed/applied, this tag mutates cooldown timers in place.
 *
 * Unlike its siblings, AMOUNT is a signed modification amount, not a database id: negative reduces
 * a cooldown, positive increases it. THROTTLE_FRAMES is the same per-rule minimum-frames-between-
 * dispatches gate every other tag in this family uses.
 *
 * UNIT (required):
 *  percent — AMOUNT is a percentage of each targeted cooldown's own full/total duration (not
 *            however much of it happens to remain), so a kill always refunds a consistent,
 *            predictable chunk regardless of timing.
 *  flat    — AMOUNT is a literal frame count, applied directly regardless of that skill's length.
 *
 * RANGE (optional, defaults to "all"):
 *  single  — exactly one named slot; requires TARGET_KEY.
 *  combat  — the four combat-skill slots only.
 *  all     — mainhand, offhand, tool, dodge (mobility skills equip here), and all four combat
 *            skills. Deliberately excludes GCD/usable-item slots.
 *
 * TARGET_KEY (required only when RANGE is "single"): an author-facing slot name — mainhand,
 * offhand, tool, dodge, or skill1-skill4 (combatskill1-4 also accepted); raw JABS_Button keys pass
 * through unchanged.
 *
 * Only slots that are both equipped and currently mid-cooldown (frames > 0) are touched- a slot
 * that's already ready has nothing to modify.
 *
 * Built on the same condition framework as the rest of this family, but only the onKill pump is
 * currently wired for this tag (see {@link AutoModifyCooldownManager}); other conditions parse
 * correctly but will not yet fire until their pump call sites are wired.
 *
 * EXAMPLES:
 *  <autoModifyCooldowns:[-10, onKill, 0, percent, all]>
 *    On every kill, no throttle: -10% of full duration off every active mainhand/offhand/tool/
 *    dodge/combat-skill cooldown.
 *  <autoModifyCooldowns:[-60, onKill, 0, flat, all]>
 *    Same trigger/range, but a flat 60-frame (1 second) refund regardless of each skill's own
 *    total duration.
 *  <autoModifyCooldowns:[-15, onKill, 0, percent, combat]>
 *    Restricted to the four combat-skill slots only.
 *  <autoModifyCooldowns:[-25, onKill, 0, percent, single, mainhand]>
 *    Restricted to the mainhand slot only.
 *  <autoModifyCooldowns:[-10, onKill, 0, percent]>
 *    RANGE omitted- defaults to "all".
 * ============================================================================
 * AUTO-INFLICT STATE TAG
 *  <autoInflictState:[STATE_ID, CONDITION, COOLDOWN_FRAMES]>
 *
 * Unlike autoApplyState (applies to the rule bearer) and its OnNearby sibling (applies to
 * proximity), this fires from an event involving an external battler- the rule bearer doing
 * something to someone else- and applies STATE_ID onto that same someone else. The bearer's own
 * state tracking credits the bearer as the inflictor of STATE_ID, matching who really did it.
 * COOLDOWN_FRAMES is the minimum frames between dispatches for this rule; 0 means every time.
 * Depth-guarded (auto-inflict-state-max-depth) in case STATE_ID is itself negative-tagged and
 * would otherwise re-trigger this same tag on application.
 *
 * CONDITIONS:
 *  negaStateInflicted — this battler inflicts a <negative> (jabsNegative) state on someone
 *  posiStateInflicted — this battler inflicts a non-negative state on someone
 *  anyStateInflicted  — this battler inflicts any state on someone
 *  onKnockback        — this battler knocks an enemy back (JABS_Engine#checkKnockback)
 *
 * EXAMPLES:
 *  <autoInflictState:[70, negaStateInflicted, 0]>
 *  <autoInflictState:[71, posiStateInflicted, 60]>
 *  <autoInflictState:[72, anyStateInflicted, 0]>
 *  <autoInflictState:[73, onKnockback, 0]>
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
 * REMOVE STATE ON MOVE (state note only)
 *  <removeStateOnMove:[STATE_ID]>
 *
 * The instant the bearer moves on the map, unconditionally peels one stack from STATE_ID
 * (or all stacks at once if that state row has loseAllStacksAtOnce set). No chance roll,
 * no stype filter- this fires every single time the bearer moves, full stop. Tag lives on
 * the state doing the peeling- typically the SAME state also carries an autoApplyState
 * "stand" rule for the very state id it removes, since this pairing is what makes a
 * "charge up while standing still, lose it the moment you move" mechanic work: standing
 * still builds the stack, moving strips it instantly, and the stand cooldown is reset to a
 * full interval the moment you move again so the buildup can't restart instantly either.
 *
 * EXAMPLES:
 *  <autoApplyState:[80, stand, 60]>
 *  <removeStateOnMove:[80]>
 *    On this same state row: standing still for 60 frames applies a stack of state 80.
 *    Taking even a single step immediately strips it and resets the stand timer.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Added autoModifyCooldowns, which directly modifies one or more of the bearer's own active
 *    skill-slot cooldowns (percent-of-total or flat frames) on a condition- currently wired for
 *    onKill only. Widened the shared dispatch contract so a subclass's dispatch() can see the full
 *    authored tuple, not just the leading id, and added an opt-out (requiresPositiveId) from the
 *    base class's positive-id validation for tags whose leading slot is a signed value instead.
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
 *
 * @param auto-inflict-state-max-depth
 * @parent parentConfigPassiveConditional
 * @type number
 * @min 1
 * @max 8
 * @text Auto-Inflict Max Depth
 * @desc Max nested autoInflictState firings per synchronous call stack.
 * @default 1
 */
//endregion annotations
