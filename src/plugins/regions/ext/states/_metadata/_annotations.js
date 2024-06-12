//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 REGIONS-STATES] Enables application of states via region ids.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-RegionEffects
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-RegionEffects
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables the ability to attempt to autoapply states based on the
 * region that a given character is standing upon while on the map.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * At set intervals while any charater on the map stands upon a given regionId,
 * the plugin will attempt to repeatedly apply a given state or states to the
 * character's battler.
 *
 * This plugin probably could've been developed to work without JABS to some
 * extent, but this was designed FOR JABS, so it is a required dependency.
 * ============================================================================
 * PLUGIN PARAMETERS:
 *  - Apply State Delay:
 *      The number of frames between states being applied.
 *      The lower this number, the more frequently states will be applied
 *        while standing on a tile with a region that applies states.
 *      Defaults to 15, aka roughly 4 times per second.
 * ============================================================================
 * REGION ADD STATE IDS:
 * Have you ever wanted to set some regionIds to apply states to characters on
 * the map? Well now you can! By applying the appropriate tags to the map
 * properties, you too can have states repeatedly applied to various battlers
 * on the map!
 *
 * NOTE ABOUT DUPLICATE TAGS:
 * Duplicate tags are allowed, in that they will stack not in effectiveness,
 * but instead in application. Having multiple tags for the same region, and
 * even the same stateId, will tell the plugin to simply attempt to apply the
 * state multiple times.
 *
 * NOTE ABOUT STATE APPLICATIONS:
 * The CHANCE component of the tag as described below represents the "default"
 * chance of application of a state against a battler. It is important to note
 * that this chance does not include potential resistances or weaknesses to the
 * state, meaning if a battler had a severe weakness (1000% chance) to a given
 * stateId but the tag was less than 100%, the math may work out in such a way
 * that the calculated chance of application is actually higher, potentially
 * guaranteeing success of application despite putting less than 100% chance in
 * the tag.
 *
 * NOTE ABOUT ANIMATION IDS:
 * It is important to note that large amounts of animations playing on the
 * screen simultaneously is incredibly non-performant. Do be cautious when
 * slapping these tags on maps with the ANIMATION_ID value provided. It may be
 * a good idea to consider using low percentage of application when also using
 * the ANIMATION_ID functionality so it does not trigger constantly.
 *
 * TAG USAGE:
 * - Map [Properties]
 *
 * TAG FORMAT:
 *  <regionAddState:[REGION_ID, STATE_ID, CHANCE?, ANIMATION_ID?]>
 * Where REGION_ID is the region that can apply the state.
 * Where STATE_ID is the state being applied by the region.
 * Where CHANCE? is an 1-100 integer chance of applying the state.
 *  (the CHANCE can be omitted and it will default to 100% application chance)
 *  (if setting an animation id is desired, CHANCE cannot be omitted)
 * Where ANIMATION_ID? is the id of the animation to play upon application.
 *  (the ANIMATION_ID can be omitted and it will default to no animation)
 *
 * TAG EXAMPLES:
 *  <regionAddState:[1, 3, 25, 4]>
 * A tile marked with the region id of 1, will apply state of id 3,
 * with a (default) 25% chance of success. The animation of id 4 will be
 * played on the character upon application.
 *
 *  <regionAddState:[1, 3, 25]>
 *  <regionAddState:[1, 4, 30]>
 *  <regionAddState:[1, 4, 50]>
 *  <regionAddState:[2, 4, 100]>
 * A tile marked with the region id of 1, will apply state 3 at 25% chance,
 * will apply state 4 at 30% chance, and again apply state 4 at a higher 50%
 * chance.
 * A tile marked with the region id of 2 will apply state 4 at a 100% chance.
 * No animations will play upon application of any of these states.
 *
 *  <regionAddState:[12, 40]>
 * A tile marked with region id of 12 will apply state of id 40 with 100%
 * chance while the player  continues to stand upon it.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * @param application-delay
 * @type number
 * @text Apply State Delay
 * @desc The number of frames between state applications.
 * Adjust this to make states apply more or less frequently.
 * @default 15
 */
//endregion annotations