//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Map text popups for JABS and beyond.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @param disablePopups
 * @text Disable all map popups
 * @type boolean
 * @default false
 * @desc When true, addTextPop ignores new pops.
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is the core of the J-Popups system.
 *
 * Have you ever wanted floating text popups on your map for damage, healing,
 * experience, loot, and more? Well now you can! This plugin provides the
 * infrastructure for building and displaying text popups on map characters,
 * and is designed to be extended by the various J-Popups extension plugins.
 *
 * Integrates with others of mine plugins:
 * - J-Popups-ABS;      combat damage, healing, loot, and reward popups.
 * - J-Popups-APT;      aptitude point reward popups.
 * - J-Popups-SDP;      SDP point reward popups.
 * - J-Popups-Resources; skill cost and hit-based resource gain popups.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Popups are built using the TextPopBuilder fluent interface, placed into a
 * layout ring on a map character, and rendered by Sprite_Damage. Each
 * extension plugin provides its own builders for the popup types it needs.
 *
 * NOTE:
 * Listeners on the optional PopupEmitter (J.POPUPS.Helpers.PopupEmitter) must
 * stay cheap- no heavy work per frame. Event names live in J.POPUPS.EventNames.
 *
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely a fluent
 * builder/rendering infrastructure that its extensions (ABS, APT, SDP,
 * Resources) build popups on top of.
 * ============================================================================
 * CHANGELOG:
 * - 2.1.1
 *    Routed the rejected-text-pop warning through J-Base's new Diagnostics. The
 *    prefix is now a literal rather than read from J.POPUPS.Metadata.name, so it
 *    still identifies the ship if the namespace is what went wrong.
 * - 2.1.0
 *    Sprite_MapDamage accumulation phase; merge helpers + PopupEmitter flush hooks.
 *    Merge idle flush is battler-wide (any merged stream refreshes the timer); strike floats release on that idle
 *    window only (not on unrelated combo-chain clear signals).
 * - 2.0.0
 *    Split from J-TextPops; plugin renamed J-Popups; layout rings + WeakMap
 *    stacking; addTextPop validation; J.POPUPS.EXT.* extensions for J-ABS,
 *    Aptitude, SDP, and Resources pop builders; disablePopups parameter
 *    (no J-ABS required).
 * - 1.1.0
 *    PopupEmitter lifecycle; DisablePopups; layout constants; variance/motion
 *    fixes; textAccent.
 * - 1.0.0
 *    Initial release (as J-TextPops).
 * ============================================================================
 */
//endregion Introduction