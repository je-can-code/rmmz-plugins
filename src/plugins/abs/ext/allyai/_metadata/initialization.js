//region Introduction
/* eslint-disable max-len */
import J_AllyAiPluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.10.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.ALLYAI = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.ALLYAI.Metadata = new J_AllyAiPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.ALLYAI.Aliased = {
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Follower: new Map(),
  Game_Followers: new Map(),
  Game_Interpreter: new Map(),
  Game_Map: new Map(),
  Game_Party: new Map(),
  Game_Player: new Map(),

  JABS_AiManager: new Map(),
  JABS_Battler: new Map(),
  JABS_Engine: new Map(),

  Scene_Map: new Map(),

  Spriteset_Map: new Map(),

  Window_AbsMenu: new Map(),
  Window_AbsMenuSelect: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.ALLYAI.RegExp = {};
J.ABS.EXT.ALLYAI.RegExp.DefaultAi =
  /<defaultAi:(berserker|guardian|vanguard|war-priest|skirmisher|generalist|cleric|artillery|wizard|medic)>/i;
//endregion Introduction