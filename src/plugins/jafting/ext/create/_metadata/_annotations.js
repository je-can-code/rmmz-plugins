//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 JAFT-Create] An extension for JAFTING to enable recipe creation.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-JAFTING
 * @orderAfter J-Base
 * @orderAfter J-JAFTING
 * @help
 * ============================================================================
 * OVERVIEW:
 * This plugin enables the "create" functionality of JAFTING.
 * The "create" functionality is a flexible but straight-forward adaptation of
 * a traditional crafting system.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-JAFTING; this is the actual recipe creation part of the framework.
 *
 * ============================================================================
 * CRAFTING:
 * Ever want to create some items and/or equips? Maybe also separate them into
 * various thematic categories as well? Well now you can! By using the J-MZ
 * Data Editor app, you can easily click your way through category and recipe
 * configuration creation!
 *
 * NOTE ABOUT RECIPE/CATEGORY CONFIGURATION:
 * It is important to note that this file is REQUIRED if you are using this
 * plugin. The configuration file is just a JSON file that lives in your /data
 * directory with other data files like your maps and database stuff, which
 * means you could hand-write it if you were a masochist, but that is highly
 * prone to error.
 *
 * It is strongly recommended to use the app I built for it.
 *
 * I literally built the app so that I didn't have to use the plugin manager's
 * really clumsy interface for configuring recipes.
 *
 *
 * USING THE DATA EDITOR
 * Obviously it would be difficult to describe this without the ability to use
 * images in here, but consider the following facts:
 *
 * RECIPE CATEGORY RELATIONSHIP
 * A recipe can belong to as many categories as you desire.
 * If you don't know any of the categories, the player won't have access to
 * the recipe to create in the scene.
 *
 * ABUSING THE HELPERS
 * It is strongly recommended to keep the component and category helper windows
 * up on the side or background to manipulate the various data points in them,
 * and also being able to clone the selected/relevant data into the respective
 * lists that they relate to.
 *
 * DEFAULT RECIPE FIELDS
 * Some of the fields of a recipe can be left blank.
 * When said fields are left blank, they will instead be populated with the
 * first item in the output list.
 * Those fields include:
 * - Name
 * - Description
 * - Icon Index (cannot be blank, set to -1 aka default)
 *
 * UNIQUENESS REQUIREMENTS
 * The Data Editor does not enforce it, but the keys of the list are required
 * to be unique. If you have duplicate keys, the last one found will be the
 * recipe representing the key. I suppose that isn't horrible, but it does seem
 * rather wasteful.
 *
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