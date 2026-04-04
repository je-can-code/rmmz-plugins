//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.2 SHIELD] A JABS extension that provides state-based HP shields.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Elementalistics
 * @orderAfter J-HUD-Party
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin provides the ability to create state-based HP shields that can
 * be used to protect actors from damage.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; this plugin is an extension to JABS.
 * - J-Elementalistics; considers all elements for shield typing/bypassing.
 * - J-HUD-Party; the shield gauge will be rendered above the hp gauge.
 * - J-Popups (+ J-Popups-ABS); shield damage popups will be generated.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Provides the standard in HP shield mechanics for JABS. States own the shield
 * and can be used to protect actors from damage in varying ways. The shields
 * always will have a maximum amount that it can absorb (cap).
 *
 * NOTE ABOUT SHIELD/STATE EXPIRATION:
 * When a shield breaks (as in, reduced to zero), the state will be removed.
 * This means one should probably make shield states unique from other effects
 * unless it is desired that the effects of the state are lost when the shield
 * breaks. Inversely, when a state owning a shield expires, the shield is
 * removed with the state.
 *
 * NOTE ABOUT STACKING:
 * Stacking works about like one might envision: a shield with stacks will be
 * multiple instances of the same shield. When damage is dealt to a battler
 * with a shield state applied having a stack greater than 1, the damage will
 * iterate through each stack until damage is fully absorbed, or until the
 * state's stacks are depleted. The exception to the "stack iteration" is when
 * a state also has the "shieldProtect" tag, in which case only one stack can
 * ever be removed per application of damage (because any overflow will be
 * negated by the protect functionality instead of carried to the next stack).
 * This means you could potentially apply a shield state with something like 10
 * stacks of 1 shield point, and it will effectively mitigate 10 hits-
 * assuming each hit deals at least 1 damage.
 *
 * NOTE ABOUT SLIP DAMAGE:
 * Currently, slip damage (aka damage over time) is not mitigated by shields.
 * It will apply directly to the battler, leaving shields intact.
 * This may change in a future update.
 *
 * ============================================================================
 * SHIELDING:
 * Have you ever wanted to apply some amount of shield points to a state to
 * protect against damage? Well now you can! By applying the appropriate tag
 * on your states, you too can apply shields to your heart's content.
 *
 * NOTE ABOUT FORMULA-BASED TAGS:
 * All formula-based tags are recalculated upon application of the state, and
 * again anytime the state refreshes. When a state is recalculated, the current
 * shield gets replaced with an updated shield, carrying over the previous
 * current amount along with adding it to the new base amount. The cap is
 * simply replaced with the updated value.
 *
 * TAG USAGE:
 * - States only.
 *
 * TAG FORMAT:
 *  <shield:[FORMULA]>
 *    Where FORMULA represents a damage-like formula calculating the amount to
 *    absorb. The variables 'a' and 'b' can be used in the formulas like you
 *    would in a damage formula, where 'a' represents the target afflicted
 *    with the shield state, and 'b' represents the RPG_State object.
 *
 * TAG EXAMPLES:
 *  <shield:[100]>
 * A shield to protect against 100 daamge will be supplied when afflicted with
 * the state bearing this tag.
 *
 *  <shield:[(a.atk * 3) + b.stepsToRemove]>
 * A shield to protect against damage based on triple the afflicted's attack
 * parameter as well as the value in the "steps to remove" field on the state.
 *
 * ============================================================================
 * SHIELD CAPS:
 * Have you ever wanted to have a cap on shields that was higher than the
 * initially applied amount? Well now you can! By applying the appropriate tag
 * on your states, you too can have shield caps as high as your heart desires!
 *
 * NOTE ABOUT OMITTING SHIELD CAPS:
 * If the shield cap is omitted from a shield state, then the cap will
 * automatically be set to the initial shield amount. This tag lets you create
 * states that can be reapplied to further increase the shield amount up to a
 * certain point- the cap.
 *
 * TAG USAGE:
 * - States only.
 *
 * TAG FORMAT:
 *  <shieldCap:[FORMULA]>
 *    Where FORMULA represents a damage-like formula calculating the cap shield
 *    amount. The variables 'a' and 'b' can be used in the formulas like you
 *    would in a damage formula, where 'a' represents the target afflicted
 *    with the shield state, and 'b' represents the RPG_State object.
 *
 * TAG EXAMPLES:
 *  <shieldCap:[100]>
 * A shield cap of 100 will be applied when afflicted with the state bearing this
 * tag.
 *
 *  <shieldCap:[(a.atk * 3) + b.stepsToRemove]>
 * A shield cap of (target's attack * 3) + (number of steps to remove) will be
 * applied when afflicted with the state bearing this tag.
 *
 * ============================================================================
 * SHIELD PRIORITY:
 * Have you ever wanted to force your shields to be consumed in a particular
 * order? Well now you can! By applying the shield priority tag to the various
 * shield states, you too can have deterministically controlled shield
 * consumption!
 *
 * NOTE ABOUT DUPLICATE PRIORITY:
 * If multiple shields have the same priority, then the timestamp at which
 * they were applied will be deferred to as a tie-breaker for determining
 * which should come first.
 *
 * TAG USAGE:
 * - States only.
 *
 * TAG FORMAT:
 *  <shieldPriority:PRIORITY>
 *    Where PRIORITY is an integer that represents the priority of the shield
 *    state. Shield states with higher priority will be consumed first.
 *
 * TAG EXAMPLES:
 *  <shieldPriority:5> (on stateA)
 *  <shieldPriority:10> (on stateB)
 *  <shieldPriority:1> (on stateC)
 * When afflicted with stateA, stateB, and stateC, the shields will be consumed
 * in the order of priority, with stateB consuming first, followed by stateA,
 * and finally stateC (because 10 > 5 > 1).
 *
 * ============================================================================
 * SHIELD PROTECT:
 * Have you ever wanted your shields to protect you from the overflow damage
 * after they break like they do in certain other games you might've played?
 * Well now you can! By applying the shield protect tag to the various shield
 * states, you too can have shields that will protect you from damage that
 * would otherwise overflow and deal damage after a shield is broken.
 *
 * TAG USAGE:
 * - States only.
 *
 * TAG FORMAT:
 *  <shieldProtect>
 *    This tag is used to indicate that the shield should protect you from
 *    damage that would otherwise overflow and deal damage after the shield
 *    is broken.
 *
 * TAG EXAMPLES:
 *  <shieldProtect>
 * Let us assume that a battler is afflicted with a shield state with the
 * <shield:[100]> tag as well, meaning they have a flat 100 shield points. If
 * this battler was struck with a blow that dealt 150 damage, normally 100 of
 * it would be soaked up by the shield leaving 50 to overflow back and damage
 * the battler's HP. If that same state also had the protect tag, then that
 * overflow of 50 would instead be nullified entirely.
 *
 * ============================================================================
 * SHIELD TYPE:
 * Have you ever wanted to have a shield that was explicitly designed to
 * protect the bearer from fire damage? Or even fire, ice, and lightning, but
 * nothing else? Well now you can! By applying the appropriate tag on your
 * states, you too can have elemental shields that are explicitly designed to
 * protect certain types of damage.
 *
 * TAG USAGE:
 * - States only.
 *
 * TAG FORMAT:
 *  <shieldType:[TYPES...]>
 *    Where TYPES... is a comma-delimited array of numbers that represent the
 *    element ids from your database of the elements that you want this shield
 *    to be typed with.
 *
 * TAG EXAMPLES:
 *  <shieldType:[1,2,3]>
 * A shield that will soak damage if damage is taken that is of elements 1, 2,
 * or 3.
 *
 *  <shieldType:[1]>
 * A shield that will soak damage if damage is taken that is of element 1.
 *
 * ============================================================================
 * SHIELD BYPASS:
 * Have you ever wanted to be able to ignore all those awesome shields that we
 * just setup from all the previous tags? Well now you can! By applying the
 * appropriate tag on your skills, you too can bypass shields as much as you
 * feel the player should.
 *
 * NOTE ABOUT TYPES AND BYPASS INTERSECTIONS:
 * Shield bypassing is expected to go hand-in-hand with shield typing. If a
 * shield has any types that intersect with the types of the skill AND the
 * bypass types also intersect with any of the shield types, then the result
 * is that the shield will be bypassed. That sounds confusing to write, but
 * in practice it'll probably be a lot less complicated since skills typically
 * only have one element associated with them. If you just want a skill that
 * totally bypasses shields, then use the typeless tag.
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <shieldBypass>
 *    This tag will indicate a skill will bypass any and all shields entirely.
 *
 *  <shieldBypass:[TYPES...]>
 *    Where TYPES... is a comma-delimited array of numbers that represent the
 *    element ids from your database of the elements that you want this skill
 *    to bypass shields for.
 *
 * TAG EXAMPLES:
 *  <shieldBypass>
 * This skill will entirely bypass all shields. There are no exceptions.
 *
 *  <shieldBypass:[1,2,3]>
 * This skill will bypass shields for elements with ids 1, 2, and 3.
 *
 * ============================================================================
 * SHIELD BONUS DAMAGE:
 * Have you ever wanted to be able to deal bonus damage to all those pesky
 * shields that the enemy has on them? Well now you can! By applying the
 * appropriate tags to skills, you too can create skills that are shield
 * destroyers!
 *
 * TAG USAGE:
 * - Skills only.
 *
 * TAG FORMAT:
 *  <shieldDamage:[FORMULA]>
 *    Where FORMULA represents a damage-like formula calculating the amount of
 *    bonus damage to deal. The variables 'a', 'b', and 'o' can be used in
 *    the formulas like you would in a damage formula, where 'a' represents
 *    the attacker executing the skill, 'b' represents target with the shield,
 *    and 'o' represents the pre-shielded amount of damage.
 *
 * TAG EXAMPLES:
 *  <shieldDamage:[100]>
 *    A skill with this tag will deal a flat 100 bonus damage to shields.
 *
 *  <shieldDamage:[o * 3]>
 *    A skill with this tag will deal triple the original damage to shields.
 *
 *  <shieldDamage:[b.currentShieldValue() / 2]>
 *    A skill with this tag will deal half of the current shield value as bonus
 *    damage to shields.
 *
 *  <shieldDamage:[a.hp + ($gameParty.gold() * 100)]>
 *    A skill with this tag will deal the amount equal to the attacker's
 *    current hp plus 100 times the party's gold.
 *    (a bizarre formula, but demonstrating availability to globals)
 *
 * ============================================================================
 * SHIELD BREAK SKILLS:
 * Have you ever wanted to be able to retaliate with particular skills when
 * your shield breaks? Well now you can! By applying the appropriate tags on
 * various applicable database objects, you too can customize your shield
 * break retaliation.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <shieldBreak:[SKILL_IDS...]>
 *    Where SKILL_IDS... is a comma-delimited array of numbers that represent
 *    the ids of the skills that will be executed when any shield breaks.
 *
 * TAG EXAMPLES:
 *  <shieldBreak:[1,2,3]> (on the shield state applied to the battler)
 *    This actor will execute skill 1, 2, and 3 when their shield breaks.
 *
 * <shieldBreak:[1,2,3]> (on the battler)
 * <shieldBreak:[1,4]>   (on the shield state applied to the battler)
 *    This battler will execute skills 1 (once), 2, 3, and 4 when their shield
 *    breaks- the 1 only triggers once even though it shows up twice.
 *
 * ============================================================================
 * There are no plugin parameters/commands for this plugin.
 * They are mostly just states, so work with them as you would any other state.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.2
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.1
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations