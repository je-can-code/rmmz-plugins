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
 * @orderAfter J-MessageTextCodes
 * @orderAfter J-Omnipedia
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the Omnipedia by adding a new entry: The Questopedia.
 *
 * Integrates with others of mine plugins:
 * - J-Base             : always required for my plugins.
 * - J-Messages         : adds \quest[questKey] message codes.
 * - J-HUD              : adds a quest tracker window.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * "The Questopedia" is another module for the Omnipedia.
 * It provides a log for tracking and managing quests in a somewhat organized
 * fashion.
 *
 * Quests are described by a collection of data points in the config file.
 * (see the IMPORTANT NOTE down below)
 * These data points together define the metadata of a quest. They include:
 * - name
 * - key
 * - categoryKey
 * - tagKeys
 * - unknownHint
 * - overview
 * - recommendedLevel
 * - objectives
 *   - id
 *   - type
 *   - description
 *   - fulfillmentData
 *   - fulfillmentQuestKeys
 *   - hiddenByDefault
 *   - isOptional
 *   - logs
 *     - discovered
 *     - completed
 *     - failed
 *     - missed
 *
 * You can see that there is a lot of data, but this is what you need to know:
 * A Quest is comprised of a series of objectives.
 * Each objective should be identifiable as a single distinct task.
 * Each objective can be categorized into one of five categories of objective.
 *
 * Remembering the above will keep you in the right mindset to fill in the
 * rest of the details. Some of the rest of the details are just text you'll
 * find across the GUI for the system. The rest of the rest of the details are
 * a means to link objectives and quest data together.
 *
 * Read the "BUILDING A QUEST" section for more information about the details.
 *
 * IMPORTANT NOTE:
 * The Quest data is derived from an external file rather than the plugin's
 * parameters. This file lives in the "/data" directory of your project, and
 * is called "config.quest.json". You can absolutely generate/modify this file
 * by hand, but you'll probably want to visit my github and swipe the
 * rmmz-data-editor project I've built that provides a convenient GUI for
 * generating and modifying quests in just about every way you could need.
 *
 * If this configuration file is missing, the game will not run.
 *
 * Additionally, due to the way RMMZ base code is designed, by loading external
 * files for configuration like this, a project made with this plugin will
 * simply crash when attempting to load in a web context with an error akin to:
 *    "ReferenceError require is not defined"
 * This error is a result of attempting to leverage nodejs's "require" loader
 * to load the "fs" (file system) library to then load the plugin's config
 * file. Normally a web deployed game will alternatively use "forage" instead
 * to handle things that need to be read or saved, but because the config file
 * is just that- a file sitting in the /data directory rather than loaded into
 * forage storage- it becomes unaccessible.
 * ============================================================================
 * BUILDING A QUEST
 * Ever want to build and manage quests in your RPG Maker MZ game? Well now you
 * can! By constructing the correct JSON to match your heart's deepest desires
 * for quests, you too can do questopedic things!
 *
 * WIP: see rmmz-data-editor... eventually.
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