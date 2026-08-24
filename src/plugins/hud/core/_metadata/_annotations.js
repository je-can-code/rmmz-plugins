//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Provides core functionality for this HUD system.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Base-Save
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is the core of the J-HUD system, and contains plugin commands
 * for managing the state of your JABS HUD.
 *
 * Integrates with others of mine plugins:
 * - J-HUD-PartyFrame; enables on-the-map display of the player and ally data.
 * - J-HUD-InputFrame; enables on-the-map display of the player's skill slots.
 * - J-HUD-TargetFrame; enables on-the-map display of the player's last target.
 *
 * NOTE:
 * If using the J-HUD-TargetFrame plugin, there is additional information in
 * the plugin help that you will want to review at least once before using it.
 *
 * ============================================================================
 * CONTROLLING THE HUD:
 * Have you ever wanted to have any degree of control over the HUD that exists
 * as an information data overlay to your JABS-tastical fun? Well now you can!
 * By leveraging the plugin commands below, you too can manipulate your HUD!
 *
 * DETAILS:
 * The "HUD" is controlled as a collection of its frames. The below plugin
 * commands all work to show/hide all portions of the "HUD" at once.
 *
 * NOTE:
 * The Party and Input frames both are forcefully hidden while the message
 * window is open and the $gameInterpreter believes an event is running.
 *
 * ----------------------------------------------------------------------------
 * SHOW/HIDE COMMANDS
 * Leveraging these commands will give you the control over showing or hiding
 * the entirety of the HUD. This is the type of command you could use to
 * - "Show HUD"
 *    Shows the entire HUD.
 * - "Hide HUD"
 *    Hides the entire HUD.
 *
 * ----------------------------------------------------------------------------
 * ALLY SHOW/HIDE COMMANDS
 * Leveraging these commands will give you the control over showing or hiding
 * any allies other than the leader from the HUD.
 * - "Show Allies"
 *    Shows the allies' section of the party frame.
 * - "Hide Allies"
 *    Hides the allies' section of the party frame.
 *
 * ----------------------------------------------------------------------------
 * REFRESH COMMANDS
 * Leveraging these commands will give you control over refreshing the HUD.
 * These commands are very circumstancial in nature, but will enable you to
 * forcefully refresh the HUD and it's image cache on-demand in the instance
 * that you make changes to assets or have some other plugin requiring some
 * sort of data update to a member of the party.
 * - "Refresh HUD"
 *    Refreshes the data of the HUD, such as actor parameters and states.
 * - "Refresh HUD Image Cache"
 *    Refreshes the image cache of the HUD, for when you change faces.
 *
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- HUD control is entirely
 * plugin-command driven.
 * ============================================================================
 * CHANGELOG:
 * - 2.2.0
 *    Routed the _hud namespace into its own save section, so HUD state lands
 *    in systems/hud.json rather than inside the system blob.
 *    Moved the _hud namespace seeding from the initialize alias to initMembers,
 *    so a decoded save can establish it without running a constructor.
 *    Fixed four broken import paths in the state affliction presenter's tests
 *    that resolved outside the repository entirely.
 * - 2.1.0
 *    Added a dual-row (negative/positive) state affliction presenter to the
 *    party HUD frame- icons, timers, and stack counts, sprite-cached per
 *    battler and cleaned up on target switch.
 *    Added an explicit J-ABS 4.0.0+ version requirement check at boot.
 *    Fixed a self-referencing @base/@orderAfter J-HUD declaration on this
 *    plugin's own header.
 * ============================================================================
 * @command hideHud
 * @text Hide HUD
 * @desc Hides the HUD on the map.
 *
 * @command showHud
 * @text Show HUD
 * @desc Shows the HUD on the map.
 *
 * @command hideAllies
 * @text Hide Allies
 * @desc Hides the display of allies in the hud.
 *
 * @command showAllies
 * @text Show Allies
 * @desc Shows allies' data in the hud.
 *
 * @command refreshHud
 * @text Refresh HUD
 * @desc Forcefully refreshes the hud.
 *
 * @command refreshImageCache
 * @text Refresh HUD Image Cache
 * @desc Forcefully refreshes the image cache of the hud.
 */