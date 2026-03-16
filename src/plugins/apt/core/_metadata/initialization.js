//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.APT = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.APT.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.APT.Metadata = new JAptitude_PluginMetadata('J-Aptitude', '1.0.1');

/**
 * A collection of all aliased methods for this plugin.
 */
J.APT.Aliased = {};
J.APT.Aliased.BattleManager = new Map();
J.APT.Aliased.Game_Action = new Map();
J.APT.Aliased.Game_Actor = new Map();
J.APT.Aliased.JABS_Battler = new Map();
J.APT.Aliased.JABS_Engine = new Map();
J.APT.Aliased.Scene_Menu = new Map();
J.APT.Aliased.Window_MenuCommand = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.APT.RegExp = {};

/**
 * The structure of a learnable aptitude skill.
 *
 * <pre>
 * Structure:
 *  <aptitude:[SKILL_ID, REQUIRED_AP]>
 *
 * Example:
 *  <aptitude:[12, 150]>
 *
 * Translation:
 *  Skill Learned: 12
 *  Required AP  : 150
 * </pre>
 * @type {RegExp}
 */
J.APT.RegExp.AptitudeTeachable = /<aptitude:[ ]?(\[\d+,[ ]?\d+])>/gi;

/**
 * The AP reward an enemy yields on defeat.
 *
 * <pre>
 * Structure:
 *  <ap:AMOUNT>
 *
 * Example:
 *  <ap:12>
 *
 * Translation:
 *  AP gained: 12
 * </pre>
 * @type {RegExp}
 */
J.APT.RegExp.ApReward = /<ap: ?(\d+)>/i;

//endregion initialization