//region Introduction
/* eslint-disable */
/*:
 * @target MZ
 * @plugindesc
 * [v2.0.0 SDP] Enables the SDP system, aka Stat Distribution Panels.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-DropsControl
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-Speed
 * @orderAfter J-DropsControl
 * @orderAfter J-CriticalFactors
 * @orderAfter J-Proficiency
 * @help
 * ============================================================================
 * OVERVIEW:
 * This plugin is a form of "stat distribution"- an alternative to the standard
 * of leveling up to raise an actor's stats.
 *
 * Integrates with others of mine plugins:
 * - J-DropsControl; enables usage of item-as-panel drops.
 * - J-ABS; enemies will individually drop their points and panels.
 * - J-ABS-Speed; enables usage of Movespeed Boost as a parameter on panels.
 * - J-CriticalFactors; enables usage of CDM/CDR as parameters on panels.
 * - J-Proficiency; enables usage of Proficiency+ as a parameter on panels.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This system allows the player's party to unlock "stat distribution panels"
 * (aka SDPs), by means of plugin command.
 *
 * The scene to manage unlocked SDPs is accessible via the menu, the JABS
 * quick menu, or via plugin command.
 *
 * Each SDP has the following:
 * - 1+ parameters (of the 27 available in RMMZ) with flat/percent growth.
 * - A fixed rank max.
 * - A relatively customizable formula to determine cost to rank up.
 * - Customizable name/icon/description1/description2.
 * - Rank up rewards for any/every/max rank, which can be most anything.
 *
 * In order to rank up these SDPs, you'll need to use SDP points. These can be
 * acquired by using the tags below, or by using plugin commands.
 *
 * NOTES:
 * - SDP points gained from enemies are earned for all members of the party.
 * - SDP points are stored and spent on a per-actor basis.
 * - SDP points for an actor cannot be reduced below 0.
 * - Stat Distribution Panels are unlocked for all members of the party.
 * - Stat Distribution Panel rewards can unlock other panels.
 *
 * IMPORTANT NOTE:
 * The SDP data is derived from an external file rather than the plugin's
 * parameters. This file lives in the "/data" directory of your project, and
 * is called "config.sdp.json". You can absolutely generate/modify this file
 * by hand, but you'll probably want to visit my github and swipe the
 * rmmz-data-editor project I've built that provides a convenient GUI for
 * generating and modifying SDPs in just about every way you could need.
 *
 * If this configuration file is missing, the game will not run.
 *
 * ============================================================================
 * SDP POINTS:
 * Ever want enemies to drop SDP Points? Well now they can! By applying the
 * appropriate tag to the enemy/enemies in question, you can have enemies drop
 * as little or as much as you want them to.
 *
 * TAG USAGE:
 * - Enemies only.
 *
 * TAG FORMAT:
 *  <sdp:POINTS>
 *
 * TAG EXAMPLES:
 *  <sdp:10>
 * The party will gain 10 SDP points from defeating this enemy.
 *
 *  <sdp:123456>
 * The party will gain 123456 SDP points from defeating this enemy.
 * ============================================================================
 * SDP MULTIPLIERS:
 * Ever want allies to gain some percentage amount more (or less) of the SDP
 * points earned from enemies? Well now you can! By applying the appropriate
 * tag to the various database locations applicable, you can gain a percentage
 * bonus/penalty amount of SDP points obtained!
 *
 * NOTE:
 * The format implies that you will be providing whole numbers and not actual
 * multipliers, like 1.3 or something. If multiple tags are present across the
 * various database locations on a single actor, they will stack additively.
 * SDP points cannot be reduced below 0 for an actor, but they most certainly
 * can receive negative amounts if the tags added up like that.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <sdpMultiplier:AMOUNT>    (for positive)
 *  <sdpMultiplier:-AMOUNT>   (for negative)
 *
 * TAG EXAMPLES:
 *  <sdpMultiplier:25>
 * An actor with something equipped/applied that has the above tag will now
 * gain 25% increased SDP points.
 *
 *  <sdpMultiplier:80>
 *  <sdpMultiplier:-30>
 * An actor with something equipped/applied that has both of the above tags
 * will now gain 50% increased SDP points (80 - 30 = 50).
 * ============================================================================
 * CHANGELOG:
 * - 2.0.0
 *    Major breaking changes related to plugin parameters.
 *    Updated to extend common plugin metadata patterns.
 *    Panel data is now strictly data.
 *    Rankings of panels are stored on the actor as save data.
 *    Now loads panel data from external file.
 *    Panels being unlocked/locked are stored on the party.
 *    Updated SDP scene to display rewards.
 *    Updated SDP rewards to have names.
 *
 * - 1.3.0
 *    Added new tag for unlocking panels on use of item.
 * - 1.2.3
 *    Updated JABS menu integration with help text.
 * - 1.2.2
 *    Updated sdp drop production to use drop item builder.
 * - 1.2.1
 *    Update to add tracking for total gained sdp points.
 *    Update to add tracking for total spent sdp points.
 * - 1.2.0
 *    Update to include Max TP as a valid panel parameter.
 * - 1.1.0
 *    Update to accommodate J-CriticalFactors.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param SDPconfigs
 * @text SDP SETUP
 *
 * @param menuSwitch
 * @parent SDPconfigs
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 104
 *
 * @param sdpIcon
 * @parent SDPconfigs
 * @type number
 * @text Points Icon
 * @desc The default icon index to represent "SDP points".
 * Use the context menu to easily select an index.
 * @default 306
 *
 * @param victoryText
 * @parent SDPconfigs
 * @type string
 * @text Victory Text
 * @desc The text appended to text as seen in the default.
 * This text usually shows up after a battle is won.
 * @default SDP points earned!
 *
 * @param menuCommandName
 * @parent SDPconfigs
 * @type string
 * @text Menu Name
 * @desc The text to show as the name of this command in menus.
 * @default Distribute
 *
 * @param menuCommandIcon
 * @parent SDPconfigs
 * @type number
 * @text Menu Icon
 * @desc The icon to show next to the command in the menu.
 * Use the context menu to easily select an index.
 * @default 2563
 *
 *
 * @param JABSconfigs
 * @text JABS-ONLY CONFIG
 * @desc Without JABS, these configurations are irrelevant.
 *
 * @param showInBoth
 * @parent JABSconfigs
 * @type boolean
 * @desc If ON, then show in both JABS quick menu and main menu, otherwise only JABS quick menu.
 * @default false
 *
 * @command Call SDP Menu
 * @text Access the SDP Menu
 * @desc Calls the SDP Menu directly via plugin command.
 *
 * @command Unlock SDP
 * @text Unlock Panel(s)
 * @desc Unlocks a new panel for the player to level up by its key. Key must exist in the SDPs list above.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the SDPs that will be unlocked.
 *
 * @command Lock SDP
 * @text Lock Panel(s)
 * @desc Locks a SDP by its key. Locked panels do not appear in the list nor affect the player's parameters.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the SDPs that will be locked.
 *
 * @command Modify SDP points
 * @text Add/Remove SDP points
 * @desc Adds or removes a designated amount of points from an actor.
 * @arg actorId
 * @type actor
 * @desc The actor to modify the points of.
 * @arg sdpPoints
 * @type number
 * @min -99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 *
 * @command Modify party SDP points
 * @text Add/Remove party's SDP points
 * @desc Adds or removes a designated amount of points from all members of the current party.
 * @arg sdpPoints
 * @type number
 * @min -99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 */
/* eslint-enable */