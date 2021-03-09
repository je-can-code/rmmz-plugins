/*:
* @target MZ
* @plugindesc
* The Hud for JABS.
* @author JE
* @url https://dev.azure.com/je-can-code/RPG%20Maker/_git/rmmz
* @help
* # Start of Help
*
* # End of Help
*
* @param BreakHead
* @text --------------------------
* @default ----------------------------------
*
* @param Extensions
* @default Modify Below
*
* @param BreakSettings
* @text --------------------------
* @default ----------------------------------
*
* @param Enabled
* @type boolean
* @desc Use Hud?
* @default true
*
* @command Show Hud
* @text Show Hud
* @desc Shows the Hud on the map.
*
* @command Hide Hud
* @text Hide Hud
* @desc Hides the Hud on the map.
*/
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};
var PluginManager = PluginManager || {};
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.Hud = {};
/**
 * The `metadata` associated with this plugin, such as version.
 */
J.Hud.Metadata = {};
J.Hud.Metadata.Version = 1.00;
J.Hud.Metadata.Name = `J-Hud`;
/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.Hud.PluginParameters = PluginManager.parameters(`J-Hud`);
J.Hud.Metadata.Active = Boolean(J.Hud.PluginParameters['Enabled']);
J.Hud.Metadata.Enabled = true;
/**
 * A collection of all aliased methods for this plugin.
 */
J.Hud.Aliased = {};
J.Hud.Aliased.Scene_Map = {};
/**
 * Plugin command for enabling the text log and showing it.
 */
PluginManager.registerCommand(J.Hud.Metadata.Name, "Show Hud", () => {
    J.Hud.Metadata.Active = true;
});
/**
 * Plugin command for disabling the text log and hiding it.
 */
PluginManager.registerCommand(J.Hud.Metadata.Name, "Hide Hud", () => {
    J.Hud.Metadata.Active = false;
});
