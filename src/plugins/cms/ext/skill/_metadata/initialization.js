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
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-CMS plugin.
  const requiredCmsVersion = '1.0.0';
  const hasCmsRequirement = J.BASE.Helpers.satisfies(J.CMS.Metadata.version.version(), requiredCmsVersion);
  if (hasCmsRequirement === false)
  {
    throw new Error(`Either missing J-CMS or has a lower version than the required: ${requiredCmsVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all extensions of the parent.
 */
J.CMS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.CMS.EXT.SKILL = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.CMS.EXT.SKILL.Metadata = new J_CmsSkill_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.CMS.EXT.SKILL.Aliased = {
  Scene_Skill: new Map(),
  Window_SkillList: new Map(),
  Window_EquipSlot: new Map(),
};
//endregion Introduction