//region Introduction
import JHudTarget_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-HUD plugin.
  const requiredHudVersion = '2.0.0';
  const hasHudRequirement = J.BASE.Helpers.satisfies(J.HUD.Metadata.version.version(), requiredHudVersion);
  if (hasHudRequirement === false)
  {
    throw new Error(`Either missing J-HUD or has a lower version than the required: ${requiredHudVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.HUD.EXT.TARGET = {};

/**
 * The `metadata` associated with this plugin, such as version.
 * @type {JHudTarget_PluginMetadata}
 */
J.HUD.EXT.TARGET.Metadata = new JHudTarget_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.EXT.TARGET.Aliased = {
  Game_System: new Map(),
  Hud_Manager: new Map(),
  JABS_Battler: new Map(),
  Scene_Map: new Map(),
  Window_TargetFrame: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.HUD.EXT.TARGET.RegExp = {
  TargetFrameText: /<targetFrameText:([\w :"'.!+\-*/\\]*)>/i,
  TargetFrameIcon: /<targetFrameIcon:(\d+)>/i,
  HideTargetFrame: /<hideTargetFrame>/i,
  HideTargetText: /<hideTargetFrameText>/i,
  HideTargetHP: /<hideTargetHpBar>/i,
  HideTargetMP: /<hideTargetMpBar>/i,
  HideTargetTP: /<hideTargetTpBar>/i,
};
//endregion Introduction