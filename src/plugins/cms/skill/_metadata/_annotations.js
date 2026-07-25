//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A redesign of the skill menu.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * This is a redesign of the skill menu.
 * It includes the ability to see more parameters when inspecting skills.
 *
 * Will reveal various JABS data points.
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely a scene/window
 * redesign of the native skill menu. Cost display data is read via the
 * consuming plugins' own getters (e.g. J-Resources), not tags belonging to
 * this plugin.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Fixed long related-skill names overlapping the fixed-position
 *    required/current proficiency values; names now truncate with an
 *    ellipsis to fit the available column width.
 *    Migrated HP/MP/TP cost labels from TextManager.longParam(id) to the
 *    parameter catalog's parameterLabel('hcr'/'mcr'/'tcr').
 *    Replaced eval() with new Function() in the raw-damage preview.
 * - 1.0.1
 *    Added HP skill cost display to the skill detail window (requires J-Resources).
 *    Updated MP/TP cost display to reflect tag-based extra costs from J-Resources.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */