//region Metadata
import J_ProficiencyPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PROF = {};

/**
 * The umbrella for all extensions of this plugin.<br/>
 * Extensions live in `prof/ext/*` and hang their own namespace beneath this one.
 */
J.PROF.EXT = {};

/**
 * A collection of helpers used across this ship at runtime.
 */
J.PROF.Helpers = {};

/**
 * Loads the external proficiency configuration off the project filesystem.
 *
 * The whole parsed root is kept rather than only the slice this plugin uses, because extensions read
 * their own blocks off it. Doing the read here instead of during classification means an extension can
 * see its configuration in its own `postInitialize`, which is the only moment it has before the game
 * boots. This is the same arrangement J-ABS uses for the extensions that read `config.jabs.json`.
 * @param {string=} configPath The project-relative path to the external config.
 * @returns {object} The parsed root blob.
 */
J.PROF.Helpers.loadExternalConfig = (configPath = J_ProficiencyPluginMetadata.CONFIG_PATH) =>
{
  // the JMZ editor guarantees the root shape, so no validator is supplied.
  const options = ExternalJsonConfigLoaderOptions.Builder()
    .pluginName('J-Proficiency')
    .configName('proficiency configuration')
    .logSummary(result => [ `- ${result.conditionals.length} proficiency conditionals` ])
    .build();

  const parsedConfig = ExternalJsonConfigLoader.load(configPath, options);

  const metadata = J.PROF.Metadata;

  // the metadata must already be published; the constructor cannot reach back for this.
  if (metadata === undefined)
  {
    throw new Error('J.PROF.Metadata must be assigned before J.PROF.Helpers.loadExternalConfig().');
  }

  metadata.ExternalConfig = parsedConfig;

  // return the parsed root blob.
  return parsedConfig;
};

/**
 * The metadata associated with this plugin.
 * @type {J_ProficiencyPluginMetadata}
 */
J.PROF.Metadata = new J_ProficiencyPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

// load the external config after the metadata is published, because the constructor runs too early to
// reach a filesystem, and extensions need the parsed root during their own postInitialize.
J.PROF.Helpers.loadExternalConfig();

/**
 * The various aliases associated with this plugin.
 */
J.PROF.Aliased = {
  Game_Actor: new Map(),
  Game_Action: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),
  Game_System: new Map(),
  JABS_Battler: new Map(),

  IconManager: new Map(),
  Scene_Boot: new Map(),
  TextManager: new Map(),
};

J.PROF.RegExp = {};
J.PROF.RegExp.ProficiencyBonus = /<proficiencyBonus:[ ]?(\d+)>/i;
J.PROF.RegExp.ProficiencyGivingBlock = /<proficiencyGivingBlock>/i;
J.PROF.RegExp.ProficiencyGainingBlock = /<proficiencyGainingBlock>/i;

// register "p" as a formula context variable so damage formulas can use it directly.
// the first argument is the Game_Action instance; skillProficiency() lives on it.
Game_Action.registerFormulaContext('p', (action) => action.skillProficiency());
//endregion Metadata