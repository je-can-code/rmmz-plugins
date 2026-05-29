//region plugins/sdp/sdp-mastery.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSdpPluginVm } from './sdp-vm.js';

/**
 * @param {string} subgroupKey
 * @param {number} subgroupTier
 * @param {number} masterySkillId
 * @returns {{ mastery: { subgroupKey: string, subgroupTier: number, masterySkillId: number } }}
 */
function masteryJson(subgroupKey = '', subgroupTier = 0, masterySkillId = 0)
{
  return {
    mastery: {
      subgroupKey,
      subgroupTier,
      masterySkillId,
    },
  };
}

/**
 * @param {object} overrides
 * @returns {string}
 */
function buildMasteryConfigJson(overrides = {})
{
  const basePanels = overrides.sdps ?? [
    {
      name: 'Vitest Panel',
      key: 'vitest_panel',
      iconIndex: '1',
      rarity: 0,
      unlockedByDefault: true,
      description: 'test',
      topFlavorText: 'test',
      maxRank: '3',
      baseCost: '0',
      flatGrowthCost: '0',
      multGrowthCost: '1',
      panelParameters: [],
      panelRewards: [],
      ...masteryJson(),
    },
    {
      name: 'Mastery Tier 1',
      key: 'mastery_t1',
      iconIndex: '1',
      rarity: 0,
      unlockedByDefault: true,
      description: 'test',
      topFlavorText: 'test',
      maxRank: '1',
      baseCost: '0',
      flatGrowthCost: '0',
      multGrowthCost: '1',
      panelParameters: [],
      panelRewards: [],
      ...masteryJson('ghosty', 1, 901),
    },
    {
      name: 'Mastery Tier 2',
      key: 'mastery_t2',
      iconIndex: '1',
      rarity: 0,
      unlockedByDefault: true,
      description: 'test',
      topFlavorText: 'test',
      maxRank: '1',
      baseCost: '0',
      flatGrowthCost: '0',
      multGrowthCost: '1',
      panelParameters: [],
      panelRewards: [],
      ...masteryJson('ghosty', 2, 902),
    },
  ];

  const config = {
    subgroups: overrides.subgroups ?? [
      {
        key: 'ghosty',
        name: 'Ghosty',
        iconIndex: -1,
        description: 'test subgroup',
      },
    ],
    sdps: basePanels,
  };

  return JSON.stringify(config);
}

/**
 * @param {object} sandbox
 * @param {object} config
 */
function applyMasteryConfiguration(sandbox, config)
{
  const classified = sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config);
  const panelMap = new Map();

  classified.panels()
    .forEach(panel => panelMap.set(panel.key, panel));

  sandbox.J.SDP.Metadata.panels = classified.panels();
  sandbox.J.SDP.Metadata.panelsMap = panelMap;
  sandbox.J.SDP.Metadata.subgroups = classified.subgroups();
  sandbox.J.SDP.Metadata.subgroupsMap = classified.subgroupsMap();
  sandbox.J.SDP.Metadata.panelsBySubgroupKey = classified.panelsBySubgroupKey();
  sandbox.J.SDP.Metadata.families = classified.families();
  sandbox.J.SDP.Metadata.familiesMap = classified.familiesMap();
  sandbox.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
}

/**
 * @param {object} sandbox
 * @returns {object}
 */
function createTestActor(sandbox)
{
  const actorId = 1;
  const actor = Object.create(sandbox.Game_Actor.prototype);
  actor._actorId = actorId;
  actor._j = { _sdp: { _ranks: [] } };
  actor._skills = [];

  actor.actorId = function()
  {
    return actorId;
  };

  actor.getAllSdpRankings = function()
  {
    return actor._j._sdp._ranks;
  };

  actor.isLearnedSkill = function(skillId)
  {
    return actor._skills.includes(skillId);
  };

  actor.learnSkill = function(skillId)
  {
    if (actor.isLearnedSkill(skillId) === false)
    {
      actor._skills.push(skillId);
    }
  };

  actor.forgetSkill = function(skillId)
  {
    actor._skills = actor._skills.filter(id => id !== skillId);
  };

  sandbox.$gameActors._byId[actorId] = actor;

  return actor;
}

