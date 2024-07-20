//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 REGIONS-SKILLS] Enables execution of skills via region ids.
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
 * This plugin enables the ability to attempt to auto-execute skills based on
 * the region that a given character is standing upon while on the map.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * At set intervals while any charater on the map stands upon a given regionId,
 * the plugin will attempt to repeatedly execute a given skill or skills
 * against the battler.
 *
 * This plugin probably could've been developed to work without JABS to some
 * extent, but this was designed FOR JABS, so it is a required dependency.
 * ============================================================================
 * TODO: Fill this in with details.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @param execution-delay
 * @type number
 * @text Execute Skill Delay
 * @desc The number of frames between skill executions.
 * Adjust this to make skills execute more or less frequently.
 * @default 60
 */
//endregion annotations