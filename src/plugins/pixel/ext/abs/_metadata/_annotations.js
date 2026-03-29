/* eslint-disable max-len */
//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.0 PIXEL-ABS] Bridges J-Pixelistics with J-ABS for combat-aware pixel movement.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Pixelistics
 * @orderAfter J-Base
 * @orderAfter J-ABS
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
 * - J-ABS   (v4.7.1+)
 * - J-Pixelistics (v1.0.0+)
 *
 * Load order in RPG Maker plugin manager:
 *   J-Base → J-ABS → J-Pixelistics → J-ABS-Pixelistics
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Added pixel-aware idle wander state machine: idle enemies now pick a
 *    random destination within the configured wander radius, walk to it, wait
 *    a random pause (2–5 seconds), then repeat. Replaces the old single
 *    tile-step moveRandom behavior.
 *    Added idleWanderRadius plugin parameter (default 1.5 tiles).
 *    Added passability validation when rolling a wander destination; retries
 *    up to five times before falling back to a wait cycle.
 *    Added stuck detection: abandons an unreachable destination after 1.5s
 *    and waits before picking a new one.
 *    Fixed isHome using integer tile equality (always false with fractional
 *    coordinates); now uses distanceToHome() < 0.5.
 *    Fixed goHome using moveStraight (one pixel per frame); now delegates to
 *    smartMoveTowardCoordinates for smooth pixel-aware return.
 * - 1.0.0
 *    Initial extraction from J-ABS-PixelMovement (abs/ext/pixel) into the
 *    dedicated J-Pixelistics extension layer.
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
 */
//endregion annotations
