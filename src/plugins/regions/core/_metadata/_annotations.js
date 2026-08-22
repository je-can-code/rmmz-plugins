//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A plugin that controls passage by region ids.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables passage control via region ids while on the map.
 *
 * DETAILS:
 * Based on a per-tile basis and some simple tags on the map, you can now
 * control the following:
 * - force-restrict passage by region id(s).
 * - force-permit passage by region id(s).
 *
 * ============================================================================
 * REGION PASSAGE:
 * Have you ever wanted a character on a particular map have the ability to
 * traverse otherwise untraversable tiles? Or possibly restrict traversal upon
 * tiles that are normally traversable? Well now you can! By adding the
 * appropriate tags to the map properties, you too can control variable
 * passage by region id!
 *
 * TAG USAGE:
 * - Map [Properties]
 *
 * TAG FORMAT:
 *  <allowRegions:[REGION_IDS]>
 *  <denyRegions:[REGION_IDS]>
 * Where REGION_IDS is a comma-delimited list of region ids used on the map.
 *
 * TAG EXAMPLES:
 *  <allowRegions:[1]>
 * A tile marked with the region id of 1 will become passable.
 *
 *  <denyRegions:[2,3,4]>
 * A tile marked with the region id of 2, 3, or 4 will become impassable.
 *
 * NOTE ABOUT OVERLAPPING IDS IN TAGS:
 * If you use the same region id in both tags on the same map, the deny will
 * take priority and prevent passage.
 *
 * NOTE ABOUT PLUGIN PARAMETERS:
 * In addition to the per-map per-tag configuration, there is also a global
 * array for both allow and deny in case you want to specify some regionIds
 * that will always be either allow/deny. The regionIds that are identified as
 * "global" are not given any special treatment, and are simply concatenated
 * into any found tags on the maps.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.3.0
 *    Added globalDenyTerrainTags, a plugin-level list of terrain tags that block
 *    passage outright. It joins the region allow and deny lists already here.
 * - 1.2.0
 *    Routed the _regions namespace into its own save section, so region
 *    effect state lands in systems/regions.json rather than in the system blob.
 *    Moved the _regions namespace seeding from the initialize alias to
 *    initMembers, so a decoded save can establish it without a constructor.
 * - 1.0.2
 *    Fixed issue with referencing CycloneMovement.
 * - 1.0.1
 *    Created plugin extension namespace for REGIONS plugin extensions.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @param globalAllowRegions
 * @type number[]
 * @text Global Allowed Regions
 * @desc The region ids that are always allowed on every map.
 * @default []
 *
 * @param globalDenyRegions
 * @type number[]
 * @text Global Denied Regions
 * @desc The region ids that are always denied on every map.
 * @default []
 *
 * @param globalDenyTerrainTags
 * @type number[]
 * @text Global Denied Terrain Tags
 * @desc The terrain tags that are always impassable on every map. Terrain tags live on the tileset, not the map.
 * @default []
 *
 */
//endregion annotations