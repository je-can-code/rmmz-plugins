//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A HUD frame that displays your party's data.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-HUD
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-HUD
 * @orderBefore J-ABS-Shield
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of the J-HUD system.
 *
 * This is the Party Frame, which displays the leader and allied members that
 * the player currently has in their party.
 *
 * This plugin requires JABS.
 * This plugin requires the base HUD.
 * This plugin has no additional configuration required.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This includes the following data points for all actors:
 * - face portrait
 * - hp gauge
 * - mp gauge
 * - tp gauge
 *
 * And the additional following data points for the currently selected leader:
 * - current level
 * - experience gauge
 * - positive/negative state tracking
 * - in combat indicator
 * - shield gauge (if using J-ABS-Shield)
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it purely reads live battler data
 * for display.
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 1.3.0
 *    Leader affliction rendering now delegates to J-HUD core's shared
 *    StateAfflictionHudPresenter/StateAfflictionHudLayoutSpec instead of a
 *    duplicated local implementation (removed ~300 lines of local code).
 *    Window backdrop opacity default changed from 32 to fully transparent (0).
 * - 1.2.0
 *    Integrated J-ABS-Shields; supports display for shield gauge.
 *    Updated many classes to use modern class syntax.
 *    Updated visuals for clarity across many aspects of the HUD.
 * - 1.1.0
 *    Added visual tracking indicator for "in combat" for the leader.
 *    Retroactively added this changelog.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */