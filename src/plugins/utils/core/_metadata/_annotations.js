/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Various system utilities.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin provides a small set of system utility functions that may or
 * may not be helpful to all users.
 *
 * NEW FUNCTIONS:
 * - F6 toggles all sound on/off.
 * - autostart newgame on testplay (when plugin parameter enabled).
 * - pull up devtools window in background upon testplay (always).
 * - $gameParty.removeInvalidItemsFromParty() strips junk bag rows and equipment
 *   (missing DB rows, blank names, or names starting with "===").
 * ============================================================================
 * CHANGELOG:
 * - 1.1.4
 *    Inventory purge is Game_Party.prototype.removeInvalidItemsFromParty (was J.UTILS.GameParty).
 * - 1.1.3
 *    Added helpers to purge invalid inventory after database ID shifts.
 * - 1.1.2
 *    Added debugging for helping diagnose recursive saved things.
 * - 1.1.1
 *    Added debugger for gamepad inputs.
 * - 1.1.0
 *    Implements strongly-typed plugin metadata.
 *    Added "pull up devtools upon testplay" functionality.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * @param autostart-newgame
 * @type boolean
 * @text Autostart Newgame
 * @desc Automatically start a new game when playtesting the game.
 * @default true
 *
 * @param autoload-devtools
 * @type boolean
 * @text Autoload Devtools
 * @desc Automatically load the devtools console when playtesting the game.
 * @default true
 */