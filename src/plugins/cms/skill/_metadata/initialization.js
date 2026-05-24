//region Introduction
import J_CmsSkill_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.0.0';
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
J.CMS_K = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.CMS_K.Metadata = new J_CmsSkill_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

J.CMS_K.Aliased = {
  Scene_Skill: {},
  Window_SkillList: {},
  Window_EquipSlot: {},
};
//endregion Introduction