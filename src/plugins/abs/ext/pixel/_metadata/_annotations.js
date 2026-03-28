/*:
 * @target MZ
 * @plugindesc
 * [v1.0.1 PIXEL] WIP Enables pixel movement.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @help
 * ==============================================================================
 * Enables 8-directional pixel movement.
 *
 * This is a Work In Progress.
 *
 * This is almost entirely complete as a functional pixel movement plugin, but
 * I encountered some issues that I just couldn't solve.
 *
 * The current issues of the plugin are:
 *
 * The Hitbox of player is anchored to the top left point (0,0) of the character
 * sprite image, resulting in your average character sprite looking like it was
 * able to step about half of a tile onto impassible terrain from the left/top,
 * and getting blocked prematurely about a half of a tile by invisible terrain
 * when approaching impassible terrain from the bottom/right.
 *
 * Additional modifications will be necessary to accommodate action sprites in
 * JABS as they aren't adapted currently and will travel very little distance if
 * they are projectiles with fixed distance.
 *
 * Additional modifications will be necessary to accommodate events and their
 * movement routes with respect to pixel movement.
 * ==============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.0
 *    The initial release.
 * ==============================================================================
 * As a courtesy, the plugin started as:
 * https://github.com/gsioteam/rmmz_movement
 */