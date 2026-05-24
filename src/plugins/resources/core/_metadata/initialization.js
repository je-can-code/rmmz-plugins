//region initialization
import JResources_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.RESOURCES = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.RESOURCES.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.RESOURCES.Metadata = new JResources_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.RESOURCES.Aliased = {};
J.RESOURCES.Aliased.IconManager = new Map();
J.RESOURCES.Aliased.TextManager = new Map();
J.RESOURCES.Aliased.Game_BattlerBase = new Map();
J.RESOURCES.Aliased.Game_Battler = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.RESOURCES.RegExp = {};
J.RESOURCES.RegExp.HpCostReduction = /<hrc:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.RegExp.HpCostFlat = /<hp-cost:(\d+)>/gi;
J.RESOURCES.RegExp.HpCostPercent = /<hp-cost:(\d+)%>/gi;
J.RESOURCES.RegExp.HpCostFormula = /<hp-cost:\[([+\-*/ ().\w]+)]>/gi;
J.RESOURCES.RegExp.HpCostLethal = /<hp-cost-can-kill>/i;

J.RESOURCES.RegExp.HpGainFlat = /<hp-gain:(\d+)>/i;
J.RESOURCES.RegExp.HpGainPercent = /<hp-gain:(\d+)%>/i;
J.RESOURCES.RegExp.HpGainFormula = /<hp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.RegExp.MpCostFlat = /<mp-cost:(\d+)>/gi;
J.RESOURCES.RegExp.MpCostPercent = /<mp-cost:(\d+)%>/gi;
J.RESOURCES.RegExp.MpCostFormula = /<mp-cost:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.RegExp.MpGainFlat = /<mp-gain:(\d+)>/i;
J.RESOURCES.RegExp.MpGainPercent = /<mp-gain:(\d+)%>/i;
J.RESOURCES.RegExp.MpGainFormula = /<mp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.RegExp.TpCostFlat = /<tp-cost:(\d+)>/gi;
J.RESOURCES.RegExp.TpCostPercent = /<tp-cost:(\d+)%>/gi;
J.RESOURCES.RegExp.TpCostFormula = /<tp-cost:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.RegExp.TpGainFlat = /<tp-gain:(\d+)>/i;
J.RESOURCES.RegExp.TpGainPercent = /<tp-gain:(\d+)%>/i;
J.RESOURCES.RegExp.TpGainFormula = /<tp-gain:\[([+\-*/ ().\w]+)]>/gi;
//endregion initialization