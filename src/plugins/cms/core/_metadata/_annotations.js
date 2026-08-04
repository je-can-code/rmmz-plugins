//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A redesign of the main menu.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * This is a redesign of the main menu.
 *
 * As the "core" of the CMS family, this plugin also carries the shared
 * parameter-catalog rendering (grouping, chrome, layout) that other CMS
 * scenes build on, so it must be enabled and ordered before them.
 * ============================================================================
 * COMMAND HELP TEXT
 * The main menu describes the highlighted command in a help window along the
 * top. Each of the engine's own commands has its description configured here,
 * because those commands belong to the engine rather than to any plugin.
 *
 * Commands contributed by other plugins carry their own descriptions, supplied
 * where that plugin builds its command. This plugin neither knows nor needs to
 * know what those commands are.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely a scene/window
 * redesign of the native main menu.
 * ============================================================================
 *
 * @param parentConfig
 * @text COMMAND DESCRIPTIONS
 *
 * @param help-item
 * @parent parentConfig
 * @type multiline_string
 * @text Inventory
 * @desc Describes the inventory command in the menu's help window.
 * @default Review and use the items the party is carrying.
 *
 * @param help-skill
 * @parent parentConfig
 * @type multiline_string
 * @text Abilities
 * @desc Describes the abilities command in the menu's help window.
 * @default Review the abilities you've learned.
 *
 * @param help-equip
 * @parent parentConfig
 * @type multiline_string
 * @text Equipment
 * @desc Describes the equipment command in the menu's help window.
 * @default Change the weapons and armor you have equipped.
 *
 * @param help-status
 * @parent parentConfig
 * @type multiline_string
 * @text Status
 * @desc Describes the status command in the menu's help window.
 * @default Inspect your parameters in detail.
 *
 * @param help-options
 * @parent parentConfig
 * @type multiline_string
 * @text Options
 * @desc Describes the options command in the menu's help window.
 * @default Adjust sound, display, and other game settings.
 *
 * @param help-save
 * @parent parentConfig
 * @type multiline_string
 * @text Save
 * @desc Describes the save command in the menu's help window.
 * @default Record your progress to a save file.
 *
 * @param help-gameEnd
 * @parent parentConfig
 * @type multiline_string
 * @text Exit
 * @desc Describes the exit command in the menu's help window.
 * @default Return to the title screen or close the game.
 *
 * @param help-formation
 * @parent parentConfig
 * @type multiline_string
 * @text Formation
 * @desc Describes the formation command in the menu's help window.
 * @default Rearrange the order of the party.
 */
//endregion Introduction