//region initialization
import JDpsHud_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-HUD plugin.
  const requiredHudVersion = '2.0.0';
  const hasHudRequirement = J.BASE.Helpers.satisfies(J.HUD.Metadata.version.version(), requiredHudVersion);
  if (!hasHudRequirement)
  {
    throw new Error(`Either missing J-HUD or has a lower version than the required: ${requiredHudVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to HUD extensions.
 */
J.HUD.EXT ||= {};

/**
 * The plugin umbrella for all things belonging to J-HUD-Dps.
 */
J.HUD.EXT.DPS ||= {};

/**
 * The metadata associated with this plugin.
 */
J.HUD.EXT.DPS.Metadata = new JDpsHud_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.EXT.DPS.Aliased = {
  Scene_Map: new Map(),
};
//endregion initialization