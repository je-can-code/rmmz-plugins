//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v2.2.0 LOG] A log window for viewing on the map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-MessageTextCodes
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-MessageTextCodes
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables logging functionality.
 * It has three built in logging managers:
 * - Action Log
 * - Loot Log
 * - DiaLog
 *
 * Each of the logging managers is responsible for different types of logging
 * for the player to observe.
 *
 * This plugin was designed for JABS, but doesn't require it.
 * If added while using JABS, the log window will automatically register all
 * actions taken, damage/healing dealth, loot and such picked up, and more.
 *
 * Additionally, the log window is a command window under the covers, so it
 * also supports scrolling via mouse/touch.
 *
 * Controller/keyboard support for the log window is not supported.
 *
 * Depends on other plugins of mine:
 * - J-Base (used for drawing the logs properly onto the window)
 * - J-MessageTextCodes (used for translating text codes in logging)
 *
 * Integrates with others of mine plugins:
 * - J-ABS; enables logging of the player/allies/enemies' actions.
 * - J-SDP; enables logging of SDP gains.
 * ============================================================================
 * THE ACTION LOG
 * This log is designed for the player to view various interactions that happen
 * through the course of playing the game. While this plugin doesn't require
 * it, it was designed to be used with JABS.
 *
 * Things that get reported to the Action Log (with JABS):
 * - a skill being used (player/allies/enemies)
 * - a target being defeated (player/allies/enemies)
 * - a skill being learned (player/allies/enemies)
 * - a level up (player/allies)
 * - a state being applied to oneself (player/allies/enemies)
 * - a retaliation (player/allies/enemies)
 * - a skill being parried (player/allies/enemies)
 * - a skill being dodged (player/allies/enemies)
 * - a skill not affecting a target (player/allies/enemies)
 * - the act of party cycling (player)
 * - the experience gained (the leader, others gain it, but no logs are added)
 * - the sdp points found (the leader, others gain it, but no logs are added)
 *
 * Without JABS, nothing is added by default and must be woven into wherever
 * a developer wants it to show up since most usages and executions would
 * happen in a non-Scene_Map context.
 *
 * This window is effectively just a Window_Command under the covers, which
 * means it is nothing more special than your average Show Choices window or
 * what have you. However, it is not accessible to the keyboard or controller,
 * which means only a mouse may interact with it (due to the fact that it
 * cannot be "selected").
 *
 * ============================================================================
 * THE LOOT LOG
 * This log is designed for the player to exclusively messages related to items
 * and their acquisition or loss.
 *
 * Things that get reported to the Loot Log (with JABS):
 * - the gold found (on enemy defeat)
 * - an item being used (player)
 *   - also if the last item in the party's possession was used (player)
 *
 * Without JABS, nothing is added by default. It was a conscious decision not
 * to integrate the loot log with the Game_Party#gainItem() function- so that
 * other devs may have control over when it the logs are added, in case there
 * were items that should be added silently.
 *
 * ============================================================================
 * THE DIALOG
 * This log is designed for the player to view messages that occur while things
 * on the map are still executing. This portion of the plugin has nothing to do
 * with JABS and is not influenced by it.
 *
 * To add messages to the DiaLog, you'll need to utilize a plugin command.
 * In it, you will find the parameters are similar to that of a regular message
 * window, except that it is smaller, and in the upper right corner. You can
 * specify the message (max of three lines), and optionally a face image and
 * index to accompany the message to enable chatter that doesn't interrupt the
 * flow of gameplay.
 *
 * It is worth noting that the DiaLog window is an extended version of the
 * Action Log window, and bears many of the same sorts of functionality,
 * including the ability to scroll with the mouse and not control it with the
 * keyboard/controller. It will automagically become invisible after lack of
 * interaction.
 *
 * When setting up events that add to the DiaLog, it is encouraged to consider
 * using parallel events that add the messages with Waits in between each
 * message to give it a proper dialogue-like effect rather than dumping all the
 * messages in at once, but not being able to see them because the player has
 * to scroll up.
 *
 * ============================================================================
 * CHANGELOG:
 * - 2.2.0
 *    Added DiaLog functionality, enabling passive chats to happen on the map.
 *    Added Loot Log functionality, where loot-related logs now show up.
 *    Refactored around the various log-related classes.
 * - 2.1.0
 *    Refactor the text log manager to use different syntax.
 * - 2.0.1
 *    Small refactor of creation method aliasing.
 * - 2.0.0
 *    Refactored heavily the setup of log window.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @param defaultInactivityTime
 * @type number
 * @text Inactivity Timer Duration
 * @desc The duration in frames of how long before the window autohides itself.
 * @default 300
 *
 *
 * @command showActionLog
 * @text Show Action Log Window
 * @desc Turns the action log window visible to allow logs to be displayed.
 *
 * @command hideActionLog
 * @text Hide Action Log Window
 * @desc Turns the action log window invisible. Logs still get logged, but can't be seen.
 *
 * @command addActionLog
 * @text Add Log
 * @desc Arbitrarily create a log for the log window. Respects text codes.
 * @arg text
 * @type string
 * @default One potion was found!
 *
 * @command clearActionLog
 * @text Clear Action Logs
 * @desc Clears all the logs out of the action log.
 *
 *
 * @command showDiaLog
 * @text Show DiaLog Window
 * @desc Turns the adialog window visible to allow logs to be displayed.
 *
 * @command hideDiaLog
 * @text Hide DiaLog Window
 * @desc Turns the dialog window invisible. Logs still get logged, but can't be seen.
 *
 * @command addDiaLog
 * @text Add DiaLog
 * @desc Adds a single DiaLog into the DiaLog Window. Respects text codes.
 * @arg lines
 * @type multiline_string
 * @text Message
 * @desc The message for the window; it should never be more than 3 lines.
 * @default Hello World!
 * @arg faceName
 * @type file
 * @text Face Filename
 * @desc The filename for the face to use; use empty string for no face.
 * @default
 * @arg faceIndex
 * @type number
 * @text Face Index
 * @desc The index of the face on the given face file; use -1 for no face.
 * @min -1
 * @max 7
 * @default -1
 *
 * @command clearDiaLog
 * @text Clear DiaLog
 * @desc Clears all the logs out of the dialog log.
 *
 *
 * @command showLootLog
 * @text Show Loot Log Window
 * @desc Turns the action log window visible to allow logs to be displayed.
 *
 * @command hideLootLog
 * @text Hide Loot Log Window
 * @desc Turns the action log window invisible. Logs still get logged, but can't be seen.
 *
 * @command addLootLog
 * @text Add Loot Log
 * @desc Arbitrarily create a log for the log window. Respects text codes.
 * @arg lootId
 * @type number
 * @default 1
 * @arg lootType
 * @type select
 * @option Item
 * @value item
 * @option Weapon
 * @value weapon
 * @option Armor
 * @value armor
 *
 * @command clearLootLog
 * @text Clear Loot Logs
 * @desc Clears all the logs out of the action log.
 *
 */