describe('J-SDP mastery', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSdpPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  describe('configuration integrity', () =>
  {
    it('throws when two panels share the same subgroup tier', () =>
    {
      const config = {
        subgroups: [
          {
            key: 'ghosty',
            name: 'Ghosty',
            iconIndex: -1,
            description: 'test subgroup',
          },
        ],
        sdps: [
          {
            name: 'A',
            key: 'dup_a',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: '',
            topFlavorText: '',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 1, 901),
          },
          {
            name: 'B',
            key: 'dup_b',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: '',
            topFlavorText: '',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 1, 902),
          },
        ],
      };

      expect(() => sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/duplicate subgroup tier/i);
    });

    it('builds panelsBySubgroupKey sorted by tier', () =>
    {
      const classified = sandbox.J.SDP.Metadata.constructor.classifyConfiguration(
        JSON.parse(buildMasteryConfigJson())
      );

      const grouped = classified.panelsBySubgroupKey()
        .get('ghosty');

      expect(grouped).toBeDefined();
      expect(grouped.map(panel => panel.key)).toEqual([ 'mastery_t1', 'mastery_t2' ]);
    });

    it('accepts subgroup enrollment without a mastery skill', () =>
    {
      const config = JSON.parse(buildMasteryConfigJson({
        sdps: [
          {
            name: 'Org Tier 1',
            key: 'org_t1',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: 'test',
            topFlavorText: 'test',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 1, 0),
          },
        ],
      }));

      const classified = sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config);
      const grouped = classified.panelsBySubgroupKey()
        .get('ghosty');

      expect(grouped).toHaveLength(1);
      expect(grouped[0].mastery.enrolledInSubgroup()).toBe(true);
      expect(grouped[0].mastery.grantsMasterySkill()).toBe(false);
    });

    it('throws when a panel references an unknown subgroup key', () =>
    {
      const config = JSON.parse(buildMasteryConfigJson({
        sdps: [
          {
            name: 'Orphan',
            key: 'orphan_panel',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: '',
            topFlavorText: '',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('missing_subgroup', 1, 901),
          },
        ],
      }));

      expect(() => sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/unknown subgroup/i);
    });

    it('throws when subgroup key and tier are not set together', () =>
    {
      const config = JSON.parse(buildMasteryConfigJson({
        sdps: [
          {
            name: 'Partial',
            key: 'partial_panel',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: '',
            topFlavorText: '',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 0, 0),
          },
        ],
      }));

      config.sdps[0].mastery.subgroupKey = 'ghosty';

      expect(() => sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/incomplete mastery metadata/i);
    });
  });

  describe('subgroup mastery reconciliation', () =>
  {
    let actor;

    beforeAll(() =>
    {
      applyMasteryConfiguration(sandbox, JSON.parse(buildMasteryConfigJson()));
      actor = createTestActor(sandbox);
    });

    afterAll(() =>
    {
      actor = null;
    });

    it('learns the tier-1 mastery skill when the first panel is maxed', () =>
    {
      const ranking = new sandbox.PanelRanking('mastery_t1', actor.actorId());
      ranking.currentRank = 1;
      ranking.maxed = true;

      actor.getAllSdpRankings().push(ranking);

      ranking.applySubgroupMastery();

      expect(actor.isLearnedSkill(901)).toBe(true);
      expect(actor.isLearnedSkill(902)).toBe(false);
    });

    it('replaces lower-tier mastery skills when a higher tier is maxed', () =>
    {
      const rankingT2 = new sandbox.PanelRanking('mastery_t2', actor.actorId());
      rankingT2.currentRank = 1;
      rankingT2.maxed = true;

      actor.getAllSdpRankings().push(rankingT2);

      rankingT2.applySubgroupMastery();

      expect(actor.isLearnedSkill(901)).toBe(false);
      expect(actor.isLearnedSkill(902)).toBe(true);
    });

    it('applies mastery when a panel reaches max rank through rankUp', () =>
    {
      const freshActor = createTestActor(sandbox);
      const ranking = new sandbox.PanelRanking('mastery_t1', freshActor.actorId());

      freshActor.getAllSdpRankings().push(ranking);
      ranking.rankUp();

      expect(ranking.isPanelMaxed()).toBe(true);
      expect(freshActor.isLearnedSkill(901)).toBe(true);
    });
    it('does not learn a skill for subgroup-only panels without a mastery skill', () =>
    {
      applyMasteryConfiguration(sandbox, JSON.parse(buildMasteryConfigJson({
        sdps: [
          {
            name: 'Org Tier 1',
            key: 'org_t1',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: 'test',
            topFlavorText: 'test',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 1, 0),
          },
        ],
      })));

      const freshActor = createTestActor(sandbox);
      const ranking = new sandbox.PanelRanking('org_t1', freshActor.actorId());

      freshActor.getAllSdpRankings().push(ranking);
      ranking.rankUp();

      expect(ranking.isPanelMaxed()).toBe(true);
      expect(freshActor.isLearnedSkill(901)).toBe(false);
    });

    it('does not strip a lower-tier mastery skill when a higher tier has no mastery skill', () =>
    {
      applyMasteryConfiguration(sandbox, JSON.parse(buildMasteryConfigJson({
        sdps: [
          {
            name: 'Mastery Tier 1',
            key: 'mastery_t1',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: 'test',
            topFlavorText: 'test',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 1, 901),
          },
          {
            name: 'Org Tier 2',
            key: 'org_t2',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: true,
            description: 'test',
            topFlavorText: 'test',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            ...masteryJson('ghosty', 2, 0),
          },
        ],
      })));

      const freshActor = createTestActor(sandbox);
      const rankingT1 = new sandbox.PanelRanking('mastery_t1', freshActor.actorId());
      rankingT1.currentRank = 1;
      rankingT1.maxed = true;
      freshActor.getAllSdpRankings().push(rankingT1);
      rankingT1.applySubgroupMastery();

      const rankingT2 = new sandbox.PanelRanking('org_t2', freshActor.actorId());
      rankingT2.currentRank = 1;
      rankingT2.maxed = true;
      freshActor.getAllSdpRankings().push(rankingT2);
      rankingT2.applySubgroupMastery();

      expect(freshActor.isLearnedSkill(901)).toBe(true);
    });
  });
});
//endregion plugins/sdp/sdp-mastery.test.js