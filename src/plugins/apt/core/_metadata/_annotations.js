//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.1 APT] A plugin that grants the ability to learn by gaining points.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-LevelMaster
 * @orderAfter J-Log
 * @orderAfter J-TextPops
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin grants the ability to learn skills by gaining points.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; acquire points from enemy kills and skill executions.
 * - J-LevelMaster; considers level difference for an AP multiplier.
 * - J-Log; log all AP gained.
 * - J-TextPops; display popups for AP gained.
 *
 * ----------------------------------------------------------------------------
 * DETAILS
 * This plugin lets actors learn skills by gaining AP (Aptitude Points).
 * As actors earn AP, it flows into the currently-active sources
 * (like Class/Weapons/Armor/States/Actor), and when a requirement is met:
 * the skill is learned.
 * - Only active sources on the actor receive AP. Change gear/class/state?
 *   Active sources change too.
 * - Multiple sources can point at the same skill; progress is tracked per
 *   source and the moment any teaching crosses its requirement, the skill
 *   becomes learned for the actor.
 *
 * ============================================================================
 * TEACHABLES
 * Ever want to have skills “teach themselves” while you play? Well now you
 * can! By applying the appropriate tags across the various database locations,
 * your actors will soak up AP from adventures and unlock those skills.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Weapons
 * - Armor
 * - States
 *
 * TAG FORMAT:
 *  <aptitude:[SKILL_ID, REQUIRED_AP]>
 *    Where SKILL_ID is the database id of the skill to learn,
 *    Where REQUIRED_AP is how much AP that source needs to teach it.
 *
 * TAG EXAMPLES:
 *  <aptitude:[12, 150]>
 * This source enables learning skill of id 12 once the owner gains 150 AP.
 * ============================================================================
 * AP
 * Ever want to gain AP so that you could learn all those skills that various
 * sources teach. Well now you can! By applying the appropriate tags onto
 * enemies, you too can gain AP when chopping up enemies.
 *
 * NOTE ABOUT LEVEL DIFFERENCE
 * There is a limit by default that prevents AP from being gained when the
 * actor level is too far above the enemy level. This is a plugin parameter
 * for your convenience. If you set the plugin parameter to -1, the
 * functionality will be disabled.
 *
 * TAG USAGE:
 * - Enemies only.
 *
 * TAG FORMAT:
 *  <ap:[AMOUNT]>
 *    Where AMOUNT is the amount of AP to be gained.
 *
 * TAG EXAMPLES:
 *  <ap:6>
 * This enemy will yield 6 AP upon defeat.
 *
 * ============================================================================
 * TIPS
 * ----------------------------------------------------------------------------
 * - Stack learnings: You can define the same skill on multiple sources. The UI
 *   will aggregate per‑source progress for that skill so you can see total vs.
 *   source contributions.
 * - Source lifetime: Only currently active sources on the actor receive AP
 *   (ex: changing class/equipment/states changes the active set of sources).
 * - J-ABS synergy: Pair enemy <ap:...> rewards with your encounter balance to
 *   tune progression alongside EXP.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    - Added emergency initialization for existing saves.
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
 * @default 107
 *
 * @param levelConfig
 * @text LEVEL-RELATED SETUP
 *
 * @param max-level-threshold
 * @parent levelConfig
 * @type number
 * @text Max Level Threshold
 * @desc The max allowed difference in level between actor and enemy to gain AP from.
 * @min -1
 * @default 10
 *
 * @command mod-ap-all
 * @text Add/Remove AP (Party)
 * @desc Adds or removes a designated amount of AP from all members of the current party.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
 *
 * @command mod-ap
 * @text Add/Remove AP
 * @desc Adds or removes a designated amount of AP from an actor by its id.
 * @arg actorId
 * @type actor
 * @desc The id of the actor to modify AP for.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
 */
//endregion annotations