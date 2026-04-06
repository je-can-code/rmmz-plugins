//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.0 POPUPS-ABS] Combat and reward popups for JABS.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Popups
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-Popups
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Popups for J-ABS.
 *
 * Have you ever wanted floating popups for all of that glorious combat chaos
 * your JABS game dishes out- damage numbers, healing, experience, gold, loot,
 * level-ups, and skill learns? Well now you can! This plugin wires up popup
 * builders for every major JABS combat and reward event.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Popup construction is handled through JABS_PopupManager, which provides
 * dedicated builder methods for each popup type. All popups are displayed on
 * the relevant battler's or character's map sprite.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Extracted popup construction into a dedicated JABS_PopupManager class.
 *    Added ABS-specific TextPopBuilder and Map_TextPop extensions in _models/.
 *    Renamed source files to standard JABS naming conventions.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion Introduction