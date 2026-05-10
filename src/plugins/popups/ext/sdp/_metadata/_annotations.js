//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.2 POPUPS-SDP] SDP point gain popups.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Popups
 * @base J-SDP
 * @orderAfter J-Base
 * @orderAfter J-Popups
 * @orderAfter J-SDP
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Popups for J-SDP.
 *
 * Have you ever wanted a popup to appear whenever a battler earns SDP points
 * in combat? Well now you can! This plugin wires up SDP reward popups into
 * the JABS combat flow so players always get that satisfying feedback when
 * their panel points are ticking up.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.2
 *    SDP reward popups route through `JABS_PopupMergeController.routeRewardPop` when J-Popups-ABS merge is enabled.
 * - 1.0.1
 *    Renamed source file to standard JABS naming conventions.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion Introduction