//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables sub-tile (pixel-accurate) movement on the map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
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
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- movement/collision tuning is
 * entirely plugin-parameter driven.
 * ============================================================================
 * CHANGELOG:
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