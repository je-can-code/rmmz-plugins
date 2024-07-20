//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 TIMING] Enable modifying cooldowns/casting for actions.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-ABS
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables modifications for cast times and cooldowns for actions.
 *
 * Enables:
 * - NEW! added param "Fast Cooldown", for modifying cooldown times.
 * - NEW! added param "Cast Speed", for modifying cast speeds.
 *
 * This plugin requires JABS.
 * This plugin requires no plugin parameter configuration.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The new parameters of fast cooldown and cast speed are both cached to
 * minimize processing time. The cache is refreshed on the following events:
 *
 * For all battlers:
 * - a new state is added.
 * - a current state is removed.
 * For only actors:
 * - new equipment is equipped.
 * - existing equipment is unequipped.
 * - leveling up.
 * - leveling down.
 * ----------------------------------------------------------------------------
 * NEW PARAMETERS:
 * When using this plugin, there are two additional parameters that become
 * defined on battlers, but they are computed values that are applied to JABS
 * related parameters, so they don't have shorthand properties like "atk".
 *
 * USAGE IN JABS:
 * In the context of JABS, these two parameters have very specific functions
 * by default:
 * - Fast Cooldown:
 *    Modifies the cooldown associated with a JABS Action.
 * - Cast Speed:
 *    Modifies the cast speed associated with a JABS Action.
 * "JABS Action" usually just refers to the execution of an equipped skill...
 * which means that in actuality, this can be applied to various states and
 * equipment to penalize or reward the player:
 * - Fast Cooldown:
 *    Used to penalize with longer cooldowns from cursed states or equipment.
 *    Used to reward with reduced cooldowns from equipment or states.
 * - Cast Speed:
 *    Used to penalize with longer cast times due to bad states or equipment.
 *    Used to reward with reduced or removed cast times from sagely equipment!
 *
 * FORMULA BREAKDOWN:
 * Knowing the usage described of these two parameters, you'll be pleased to
 * know they are calculated in exactly the same way, but applied to the two
 * separate values, cooldown and cast speed.
 *
 * First, a base parameter for the value is established:
 * "base fast cooldown" or "base cast speed" in this plugin's case.
 * If there is no base parameter values found, then zero is assumed the base
 * parameter value.
 * The same is assumed if all found values summed together to equal zero.
 * If any values are found, they are added together as one.
 * This sum represents a flat addition or subtraction against the calculated
 * parameter- in frames.
 *
 * Second, the flat modifier is evaluated:
 * "cast speed flat" or "fast cooldown flat" in this plugin's case.
 * If there are no flat parameter values found, then zero is assumed to be the
 * flat modifier value.
 * The same is assumed if all found values summed together to equal zero.
 * If any values are found, they are added together as one.
 * This summed value represents a flat modifier against the base parameter
 * when being combined with the multiplier.
 * Higher of this will increase the time required.
 * Lower of this will reduce the time required.
 * Being a flat modifier, this can have great impact if your skills have low
 * cooldowns consiering this amount is directly being added to the
 * cast time/cooldown values recorded by the JABS Action.
 *
 * Third, the multiplicitive modifier is evaluated:
 * "cast speed rate" or "fast cooldown rate" in this plugin's case.
 * If there are no rate parameter values found, then zero is assumed to be the
 * rate modifier value.
 * The same is assumed if all found values summed together to equal zero.
 * If any values are found, they are added together as one.
 * This summed value represents a "factor multiplier"* against the original
 * cast time derived from the action itself.
 *
 * Fourth, and finally, the product of the original cast time being combined
 * with the factor multiplier from step three is added to the sum of the flat
 * modifier derived from step two, resulting in a single new value that
 * represents the new cast time. There is validation logic that will ensure
 * this amount didn't go below the "minimum" cast time (defaults to 0). This
 * amount- rounded- is returned as the REAL cast time.
 *
 * | WHAT IS A FACTOR MULTIPLIER?
 * | A "factor multiplier" is a number that usually begins as a base-100 integer,
 * | such as 150, that is later divided by 100 to get a "multiplier" that
 * | indicates a percentage multiplier against another value. In the case of 150,
 * | the "factor multiplier" would be 1.5, aka +50% more than the base.
 *
 *
 * ============================================================================
 * FAST COOLDOWN:
 * Have you ever wanted skills to have a base cooldown time, but maybe when
 * a battler has a particular state applied or equipment equipped, they now
 * have even faster cooldown times (or slower???)? Well now you can! By
 * applying the appropriate tag to various database locations, you can control
 * how fast (or slow) a battler's cooldown times are!
 *
 * DETAILS:
 * Considering the value is evaluated() in javascript (similar to how a skill
 * formula box is calculated), there are also a few letter variables available
 * for use when building the formula:
 * - "a": as seen in the example of "a.level", refers to the battler itself.
 *
 * - "b": as seen in the example of "-1 * (b * 5)" refers to
 *      the base parameter.
 *      This defaults to 0 unless otherwise uncalculated.
 *
 * NOTE1:
 * By constructing tags using the format described below, you are given access
 * to a "Formula" box that behaves similar to a "Formula" box that defines the
 * damage of a skill. None of the tags are case sensitive, but the order is
 * specific. If you find yourself having trouble building the tags, you can
 * peek at the source code of this file and search for
 * "J.ABS.EXT.TIMING.RegExp =" to find the grand master list of all
 * combinations of tags. Do note that the hard brackets of [] are required to
 * wrap the formula in the note tag.
 *
 * NOTE2:
 * If you want faster cooldowns, the formula should result in a NEGATIVE value.
 * If you want slower cooldowns, the formula should result in a POSITIVE value.
 *
 * NOTE3:
 * The minimum amount of time for cooldowns is 0 frames.
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
 *  <baseFastCooldown:[FORMULA]>
 *  <fastCooldownFlat:[FORMULA]>
 *  <fastCooldownRate:[FORMULA]>
 * Where [FORMULA] is the formula to produce the fast cooldown value.
 *
 * EXAMPLE:
 *  <baseFastCooldown:[3]>
 * Base fast cooldown will be set to +3 frames.
 *
 *  <fastCooldownFlat:[(a.level * -2)]>
 * All cooldowns are reduced by 2 frames per level.
 *
 *  <fastCooldownRate:[-1 * (b * 5)]>
 * All cooldowns will be reduced by 5% per point of base fast cooldown.
 * (not a practical formula, but demonstrating use)
 * ============================================================================
 * CAST SPEED:
 * Have you ever wanted skills to have a base cast speed, but maybe when
 * a battler has a particular state applied or equipment equipped, they now
 * have even faster cast times (or slower???)? Well now you can! By
 * applying the appropriate tag to various database locations, you can control
 * how fast (or slow) a battler's cast times are!
 *
 * NOTE1:
 * By constructing tags using the format described below, you are given access
 * to a "Formula" box that behaves similar to a "Formula" box that defines the
 * damage of a skill. None of the tags are case sensitive, but the order is
 * specific. If you find yourself having trouble building the tags, you can
 * peek at the source code of this file and search for
 * "J.ABS.EXT.TIMING.RegExp =" to find the grand master list of all
 * combinations of tags. Do note that the hard brackets of [] are required to
 * wrap the formula in the note tag.
 *
 * NOTE2:
 * If you want faster casting, the formula should result in a NEGATIVE value.
 * If you want slower casting, the formula should result in a POSITIVE value.
 *
 * NOTE3:
 * The minimum amount of time for casting is 0 frames.
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
 *  <baseCastSpeed:[FORMULA]>
 *  <castSpeedFlat:[FORMULA]>
 *  <castSpeedRate:[FORMULA]>
 * Where [FORMULA] is the formula to produce the fast cooldown value.
 *
 * EXAMPLE:
 *  <baseCastSpeed:[3]>
 * Base cast speed will be set to +3 frames.
 *
 *  <castSpeedFlat:[(a.level * 2) * -1]>
 * All cast times are reduced by 2 frames per level.
 *
 *  <castSpeedRate:[b * -5]>
 * All cast times will be reduced by 5% per point of base fast cooldown.
 * (not a practical formula, but demonstrating use)
 * ==============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ==============================================================================
 */