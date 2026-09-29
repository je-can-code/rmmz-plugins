//region initialization
import J_ClassAptPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.20.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Classes plugin.
  const requiredClassesVersion = '1.0.0';
  const hasClassesRequirement = J.BASE.Helpers.satisfies(J.CLASS.Metadata.version.version(), requiredClassesVersion);
  if (hasClassesRequirement === false)
  {
    throw new Error(`Either missing J-Classes or has a lower version than the required: ${requiredClassesVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Aptitude plugin.
  const requiredAptitudeVersion = '1.5.0';
  const hasAptitudeRequirement = J.BASE.Helpers.satisfies(J.APT.Metadata.version.version(), requiredAptitudeVersion);
  if (hasAptitudeRequirement === false)
  {
    throw new Error(`Either missing J-Aptitude or has a lower version than the required: ${requiredAptitudeVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this extension.
 */
J.CLASS.EXT.APT = {};

/**
 * The metadata associated with this plugin.
 */
J.CLASS.EXT.APT.Metadata = new J_ClassAptPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.CLASS.EXT.APT.Aliased = {};
J.CLASS.EXT.APT.Aliased.Scene_Classes = new Map();
J.CLASS.EXT.APT.Aliased.Window_ClassList = new Map();
//endregion initialization