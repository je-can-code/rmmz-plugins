---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.5.0
  - Fixed path searches never reaching their goal from a fractional position. Path searches are much faster and remember
    a failed search briefly. Requires J-Base 4.2.0.
### 1.4.0
  - Added <areaEvent:[WIDTH, HEIGHT]>, letting an event's page cover a rectangle of tiles. Added <relativeTransfer>,
    landing a transfer from an area as far along as the player crossed it.
### 1.3.1
  - Fixed tiles at the map's edge counting as enterable from off the map.
### 1.3.0
  - setPosition no longer rounds a character onto the tile grid. Under pixel movement the logical and real coordinates
    are the same position, so rounding one of them left the pair disagreeing with nothing in flight to reconcile them -
    which anything measuring distance travelled read as motion that never stopped.
### 1.2.1
  - Fixed a page-level move route pausing for its frequency after every pixel step instead of once per command.
### 1.2.0
  - Subcell passability is decided by PIXEL_CollisionManager.PassagePredicates and tile merging by SingleTileMerges, so
    a plugin adding a collision code teaches passability about it from its own tree instead of editing the manager.
### 1.1.0
  - Routed the _pixel namespace into its own save section, so pixel movement state lands in systems/pixel.json rather
    than inside the system blob.
### 1.0.3
  - Fixed Game_CharacterBase#pos comparing fractional coordinates for exact equality. Under pixel movement _x/_y are
    fractional almost always, so pos() matched only by coincidence and event-trigger lookups (Game_Map#eventsXy,
    startMapEvent) broke; coordinates are now rounded before the tile comparison.
  - Fixed Game_Character#moveRandom re-rolling a direction every frame. A "Move Random" route command repeats per frame
    to cover a tile of sub-pixel distance, so the character twitched in place instead of travelling; the rolled
    direction now holds for a full tile.
  - Fixed Game_CharacterBase#moveDiagonally facing the raw 8-direction composite code, which
    Sprite_Character#characterPatternY cannot interpret and rendered as a corrupted sprite-sheet row.
### 1.0.2
  - Fixed a jump-in-progress being teleported to its destination on frame one- Game_CharacterBase#update's
    render-coordinate snap now skips while isJumping() so updateJump's own interpolation is not overridden.
  - Moved the debug-overlay sample collector from a plain J.PIXEL.Debug object into its own PixelDebugSampler class; no
    functional change.
### 1.0.1
  - Optional foot-touch trigger delay after map setup (plugin parameter).
### 1.0.0
  - Initial release as standalone J-Pixelistics.
  - Sub-tile fractional-coordinate movement with AABB subcell collision grid.
  - Wall-sliding on cardinal and diagonal movement.
  - Visual depth pivot (characters rendered with feet at the tile center).
  - Vector (360-degree) movement via raw analog gamepad axes; falls back to 8-direction for keyboard and d-pad input.
  - Subcell collision debug overlay (toggle with backslash key).