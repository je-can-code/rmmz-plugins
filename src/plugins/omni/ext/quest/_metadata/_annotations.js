//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 OMNI-QUEST] Extends the Omnipedia with a Questopedia entry.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Omnipedia
 * @orderAfter J-Base
 * @orderAfter J-Omnipedia
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the Omnipedia by adding a new entry: The Questopedia.
 *
 * Integrates with others of mine plugins:
 * - J-Base             : always required for my plugins.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Cool details about this cool plugin go here.
 *
 * ============================================================================
 * SOMETHING KEY TO THIS PLUGIN:
 * Ever want to do something cool? Well now you can! By applying the
 * appropriate tag to across the various database locations, you too can do
 * cool things that only others with this plugin can do.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Skills
 * - etc.
 *
 * TAG FORMAT:
 *  <tag:VALUE>
 *    Where VALUE represents the amount to do.
 *
 * TAG EXAMPLES:
 *  <tag:100>
 * 100 of something will occur when this is triggered.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 101
 *
 *
 * @command do-the-thing
 * @text Add/Remove points
 * @desc Adds or removes a designated amount of points from all members of the current party.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 */
//endregion annotations