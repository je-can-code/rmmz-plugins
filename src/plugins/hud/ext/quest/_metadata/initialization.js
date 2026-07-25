//region initialization
import J_HUD_Quest_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  const requiredHudVersion = '2.0.0';
  const hasHudRequirement = J.BASE.Helpers.satisfies(J.HUD.Metadata.version.version(), requiredHudVersion);
  if (hasHudRequirement === false)
  {
    throw new Error(`Either missing J-HUD or has a lower version than the required: ${requiredHudVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.HUD.EXT.QUEST ||= {};

/**
 * The metadata associated with this plugin.
 * @type {J_HUD_Quest_PluginMetadata}
 */
J.HUD.EXT.QUEST.Metadata = new J_HUD_Quest_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.EXT.QUEST.Aliased = {};
J.HUD.EXT.QUEST.Aliased.Scene_Map = new Map();
J.HUD.EXT.QUEST.Aliased.Scene_Questopedia = new Map();
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest = new Map();
J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective = new Map();
J.HUD.EXT.QUEST.Aliased.HudManager = new Map();
//endregion initialization