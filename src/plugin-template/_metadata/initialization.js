//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.__TEMPLATE__ = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.__TEMPLATE__.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.__TEMPLATE__.Metadata = new J__TEMPLATE___PluginMetadata('J-TEMPLATE', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.__TEMPLATE__.Aliased = {};
J.__TEMPLATE__.Aliased.Game_Action = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.__TEMPLATE__.RegExp = {};
J.__TEMPLATE__.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization