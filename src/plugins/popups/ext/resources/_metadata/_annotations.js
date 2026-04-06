//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 POPUPS-RESOURCES] Skill cost and resource gain popups.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Popups
 * @base J-Resources
 * @orderAfter J-Base
 * @orderAfter J-Popups
 * @orderAfter J-Resources
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds visual popup feedback for the HP, MP, and TP costs and
 * gains introduced by J-Resources.
 *
 * Have you ever wanted to see a popup fly off your character when a skill
 * drains their HP, or when a hit-based gain restores their MP mid-combat?
 * Well now you can! Any time a J-Resources cost is paid or a gain is applied,
 * a text popup will appear over that battler's character on the map.
 *
 * Integrates with others of mine plugins:
 * - J-Resources-ABS; on-attack and when-hit gains are covered automatically.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * - HP cost popups appear in red tones.
 * - MP cost popups appear in blue tones.
 * - TP cost popups appear in yellow/green tones.
 * - Gain popups use the corresponding healing color tones.
 *
 * NOTE:
 * If J-Resources-ABS is also loaded, the on-attack and when-hit gains from
 * that plugin go through the same Game_Battler hooks and get popups for free.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 *    Added HP/MP/TP cost and gain popups hooked via Game_Battler methods.
 *    On-attack and when-hit gains from J-Resources-ABS are covered automatically.
 * ============================================================================
 */
//endregion annotations
