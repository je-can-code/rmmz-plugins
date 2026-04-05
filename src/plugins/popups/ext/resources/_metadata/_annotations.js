//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 POPUPS-RESOURCES] Popup extensions for J-Resources skill costs and gains.
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
 * This plugin adds popup visual feedback for the HP/MP/TP costs and gains
 * introduced by J-Resources.
 *
 * When a battler pays an HP, MP, or TP cost (or receives a gain) from a
 * J-Resources tagged skill, a corresponding text popup will appear over
 * the battler's character on the map.
 *
 * Requires J-Popups and J-Resources.
 * Designed for use with J-ABS (JABS), but falls back gracefully without it.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * - HP cost popups appear in red tones.
 * - MP cost popups appear in blue tones.
 * - TP cost popups appear in yellow/green tones.
 * - Gain popups use the corresponding healing color tones.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 *    Added HP/MP/TP cost and gain popups hooked via Game_Battler methods.
 * ============================================================================
 */
//endregion annotations
