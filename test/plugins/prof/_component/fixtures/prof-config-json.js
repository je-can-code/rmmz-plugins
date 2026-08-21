//region plugins/prof/_component/fixtures/prof-config-json.js
/**
 * Proficiency conditionals JSON for Vitest (shape expected by {@link J_ProficiencyPluginMetadata.classifyConditionals}).
 *
 * Carries a sibling block alongside `conditionals` on purpose. The whole parsed root is published for
 * extensions to read their own blocks off, and with only one block present a loader that returned the
 * root and one that returned just the conditionals would be indistinguishable.
 * @returns {string}
 */
export function buildVitestProficiencyConfigJson()
{
  return JSON.stringify({
    vitestSiblingBlock: 'untouched',
    // two of everything, on purpose. every lookup in the knowledge extension selects by key, and with a
    // single tag, a single mapping and a single exchange, "matches this key" and "matches anything" are
    // the same program- no assertion, however exact, could tell them apart.
    knowledgeTags: [
      {
        key: 'vitest_offense',
        name: 'Vitest Offense',
        iconIndex: 11,
        description: 'what hitting things teaches.',
      },
      {
        key: 'vitest_defense',
        name: 'Vitest Defense',
        iconIndex: 22,
        description: 'what being hit teaches.',
      },
    ],
    // skill type 5 is deliberately absent, so the unmapped path has something real to walk.
    skillTypeMapping: {
      7: [ 'vitest_offense' ],
      2: [ 'vitest_defense' ],
      9: [ 'vitest_offense', 'vitest_defense' ],
    },
    knowledgeExchanges: [
      {
        key: 'vitest_blueprints',
        tagKey: 'vitest_offense',
        cost: 100,
        output: {
          id: 501,
          type: 'i',
          count: 1,
        },
      },
      {
        key: 'vitest_patterns',
        tagKey: 'vitest_defense',
        cost: 50,
        output: {
          id: 502,
          type: 'i',
          count: 2,
        },
      },
    ],
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
//endregion plugins/prof/_component/fixtures/prof-config-json.js
