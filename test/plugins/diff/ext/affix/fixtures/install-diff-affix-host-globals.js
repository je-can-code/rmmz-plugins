//region plugins/diff/ext/affix/fixtures/install-diff-affix-host-globals.js
import PluginMetadata from '../../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

let scenarioCounter = 0;

/**
 * Stands in for J-Difficulty's own metadata.
 *
 * The extension never reads the difficulty configuration from disk - it reads what J-Difficulty
 * already parsed - so what the tests need is that parsed shape, not a second config file. Building
 * it directly is also what keeps these tests from depending on J-Difficulty's classifier, which has
 * its own suite and its own reasons to change.
 * @param {Map<string, object>} allRawConfigs Raw layer blobs, keyed by layer key.
 * @param {Map<string, object>} allMetadatas Built layer metadatas, keyed by layer key.
 * @param {string} defaultKey The key of the layer treated as the default.
 */
export function installDifficultyMetadata(allRawConfigs, allMetadatas, defaultKey = 'default')
{
  globalThis.J.DIFFICULTY = {
    Metadata: {
      allRawConfigs,
      allMetadatas,
      defaultKey,
    },
  };
}

/**
 * Stands in for J-Passive-Affix's metadata, holding the authored pools this extension biases.
 * @param {Map<number, number>} prefixMap The authored prefix pool.
 * @param {Map<number, number>} suffixMap The authored suffix pool.
 */
export function installPassiveAffixMetadata(prefixMap, suffixMap)
{
  globalThis.J.PASSIVE = {
    EXT: {
      AFFIX: {
        Metadata: {
          prefixMap,
          suffixMap,
        },
      },
    },
  };
}

/**
 * A minimal `$dataStates`-shaped row carrying only what grant validation reads off it.
 * @param {number} id The state id.
 * @param {boolean} isEnemyPrefix Whether this state is a member of the prefix pool.
 * @param {boolean} isEnemySuffix Whether this state is a member of the suffix pool.
 * @param {number} affixWeight The weight the state was authored at.
 * @returns {object}
 */
export function affixState(id, isEnemyPrefix, isEnemySuffix, affixWeight)
{
  return {
    id,
    isEnemyPrefix,
    isEnemySuffix,
    affixWeight,
  };
}

/**
 * Installs a `$gameSystem` whose enabled difficulty configs are exactly the given keys.
 * @param {string[]} enabledKeys The layer keys that should report as enabled.
 * @param {string[]} disabledKeys Layer keys present but disabled, so "enabled" has a near-miss.
 */
export function installGameSystemWithEnabledLayers(enabledKeys, disabledKeys = [])
{
  const enabledConfigs = enabledKeys.map(key => ({
    key,
    enabled: true,
  }));

  const disabledConfigs = disabledKeys.map(key => ({
    key,
    enabled: false,
  }));

  globalThis.$gameSystem = {
    getAllDifficultyConfigs: () => enabledConfigs.concat(disabledConfigs),
  };
}

/**
 * Globals this extension's source needs before any of its files can be evaluated.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installDiffAffixHostGlobals(sandbox = globalThis)
{
  sandbox.J ||= {};

  // the extension's metadata subclasses this real J-Base class as a bare global, with no import.
  sandbox.PluginMetadata ??= PluginMetadata;

  // J-Difficulty's model is a bare global in its built ship, and this extension augments it there.
  // It has to exist before the augment file is imported, since that file patches its prototype at
  // evaluation time rather than inside a function.
  sandbox.DifficultyMetadata ??= function DifficultyMetadata()
  {
  };
}

/**
 * Builds a fresh extension metadata instance under a name nothing has registered before.
 *
 * PluginMetadata keeps an append-only static registry and throws on a repeat registration, so every
 * scenario needing its own instance also needs its own name.
 * @param {Function} metadataClass The extension's metadata constructor.
 * @returns {object}
 */
export function buildDiffAffixMetadata(metadataClass)
{
  scenarioCounter += 1;

  const name = `J-Difficulty-Affix-test-${scenarioCounter}`;
  installPluginManagerWithParams(globalThis, name, {});

  return new metadataClass(name, '1.0.0');
}
//endregion plugins/diff/ext/affix/fixtures/install-diff-affix-host-globals.js