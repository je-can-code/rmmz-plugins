//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
J.RESOURCES.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.RESOURCES.EXT.ABS.Metadata = new JResourcesAbs_PluginMetadata('J-Resources-ABS', '1.0.0');

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

//endregion initialization