//region introduction
 
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A layered difficulty system.
 * @base J-Base
 * @orderAfter J-Base
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-DropsControl
 * @orderAfter J-SDP
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables the ability to apply one to many "difficulty layers",
 * defined as a collection of parameter modifications and bonuses against both
 * actors and enemies alike.
 * ----------------------------------------------------------------------------
 * NOTE:
 * There are no tags for this plugin.
 * All difficulties are defined in an external JSON file.
 * ============================================================================
 * CHANGELOG:
 * - 2.1.2
 *    Difficulty scaling can no longer reduce max hp below one. The engine floors
 *    it at one inside its own param call, and the difficulty multiplier was
 *    applied to the result - outside that clamp - so a max hp multiplier of zero
 *    produced a battler with no maximum hp and broke every ratio computed from
 *    it. Other parameters still scale to zero, which is a legitimate setting.
 * - 2.1.1
 *    The difficulty points window no longer declares private members. A
 *    window's constructor reaches initialize, and through it the drawing
 *    hooks, before a derived class installs its own members- so anything
 *    private was being touched on an object that did not yet have it.
 * - 2.1.0
 *    Routed the _difficulty namespace into its own save section, so difficulty
 *    state lands in systems/difficulty.json rather than in the system blob.
 *    Moved the _difficulty namespace seeding from the initialize alias to
 *    initMembers, so a decoded save can establish it without a constructor.
 * - 2.0.2
 *    Fixed the scene's initMembers chain never reaching Scene_Base, which left
 *    the modal dimmer field unseeded. getModalDimmerWindow guards on === null,
 *    so undefined slipped straight past it and showModalDimmer dereferenced it.
 *    Command windows now seed state in initMembers, early enough for
 *    makeCommandList to see it.
 * - 2.0.1
 *    Added flag for showing external file load info.
 *    Removed dead plugin parameter inputs.
 * - 2.0.0
 *    Updated window layout of scene.
 *    Added multiple layer application support.
 *    Updated difficulty layers to also be applicable to actors if desired.
 *    Refactored a lot of underlying code.
 *    Externalized difficulty layer data.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param difficultyConfigs
 * @text DIFFICULTY SETUP
 *
 * @param initialPoints
 * @parent difficultyConfigs
 * @type number
 * @text Starting Points
 * @desc The number of points the player has available from the start of a new game.
 * @default 10
 *
 * @param defaultDifficulty
 * @parent difficultyConfigs
 * @type string
 * @text Default Difficulty
 * @desc The key of the starting or default difficulty before it is decided.
 * @default 000_default
 *
 * @command callDifficultyMenu
 * @text Call Difficulty Menu
 * @desc Calls the difficulty menu regardless of the current scene.
 *
 * @command lockDifficulty
 * @text Lock Difficulty
 * @desc Locks a difficulty, making it unchoosable in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be locked.
 *
 * @command unlockDifficulty
 * @text Unlock Difficulty
 * @desc Unlocks a difficulty, making it choosable in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be unlocked.
 *
 * @command hideDifficulty
 * @text Hide Difficulty
 * @desc Hides a difficulty, preventing it from being added to the list in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be hidden.
 *
 * @command unhideDifficulty
 * @text Unhide Difficulty
 * @desc Shows a difficulty, forcing it to be added to the list in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be unhidden.
 *
 * @command enableDifficulty
 * @text Enable Difficulty
 * @desc Enables a difficulty, applying its effects.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be enabled.
 *
 * @command disableDifficulty
 * @text Disable Difficulty
 * @desc Disables a difficulty, rendering its effects inactive.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be disabled.
 *
 * @command modifyLayerMax
 * @text Modify Layer Max
 * @desc Modifies the maximum difficulty layer points by the given amount.
 * @arg amount
 * @type number
 * @desc The amount to modify the max layer points by. This can be negative.
 * @min -999999
 * @max 999999
 */
 