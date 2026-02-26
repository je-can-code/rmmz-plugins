//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.0 CMS_S] A redesign of the status menu for chef adventure.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-SDP
 * @base J-CriticalFactors
 * @base J-NaturalGrowth
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This is primarily designed to render out multiple additional parameters from
 * other plugins for the Chef Adventure game:
 * - BASE (the max tp)
 * - JABS (the movement speed boost)
 * - SDP (breakdown of what panels give bonuses, sdp/exp/gold boosts)
 * - CRIT (the crit damage multiplier and reduction)
 * - NATURAL (the natural buffs and growths)
 *
 * This provides a more comprehensive view of what all the parameters are for
 * the actors (revealing base/sp/ex values) as well as providing a breakdown
 * for each parameter as to what is feeding into it.
 *
 * NOTE ABOUT USING THIS CUSTOM STATUS SCREEN:
 * It is not encouraged to use this unless you intend to use all the base
 * plugins that are listed. Support for this plugin will be minimal for
 * edge-cases outside of how I use this.
 *
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 1.1.0
 *    Added complete long-parameter coverage and detailed breakdown panel.
 *    Documentation pass for status list window and models.
 *    Retroactively added this changelog.
 * - 1.0.0
 *    Initial release.
 * =========================================================================
 */
//endregion Introduction