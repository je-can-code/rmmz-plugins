/*:
 * @target MZ
 * @plugindesc
 * [v1.1.0 UTIL] Various system utilities.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @help
 * ============================================================================
 * OVERVIEW:
 * This plugin provides a small set of system utility functions that may or
 * may not be helpful to all users.
 *
 * NEW FUNCTIONS:
 * - F6 toggles all sound on/off.
 * - autostart newgame on testplay (when plugin parameter enabled).
 * - pull up devtools window in background upon testplay (always).
 * ============================================================================
 * CHANGELOG:
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