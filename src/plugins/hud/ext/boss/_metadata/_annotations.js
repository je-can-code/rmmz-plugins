//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A HUD frame that displays a single target, like a boss.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-HUD
 * @base J-HUD-TargetFrame
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-HUD
 * @orderAfter J-HUD-TargetFrame
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of the J-HUD-TargetFrame plugin, designed for
 * JABS. It generates a window on the map displaying a single target at a much
 * bigger scale than the J-HUD-TargetFrame does.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it displays whichever battler is
 * the player's current target, not a specially-tagged "boss".
 * ============================================================================
 * CHANGELOG:
 * - 1.0.2
 *    Routed the boss-creation failure through J-Base's new Diagnostics, so it
 *    names J-HUD-BossFrame in the console.
 * - 1.0.1
 *    Fixed the HP-percent threshold check using a chained comparison
 *    (lowerRange <= hpPercent <= upperRange), which does not perform a
 *    range check in JS and was nearly always true regardless of the
 *    boss's actual HP.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */