//region annotations
/*:
 * @target MZ
 * @plugindesc [CAMODS] JS Mods exclusive to Chef Adventure.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @help
 * ============================================================================
 * OVERVIEW
 * These modifications of code are modifications against various components of
 * the core scripts. Additionally, plugins I've written are also modified here
 * in a way that I consider "not-mainstream enough" to be published as a part
 * of the original plugins.
 *
 * NOTE ABOUT USING THIS "PLUGIN":
 * While I do list below the various changes that are provided by this plugin
 * modifier, I do not intend to support this as a public plugin, so you should
 * probably not use this plugin unless you want 100% of the functionality
 * listed below, or are able to tweak/adjust the code yourself.
 *
 * This is also NOT a versioned plugin, and can potentially change without
 * any notification.
 *
 * Use with caution!
 *
 * ============================================================================
 * SYSTEM CHANGES:
 * - variable assignment for tracking a wide variety of battle data points
 * - additional equip slot for all actors (as accessory)
 * - "recover all" recovers TP too
 * - prevent passage on tileset terrain id 1
 * - random variable assignment for "rare/named enemies" on map transfer
 * - removal of touch buttons from base/map/menu scenes
 *
 * ----------------------------------------------------------------------------
 * CA-UNIQUE CHANGES:
 * - forces the previous leader to be in the second party slot after cycling.
 * - loot drop x,y adjustment unique to CA
 * - anti-null elementIds hard-coded
 * - mini floor-damage system built with tags (TODO: replace with plugin?)
 * - drop sources for enemies modified to include states and party drop sources
 *
 * ============================================================================
 */
//endregion annotations