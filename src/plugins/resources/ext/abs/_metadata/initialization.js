//region initialization
import JResourcesAbs_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};
J.RESOURCES ||= {};
J.RESOURCES.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.RESOURCES.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.RESOURCES.EXT.ABS.Metadata = new JResourcesAbs_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.RESOURCES.EXT.ABS.Aliased = {};
J.RESOURCES.EXT.ABS.Aliased.JABS_Engine = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.RESOURCES.EXT.ABS.RegExp = {};

// on-attack tags (on the skill — fires for the caster on a successful hit).
J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainFlat    = /<on-attack-hp-gain:(\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainPercent = /<on-attack-hp-gain:(\d+)%>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainFormula = /<on-attack-hp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainFlat    = /<on-attack-mp-gain:(\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainPercent = /<on-attack-mp-gain:(\d+)%>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainFormula = /<on-attack-mp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainFlat    = /<on-attack-tp-gain:(\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainPercent = /<on-attack-tp-gain:(\d+)%>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainFormula = /<on-attack-tp-gain:\[([+\-*/ ().\w]+)]>/gi;

// when-hit tags (on actor/class/equip/state — fires for the target when taking damage).
J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainFlat    = /<when-hit-hp-gain:(\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainPercent = /<when-hit-hp-gain:(\d+)%>/gi;
J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainFormula = /<when-hit-hp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainFlat    = /<when-hit-mp-gain:(\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainPercent = /<when-hit-mp-gain:(\d+)%>/gi;
J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainFormula = /<when-hit-mp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainFlat    = /<when-hit-tp-gain:(\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainPercent = /<when-hit-tp-gain:(\d+)%>/gi;
J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainFormula = /<when-hit-tp-gain:\[([+\-*/ ().\w]+)]>/gi;

J.RESOURCES.EXT.ABS.RegExp.Lifesteal = /<lst:(-?\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.Manasteal = /<mst:(-?\d+)>/gi;
J.RESOURCES.EXT.ABS.RegExp.Techsteal = /<tst:(-?\d+)>/gi;

/** Legacy SDP panel parameter ids for on-attack drain stats. */
J.RESOURCES.EXT.ABS.SdpParamId = {
  LST: 35,
  MST: 36,
  TST: 37,
};

//endregion initialization