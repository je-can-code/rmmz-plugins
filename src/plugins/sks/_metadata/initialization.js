//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.SKS = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.SKS.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.SKS.Metadata = new JSkillSlots_PluginMetadata('J-SkillSlots', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.SKS.Aliased = {};
J.SKS.Aliased.Game_Actor = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.SKS.RegExp = {};
J.SKS.RegExp.SlotCost = /<slotCost:[ ]?(-?\d+)>/i;
J.SKS.RegExp.Unslotted = /<unslotted>/i;
J.SKS.RegExp.SlotCostModifier = /<slotCostModifier:[ ]?(-?\d+)>/i;
//endregion initialization