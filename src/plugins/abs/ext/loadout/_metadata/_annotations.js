//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A scene for managing every party member's combat loadout.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-InputManager
 * @orderAfter J-CMS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds a single scene showing every party member's assignable
 * combat slots at once, and lets the player change any of them.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; the skill slots being managed belong to JABS.
 * - J-ABS-InputManager; when present, slots are labelled with the inputs
 *   currently bound to them rather than with fixed button names.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This replaces the five separate assignment flows that previously lived on
 * the JABS quick menu- offhand, combat skills, dodge, tools, and usable items.
 * Each of those opened a pair of on-map windows, and every one of them operated
 * on the party leader alone, meaning an ally's loadout could not be adjusted
 * without first making that ally the leader.
 *
 * Here, every member is shown side by side. Moving between them is ordinary
 * horizontal cursor movement, because they are literally adjacent columns.
 *
 * The mainhand slot is deliberately absent. It is supplied by whichever weapon
 * the actor has equipped rather than chosen by the player, so presenting it
 * would imply an assignment that cannot be made.
 *
 * ----------------------------------------------------------------------------
 * ABOUT COMBAT SKILL INPUTS:
 * Combat skills are not bound to inputs directly. Each is the skill trigger
 * modifier held alongside one of the primary buttons, so the input shown for
 * those slots is assembled from the current binding of both halves. Remapping
 * either half is reflected here immediately.
 *
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- the slots it manages are defined by
 * JABS, and their contents are chosen by the player rather than tagged.
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
 * @desc When this switch is ON, this command is visible in the menu. Use 0 to always show it.
 * @default 0
 *
 * @param command-name
 * @parent parentConfig
 * @type string
 * @text Command Name
 * @desc The name the loadout command carries in the menu.
 * @default Loadout
 *
 * @param command-icon
 * @parent parentConfig
 * @type number
 * @text Command Icon
 * @desc The icon index the loadout command carries in the menu.
 * @default 77
 */
//endregion annotations
