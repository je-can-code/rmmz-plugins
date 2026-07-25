//region initialization
import JSkillSlots_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

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
J.SKS.Metadata = new JSkillSlots_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.SKS.Aliased = {};
J.SKS.Aliased.Game_Actor = new Map();
J.SKS.Aliased.Scene_Menu = new Map();
J.SKS.Aliased.Window_MenuCommand = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.SKS.RegExp = {};
J.SKS.RegExp.SlotCost = /<slotCost:[ ]?(-?\d+)>/i;
J.SKS.RegExp.Unslotted = /<unslotted>/i;
J.SKS.RegExp.SlotCostModifier = /<slotCostModifier:[ ]?(-?\d+)>/i;
J.SKS.RegExp.BaseSlots = /<baseSlots:\[([+\-*/ ().\w]+)]>/gi;
J.SKS.RegExp.BaseSlotPoints = /<baseSlotPoints:\[([+\-*/ ().\w]+)]>/gi;
J.SKS.RegExp.MaxSlots = /<maxSlots:\[([+\-*/ ().\w]+)]>/gi;
J.SKS.RegExp.MaxSlotPoints = /<maxSlotPoints:\[([+\-*/ ().\w]+)]>/gi;
J.SKS.RegExp.UnslottedSkills = /<unslottedSkills:[ ]?(\[[\d, ]+])>/i;
//endregion initialization