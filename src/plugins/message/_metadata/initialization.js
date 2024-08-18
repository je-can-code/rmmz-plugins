/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.MESSAGE = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.MESSAGE.Metadata = {};
J.MESSAGE.Metadata.Name = `J-MessageTextCodes`;
J.MESSAGE.Metadata.Version = '1.2.0';

/**
 * A collection of all base aliases.
 */
J.MESSAGE.Aliased = {};
J.MESSAGE.Aliased.Game_Interpreter = new Map();
J.MESSAGE.Aliased.Game_Message = new Map();
J.MESSAGE.Aliased.Window_Base = new Map();
J.MESSAGE.Aliased.Window_ChoiceList = new Map();
J.MESSAGE.Aliased.Window_ChoiceList = new Map();
//endregion introduction