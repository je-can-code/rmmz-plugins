//region Introduction
import J_CmsStatus_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '1.0.1';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.CMS_S = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.CMS_S.Metadata = new J_CmsStatus_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

J.CMS_S.Aliased = {
  Scene_Status: new Map(),
};
//endregion Introduction