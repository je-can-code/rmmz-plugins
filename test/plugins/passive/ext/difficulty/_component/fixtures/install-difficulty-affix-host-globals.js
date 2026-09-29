//region plugins/passive/ext/difficulty/_component/fixtures/install-difficulty-affix-host-globals.js
/**
 * Stands in for this plugin's own metadata: the built layer metadatas, and the default key.
 * @param {Map<string, {affixEffects: AffixEffects|null}>} allMetadatas Built layer metadatas, by key.
 * @param {string} defaultKey The key of the layer treated as the default.
 */
export function installDifficultyMetadata(allMetadatas, defaultKey = 'default')
{
  globalThis.J.PASSIVE ||= {};
  globalThis.J.PASSIVE.EXT ||= {};
  globalThis.J.PASSIVE.EXT.DIFFICULTY = {
    Metadata: {
      allMetadatas,
      defaultKey,
    },
  };
}

/**
 * Stands in for J-Passive-Affix's metadata, holding the authored pools the difficulty biases.
 * @param {Map<number, number>} prefixMap The authored prefix pool.
 * @param {Map<number, number>} suffixMap The authored suffix pool.
 */
export function installPassiveAffixMetadata(prefixMap, suffixMap)
{
  globalThis.J.PASSIVE ||= {};
  globalThis.J.PASSIVE.EXT ||= {};
  globalThis.J.PASSIVE.EXT.AFFIX = {
    Metadata: {
      prefixMap,
      suffixMap,
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
 * Installs a `$gameTemp` whose layers in force are exactly the given metadatas.
 * @param {Map<string, object>} allMetadatas The installed metadatas, by key.
 * @param {string[]} keysInForce The keys of the layers in force.
 */
export function installLayersInForce(allMetadatas, keysInForce)
{
  globalThis.$gameTemp = {
    difficultyLayersInForce: () => keysInForce.map(key => allMetadatas.get(key)),
  };
}

/**
 * Globals this plugin's affix code needs before any of its files can be evaluated.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installDiffAffixHostGlobals(sandbox = globalThis)
{
  sandbox.J ||= {};

  // the thrown messages name the plugin through the build-time identifier.
  sandbox.__PLUGIN_NAME__ = 'J-Passive-Difficulty';
}
//endregion plugins/passive/ext/difficulty/_component/fixtures/install-difficulty-affix-host-globals.js
