//region Introduction
import JHudBoss_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.3';
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
J.HUD.EXT.BOSS = {};

/**
 * The `metadata` associated with this plugin, such as version.
 * @type {JHudBoss_PluginMetadata}
 */
J.HUD.EXT.BOSS.Metadata = new JHudBoss_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.EXT.BOSS.Aliased = {};
J.HUD.EXT.BOSS.Aliased.Hud_Manager = new Map();
J.HUD.EXT.BOSS.Aliased.Scene_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.HUD.EXT.BOSS.RegExp = {};
//endregion Introduction