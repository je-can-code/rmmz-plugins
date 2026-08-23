//region Introduction
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Manages critical damage multiplier/reduction of battlers.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-NaturalGrowth
 * @orderAfter J-Extend
 * @help
 * ============================================================================
 * This plugin enables the ability to control the multiplier of critical damage
 * based on a pair of tags.
 *
 * Integrates with others of mine plugins:
 * - J-SDP            (can earn CDM and CDR from panels)
 * - J-NaturalGrowths (can grow CDM and CDR via levels)
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This overwrites the "applyCritical()" function in its entirety and replaces
 * the functionality with two new parameters on battlers: cdm and cdr, which
 * are described below. One significant difference to note is that critical hit
 * damage is calculated and managed separately, allowing for a battler's CDR
 * parameter to mitigate the critical portion entirely while still taking the
 * base damage. Additionally, the base critical damage multiplier is reduced by
 * default, and is parameterized for your convenience- because lets face it:
 * triple damage for a crit is an awful lot for the default.
 *
 * ============================================================================
 * THIS ACTION CRITICAL MODIFIERS:
 * Have you ever wanted to modify the current action's critical chance and/or
 * modifier? Well now you can! By applying the appropriate tag to the database
 * objects in question, you can control the critical chance and critical
 * damage modifiers for a specific skill's execution!
 *
 * NOTE:
 * This stacks additively with other crit effects.
 *
 * NOTE:
 * The effects of these tags do not apply to skills that cannot crit, so be
 * sure to make certain the critical dropdown is set to "YES" in the damage
 * formula box for the given skill.
 *
 * Formula context:
 *   a = this action's subject (the attacker)
 *   b = 0 (unused; present for formula consistency)
 *   v = $gameVariables._data
 *
 * TAG USAGE:
 * - Items
 * - Skills
 *
 * TAG FORMAT:
 *  <thisCritChance:[FORMULA]>
 *  <thisCritMultiplier:[FORMULA]>
 *  <thisCritsAlways>
 *
 * TAG EXAMPLES:
 *  <thisCritChance:[25]>
 * Increases the critical chance of this particular skill by 25%.
 *
 *  <thisCritMultiplier:[10 + a.agi]>
 * Increases the critical damage multiplier by 10% plus the battler's agility.
 *
 *  <thisCritsAlways>
 * The skill or item with this tag will ALWAYS crit.
 *
 * ============================================================================
 * CRITICAL DAMAGE MULTIPLIER:
 * Have you ever wanted to have any amount of control over critical damage?
 * Well now you can! By applying the appropriate tag to various database
 * locations, you can now control how hard (or weak) a battler's crit will be!
 *
 * DETAILS:
 * Four new tags are available for use across the various applicable database
 * objects: two for base values, and two for adding onto the base. While you
 * can use any of the four on any of the database locations listed below, it
 * was designed so that the "base" tags would live on static objects, like the
 * actor itself, while the non-base tags would live everywhere else.
 *
 * The two base values have greater impact when used in the context of
 * "J-NaturalGrowths", as they are a new value that can be leveraged within
 * the formulas you write, allowing for complex buff/growth formulas revolving
 * around incoming/outgoing critical hit damage.
 *
 * NOTE:
 * If multiple tags are present on a single battler, then all tag amounts will
 * be added together for a single multiplier amount as seen in the examples.
 *
 * USING "J-NATURALGROWTHS":
 * If using my "J-NaturalGrowths" plugin as well, these tags will function in
 * a near identical fashion to the "(cdm|cdr)(Buff)(Plus):[flat amount]" type
 * of tags. To spare the extra unnecessary loops, it is recommended that if
 * using the "J-NaturalGrowths" plugin as well, then to use the suggested format
 * provided by that plugin instead of this.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <critMultiplierBase:NUM>
 *  <critMultiplier:NUM>
 * Where NUM is the amount to add to the battler's critical damage multiplier.
 *
 * TAG EXAMPLE(S):
 *  <critMultiplier:50>
 * Increases the outgoing critical damage multiplier by 50% for this battler.
 *
 *  <critMultiplier:10>
 *  <critMultiplier:40>
 *  <critMultiplier:150>
 * Increases the outgoing critical damage multiplier by 200% for this battler.
 *
 * ============================================================================
 * CRITICAL DAMAGE REDUCTION:
 * Have you ever regreted adding a ton of critical damage multipliers across
 * the various database locations and now need to counterbalance that somehow?
 * Well now you can! By applying the appropriate tag in various database
 * locations, you can now reduce the amount of damage received when an enemy
 * battler lands a critical hit!
 *
 * NOTE:
 * This reduces the amount of CRITICAL damage, and does not actually impact the
 * base damage that the critical hit is based on. See the overview details for
 * more information.
 *
 * USING "J-NATURALGROWTHS":
 * If using my "J-NaturalGrowths" plugin as well, these tags will function in
 * a near identical fashion to the "(cdm|cdr)(Buff)(Plus):[flat amount]" type
 * of tags. To spare the extra unnecessary loops, it is recommended that if
 * using the "J-NaturalGrowths" plugin as well, then to use the suggested format
 * provided by that plugin instead of this.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <critReductionBase:NUM>
 *  <critReduction:NUM>
 * Where NUM is the amount to add to the battler's critical damage reduction.
 *
 * TAG EXAMPLE(S):
 *  <critReduction:30>
 * Reduces critical damage against this battler by 30%.
 *
 *  <critReduction:10>
 *  <critReduction:30>
 *  <critReduction:80>
 * The three amounts above total to above 100. This means that this battler
 * will NOT take any bonus damage from critical hits. All critical hits will
 * be the same as non-critical hits. However, for the sake of other possible
 * effects, the attack will still be classified as a "critical hit".
 * ============================================================================
 * NATURAL GROWTH + CRITICAL DAMAGE MULTIPLIERS/REDUCTIONS:
 * Have you ever wanted to permanently grow your CDM/CDR stats along with your
 * other growths that you have setup because you're also using my
 *
 *        J-NaturalGrowth
 *
 * plugin? Well now you can! By taking advantage of the same builder-like
 * pattern already established by the natural growths plugin, you too can start
 * growing your CDR and CDM by flat or rate multipliers as you level up!
 *
 * NOTE ABOUT NATURAL "BUFFS" FOR CDM/CDR:
 * Unlike other natural buffs, cdm/cdr are not tracked and only used during the
 * calculation of a critical hit.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <(PARAM)(BUFF|GROWTH)(PLUS|RATE):[FORMULA]>
 * Where (PARAM) is literally one of either "cdm" (crit damage multiplier) or
 * "ctr" (crit taken rate- internally this is the same stat the critReduction
 * tags above feed into, just spelled differently here for consistency with
 * how J-NaturalGrowths names its own tag families).
 * Where (BUFF|GROWTH) is literally one of either "Buff" or "Growth".
 * Where (PLUS|RATE) is literally one of either "Plus" or "Rate".
 * Where [FORMULA] is a real formula this time (unlike the thisCritChance/
 * thisCritMultiplier tags above)- it runs through the standard evaluator with:
 *   a = the battler these bonuses are being calculated for
 *   b = the battler's base value for this parameter (baseCriticalMultiplier()
 *       for cdm tags, baseCriticalReduction() for ctr tags- 0.5 by default
 *       for both)
 *   v = $gameVariables._data
 *
 * EXAMPLE:
 *  <cdmGrowthRate:[5]>
 * Gain +5% crit damage multiplier (cdm) per level.
 * This would result in gaining an ever-increasing amount of crit damage
 * multiplier per level.
 *
 *  <ctrBuffPlus:[25]>
 * Gain a flat 25 crit taken rate reduction (ctr) while this tag is applied to
 * this battler.
 * This would be lost if the object this tag lived on was removed.
 *
 *  <cdmGrowthPlus:[a.level * 3]>
 * Gain (the battler's level multiplied by 3) crit damage multiplier (cdm) per
 * level.
 * This would result in gaining an ever-increasing amount of crit damage
 * multiplier per level.
 *
 * Please refer to the other plugin's documentation for more details.
 * ============================================================================
 * ON-CRIT STATE APPLICATION:
 * Have you ever wanted a critical hit to do more than just deal extra damage?
 * Well now you can! By applying the appropriate tags to the relevant database
 * objects, you can configure states to be applied to the target or to the
 * attacker themselves whenever a critical hit lands — each with its own
 * independent chance to trigger.
 *
 * Two families of tags are available:
 *
 * "thisCrit" tags live on a specific skill or item and only fire when THAT
 * skill or item lands a critical hit. Think of these as per-skill effects.
 *
 * "onCrit" tags live on any note source attached to the attacker (states,
 * weapons, armors, class, actor, enemy) and fire whenever ANY of their
 * actions lands a critical hit. Think of these as passive crit behaviors —
 * ideal for mastery passive states that grant a character-wide on-crit effect.
 *
 * Both families are processed independently on every critical hit, so a
 * battler can carry both simultaneously without conflict.
 *
 * NOTE:
 * These effects require J-ABS to be loaded. The tags will be silently ignored
 * in non-JABS combat contexts.
 *
 * NOTE:
 * CHANCE is a whole-number percent from 0 to 100.
 * A CHANCE of 100 means the state is always applied on crit.
 * Multiple tags for the same state are each rolled independently.
 *
 * TAG USAGE:
 * "thisCrit" tags:
 * - Skills
 * - Items
 *
 * "onCrit" tags:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <thisCritApply:[STATE_ID, CHANCE]>
 *  <thisCritSelf:[STATE_ID, CHANCE]>
 *  <onCritApply:[STATE_ID, CHANCE]>
 *  <onCritSelf:[STATE_ID, CHANCE]>
 * Where STATE_ID is the id of the state to apply.
 * Where CHANCE is the percent chance (0–100) that the state applies on a crit.
 * "Apply" variants apply the state to the TARGET that was critically hit.
 * "Self" variants apply the state to the ATTACKER who landed the critical hit.
 *
 * TAG EXAMPLES:
 *  <thisCritApply:[5, 30]>
 * This skill has a 30% chance to apply state id 5 to the target when it crits.
 *
 *  <thisCritSelf:[12, 100]>
 * This skill always applies state id 12 to the attacker when it crits.
 *
 *  <onCritApply:[5, 25]>
 * Whenever this battler (or whatever carries this note) lands any critical hit,
 * there is a 25% chance to apply state id 5 to the target.
 * A passive mastery state with this tag would grant the effect for as long as
 * the state is active.
 *
 *  <onCritSelf:[20, 50]>
 * Whenever this battler lands any critical hit, there is a 50% chance to apply
 * state id 20 to themselves.
 *
 * ============================================================================
 * FORCING ON-CRIT PROCS:
 * Have you ever wanted an on-crit state application to land every single time,
 * no exceptions, without having to touch your Accumulate/Encore/luck systems
 * to get there? Well now you can! Applying this tag to the attacker's own note
 * sources forces every "thisCrit"/"onCrit" state-application roll from above
 * to succeed, as if the attacker had rolled a guaranteed positive result.
 *
 * NOTE:
 * This ONLY affects the on-crit state application roll (thisCritApply,
 * thisCritSelf, onCritApply, onCritSelf). It does not change whether the hit
 * itself crits, and it does not touch the attacker's real isVeryLucky() or
 * isVeryCursed() flags anywhere else- Accumulate Mode and Encore both still
 * read the attacker's real values and stack normally on top of this.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <forceCritProcs>
 *
 * TAG EXAMPLES:
 *  <forceCritProcs>
 * Any battler with this tag applied to one of their note sources will always
 * succeed their on-crit state application rolls- a mastery capstone state with
 * this tag turns an "onCritApply:[5, 25]" (25% chance) into a guaranteed
 * application on every critical hit, without inflating crit chance itself or
 * touching luck elsewhere.
 *
 * ============================================================================
 * CONDITIONAL CRITICAL CHANCE BY TARGET STATE:
 * Have you ever wanted a skill to crit more reliably — or guaranteed — when the
 * target is already afflicted with a specific state? Well now you can! By
 * applying the appropriate tags, you can add bonus crit chance that only applies
 * when the target has a specific state active.
 *
 * Two families of tags are available, mirroring the "thisCrit"/"onCrit" split:
 *
 * "thisCritChanceIfState" lives on a specific skill or item and only contributes
 * its bonus when THAT skill is the one being executed.
 *
 * "critChanceIfState" lives on any note source attached to the attacker (states,
 * weapons, armors, class, actor, enemy) and contributes its bonus whenever ANY
 * of their actions is executed against a matching target.
 *
 * NOTE:
 * BONUS_CHANCE is a whole-number percent from 0 to 100 (or higher for guaranteed).
 * A BONUS_CHANCE of 100 effectively guarantees a crit when the state is present,
 * though the target's crit evasion (cev) still applies.
 *
 * NOTE:
 * Multiple tags stack additively. If a skill carries two tags for different states,
 * and the target has both states, both bonuses are added to the crit chance.
 *
 * TAG USAGE:
 * "thisCritChanceIfState" tags:
 * - Skills
 * - Items
 *
 * "critChanceIfState" tags:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <thisCritChanceIfState:[STATE_ID, BONUS_CHANCE]>
 *  <critChanceIfState:[STATE_ID, BONUS_CHANCE]>
 * Where STATE_ID is the id of the state the target must have.
 * Where BONUS_CHANCE is the percent crit chance bonus (0–100+) to add.
 *
 * TAG EXAMPLES:
 *  <thisCritChanceIfState:[14, 100]>
 * This skill has guaranteed crit chance against targets afflicted with state 14.
 *
 *  <thisCritChanceIfState:[14, 50]>
 *  <thisCritChanceIfState:[7, 50]>
 * This skill gains +50% crit chance if the target has state 14, another +50%
 * if the target has state 7. If both are present, the bonus totals +100%.
 *
 *  <critChanceIfState:[14, 30]>
 * While this note source is active on the attacker, all of their actions gain
 * +30% crit chance against targets afflicted with state 14. Useful on passive
 * mastery states to reward building into a specific debuff.
 *
 * ============================================================================
 * CONDITIONAL CRITICAL CHANCE BY TARGET STATE TYPE:
 * The same as the state-id variants above, but matching by type classifier
 * (the <type:TYPE> tag on states) rather than a specific state id. This lets
 * you say "any bleed" instead of "specifically state 15."
 *
 * NOTE:
 * The type comparison is case-insensitive.
 *
 * TAG USAGE:
 * "thisCritChanceIfStateType" tags:
 * - Skills
 * - Items
 *
 * "critChanceIfStateType" tags:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <thisCritChanceIfStateType:[TYPE, BONUS_CHANCE]>
 *  <critChanceIfStateType:[TYPE, BONUS_CHANCE]>
 * Where TYPE is the state type classifier string (case-insensitive).
 * Where BONUS_CHANCE is the percent crit chance bonus (0–100+) to add.
 *
 * TAG EXAMPLES:
 *  <thisCritChanceIfStateType:[bleed, 100]>
 * This skill has guaranteed crit chance against targets with any state typed "bleed".
 *
 *  <critChanceIfStateType:[bleed, 50]>
 * While this note source is active, all actions gain +50% crit chance against
 * targets with any state typed "bleed".
 *
 * ============================================================================
 * GUARANTEED CRITICAL HIT BY TARGET STATE:
 * Have you ever wanted a skill to always crit against a target that has a
 * specific state — without needing to route through the chance system? Well
 * now you can! By applying the appropriate tags, you can guarantee a critical
 * hit when the target has any one of the listed states active.
 *
 * Two families of tags are available, mirroring the "thisCrit"/"crit" split:
 *
 * "thisCritsAlwaysIfState" lives on a specific skill or item and only triggers
 * for THAT skill's execution.
 *
 * "critAlwaysIfState" lives on any note source attached to the attacker and
 * triggers for ALL of their actions.
 *
 * NOTE:
 * Each tag accepts one or more state IDs. The crit is guaranteed if the target
 * has ANY of the listed states active — you do not need all of them.
 *
 * NOTE:
 * Multiple tags stack via OR — if any tag's state list contains a state the
 * target has, the crit is guaranteed.
 *
 * NOTE:
 * A guaranteed crit from these tags bypasses the target's crit evasion (cev),
 * exactly like {@link thisCritsAlways}.
 *
 * TAG USAGE:
 * "thisCritsAlwaysIfState" tags:
 * - Skills
 * - Items
 *
 * "critAlwaysIfState" tags:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <thisCritsAlwaysIfState:[STATE_ID, ...]>
 *  <critAlwaysIfState:[STATE_ID, ...]>
 * Where STATE_ID is one or more state ids (comma-separated) to check on the target.
 *
 * TAG EXAMPLES:
 *  <thisCritsAlwaysIfState:[14]>
 * This skill always crits against targets afflicted with state 14.
 *
 *  <thisCritsAlwaysIfState:[14, 7]>
 * This skill always crits against targets afflicted with state 14 OR state 7.
 *
 *  <critAlwaysIfState:[14]>
 * While this note source is active on the attacker, all of their actions always
 * crit against targets afflicted with state 14.
 *
 * ============================================================================
 * GUARANTEED CRITICAL HIT BY TARGET STATE TYPE:
 * The same as the state-id guaranteed-crit variants above, but matching by
 * type classifier rather than a specific state id.
 *
 * NOTE:
 * The type comparison is case-insensitive.
 *
 * TAG USAGE:
 * "thisCritsAlwaysIfStateType" tags:
 * - Skills
 * - Items
 *
 * "critAlwaysIfStateType" tags:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <thisCritsAlwaysIfStateType:TYPE>
 *  <critAlwaysIfStateType:TYPE>
 * Where TYPE is the state type classifier string (case-insensitive).
 *
 * TAG EXAMPLES:
 *  <thisCritsAlwaysIfStateType:bleed>
 * This skill always crits against targets with any state typed "bleed".
 *
 *  <critAlwaysIfStateType:bleed>
 * While this note source is active, all actions always crit against targets
 * with any state typed "bleed".
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.3.0
 *    Added <forceCritProcs> to force every on-crit state application roll
 *    to succeed, without inflating crit chance or touching luck elsewhere.
 *    Added conditional crit chance bonuses vs a target's active state, by
 *    id (<thisCritChanceIfState>/<critChanceIfState>) or by type
 *    classifier (<thisCritChanceIfStateType>/<critChanceIfStateType>).
 *    Added guaranteed crits vs a target's active state, by id
 *    (<thisCritsAlwaysIfState>/<critAlwaysIfState>) or by type classifier
 *    (<thisCritsAlwaysIfStateType>/<critAlwaysIfStateType>); bypasses cev
 *    the same way <thisCritsAlways> does.
 * - 1.2.0
 *    Added plugin parameters for the base CDM/CTR defaults (previously a
 *    hard-coded, unreachable 50% baked into Game_BattlerBase).
 * - 1.1.0
 *    Added on-crit state application tags:
 *    <thisCritApply>, <thisCritSelf> (skill-scoped) and
 *    <onCritApply>, <onCritSelf> (attacker-global, any note source).
 * - 1.0.2
 *    Added dependency note about NaturalGrowth.
 *    Added ordering annotation for coming after J-NaturalGrowth.
 * - 1.0.1
 *    Fixed issue where CDM and CDR were not being calculated for SDP bonuses.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param critMultiplierBaseDefault
 * @type number
 * @decimals 2
 * @min 0
 * @text Base Critical Damage Multiplier
 * @desc The default bonus critical damage (%) for battlers with no <critMultiplierBase> tags. 50 = +50% (x1.5 total).
 * @default 50.00
 *
 * @param critReductionBaseDefault
 * @type number
 * @decimals 2
 * @min 0
 * @text Base Critical Damage Reduction
 * @desc The default critical damage reduction (%) for battlers with no <critReductionBase> tags. 50 = -50% of the bonus.
 * @default 50.00
 */