//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.REGIONS.EXT.SKILLS = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.REGIONS.EXT.SKILLS.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.REGIONS.EXT.SKILLS.Metadata = new J_RegionSkillsPluginMetadata('J-Region-Skills', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.REGIONS.EXT.SKILLS.Aliased = {};
J.REGIONS.EXT.SKILLS.Aliased.Game_Character = new Map();
J.REGIONS.EXT.SKILLS.Aliased.Game_Map = new Map();
J.REGIONS.EXT.SKILLS.Aliased.Game_System = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.REGIONS.EXT.SKILLS.RegExp = {};
J.REGIONS.EXT.SKILLS.RegExp.RegionSkill = /<regionSkill:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?(true|false)])>/gi;
//endregion initialization