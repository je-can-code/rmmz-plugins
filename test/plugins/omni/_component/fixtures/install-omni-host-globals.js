//region plugins/omni/_component/fixtures/install-omni-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import PluginVersion from '../../../../../src/plugins/_base/core/models/PluginVersion.js';
import ExternalJsonConfigLoader from '../../../../../src/plugins/_base/core/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../../src/plugins/_base/core/models/ExternalJsonConfigLoaderOptions.js';

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * _base/_metadata/initialization.js. Vite's `define` substitutes them at build time, so raw src
 * imports have to supply them by hand.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '4.3.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Omnipedia's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJOmnipedia(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Omnipedia';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-OMNI-Quests's own
 * identity. Call this right before importing omni/ext/quest/_metadata/initialization.js, after
 * `setPluginContextToJOmnipedia` and the J-Omnipedia initialization.js import its version check
 * guards.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJOmniQuest(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-OMNI-Quests';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-OMNI-Monsters's own
 * identity. Call this right before importing omni/ext/monster/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJOmniMonster(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-OMNI-Monsters';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-OMNI-Stats's own identity.
 * Call this right before importing omni/ext/stats/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJOmniStats(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-OMNI-Stats';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * A minimal but structurally honest quest configuration, shaped the way `data/config.quest.json`
 * is shaped on disk. The `__`, `==`, and `--` prefixed rows exist because the real config uses them
 * as editor-only organizational separators, and the metadata's classifier is required to drop them
 * before players ever see the list.
 * @type {{quests: object[], categories: object[], tags: object[]}}
 */
export const SAMPLE_QUEST_CONFIG = {
  quests: [
    {
      name: 'Gather the Herbs',
      key: 'gather-herbs',
      categoryKey: 'side',
      tagKeys: [ 'foraging' ],
      unknownHint: 'Someone in town needs something green.',
      overview: 'Collect herbs for the apothecary.',
      recommendedLevel: 3,
      objectives: [],
    },
    {
      name: '__editor scratch row',
      key: 'editor-scratch',
      categoryKey: 'side',
      tagKeys: [],
      unknownHint: '',
      overview: '',
      recommendedLevel: 0,
      objectives: [],
    },
    {
      name: '=== MAIN QUESTS ===',
      key: 'main-separator',
      categoryKey: 'main',
      tagKeys: [],
      unknownHint: '',
      overview: '',
      recommendedLevel: 0,
      objectives: [],
    },
    {
      name: '-- deprecated --',
      key: 'deprecated-row',
      categoryKey: 'main',
      tagKeys: [],
      unknownHint: '',
      overview: '',
      recommendedLevel: 0,
      objectives: [],
    },
  ],
  categories: [
    {
      name: 'Main',
      key: 'main',
      iconIndex: 1,
    },
    {
      name: 'Side',
      key: 'side',
      iconIndex: 2,
    },
  ],
  tags: [
    {
      name: 'Foraging',
      key: 'foraging',
      iconIndex: 3,
    },
  ],
};

/**
 * A minimal omnipedia configuration, shaped the way `data/config.omni.json` is shaped on disk: the
 * monsterpedia's two pages, ordinary enemies first, which is the page the scene opens on.
 * @type {{monsterTypes: {key: string, name: string, iconIndex: number, showsStats: boolean}[]}}
 */
export const SAMPLE_OMNI_CONFIG = {
  monsterTypes: [
    {
      key: 'enemy',
      name: 'Monsterpedia',
      iconIndex: 14,
      showsStats: true,
    },
    {
      key: 'destructible',
      name: 'Destructapedia',
      iconIndex: 210,
      showsStats: false,
    },
  ],
};

/**
 * Serves a configuration blob from `StorageManager.fsReadFile` at one project-relative path, alongside
 * whatever other files are already being served, so {@link ExternalJsonConfigLoader} can read each
 * plugin's own file without touching the real project data directory. A path nothing has been served
 * at reads as missing, exactly the way an absent file does on disk, which is what lets a plugin reading
 * the wrong path fail rather than quietly receive another plugin's configuration.
 * @param {object} sandbox The global object to serve the files from.
 * @param {string} configPath The project-relative path the blob answers to.
 * @param {object} config The configuration blob to serve there.
 */
function serveConfigFile(sandbox, configPath, config)
{
  sandbox.__servedConfigFiles ??= new Map();
  sandbox.__servedConfigFiles.set(configPath, config);

  sandbox.StorageManager.fsReadFile = filePath =>
  {
    // an unserved path is a missing file.
    if (sandbox.__servedConfigFiles.has(filePath) === false) return null;

    return JSON.stringify(sandbox.__servedConfigFiles.get(filePath));
  };
}

/**
 * Serves an in-memory quest configuration at `data/config.quest.json`.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {object} [config] The configuration blob to serve. Defaults to {@link SAMPLE_QUEST_CONFIG}.
 */
export function installQuestConfig(sandbox = globalThis, config = SAMPLE_QUEST_CONFIG)
{
  serveConfigFile(sandbox, 'data/config.quest.json', config);
}

/**
 * Serves an in-memory omnipedia configuration at `data/config.omni.json`.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {object} [config] The configuration blob to serve. Defaults to {@link SAMPLE_OMNI_CONFIG}.
 */
export function installOmniConfig(sandbox = globalThis, config = SAMPLE_OMNI_CONFIG)
{
  serveConfigFile(sandbox, 'data/config.omni.json', config);
}

/**
 * Globals required for J-Omnipedia's `_metadata/**` and `objects/**` files to evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 *
 * Deliberately its own fixture rather than a shared one: each plugin family owns its host-global
 * surface so a change made for one family cannot silently alter another family's test environment.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installOmniHostGlobals(sandbox = globalThis)
{
  // installing twice would re-run J-Base's own bootstrap and double-register its metadata, so the
  // whole body is idempotent behind a single marker flag.
  if (sandbox.__omniHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__omniHostGlobalsInstalled = true;

  // J-Omnipedia sits on top of J-Base, so J-Base's host surface has to exist first.
  installJBaseHostGlobals(sandbox);

  // omni's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import),
  // exactly the way the built plugin bundle sees it after vite concatenation.
  sandbox.PluginMetadata ??= PluginMetadata;

  // the questopedia extension's metadata compares versions and loads its quest configuration from
  // disk, and reaches all three of these as bare globals the same way the bundle does.
  sandbox.PluginVersion ??= PluginVersion;
  sandbox.ExternalJsonConfigLoader ??= ExternalJsonConfigLoader;
  sandbox.ExternalJsonConfigLoaderOptions ??= ExternalJsonConfigLoaderOptions;
}
//endregion plugins/omni/_component/fixtures/install-omni-host-globals.js
