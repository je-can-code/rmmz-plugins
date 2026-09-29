//region plugins/passive/ext/difficulty/_component/fixtures/diff-config-json.js
export const VITEST_DIFF_KEY = 'vitest_diff';
export const VITEST_HARD_KEY = 'vitest_hard';
export const VITEST_SOFT_KEY = 'vitest_soft';

/**
 * Three-layer config.
 *
 * - {@link VITEST_DIFF_KEY}: the default layer. Enabled, costs nothing, grants neither side a state.
 * - {@link VITEST_HARD_KEY}: enabled, costs 3, actors carry 501 and enemies 502, declares affix effects.
 * - {@link VITEST_SOFT_KEY}: disabled, costs 2, actors carry 503 and enemies nothing. The near-miss for
 *   every "only what is enabled" assertion.
 *
 * @returns {string} JSON text for {@link StorageManager.fsReadFile}.
 */
export function buildVitestDifficultyConfigJson()
{
  const layers = [
    {
      key: VITEST_DIFF_KEY,
      name: 'Vitest',
      description: 'Harness layer',
      iconIndex: 0,
      cost: 0,
      actorStateId: 0,
      enemyStateId: 0,
      enabled: true,
      unlocked: true,
      hidden: false,
    },
    {
      key: VITEST_HARD_KEY,
      name: 'Vitest Hard',
      description: 'Second harness layer',
      iconIndex: 0,
      cost: 3,
      actorStateId: 501,
      enemyStateId: 502,
      enabled: true,
      unlocked: true,
      hidden: false,
      affixEffects: {
        prefixChance: 150,
      },
    },
    {
      key: VITEST_SOFT_KEY,
      name: 'Vitest Soft',
      description: 'Third harness layer',
      iconIndex: 0,
      cost: 2,
      actorStateId: 503,
      enemyStateId: 0,
      enabled: false,
      unlocked: true,
      hidden: false,
    },
  ];

  return JSON.stringify(layers);
}
//endregion plugins/passive/ext/difficulty/_component/fixtures/diff-config-json.js
