//region initialization
import J_LIGHTING_TIME_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.5.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Lighting plugin.
  const requiredLightingVersion = '1.0.0';
  const lightingVersion = J.LIGHTING.Metadata.version.version();
  const hasLightingRequirement = J.BASE.Helpers.satisfies(lightingVersion, requiredLightingVersion);
  if (hasLightingRequirement === false)
  {
    throw new Error(`Either missing J-Lighting or has a lower version than the required: ${requiredLightingVersion}`);
  }

  // check to ensure we have the minimum required version of the J-TIME plugin.
  const requiredTimeVersion = '1.0.0';
  const timeVersion = J.TIME.Metadata.version.version();
  const hasTimeRequirement = J.BASE.Helpers.satisfies(timeVersion, requiredTimeVersion);
  if (hasTimeRequirement === false)
  {
    throw new Error(`Either missing J-TIME or has a lower version than the required: ${requiredTimeVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this extension.
 */
J.LIGHTING.EXT.TIME = {};

/**
 * The metadata associated with this plugin.
 */
J.LIGHTING.EXT.TIME.Metadata = new J_LIGHTING_TIME_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.LIGHTING.EXT.TIME.Aliased = {};
J.LIGHTING.EXT.TIME.Aliased.Game_Time = new Map();
J.LIGHTING.EXT.TIME.Aliased.Scene_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.LIGHTING.EXT.TIME.RegExp = {};
//endregion initialization