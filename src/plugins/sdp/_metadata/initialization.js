/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.3';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.SDP = {};

/**
 * The metadata associated with this plugin.
 */
J.SDP.Metadata = new J_SdpPluginMetadata('J-SDP', '2.0.0');

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
  Game_Switches: new Map(),
  Game_System: new Map(),

  Scene_Map: new Map(),
  Scene_Menu: new Map(),

  Window_AbsMenu: new Map(),
  Window_MenuCommand: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.SDP.RegExp = {
  SdpPoints: /<sdpPoints:[ ]?([0-9]*)>/i,
  SdpMultiplier: /<sdpMultiplier:[ ]?([-.\d]+)>/i,
  SdpDropData: /<sdpDropData:[ ]?(\[[-\w]+,[ ]?\d+(:?,[ ]?\d+)?])>/i,
  SdpUnlockKey: /<sdpUnlock:(.+)>/i,
};
//endregion Introduction