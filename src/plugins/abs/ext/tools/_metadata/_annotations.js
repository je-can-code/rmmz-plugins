//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.0 TOOLS] Enable new tool-like tags for use with skills.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables new tags that give tool-like functionality to skills.
 *
 * Enables:
 * - NEW! added "gap close" aka "hookshot" functionality.
 *
 * TODO:
 * - gloves for carrying events.
 *
 * This plugin requires JABS.
 * ============================================================================
 * GAP CLOSING:
 * Have you ever wanted to be able to use a skill and gap close to a target
 * without having to take the painstaking effort of manually moving to the
 * given target? Well now you can! By applying the appropriate tags to various
 * database locations, you can enable/disable gap closing for your battlers!
 *
 * HEADS UP:
 * There are a number of tags required to make this work, so this will deviate
 * from normal tag explanations a bit.
 *
 * TAG USAGE:
 * (primarily)
 * - Events
 * - Skills
 * - Enemies
 *
 * (secondarily)
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <gapClose:key>
 * This tag is required on skills that you want to be "gap closing skills".
 * The key must match the key on the target for gap closing to occur.
 *
 *  <gapCloseTarget:key>
 * This tag is required on the things you want to be "gap closable", such as
 * enemies or on events representing enemies. This tag can also be applied to
 * things that a battler can be affected by, such as equipment or states.
 * The key must match the key on the skill for gap closing to occur.
 *
 * KEYS:
 * Keys are arbitrary strings (word characters only). They act as a namespace
 * so that different gap-close mechanics cannot accidentally cross-trigger.
 * For example, a hookshot skill with <gapClose:hookshot> will never warp the
 * player to an enemy bearing <gapCloseTarget:pierce>, and vice versa.
 *
 * EXAMPLE:
 *  <gapClose:hookshot> on skill ID 25.
 *  <gapCloseTarget:hookshot> on an event representing a grapple anchor.
 * Using skill 25 against that event will pull the player to it.
 *
 *  <gapClose:pierce> on skill ID 34 (spear pin).
 *  <gapCloseTarget:pierce> on state ID 4 (pinned state).
 * An enemy hit by skill 34 receives state 4.
 * Using skill 34 again against that pinned enemy will pull the player to it.
 * Hookshot anchors are unaffected because their key does not match.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Gap close tags now require a key: <gapClose:key> / <gapCloseTarget:key>.
 *    Keys must match for gap closing to occur — no cross-mechanic bypass.
 *    Removed canGapCloseByDefault plugin parameter.
 * - 1.0.3
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.2
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.1
 *    Consumed `RPGManager` update.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * @param grabThrowConfigs
 * @text GRAB AND THROW DEFAULTS
 *
 * @param grabThrowEnabled
 * @parent grabThrowConfigs
 * @type boolean
 * @text Grab and Throw Enabled
 * @desc True if grab and throw functionality is enabled globally by default.
 * @default true
 *
 * @param directionFixAlways
 * @parent grabThrowConfigs
 * @type boolean
 * @text Always Fix Throw Direction
 * @desc True if the throw direction is always fixed regardless of input.
 * @default false
 *
 */