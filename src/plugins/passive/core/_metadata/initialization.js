/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PASSIVE = {};

/**
 * The plugin umbrella that governs all extensions related to this plugin.
 */
J.PASSIVE.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.PASSIVE.Metadata = {};
J.PASSIVE.Metadata.Name = `J-Passive`;
J.PASSIVE.Metadata.Version = '2.0.2';

/**
 * The label shown for the Passives command in the main menu.
 * @type {string}
 */
J.PASSIVE.Metadata.commandName = 'Passives';

/**
 * The icon index shown beside the Passives command in the main menu.
 * Set to 0 for no icon; update this to any IconManager-registered index.
 * @type {number}
 */
J.PASSIVE.Metadata.commandIconIndex = 0;

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.RegExp = {};
J.PASSIVE.RegExp.EquippedPassiveStateIds = /<equippedPassive:[ ]?(\[[\d, ]+])>/gi;
J.PASSIVE.RegExp.UniqueEquippedPassiveStateIds = /<uniqueEquippedPassive:[ ]?(\[[\d, ]+])>/gi;
J.PASSIVE.RegExp.PassiveStateIds = /<passive:[ ]?(\[[\d, ]+])>/gi;
J.PASSIVE.RegExp.UniquePassiveStateIds = /<uniquePassive:[ ]?(\[[\d, ]+])>/gi;

/**
 * The collection of all aliased classes for extending.
 */
J.PASSIVE.Aliased = {};
J.PASSIVE.Aliased.DataManager = new Map();
J.PASSIVE.Aliased.Game_Actor = new Map();
J.PASSIVE.Aliased.Game_Battler = new Map();
J.PASSIVE.Aliased.Game_BattlerBase = new Map();
J.PASSIVE.Aliased.Game_Enemy = new Map();
J.PASSIVE.Aliased.Game_Party = new Map();
J.PASSIVE.Aliased.JABS_AiManager = new Map();
J.PASSIVE.Aliased.Scene_Menu = new Map();
J.PASSIVE.Aliased.Window_MenuCommand = new Map();
J.PASSIVE.Aliased.Window_MoreEquipData = new Map();
//endregion Introduction