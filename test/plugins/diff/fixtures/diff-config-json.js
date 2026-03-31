//region diff-config-json
export const VITEST_DIFF_KEY = 'vitest_diff';
export const VITEST_HARD_KEY = 'vitest_hard';

/**
 * Two-layer config: default key {@link VITEST_DIFF_KEY} (80% actor mhp) and {@link VITEST_HARD_KEY}
 * (50% actor/enemy mhp, skewed rewards). Both start enabled for {@link Game_Temp.setupDifficultySystem} merge tests.
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
      enabled: true,
      unlocked: true,
      hidden: false,
      actorEffects: {
        bparams: [ 80 ],
        xparams: [],
        sparams: [],
        cparams: [],
      },
      enemyEffects: {
        bparams: [],
        xparams: [],
        sparams: [],
        cparams: [],
      },
      rewards: {
        exp: 100,
        gold: 100,
        drops: 100,
        encounters: 100,
        sdp: 100,
      },
    },
    {
      key: VITEST_HARD_KEY,
      name: 'Vitest Hard',
      description: 'Second harness layer',
      iconIndex: 0,
      cost: 0,
      enabled: true,
      unlocked: true,
      hidden: false,
      actorEffects: {
        bparams: [ 50 ],
        xparams: [],
        sparams: [ 100, 80 ],
        cparams: [],
      },
      enemyEffects: {
        bparams: [ 50 ],
        xparams: [],
        sparams: [],
        cparams: [],
      },
      rewards: {
        exp: 50,
        gold: 200,
        drops: 100,
        encounters: 200,
        sdp: 100,
      },
    },
  ];

  return JSON.stringify(layers);
}
//endregion diff-config-json
