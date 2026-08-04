//region Metadata
import J_SdpPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.SDP = {};

/**
 * The metadata associated with this plugin.
 */
J.SDP.Metadata = new J_SdpPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.SDP.Aliased = {
  BattleManager: new Map(),
  DataManager: new Map(),
  JABS_Engine: new Map(),
  TextManager: new Map(),
  IconManager: new Map(),

  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Enemy: new Map(),
  Game_Party: new Map(),
  Game_Player: new Map(),
  Game_Switches: new Map(),
  Game_System: new Map(),

  Scene_Boot: new Map(),
  Scene_Map: new Map(),
  Scene_Menu: new Map(),

  Window_MenuCommand: new Map(),
  Window_MenuStatus: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.SDP.RegExp = {
  SdpPoints: /<sdpPoints: ?-?([0-9]+)>/i,
  SdpMultiplier: /<sdpMultiplier: ?([-.\d]+)>/i,
  SdpBonusFormula: /<sdpBonusFormula:\[(.+?)]>/i,
  SdpDropData: /<sdpDropData: ?(\[[-\w]+,[ ]?\d+])>/i,
  SdpUnlockKey: /<sdpUnlock: ?(.+)>/i,
};
//endregion Metadata