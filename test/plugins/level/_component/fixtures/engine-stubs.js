//region plugins/level/_component/fixtures/engine-stubs.js
/**
 * Mirrors {@code data/config.level.json}'s shape post-migration off PluginManager parameters. Real numbers/booleans
 * now, not stringified plugin-param values, since this is read via {@link StorageManager.fsReadFile} + JSON.parse
 * (see {@link ExternalJsonConfigLoader}) rather than {@link PluginManager.parameters}.
 */
export const DEFAULT_LEVEL_CONFIG = {
  useScaling: true,
  minMultiplier: 0.10,
  maxMultiplier: 2.00,
  rewardMinMultiplier: null,
  rewardMaxMultiplier: null,
  growthMultiplier: 0.10,
  invariantUpperRange: 1,
  invariantLowerRange: 1,
  variableActorBalancer: 141,
  variableEnemyBalancer: 142,
  defaultBeyondMaxLevel: 255,
  trueMaxLevel: 1000,
  useSharedActorLevel: true,
  canonicalExpBasis: 30,
  canonicalExpExtra: 20,
  canonicalExpAccA: 30,
  canonicalExpAccB: 30,
};

export const DEFAULT_LEVEL_CONFIG_JSON = JSON.stringify(DEFAULT_LEVEL_CONFIG);
//endregion plugins/level/_component/fixtures/engine-stubs.js
