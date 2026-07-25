//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A HUD frame that displays your leader's buttons data.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-HUD
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-HUD
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of the J-HUD system.
 *
 * This is the Input Frame, which displays the various action keys and their
 * corresponding cooldown and cost data points for the leader of the party.
 *
 * This plugin requires JABS.
 * This plugin requires the base HUD.
 * See plugin parameters below for configuration options.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This includes the following data points for the currently selected leader:
 * - mainhand, offhand, tool, and dodge/sprint action keys.
 * - while holding the skill trigger, skill keys show instead.
 * - ability costs for all keys, or item count remaining for tool.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it purely reads live JABS skill
 * slot/cooldown/cost data for display.
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 1.2.0
 *    Cooldown overlay icon: a configurable icon renders over skill slots that
 *    are currently on cooldown, making unavailability obvious at a glance.
 *    Pulse animation: a brief scale pop fires whenever a slot becomes newly
 *    available (base cooldown finished or combo window opens).
 *    Combo expire gauge: the cooldown gauge switches to a warm orange-to-yellow
 *    color and counts down the combo expiry window while a follow-up is live,
 *    then returns to the base cooldown display after the window closes.
 * - 1.1.2
 *    Combo cooldown gauge merges J-ABS global cooldown (GCD) for GCD-subject
 *    skill slots (not tool/dodge).
 * - 1.1.1
 *    Wired HP skill cost into Sprite_SkillCost for display on action slots
 *    (requires J-Resources).
 * - 1.1.0
 *    Changed input to reflect a switch-view diamond in the center.
 *    Retroactively added this changelog.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param cooldownOverlayIconIndex
 * @type number
 * @text Cooldown Overlay Icon
 * @desc Icon index to overlay on skill slots that are currently on cooldown.
 * @default 90
 */