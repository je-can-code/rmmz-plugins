//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.1 HUD-INPUT] A HUD frame that displays your leader's buttons data.
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
 * This plugin has no additional configuration required.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This includes the following data points for the currently selected leader:
 * - mainhand, offhand, tool, and dodge/sprint action keys.
 * - while holding the skill trigger, skill keys show instead.
 * - ability costs for all keys, or item count remaining for tool.
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 1.1.1
 *    Wired HP skill cost into Sprite_SkillCost for display on action slots
 *    (requires J-Resources).
 * - 1.1.0
 *    Changed input to reflect a switch-view diamond in the center.
 *    Retroactively added this changelog.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */