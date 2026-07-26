//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A redesign of the status menu for chef adventure.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-CMS
 * @base J-ABS
 * @base J-SDP
 * @base J-CriticalFactors
 * @base J-NaturalGrowth
 * @orderAfter J-Base
 * @orderAfter J-CMS
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
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely a scene/window
 * redesign of the status menu that renders parameters sourced from the
 * other listed plugins (which own their own respective tags).
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 1.1.0
 *    Added complete long-parameter coverage and detailed breakdown panel.
 *    Migrated StatusParameter from numeric longParamId to the shared
 *    parameter catalog's string parameterKey.
 *    Documentation pass for status list window and models.
 *    Retroactively added this changelog.
 * - 1.0.0
 *    Initial release.
 * =========================================================================
 */
//endregion Introduction