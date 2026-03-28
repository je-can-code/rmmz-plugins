/* eslint-disable max-len */
//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 PIXEL] Enables sub-tile (pixel-accurate) movement on the map.
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
 * CHANGELOG:
 * - 1.0.0
 *    Initial migration from J-ABS-PixelMovement to standalone J-Pixelistics.
 *    Separated engine-facing movement logic from JABS-specific hooks.
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
