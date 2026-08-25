//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Extends the Omnipedia with a Questopedia entry.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Omnipedia
 * @orderAfter J-Base
 * @orderAfter J-Omnipedia
 * @orderAfter J-HUD
 * @orderAfter J-MessageTextCodes
 * @orderAfter J-ABS
 * @orderAfter J-ABS-InputManager
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
 * A Quest consists of a series of objectives.
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
 * by hand, but you'll probably want to visit my GitHub and swipe the
 * rmmz-data-editor project I've built that provides a convenient GUI for
 * generating and modifying quests in just about every way you could need.
 *
 * If this configuration file is missing, the game will not run.
 *
 * Additionally, due to the way RMMZ base code is designed, by loading external
 * files for configuration like this, a project made with this plugin will
 * simply crash when attempting to load in a web context with an error akin to:
 *    "ReferenceError require is not defined"
 * This error is a result of attempting to leverage nodejs' "require" loader
 * to load the "fs" (file system) library to then load the plugin's config
 * file. Normally a web deployed game will alternatively use "forage" instead
 * to handle things that need to be read or saved, but because the config file
 * is just that- a file sitting in the /data directory rather than loaded into
 * forage storage- it becomes inaccessible.
 * ============================================================================
 * BUILDING A QUEST
 * Ever want to build and manage quests in your RPG Maker MZ game? Well now you
 * can! By constructing the correct JSON to match your heart's deepest desires
 * for quests, you too can do questopedic things!
 *
 * TLDR;
 * Use my "rmmz-data-editor" to actually construct the data, please don't try
 * to hack this together manually by writing JSON.
 *
 * ============================================================================
 * QUEST-GATED EVENT PAGES AND CHOICES:
 * Beyond the JSON-authored quest data itself, this plugin adds tags that
 * gate event pages and "Show Choices" branches behind quest/objective
 * state, similar in spirit to J-MessageTextCodes' leader/switch choice
 * conditionals.
 *
 * NOTE ABOUT THE THREE ARGUMENT SHAPES:
 * All six tags below accept the array in one of three shapes, and behave
 * accordingly:
 *  [QUEST_KEY]
 *   Valid while the quest itself is active (any objective).
 *  [QUEST_KEY, OBJECTIVE_ID]
 *   Valid while that specific objective is active.
 *  [QUEST_KEY, OBJECTIVE_ID, STATE]
 *   Valid while that specific objective is in the given STATE, where STATE
 *   is one of: inactive, active, completed, failed, missed.
 *
 * TAG USAGE:
 * - Event pages (comment, gates the whole page like a normal page condition)
 * - "Show Choices" branches (comment, gates a single choice)
 *
 * TAG FORMAT:
 *  <pageQuestCondition:[QUEST_KEY]>
 *  <pageQuestCondition:[QUEST_KEY, OBJECTIVE_ID]>
 *  <pageQuestCondition:[QUEST_KEY, OBJECTIVE_ID, STATE]>
 *    Gates an entire event page.
 *
 *  <choiceQuestCondition:[QUEST_KEY]>
 *  <choiceQuestCondition:[QUEST_KEY, OBJECTIVE_ID]>
 *  <choiceQuestCondition:[QUEST_KEY, OBJECTIVE_ID, STATE]>
 *    Gates a single "Show Choices" branch.
 *
 * TAG EXAMPLES:
 *  <pageQuestCondition:[herbalist_delivery]>
 * This event page is only active while the "herbalist_delivery" quest is
 * active (in any objective state).
 *
 *  <pageQuestCondition:[herbalist_delivery, 2]>
 * This event page is only active while objective 2 of that quest is active.
 *
 *  <choiceQuestCondition:[herbalist_delivery, 2, completed]>
 * This choice is only shown while objective 2 of that quest is completed.
 * ============================================================================
 * CHANGELOG:
 * - 2.0.2
 *    Routed every quest and objective warning and error through J-Base's new
 *    Diagnostics, so each names J-OMNI-Quests. Removed the console.log lines
 *    narrating category changes, tracking toggles, index moves, quest additions
 *    and no-op state refreshes; none reported a fault.
 * - 2.0.1
 *    Repointed quest and objective update announcements at J-Log's new
 *    $mapLogs registry. The $diaLogManager global these called is gone.
 *    Requires J-Log 3.0.0 when J-Log is installed at all.
 * - 2.0.0
 *    Renamed from J-Omni-Questopedia to J-OMNI-Quests. The shipped file is
 *    renamed with it, so an existing plugins.js entry must be updated or the
 *    plugin will simply not load.
 * - 1.2.2
 *    Removed two console logs left over from testing.
 * - 1.2.1
 *    The questopedia description window no longer declares private members. A
 *    window's constructor reaches initialize, and through it the drawing
 *    hooks, before a derived class installs its own members- so anything
 *    private was being touched on an object that did not yet have it.
 * - 1.2.0
 *    The questopedia lookup cache is no longer written to savefiles. It held
 *    the same entries as the saveables it is built from, keyed for lookup,
 *    which made it the single largest thing in a savefile - 44,109 characters
 *    in a real one. It now rebuilds from the saveables on load.
 *    The destination timer is no longer written either; the map gets a fresh
 *    one, since it measures nothing the player can observe.
 * - 1.1.0
 *    Added <pageQuestCondition>/<choiceQuestCondition>, gating an event
 *    page or a single "Show Choices" branch behind quest/objective state
 *    (active quest, active objective, or a specific objective STATE:
 *    inactive/active/completed/failed/missed).
 * - 1.0.3
 *    Updated to accommodate for mapping shortcut to view quest log.
 *    Added flag for showing external file load info.
 * - 1.0.2
 *    Adapted for updates to J-ABS-InputManager (input namespace).
 * - 1.0.1
 *    Adds support for JABS-based input remapping.
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
 * @command unlock-quests
 * @text Unlock Quest(s)
 * @desc Unlocks a new quest for the player.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the quests that will be unlocked.
 * 
 * @command progress-quest
 * @text Progress Quest
 * @desc Progresses a given quest through by completing its current objective.
 * @arg key
 * @type string
 * @desc The unique key for the quest to progress.
 * 
 * @command finalize-quest
 * @text Finalize Quest
 * @desc Flags a quest as a given finalized state.
 * @arg key
 * @type string
 * @desc The unique key for the quest to progress.
 * @arg state
 * @text Finalized State
 * @desc The state to finalize the quest as.
 * @type select
 * @option Completed
 * @value 0
 * @option Failed
 * @value 1
 * @option Missed
 * @value 2
 * 
 * @command set-quest-tracking
 * @text Set Quest Tracking
 * @desc Sets whether or not a given quest is tracked.
 * @arg key
 * @type string
 * @desc The unique key for the quest to progress.
 * @arg trackingState
 * @desc True if the quest should be tracked, false otherwise.
 * @type boolean
 * @default true
 * @on Start Tracking Quest
 * @off Stop Tracking Quest
 * 
 */
//endregion annotations