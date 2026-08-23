//region annoations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Renders a passability-driven minimap on the screen.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-HUD
 * @orderAfter J-TIME
 * @orderAfter J-ABS-InputManager
 * @orderAfter J-Base-Save
 * @orderAfter J-Omnipedia
 * @orderAfter J-OMNI-Quests
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
 *    The player is a teal plus-shape marker.
 * - Follower
 *    The followers of the player are sky-blue square markers.
 * - JABS Enemy (hostile)
 *    Does not show up at all if not using JABS. Rendered as a red diamond.
 * - JABS Enemy (inanimate)
 *    Enemy-backed but non-combative objects (pots, crates). Rendered as an
 *    orange diamond.
 * - NPC
 *    An NPC event marker is rendered as a bright purple circle shape.
 * - Loot
 *    A loot event marker is rendered as a bright green diamond shape.
 * - Interactable Object
 *    An object event marker is rendered as a yellow diamond shape.
 * - Teleport
 *    A hollow light-blue square. Can be stretched to represent a
 *    multi-tile teleport zone with <areaEvent:WxH> (see below).
 * - Quest Offer
 *    A yellow square marking a quest available to accept.
 * - Quest Progress
 *    A blue diamond marking where to advance a quest's next objective.
 * - Quest Turn-In
 *    A green circle marking where to complete/turn in a quest.
 *
 * If multiple marker tags are present on a single event, the last one
 * found will be prioritized.
 *
 * TAG USAGE:
 * - Events on the map
 *
 * TAG FORMAT:
 *  <minimap:MARKER_TYPE> or <mm:MARKER_TYPE>
 * Where MARKER_TYPE is one of "npc", "loot", "object", "teleport",
 * "questOffer", "questProgress", or "questTurnIn" (without quotes).
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
 *  <minimap:teleport> or <mm:teleport>
 * An event with this tag will show up as a hollow-square teleport marker.
 *
 * ----------------------------------------------------------------------------
 * TELEPORT ZONE SIZE
 * By default, a <minimap:teleport> marker is drawn as a single-tile hollow
 * square. If the teleport actually spans multiple tiles, stretch its marker
 * to match using this tag on the same event.
 *
 * TAG USAGE:
 * - Events on the map (typically alongside <minimap:teleport>)
 *
 * TAG FORMAT:
 *  <areaEvent:WIDTHxHEIGHT>
 * Where WIDTH and HEIGHT are the tile dimensions of the zone. Defaults to
 * 1x1 (a single tile) if this tag is absent or malformed.
 *
 * TAG EXAMPLES:
 *  <minimap:teleport>
 *  <areaEvent:3x2>
 * This teleport event's minimap marker is stretched to a 3-wide by 2-tall
 * hollow square instead of a single tile.
 *
 * ============================================================================
 * BLOCKING THE MINIMAP:
 * Some maps- like tight indoor corridors, cutscene-only maps, or maps where
 * you simply don't want the minimap distracting the player- can suppress
 * the minimap outright.
 *
 * TAG USAGE:
 * - Maps (the map's own note field)
 *
 * TAG FORMAT:
 *  <blockMinimap>
 *
 * TAG EXAMPLES:
 *  <blockMinimap>
 * The minimap never renders while the player is on this map, regardless of
 * the plugin's "Start Visible" setting or any toggle command.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.2.0
 *    Routed the _map namespace into its own save section, so minimap state
 *    lands in systems/map.json rather than inside the system blob.
 * - 1.1.0
 *    Added an orange-diamond minimap marker for inanimate JABS enemies
 *    (pots, crates), distinct from the red-diamond hostile marker.
 *    Added <minimap:teleport>/<mm:teleport> markers (hollow light-blue
 *    square), stretchable to a multi-tile zone via <areaEvent:WxH>.
 *    Added quest markers (questOffer/questProgress/questTurnIn) for
 *    Omni-Quest integration.
 *    Added <blockMinimap> to suppress the minimap outright on a given map.
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