//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Lets states contribute extra drops to every enemy.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-DropsControl
 * @orderAfter J-Base
 * @orderAfter J-DropsControl
 * @help
 * ============================================================================
 * OVERVIEW
 * J-DropsControl reads the `<drops:[...]>` tag off the enemy being defeated and
 * nothing else. This extension widens that search to include states: the ones
 * riding the defeated enemy, and the ones riding the party that killed it.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-DropsControl; this is an extension of that plugin's drop sources.
 * - J-Passive; passive skill states are the intended vehicle for this.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * A state is a convenient place to hang a drop because it can arrive from a
 * dozen directions- a passive skill, a piece of equipment, a buff someone cast,
 * a story flag applied at a cutscene- and every one of those ends up asking the
 * same question of the same tag. Rather than teach each of those systems to
 * publish drops, this teaches drops to read states.
 *
 * WHY THIS IS AN EXTENSION AND NOT THE DEFAULT:
 * "Everything the party is currently buffed by can change what an enemy drops"
 * is a strong flavor. It makes loot tables depend on party composition, which
 * is either the entire point of your build system or an unpleasant surprise
 * that makes your drop rates impossible to reason about. Loading this plugin is
 * how you opt into the first reading.
 *
 * ============================================================================
 * ENEMY STATES AS DROP SOURCES:
 * Every state currently applied to the defeated enemy is scanned for the same
 * `<drops:[...]>` tag J-DropsControl already reads from the enemy itself.
 *
 * This is what makes "burning enemies drop charcoal" or "an enemy afflicted
 * with a treasure-marking state drops an extra item" possible without editing
 * a single enemy in the database.
 *
 * ============================================================================
 * PARTY STATES AS DROP SOURCES:
 * Every state currently applied to any active battle member is also scanned,
 * against every enemy that dies.
 *
 * This is the "lucky charm" pattern: a passive skill state that adds an item to
 * the global drop pool for as long as somebody in the active party has it.
 * Reserve members do not count- only who is actually fighting.
 *
 * ============================================================================
 * TAG USAGE:
 * - States
 *
 * TAG FORMAT:
 *  <drops:[TYPE,ID,CHANCE]>
 *    Where TYPE is one of: i, item, w, weapon, a, armor.
 *    Where ID is the id of the item/weapon/armor in the database.
 *    Where CHANCE is the percent chance of this dropping.
 *
 * This is J-DropsControl's own tag, unchanged- see that plugin's help for the
 * full description. All this plugin changes is where it gets read from.
 *
 * TAG EXAMPLES:
 *  <drops:[i,3,25]>
 * While this state is applied, there is a 25% chance of also dropping item 3.
 *
 *  <drops:[a,7,100]>
 * While this state is applied, armor 7 always additionally drops.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations