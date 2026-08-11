//region initialization
import J_KnowledgePluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Proficiency plugin.
  const requiredProficiencyVersion = '2.3.0';
  const hasProficiencyRequirement = J.BASE.Helpers.satisfies(
    J.PROF.Metadata.version.version(),
    requiredProficiencyVersion);
  if (hasProficiencyRequirement === false)
  {
    throw new Error(`Either missing J-Proficiency or has a lower version than the required: ${requiredProficiencyVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PROF.EXT.KNOWLEDGE = {};

/**
 * The metadata associated with this plugin.
 * @type {J_KnowledgePluginMetadata}
 */
J.PROF.EXT.KNOWLEDGE.Metadata = new J_KnowledgePluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PROF.EXT.KNOWLEDGE.Aliased = {
  Game_Actor: new Map(),
  Game_Party: new Map(),
};
//endregion initialization