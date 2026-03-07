//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 SHIELD] A JABS extension that provides state-based HP shields.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-HUD-Party
 * @orderAfter J-TextPops
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin provides the ability to create state-based HP shields that can
 * be used to protect actors from damage.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; this plugin is an extension to JABS.
 * - J-HUD-Party; the shield gauge will be rendered above the hp gauge.
 * - J-TextPops; shield damage popups will be generated.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Provides the standard in HP shield mechanics for JABS. States own the shield
 * and can be used to protect actors from damage in varying ways. The shields
 * always will have a maximum amount that it can absorb (cap).
 *
 * NOTE ABOUT SHIELD/STATE EXPIRATION:
 * When a shield is exhausted (as in, reduced to zero), the state will be
 * removed. This means one should make shield states unique from other effects.
 * Inversely, when a state expires, the shield is removed.
 *
 * ============================================================================
 * SHIELDING:
 * Have you ever wanted to apply some amount of shield points to a state to
 * protect against damage? Well now you can! By applying the appropriate tag
 * across the various database locations, you too can apply shields to your
 * heart's content.
 *
 * NOTE ABOUT FORMULA-BASED TAGS:
 * All formula-based tags are recalculated upon application of the state, and
 * again anytime the state refreshes. When a state is recalculated, the current
 * shield gets replaced with an updated shield, carrying over the previous
 * current amount along with adding it to the new base amount. The cap is
 * simply replaced with the updated value.
 *
 * TAG USAGE:
 * - States
 *
 * TAG FORMAT:
 *  <shield:VALUE>
 *    Where VALUE represents the flat amount to absorb.
 *
 *  <sh-formula:[FORMULA]>
 *    Where FORMULA represents a damage-like formula calculating the amount to
 *    absorb. The variables 'a' and 'b' can be used in the formulas like you
 *    would in a damage formula, where 'a' represents the target afflicted
 *    with the shield state, and 'b' represents the RPG_State object.
 *
 * TAG EXAMPLES:
 *  <shield:100>
 * A shield to protect against 100 daamge will be supplied when afflicted with
 * the state bearing this tag.
 *
 *  <sh-formula:[(a.atk * 3) + b.stepsToRemove]>
 * A shield to protect against damage based on triple the afflicted's attack
 * parameter as well as the value in the "steps to remove" field on the state.
 *
 *
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 101
 *
 *
 * @command do-the-thing
 * @text Add/Remove points
 * @desc Adds or removes a designated amount of points from all members of the current party.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 */
//endregion annotations