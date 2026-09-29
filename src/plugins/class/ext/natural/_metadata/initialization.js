//region initialization
import J_ClassNaturalPluginMetadata from './_pluginMetadata.js';

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

  // check to ensure we have the minimum required version of the J-NaturalGrowth plugin.
  const requiredNaturalVersion = '3.0.0';
  const hasNaturalRequirement = J.BASE.Helpers.satisfies(J.NATURAL.Metadata.version.version(), requiredNaturalVersion);
  if (hasNaturalRequirement === false)
  {
    throw new Error(
      `Either missing J-NaturalGrowth or has a lower version than the required: ${requiredNaturalVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this extension.
 */
J.CLASS.EXT.NATURAL = {};

/**
 * The metadata associated with this plugin.
 */
J.CLASS.EXT.NATURAL.Metadata = new J_ClassNaturalPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.CLASS.EXT.NATURAL.Aliased = {};
J.CLASS.EXT.NATURAL.Aliased.ClassManager = new Map();
J.CLASS.EXT.NATURAL.Aliased.Window_ClassParameters = new Map();
//endregion initialization