//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Extends the Omnipedia with a Monsterpedia entry.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-DropsControl
 * @base J-Elementalistics
 * @base J-SDP
 * @base J-Omnipedia
 * @orderAfter J-HUD
 * @orderAfter J-HUD-TargetFrame
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the Omnipedia by adding a new entry: The Monsterpedia.
 *
 * Due to rendering a large amount of data, there are a number of other plugins
 * required to use this plugin:
 * - J-Base             : always required for my plugins.
 * - J-ABS              : enables the tracking of most data points.
 * - J-DropsControl     : renders loot drop data and tracking.
 * - J-Elementalistics  : renders elemental data and tracking.
 * - J-SDP              : renders SDP points earned and panel drop rate.
 * ============================================================================
 * MONSTERPEDIA ENTRY TAGS:
 * A handful of tags customize how an enemy appears (or doesn't) in the
 * Monsterpedia.
 *
 * TAG USAGE:
 * - Enemies
 *
 * TAG FORMAT:
 *  <hideFromMonsterpedia>
 *    Excludes this enemy entirely from the Monsterpedia entry list.
 *
 *  <monsterFamilyIcon:ICON_INDEX>
 *    Sets the icon index representing this enemy's monster family/category
 *    in the Monsterpedia listing.
 *
 *  <descriptionLine:TEXT>
 *    Adds one line of flavor-text description to this enemy's Monsterpedia
 *    detail view. Multiple tags on the same enemy each add another line.
 *
 * TAG EXAMPLES:
 *  <hideFromMonsterpedia>
 * This enemy (a story-only or hidden boss, perhaps) never appears in the
 * Monsterpedia listing.
 *
 *  <monsterFamilyIcon:64>
 * This enemy's family icon in the Monsterpedia listing is icon 64.
 *
 *  <descriptionLine:A lumbering beast of the northern peaks.>
 *  <descriptionLine:Known to hoard shiny objects.>
 * This enemy's Monsterpedia detail view shows both lines of description,
 * one per tag, in the order they appear on the note.
 * ============================================================================
 * CHANGELOG:
 * - 1.2.1
 *    The monsterpedia detail window no longer declares private members. A
 *    window's constructor reaches initialize, and through it the drawing
 *    hooks, before a derived class installs its own members- so anything
 *    private was being touched on an object that did not yet have it.
 * - 1.2.0
 *    The monsterpedia lookup cache is no longer written to savefiles. It held
 *    the same observations as the saveables it is built from, keyed by enemy
 *    id, which meant every observation the party had ever made was stored
 *    twice. It now rebuilds from the saveables on load.
 * - 1.1.0
 *    Added <hideFromMonsterpedia>, <monsterFamilyIcon:ICON_INDEX>, and
 *    repeatable <descriptionLine:TEXT> Monsterpedia entry tags.
 * - 1.0.2
 *    Consumed `RPGManager` updates.
 *    Fixed missed issue with SDP rendering.
 *    Adjusted monster detail view to accommodate fontsize 24 at 1080p.
 * - 1.0.1
 *    Added support for auto-generating target frame icons where applicable.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion Introduction