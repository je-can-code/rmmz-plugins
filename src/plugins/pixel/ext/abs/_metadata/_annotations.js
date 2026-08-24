 
//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Bridges J-Pixelistics with J-ABS for combat-aware pixel movement.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-ABS-AllyAI
 * @base J-Pixelistics
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-AllyAI
 * @orderAfter J-Pixelistics
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is J-ABS-Pixelistics: the JABS integration layer for
 * J-Pixelistics.
 *
 * It adapts JABS-specific behavior (ally AI formation movement, JABS battler
 * hitbox queries, action/projectile pixel distance scaling, and the dodge
 * step-count multiplier) to work with the fractional-coordinate system
 * provided by J-Pixelistics.
 *
 * ----------------------------------------------------------------------------
 * REQUIREMENTS
 * - J-Base  (any recent version)
 * - J-ABS   (v4.11.0+)
 * - J-Pixelistics (v1.0.0+)
 *
 * Load order in RPG Maker plugin manager:
 *   J-Base → J-ABS → J-Pixelistics → J-ABS-Pixelistics
 *
 * ----------------------------------------------------------------------------
 * HITBOX SIZE
 * Enemy battlers now share one rectangular hitbox model across:
 *  - PIXEL movement/body collision
 *  - JABS battler targeting/collision
 *  - JABS battler hitbox overlays
 *
 * The hitbox is centered horizontally on the event and anchored vertically to
 * the event's feet, meaning the feet are the bottom-center of the rectangle.
 *
 * Apply hitbox size in either place:
 *  - enemy note
 *  - event comments on the battler page
 *
 * If both exist, the event comment wins.
 * If neither exists, the plugin parameter defaults are used.
 *
 * Tag formats:
 *   <hitboxSize:N>
 *    Square shorthand. N is both the width and height in tiles.
 *
 *   <hitboxSize:[W, H]>
 *    Explicit rectangle. W is width in tiles, H is height in tiles.
 *
 * Examples:
 *   <hitboxSize:1.0>
 *    A 1.0 x 1.0 tile square hitbox.
 *
 *   <hitboxSize:[0.8, 0.5]>
 *    A rectangle 0.8 tiles wide and 0.5 tiles tall.
 *
 * ----------------------------------------------------------------------------
 * HITBOX REVEAL
 * Enemy battlers can optionally reveal a faint hitbox outline when the player
 * is nearby, using the same battler AABB model as combat collision.
 *
 * Apply reveal range in either place:
 *  - enemy note
 *  - event comments on the battler page
 *
 * If both exist, the event comment wins.
 * If neither exists, the plugin parameter default is used.
 *
 * Tag format:
 *   <hitboxReveal:N>
 *    Reveal this battler's hitbox outline while the player is within N tiles.
 *
 * Example:
 *   <hitboxReveal:4.5>
 *    The outline is visible when the player is within 4.5 tiles.
 *
 * If the default range is 0, then proximity-based outlines are disabled unless
 * the always-active plugin parameter is enabled.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.8
 *    Corrected PLUGIN_NAME from J-ABS-Pixelistics to J-Pixel-ABS, matching the
 *    name the ship has always been built and shipped under. The old spelling
 *    also read as an extension of J-ABS rather than of J-Pixelistics, which is
 *    the opposite of what this ship is.
 * - 1.0.7
 *    Overrode JABS_Battler#canDirectionalDodgeStepPass to gate directional
 *    dodge steps through PIXEL's own subcell passability
 *    (canPassDiagonalByDirection/canPassStraight) instead of the base
 *    tile-grid check.
 *    Added Game_CharacterBase#hasCustomPixelHitbox/getPixelAbsBattlerAabbModel
 *    default stubs (false/null), replacing duck-typing checks against
 *    optional methods with a real base contract.
 * - 1.0.6
 *    Added enemy `hitboxReveal` support for proximity-based hitbox outlines in `J-ABS-Pixelistics`.
 *    Added an always-active outline option and a default reveal-range plugin parameter.
 * - 1.0.5
 *    Added unified enemy `hitboxSize` support across PIXEL movement, JABS battler collision,
 *    and battler hitbox overlays.
 *    `event > enemy > default` precedence now applies to enemy hitbox sizing.
 *    Added default enemy hitbox width/height plugin parameters.
 * - 1.0.4
 *    `angleToDirection` folds atan2 vs `dir8ToAngle` degrees into one sector map so keyboard north and analog aim agree.
 * - 1.0.3
 *    `JABS_AiManager` and `JABS_Battler` integration for defensive dodge with pixel movement and formation rules.
 * - 1.0.2
 *    While strafe (direction fix) is active on the leader, projectile base direction follows
 *    sprite facing instead of movement vector — avoids firing opposite the drawn facing.
 * - 1.0.1
 *    Leader projectile aim uses vector / analog input (8-dir) so diagonals match movement.
 *    Sprites stay 4-dir; load order remains J-Base → J-ABS → J-Pixelistics → this plugin.
 * - 1.0.0
 *    Initial release as the JABS integration layer for J-Pixelistics.
 *    Pixel-aware idle wander state machine: idle enemies pick a random
 *    passable destination within the configured wander radius, walk to it,
 *    wait 2–5 seconds, then repeat.
 *    idleWanderRadius plugin parameter (default 1.5 tiles).
 *    Stuck detection: abandons unreachable destinations after 1.5s.
 *    Dodge step count scaled by subcell density so dodge distance matches
 *    the intended tile distance.
 *    Collision table rebuilt when an enemy is defeated.
 *    Smart pixel-aware movement for ally formation, retreating, and
 *    returning to home point.
 *    While the party leader is in pivot guard (one input: lock in place, guard
 *    when eligible), player map movement and dash reassert are disabled.
 * ============================================================================
 *
 *
 * @param idleConfigs
 * @text IDLE MOVEMENT
 *
 * @param idleWanderRadius
 * @parent idleConfigs
 * @type number
 * @decimals 2
 * @min 0.50
 * @max 10.00
 * @text Idle Wander Radius
 * @desc Distance in tiles from home an enemy may wander while idle. Default 1.5 gives a 3x3-tile area.
 * @default 1.50
 *
 * @param enemyHitboxConfigs
 * @text ENEMY HITBOX
 *
 * @param defaultEnemyHitboxWidth
 * @parent enemyHitboxConfigs
 * @type number
 * @decimals 2
 * @min 0.05
 * @text Default Enemy Hitbox Width
 * @desc Full enemy hitbox width in tiles when no event or enemy override exists.
 * @default 0.80
 *
 * @param defaultEnemyHitboxHeight
 * @parent enemyHitboxConfigs
 * @type number
 * @decimals 2
 * @min 0.05
 * @text Default Enemy Hitbox Height
 * @desc Full enemy hitbox height in tiles when no event or enemy override exists.
 * @default 0.50
 *
 * @param outlineAlwaysActive
 * @parent enemyHitboxConfigs
 * @type boolean
 * @text Outline Always Active
 * @desc If true, all eligible battler hitbox outlines are always visible regardless of range.
 * @default false
 *
 * @param defaultHitboxRevealRange
 * @parent enemyHitboxConfigs
 * @type number
 * @decimals 2
 * @min 0
 * @text Default Hitbox Reveal Range
 * @desc Reveal hitbox outlines within this many tiles when no event or enemy override exists. 0 disables proximity mode.
 * @default 6.00
 *
 */
//endregion annotations