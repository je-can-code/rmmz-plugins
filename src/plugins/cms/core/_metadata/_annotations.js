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
 * CHANGELOG:
 * - 1.2.1
 *    Resource amounts in the status list are rounded before being drawn. The gauge
 *    still fills from the exact value, so only the label changed.
 * - 1.2.0
 *    The menu gold strip is now a currency strip: CurrencyDefinition describes
 *    a currency, registerCoreCurrencies declares gold, and Window_Currencies
 *    renders however many are registered. Extensions add their own without
 *    touching the scene.
 * - 1.1.0
 *    Each party member's cell is now a character card rather than a data row.
 *    It is headed by their name with their class beneath it, carries their map
 *    sprite beside their portrait, and is banded into sections by rules.
 *    Level and remaining experience share a row, since a level means little
 *    without knowing how close the next one is.
 *    Resources are drawn as segmented gauges spanning the cell, marked by icon
 *    rather than by abbreviation and trailed by their current and maximum
 *    values.
 *    Afflicting states are listed by icon, and an actor suffering none says so
 *    rather than leaving the row blank.
 *    Every equipment slot is listed, with empty ones named and dimmed rather
 *    than omitted, so the block keeps its shape as gear comes and goes.
 *    A drawExtensionData hook sits alongside level and experience for other
 *    plugins to contribute to; it returns the position it finished at, so any
 *    number of them may each claim a row without knowing about one another.
 *    The party display no longer tints each cell behind its contents. That
 *    tint marks which row a cursor is on, and nothing selects a party member
 *    here- it advertised an interaction that does not exist.
 *    Fixed the party display overrunning the currency strip by the height of
 *    the control legend. It was measuring its own floor from the bottom of the
 *    screen by the strip's height rather than stopping at the strip's position,
 *    and the sixty pixels it overran were hidden underneath the very window
 *    that caused it.
 *    Command help text no longer refers to "this character", which pointed at
 *    a referent the menu never identifies.
 * - 1.0.0
 *    The initial release.
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