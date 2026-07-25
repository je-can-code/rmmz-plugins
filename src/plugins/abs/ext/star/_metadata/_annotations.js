/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Converts random encounters into star battles.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension to JABS, that enables standard "encounters" as
 * interpreted by RMMZ to be converted into on-the-map field-based encounters
 * leveraging JABS combat.
 *
 * When a random encounter triggers, instead of transitioning to a turn-based
 * battle scene, the player is teleported to a dedicated "battle map" where
 * enemies are generated and fought in real-time via JABS. Once the star
 * battle concludes, the player is returned to their original map/position.
 * ============================================================================
 * BATTLE MAP:
 * By default, every star battle transfers the player to the plugin-wide
 * default battle map (id 110). To use a different battle map for a specific
 * map's encounters, tag that map's own note field:
 *
 * TAG USAGE:
 * - Maps (the map note field, not an event comment)
 *
 * TAG FORMAT:
 *  <battleMap:MAP_ID>
 *    Where MAP_ID is the id of the map to use as the star battlefield when
 *    an encounter triggers while the player is on this map.
 *
 * TAG EXAMPLES:
 *  <battleMap:112>
 * Random encounters triggered while the player is on this map transfer them
 * to map 112 instead of the default battle map.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */