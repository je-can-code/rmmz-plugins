//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 PASSIVE-OTIB] One-Time Item Boosts as permanent passive states.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Passive
 * @orderAfter J-Base
 * @orderAfter J-Passive
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Passive that implements One-Time Item
 * Boosts (OTIB): consuming a tagged item permanently grants the actor one
 * or more database States whose Traits carry the actual stat effects.
 *
 * Those states are fed through J-Passive's pipeline so they appear alongside
 * all other passive contributors and can be inspected in Scene_Passive.
 *
 * Integrates with others of mine plugins:
 * - J-Base; required by all JE plugins.
 * - J-Passive; provides the passive state pipeline and the Passive Viewer.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Unlike the legacy OTIB implementation, this plugin does NOT patch param /
 * xparam / sparam directly. All stat effects are expressed through database
 * State Traits, giving designers full control over what each item unlocks.
 *
 * Unlock records are persisted on each actor as plain JSON-safe data and are
 * rebuilt into the passive pipeline on every refreshPassiveStates() call,
 * so no custom serialization classes are needed.
 *
 * ============================================================================
 * ITEM BOOST NOTETAG
 * To make an item grant permanent passive states when consumed, apply the
 * following notetag to the item in the database.
 *
 * TAG USAGE:
 * - Items (consumable, "All" or "Battle / Menu" occasion)
 *
 * TAG FORMAT:
 *  <otib:[STATE_ID]>
 *  <otib:[STATE_ID, STATE_ID, ...]>
 *    Where STATE_ID is the numeric id of a database State.
 *    Multiple ids are supported; all will be unlocked on first consume.
 *
 * TAG EXAMPLES:
 *  <otib:[42]>
 *    Consuming this item permanently grants State 42 as a passive.
 *
 *  <otib:[42, 55]>
 *    Consuming this item permanently grants both State 42 and State 55.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations