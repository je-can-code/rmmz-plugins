//region initialization
import JDifficultyAffix_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The umbrella for extensions of J-Difficulty. This is the first of them, so the shell does not
 * exist yet and has to be declared here rather than assumed.
 */
J.DIFFICULTY.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.DIFFICULTY.EXT.AFFIX = {};

/**
 * The metadata associated with this plugin.
 */
J.DIFFICULTY.EXT.AFFIX.Metadata = new JDifficultyAffix_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.DIFFICULTY.EXT.AFFIX.Aliased = {};
J.DIFFICULTY.EXT.AFFIX.Aliased.Game_Event = new Map();
J.DIFFICULTY.EXT.AFFIX.Aliased.Game_Temp = new Map();
J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata = new Map();
J.DIFFICULTY.EXT.AFFIX.Aliased.Scene_Boot = new Map();
//endregion initialization