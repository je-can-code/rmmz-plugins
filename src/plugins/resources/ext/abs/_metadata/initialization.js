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
J.RESOURCES.EXT.ABS.Aliased.Game_Battler = new Map();
J.RESOURCES.EXT.ABS.Aliased.Scene_Boot = new Map();

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

// heal-event onSelf tags — when THIS battler's trigger resource is healed, cascade to output resource.
// format: <onSelf{Trigger}Heal{Output}:[PERCENT, RANGE]> or <onSelf{Trigger}Heal{Output}:[PERCENT, RANGE, MAX_DEPTH]>
// RANGE=0 means self only; RANGE>0 also applies to allies within that tile radius.
// MAX_DEPTH overrides the healChainDepth plugin param for this tag only; omit to use the global default.
J.RESOURCES.EXT.ABS.RegExp.OnSelfHpHealHp  = /<onSelfHpHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfHpHealMp  = /<onSelfHpHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfHpHealTp  = /<onSelfHpHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfMpHealHp  = /<onSelfMpHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfMpHealMp  = /<onSelfMpHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfMpHealTp  = /<onSelfMpHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfTpHealHp  = /<onSelfTpHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfTpHealMp  = /<onSelfTpHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfTpHealTp  = /<onSelfTpHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfAnyHealHp = /<onSelfAnyHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfAnyHealMp = /<onSelfAnyHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnSelfAnyHealTp = /<onSelfAnyHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;

// heal-event onAlly tags — when an ally's trigger resource is healed within RANGE tiles, cascade to observer.
// format: <onAlly{Trigger}Heal{Output}:[PERCENT, RANGE]> or <onAlly{Trigger}Heal{Output}:[PERCENT, RANGE, MAX_DEPTH]>
J.RESOURCES.EXT.ABS.RegExp.OnAllyHpHealHp  = /<onAllyHpHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyHpHealMp  = /<onAllyHpHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyHpHealTp  = /<onAllyHpHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyMpHealHp  = /<onAllyMpHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyMpHealMp  = /<onAllyMpHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyMpHealTp  = /<onAllyMpHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyTpHealHp  = /<onAllyTpHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyTpHealMp  = /<onAllyTpHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyTpHealTp  = /<onAllyTpHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyAnyHealHp = /<onAllyAnyHealHp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyAnyHealMp = /<onAllyAnyHealMp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;
J.RESOURCES.EXT.ABS.RegExp.OnAllyAnyHealTp = /<onAllyAnyHealTp:[ ]?(\[\d+,[ ]?\d+(?:,[ ]?\d+)?])>/gi;

/** Legacy SDP panel parameter ids for on-attack drain stats. */
J.RESOURCES.EXT.ABS.SdpParamId = {
  LST: 35,
  MST: 36,
  TST: 37,
};

//endregion initialization