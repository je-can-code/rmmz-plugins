//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables sub-tile (pixel-accurate) movement on the map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-Base-Save
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is J-Pixelistics: pixel-accurate movement for RPG Maker MZ.
 *
 * It replaces the default tile-locked movement with a fractional-coordinate
 * system, allowing characters to occupy any point within the map rather than
 * only the center of a tile. Sub-tile collision is handled via a subcell
 * table built from the engine's own tile passability data.
 *
 * All J-plugins that provide optional integration with this plugin (such as
 * J-ABS-Pixelistics for JABS combat support) load after this plugin.
 *
 * ----------------------------------------------------------------------------
 * DETAILS
 * Characters move in fractional tile units each frame (e.g. 0.15 tiles). A
 * subcell collision table (PIXEL_CollisionManager) is built on each map load,
 * dividing every tile into a configurable number of subcells (default 4x4).
 *
 * Collision is resolved by checking subcell edge crossings in the direction
 * of travel, using directional passability codes derived from the tileset.
 *
 * JABS integration (ally AI formation, smart battler movement, action
 * distance scaling, etc.) is handled by the separate J-ABS-Pixelistics
 * extension, which must be loaded after this plugin.
 *
 * ----------------------------------------------------------------------------
 * LAYERING
 * The source for this plugin is organized as follows:
 *   src/plugins/pixel/core  — this plugin (engine-facing movement)
 *   src/plugins/pixel/ext/abs  — JABS bridge (loads after J-ABS + this)
 *
 * ============================================================================
 * AREA EVENTS
 * An event normally stands on exactly one tile. A comment on one of its
 * pages can stretch that into a rectangle, so stepping onto any tile of it
 * counts as reaching the event: one wide exit along a map's edge, rather
 * than a row of identical events.
 *
 * TAG USAGE:
 * - Events on the map (page comment)
 *
 * TAG FORMAT:
 *  <areaEvent:[WIDTH, HEIGHT]>
 * Where WIDTH and HEIGHT are whole tiles, counted rightward and downward
 * from the tile the event itself stands on. Both must be at least 1.
 *
 * TAG EXAMPLES:
 *  <areaEvent:[5, 1]>
 * This page covers the event's own tile and the four to the right of it.
 *
 * An area belongs to the page that declares it, so a page without the tag
 * covers one tile again. It changes where the event counts as standing,
 * never the size of its body.
 *
 * ----------------------------------------------------------------------------
 * RELATIVE TRANSFERS
 * A transfer from an area can remember where along it the player crossed,
 * and land them just as far along on the other side.
 *
 * TAG USAGE:
 * - Events on the map (page comment), alongside <areaEvent>
 *
 * TAG FORMAT:
 *  <relativeTransfer>
 * Point the page's Transfer Player at where the event's own tile should
 * land. Every other tile of the area lands the same distance along, so
 * walking off a wide edge arrives at the matching spot on the next map.
 *
 * TAG EXAMPLES:
 *  <areaEvent:[20, 1]>
 *  <relativeTransfer>
 * Crossing eight tiles from the event lands the player eight tiles to the
 * right of where the Transfer Player points.
 *
 * The two maps' openings should line up tile for tile. A landing that would
 * fall off the destination map lands on its edge instead, and a warning in
 * the console names the transfer.
 * ============================================================================
 * CHANGELOG:
 * - 1.4.0
 *    Added <areaEvent:[WIDTH, HEIGHT]>, letting an event's page cover a rectangle
 *    of tiles. Added <relativeTransfer>, landing a transfer from an area as far
 *    along as the player crossed it.
 * - 1.3.1
 *    Fixed tiles at the map's edge counting as enterable from off the map.
 * - 1.3.0
 *    setPosition no longer rounds a character onto the tile grid. Under pixel
 *    movement the logical and real coordinates are the same position, so
 *    rounding one of them left the pair disagreeing with nothing in flight to
 *    reconcile them - which anything measuring distance travelled read as
 *    motion that never stopped.
 * - 1.2.1
 *    Fixed a page-level move route pausing for its frequency after every pixel
 *    step instead of once per command.
 * - 1.2.0
 *    Subcell passability is decided by PIXEL_CollisionManager.PassagePredicates and
 *    tile merging by SingleTileMerges, so a plugin adding a collision code teaches
 *    passability about it from its own tree instead of editing the manager.
 * - 1.1.0
 *    Routed the _pixel namespace into its own save section, so pixel movement
 *    state lands in systems/pixel.json rather than inside the system blob.
 * - 1.0.3
 *    Fixed Game_CharacterBase#pos comparing fractional coordinates for exact
 *    equality. Under pixel movement _x/_y are fractional almost always, so
 *    pos() matched only by coincidence and event-trigger lookups
 *    (Game_Map#eventsXy, startMapEvent) broke; coordinates are now rounded
 *    before the tile comparison.
 *    Fixed Game_Character#moveRandom re-rolling a direction every frame. A
 *    "Move Random" route command repeats per frame to cover a tile of
 *    sub-pixel distance, so the character twitched in place instead of
 *    travelling; the rolled direction now holds for a full tile.
 *    Fixed Game_CharacterBase#moveDiagonally facing the raw 8-direction
 *    composite code, which Sprite_Character#characterPatternY cannot interpret
 *    and rendered as a corrupted sprite-sheet row.
 * - 1.0.2
 *    Fixed a jump-in-progress being teleported to its destination on frame
 *    one- Game_CharacterBase#update's render-coordinate snap now skips
 *    while isJumping() so updateJump's own interpolation is not overridden.
 *    Moved the debug-overlay sample collector from a plain J.PIXEL.Debug
 *    object into its own PixelDebugSampler class; no functional change.
 * - 1.0.1
 *    Optional foot-touch trigger delay after map setup (plugin parameter).
 * - 1.0.0
 *    Initial release as standalone J-Pixelistics.
 *    Sub-tile fractional-coordinate movement with AABB subcell collision grid.
 *    Wall-sliding on cardinal and diagonal movement.
 *    Visual depth pivot (characters rendered with feet at the tile center).
 *    Vector (360-degree) movement via raw analog gamepad axes; falls back to
 *    8-direction for keyboard and d-pad input.
 *    Subcell collision debug overlay (toggle with backslash key).
 * ============================================================================
 *
 *
 * @param collisionConfigs
 * @text COLLISION SETUP
 *
 * @param collisionStepCount
 * @parent collisionConfigs
 * @type select
 * @option 1 (coarse)
 * @value 1
 * @option 2 (medium)
 * @value 2
 * @option 4 (fine, default)
 * @value 4
 * @text Subcells Per Tile
 * @desc The number of subcells to divide each tile into along each axis. Higher = more precise edges but more memory.
 * @default 4
 *
 * @param collisionRadius
 * @parent collisionConfigs
 * @type number
 * @decimals 2
 * @min 0.05
 * @max 0.49
 * @text Collision Radius
 * @desc Half-size of the character's square hitbox in tile units. 0.3 is a reasonable default.
 * @default 0.30
 *
 *
 * @param movementConfigs
 * @text MOVEMENT
 *
 * @param vectorMovementEnabled
 * @parent movementConfigs
 * @type boolean
 * @text Enable Vector (360°) Movement
 * @desc When true, the player can move at any angle via analog stick or mouse direction. Falls back to 8-dir if no analog input.
 * @default false
 *
 * @param footTouchEventDelayFrames
 * @parent movementConfigs
 * @type number
 * @min 0
 * @max 120
 * @text Foot Touch Trigger Delay (frames)
 * @desc After a map loads, suppress Player Touch / Event Touch on the tile under the player for this many frames (0 = off). Reduces spurious saves after load.
 * @default 15
 *
 *
 * @param debugConfigs
 * @text DEBUG
 *
 * @param overlayInitiallyVisible
 * @parent debugConfigs
 * @type boolean
 * @text Overlay Initially Visible
 * @desc Show the subcell collision overlay on map load. Toggle at runtime with the backslash key.
 * @default false
 *
 */
//endregion annotations