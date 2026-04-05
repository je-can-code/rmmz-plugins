//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.POPUPS.EXT.RESOURCES = {};

/**
 * The metadata associated with this plugin.
 */
J.POPUPS.EXT.RESOURCES.Metadata = new JPopupsResources_PluginMetadata('J-Popups-Resources', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.POPUPS.EXT.RESOURCES.Aliased = {};
J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler = new Map();
//endregion initialization