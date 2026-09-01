//region Introduction
import J_AbsTimePluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.18.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-TIME plugin.
  const requiredTimeVersion = '1.2.0';
  const hasTimeRequirement = J.BASE.Helpers.satisfies(J.TIME.Metadata.version.version(), requiredTimeVersion);
  if (!hasTimeRequirement)
  {
    throw new Error(`Either missing J-TIME or has a lower version than the required: ${requiredTimeVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.ABS.EXT.TIME = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.TIME.Metadata = new J_AbsTimePluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);
//endregion Introduction