//region Metadata
import J_MessagePluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.MESSAGE = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.MESSAGE.Metadata = new J_MessagePluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all base aliases.
 */
J.MESSAGE.Aliased = {};
J.MESSAGE.Aliased.Game_Interpreter = new Map();
J.MESSAGE.Aliased.Game_Message = new Map();
J.MESSAGE.Aliased.Window_Base = new Map();
J.MESSAGE.Aliased.Window_ChoiceList = new Map();
J.MESSAGE.Aliased.Window_Message = new Map();

/**
 * The text codes that toggle a rendering effect, mapped to the effect they toggle.
 *
 * Symbols rather than words, and pictographic on purpose: a tilde is a wave, and a percent sign
 * cannot make up its mind whether it is going up or down. That is the whole mnemonic, and it is
 * what an author reading a map file three years from now has instead of documentation.
 *
 * These are permanent grammar the moment any map carries one, on exactly the same terms as the
 * notetags - the game data becomes the thing that has to keep working, not this table.
 * @type {Map<string, string>}
 */
J.MESSAGE.EffectCodes = new Map([
  [ '~', 'wave' ],
  [ '%', 'jitter' ],
  [ '=', 'rainbow' ],
  [ '+', 'pulse' ],
]);

J.MESSAGE.RegExp = {};
J.MESSAGE.RegExp.LeaderChoiceConditional = /<leaderChoiceCondition:[ ]?(\d+)>/i;
J.MESSAGE.RegExp.NotLeaderChoiceConditional = /<notLeaderChoiceCondition:[ ]?(\d+)>/i;
J.MESSAGE.RegExp.SwitchOnChoiceConditional = /<switchOnChoiceCondition:[ ]?(\d+)>/i;
J.MESSAGE.RegExp.SwitchOffChoiceConditional = /<switchOffChoiceCondition:[ ]?(\d+)>/i;
//endregion introduction