//region prof-config-json
/**
 * Proficiency conditionals JSON for Vitest (shape expected by {@link J_ProficiencyPluginMetadata.classifyConditionals}).
 *
 * @returns {string}
 */
export function buildVitestProficiencyConfigJson()
{
  return JSON.stringify({
    conditionals: [
      {
        key: 'vitest_unlock_skill',
        actorIds: [ 1 ],
        requirements: [
          {
            skillId: 10,
            proficiency: 3,
            secondarySkillIds: [],
          },
        ],
        skillRewards: [ 99 ],
        jsRewards: '',
      },
      {
        key: 'vitest_secondary_total',
        actorIds: [ 2 ],
        requirements: [
          {
            skillId: 20,
            proficiency: 5,
            secondarySkillIds: [ 21 ],
          },
        ],
        skillRewards: [ 88 ],
        jsRewards: '',
      },
      {
        key: 'vitest_two_requirements',
        actorIds: [ 3 ],
        requirements: [
          {
            skillId: 30,
            proficiency: 2,
            secondarySkillIds: [],
          },
          {
            skillId: 31,
            proficiency: 2,
            secondarySkillIds: [],
          },
        ],
        skillRewards: [ 98 ],
        jsRewards: '',
      },
      {
        key: 'vitest_js_ok',
        actorIds: [ 4 ],
        requirements: [
          {
            skillId: 40,
            proficiency: 1,
            secondarySkillIds: [],
          },
        ],
        skillRewards: [],
        jsRewards: 'a._vitestJsReward = 42',
      },
      {
        key: 'vitest_js_fail',
        actorIds: [ 5 ],
        requirements: [
          {
            skillId: 50,
            proficiency: 1,
            secondarySkillIds: [],
          },
        ],
        skillRewards: [],
        jsRewards: 'throw new Error("vitest_js_broken")',
      },
    ],
  });
}
//endregion prof-config-json
