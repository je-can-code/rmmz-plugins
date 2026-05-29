//region initialization
import JPassiveConditional_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs conditional passive states on the map.
 */
J.PASSIVE.EXT.CONDITIONAL = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.Metadata = new JPassiveConditional_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased = {};
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler = new Map();
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp = {};

// one rule per tag: state id, condition kind, optional numeric param.
J.PASSIVE.EXT.CONDITIONAL.RegExp.ConditionalPassive = /<conditionalPassive:\[\s*(\d+)\s*,\s*(\w+)\s*(?:,\s*([\d.]+))?\s*\]>/gi;
//endregion initialization