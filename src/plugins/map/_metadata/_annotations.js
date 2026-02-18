//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.2 MAP] Renders a passability-driven minimap on the screen.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-HUD
 * @orderafter J-TIME
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin renders a minimap onto the map.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; reveals battlers on the map.
 * - J-HUD; respects "should hide HUD" logic.
 * - J-TIME; visibility syncs with TIME window if available.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The minimap will render the player, your followers, and if using JABS, it'll
 * also render enemy battlers and any dropped loot.
 *
 * You can use the plugin commands to toggle minimap visibility.
 *
 * ============================================================================
 * PLUGIN PARAMETERS BREAKDOWN:
 * - Minimap X:
 *    Represents the X coordinate this will be rendered at by default.
 *    -1 = will automatically show up at the bottom right.
 * - Minimap Y:
 *    Represents the Y coordinate this will be rendered at by default.
 *    -1 = will automatically show up at the bottom right.
 * - Start Visible:
 *    Whether or not this minimap should be rendered when a game is started.
 *    This state is false by default, and is not persisted into game state.
 * - Respect JABS HUD Visibility:
 *    Whether or not to sync the show/hide toggling with the rest of the JABS
 *    HUD elements.
 * - Overlap Opacity %:
 *    The opacity to switch to when the player overlaps with the minimap.
 *
 * ============================================================================
 * PLUGIN COMMAND BREAKDOWN:
 * - Toggle Minimap:
 *    Choose to show/hide the minimap on-demand.
 *
 * ============================================================================
 * MINIMAP MARKER TAGS
 * Have you ever wanted your minimap to reveal particular events as one of a
 * few categories, like NPCs, loot, or interactable objects? Well now you can!
 * By adding the appropriate tags to the desired events inside a comment event
 * command, you too can have your minimap decorated with additional markers!
 *
 * NOTE ABOUT MARKER TYPES
 * There are multiple marker types that show up on the minimap, here is a
 * brief description of all of them:
 * - Player
 *    The player is usually at the center of the map and has a teal-green
 *    colored plus for its shape.
 * - Follower
 *    The followers of the player are a sky-blue colored smaller squares.
 * - JABS Enemy
 *    These do not show up at all if not using JABS.
 *    They are rendered as red diamond shapes.
 * - NPC
 *    An NPC event marker is rendered as a bright purple circle shape.
 * - Loot
 *    A loot event marker is rendered as a bright green diamond shape.
 * - Interactable Object
 *    An object event marker is rendered as a yellow square shape.
 *
 * If multiple marker tags are present on a single event, the last one
 * found will be prioritized.
 *
 * TAG USAGE:
 * - Events on the map
 *
 * TAG FORMAT:
 *  <minimap:MARKER_TYPE> or <mm:MARKER_TYPE>
 * Where MARKER_TYPE is one of "npc", "loot", or "object" (without quotes).
 *
 * TAG EXAMPLES:
 *  <minimap:npc> or <mm:npc>
 * An event with this tag will show up as an NPC marker on the minimap.
 * 
 *  <minimap:loot> or <mm:loot>
 * An event with this tag will show up as a loot marker on the minimap.
 * 
 *  <minimap:object> or <mm:object>
 * An event with this tag will show up as an object marker on the minimap.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.2
 *    Adapted for updates to J-ABS-InputManager (input namespace).
 * - 1.0.1
 *    Adds support for JABS-based input remapping.
 *    Removes connection between TIME system and minimap visibility.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @param BASEconfigs
 * @text BASE SETUP
 *
 * @param minimapX
 * @parent BASEconfigs
 * @type number
 * @min -1
 * @text Minimap X
 * @desc X position of the minimap in screen pixels; -1 = auto bottom-right.
 * @default -1
 *
 * @param minimapY
 * @parent BASEconfigs
 * @type number
 * @min -1
 * @text Minimap Y
 * @desc Y position of the minimap in screen pixels; -1 = auto bottom-right.
 * @default -1
 *
 * @param startVisible
 * @parent BASEconfigs
 * @type boolean
 * @text Start Visible
 * @desc If true, the minimap starts visible on new game/load.
 * @on Visible
 * @off Hidden
 * @default true
 *
 * @param respectHudHide
 * @parent BASEconfigs
 * @type boolean
 * @text Respect JABS HUD Visibility
 * @desc If true, the minimap hides when the HUD is hidden via input.
 * @on Respect
 * @off Ignore
 * @default true
 *
 * @param overlapOpacityPercent
 * @parent BASEconfigs
 * @type number
 * @min 0
 * @max 100
 * @text Overlap Opacity (%)
 * @desc Minimap alpha when overlapping other windows (0=invisible,100=opaque).
 * @default 40
 *
 *
 * @command toggle-minimap
 * @text Toggle MiniMap
 * @desc Toggles visibility of the minimap to the designated state.
 * @arg action
 * @type boolean
 * @desc True for visible, false for invisible.
 * @default true
 */
//endregion annotations