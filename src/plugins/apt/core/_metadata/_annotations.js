//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A plugin that grants the ability to learn by gaining points.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-LevelMaster
 * @orderAfter J-Log
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin grants the ability to learn skills by gaining points.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; acquire points from enemy kills and skill executions.
 * - J-LevelMaster; gates AP gain entirely (all-or-nothing, not a scaling
 *   multiplier) once the actor is too many levels above the enemy.
 * - J-Log; log all AP gained.
 * - J-Popups (+ J-Popups-APT); display popups for AP gained.
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
 *  <aptitude:[12,150]>
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
 *  <ap:AMOUNT>
 *    Where AMOUNT is the amount of AP to be gained.
 *
 * TAG EXAMPLES:
 *  <ap:6>
 * This enemy will yield 6 AP upon defeat.
 *
 * ============================================================================
 * AP RATE MULTIPLIER
 * Ever want an actor to earn AP faster (or slower) than everyone else? Well
 * now you can! By applying the appropriate tag across the various database
 * locations, you can boost or reduce how much AP that actor actually banks
 * from every gain.
 *
 * NOTE:
 * The format implies whole numbers, not actual multipliers like 1.3. All
 * matching tags across an actor's active note sources sum together before
 * being applied as a single rate against the raw AP amount- same pattern as
 * J-SDP's sdpMultiplier. Also stacks with any SDP panel bonus for the "apr"
 * parameter key, if J-SDP is loaded.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <aptMultiplier:AMOUNT>    (for positive)
 *  <aptMultiplier:-AMOUNT>   (for negative)
 *
 * TAG EXAMPLES:
 *  <aptMultiplier:25>
 * An actor with something equipped/applied that has the above tag now gains
 * 25% increased AP from every source.
 *
 *  <aptMultiplier:80>
 *  <aptMultiplier:-30>
 * An actor with something equipped/applied that has both of the above tags
 * now gains 50% increased AP (80 - 30 = 50).
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
 * - 1.3.1
 *    Fixed an aptitude multiplier of zero awarding the full unscaled amount. The
 *    guard tested truthiness, so the one value that must scale the award away
 *    entirely was the one value that skipped scaling.
 * - 1.3.0
 *    Routed the _aptitude namespace into its own save section, so aptitude
 *    state lands in systems/aptitude.json rather than inside the system blob.
 * - 1.2.0
 *    Learning a skill through an aptitude now announces in the dia log, naming
 *    the aptitude source, instead of only producing a floating text pop on the
 *    same visual channel as damage numbers and gold.
 *    Retrofitted the aptitude viewer onto the shared actor skeleton.
 *    The actor ribbon is now one row tall and no longer teaches controls.
 *    Fixed an accessor calling itself rather than assigning its field.
 *    Command windows now seed state in initMembers, early enough for
 *    makeCommandList to see it.
 * - 1.1.0
 *    Added AP rate multiplier via <aptMultiplier:AMOUNT>, registered with
 *    the shared parameter catalog (apr) with an SDP panel binding.
 *    J-LevelMaster integration is now an all-or-nothing gate on AP gain
 *    once the actor is too many levels above the enemy, replacing the old
 *    scaling multiplier; reads $gameSystem.isLevelScalingEnabled() instead
 *    of the static plugin metadata flag.
 *    Fixed stale requiredAp: a learning's persisted requiredAp now re-syncs
 *    to the live notetag value every time its source grants AP, instead of
 *    being frozen at whatever value existed the first time it was touched.
 *    Added refresh-required-ap / refresh-required-ap-all plugin commands to
 *    manually repair saves that had already gone stale before this fix.
 * - 1.0.3
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.2
 *    Updated to be more extensible for extensions.
 *    Fixed issue with parsing inputs for aptitude progresses.
 * - 1.0.1
 *    Added emergency initialization for existing saves.
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
 * @default 10
 *
 * @command mod-ap
 * @text Add/Remove AP
 * @desc Adds or removes a designated amount of AP from an actor by its id.
 * @arg actorId
 * @type actor
 * @desc The id of the actor to modify AP for.
 * @default 1
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
 * @default 10
 *
 * @command refresh-required-ap-all
 * @text Refresh Required AP (Party)
 * @desc Re-syncs persisted aptitude requiredAp values against current notetags for all party members.
 *
 * @command refresh-required-ap
 * @text Refresh Required AP
 * @desc Re-syncs persisted aptitude requiredAp values against current notetags for an actor by its id.
 * @arg actorId
 * @type actor
 * @desc The id of the actor to refresh aptitude requirements for.
 * @default 1
 */
//endregion annotations