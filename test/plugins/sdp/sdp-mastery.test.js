//region plugins/sdp/sdp-mastery.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';

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
 * @returns {object}
 */
function buildMasteryConfig(overrides = {})
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

  return {
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
}

/**
 * @param {object} config
 */
function applyMasteryConfiguration(config)
{
  const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config);
  const panelMap = new Map();

  classified.panels()
    .forEach(panel => panelMap.set(panel.key, panel));

  globalThis.J.SDP.Metadata.panels = classified.panels();
  globalThis.J.SDP.Metadata.panelsMap = panelMap;
  globalThis.J.SDP.Metadata.subgroups = classified.subgroups();
  globalThis.J.SDP.Metadata.subgroupsMap = classified.subgroupsMap();
  globalThis.J.SDP.Metadata.panelsBySubgroupKey = classified.panelsBySubgroupKey();
  globalThis.J.SDP.Metadata.families = classified.families();
  globalThis.J.SDP.Metadata.familiesMap = classified.familiesMap();
  globalThis.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
}

/**
 * @returns {object}
 */
function createTestActor()
{
  const actorId = 1;
  const actor = Object.create(globalThis.Game_Actor.prototype);
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

  globalThis.$gameActors._byId[actorId] = actor;

  return actor;
}

describe('J-SDP mastery (direct src import)', () =>
{
  let SdpMasteryManager;
  let PanelRanking;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    await import('../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJSdp();
    await import('../../../src/plugins/sdp/core/_metadata/initialization.js');

    ({ default: SdpMasteryManager } = await import('../../../src/plugins/sdp/core/managers/SdpMasteryManager.js'));
    globalThis.SdpMasteryManager = SdpMasteryManager;

    ({ default: PanelRanking } = await import('../../../src/plugins/sdp/core/models/PanelRanking.js'));
  });

  describe('configuration integrity', () =>
  {
    it('throws when two panels share the same subgroup tier', () =>
    {
      // Arrange
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

      // Act & Assert
      expect(() => globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/duplicate subgroup tier/i);
    });

    it('builds panelsBySubgroupKey sorted ascending by tier', () =>
    {
      // Arrange
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(buildMasteryConfig());

      // Act
      const grouped = classified.panelsBySubgroupKey()
        .get('ghosty');

      // Assert
      expect(grouped.map(panel => panel.key)).toEqual([ 'mastery_t1', 'mastery_t2' ]);
    });

    it('accepts subgroup enrollment without a mastery skill', () =>
    {
      // Arrange
      const config = buildMasteryConfig({
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
      });

      // Act
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config);
      const grouped = classified.panelsBySubgroupKey()
        .get('ghosty');

      // Assert
      expect(grouped[0].mastery.enrolledInSubgroup()).toBe(true);
    });

    it('flags subgroup enrollment without a mastery skill as not granting one', () =>
    {
      // Arrange
      const config = buildMasteryConfig({
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
      });

      // Act
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config);
      const grouped = classified.panelsBySubgroupKey()
        .get('ghosty');

      // Assert
      expect(grouped[0].mastery.grantsMasterySkill()).toBe(false);
    });

    it('throws when a panel references an unknown subgroup key', () =>
    {
      // Arrange
      const config = buildMasteryConfig({
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
      });

      // Act & Assert
      expect(() => globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/unknown subgroup/i);
    });

    it('throws when subgroup key and tier are not set together', () =>
    {
      // Arrange
      const config = buildMasteryConfig({
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
      });
      config.sdps[0].mastery.subgroupKey = 'ghosty';

      // Act & Assert
      expect(() => globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/incomplete mastery metadata/i);
    });
  });

  describe('subgroup mastery reconciliation', () =>
  {
    let actor;

    beforeAll(() =>
    {
      applyMasteryConfiguration(buildMasteryConfig());
      actor = createTestActor();
    });

    it('learns the tier-1 mastery skill when the first panel is maxed', () =>
    {
      // Arrange
      const ranking = new PanelRanking('mastery_t1', actor.actorId());
      ranking.currentRank = 1;
      ranking.maxed = true;
      actor.getAllSdpRankings().push(ranking);

      // Act
      ranking.applySubgroupMastery();

      // Assert
      expect(actor.isLearnedSkill(901)).toBe(true);
    });

    it('does not learn the tier-2 mastery skill when only tier 1 is maxed', () =>
    {
      // Assert (state carried over from the previous test in this describe block, by design)
      expect(actor.isLearnedSkill(902)).toBe(false);
    });

    it('replaces the lower-tier mastery skill when a higher tier is maxed', () =>
    {
      // Arrange
      const rankingT2 = new PanelRanking('mastery_t2', actor.actorId());
      rankingT2.currentRank = 1;
      rankingT2.maxed = true;
      actor.getAllSdpRankings().push(rankingT2);

      // Act
      rankingT2.applySubgroupMastery();

      // Assert
      expect(actor.isLearnedSkill(901)).toBe(false);
    });

    it('grants the higher-tier mastery skill after replacement', () =>
    {
      // Assert (state carried over from the previous test in this describe block, by design)
      expect(actor.isLearnedSkill(902)).toBe(true);
    });

    it('applies mastery when a panel reaches max rank through rankUp', () =>
    {
      // Arrange
      applyMasteryConfiguration(buildMasteryConfig());
      const freshActor = createTestActor();
      const ranking = new PanelRanking('mastery_t1', freshActor.actorId());
      freshActor.getAllSdpRankings().push(ranking);

      // Act
      ranking.rankUp();

      // Assert
      expect(ranking.isPanelMaxed()).toBe(true);
    });

    it('learns the mastery skill as a side effect of rankUp reaching max rank', () =>
    {
      // Arrange
      applyMasteryConfiguration(buildMasteryConfig());
      const freshActor = createTestActor();
      const ranking = new PanelRanking('mastery_t1', freshActor.actorId());
      freshActor.getAllSdpRankings().push(ranking);

      // Act
      ranking.rankUp();

      // Assert
      expect(freshActor.isLearnedSkill(901)).toBe(true);
    });

    it('reconcileAllForActor learns mastery for an already-maxed panel without another rankUp', () =>
    {
      // Arrange
      applyMasteryConfiguration(buildMasteryConfig());
      const freshActor = createTestActor();
      const ranking = new PanelRanking('mastery_t1', freshActor.actorId());
      ranking.currentRank = 1;
      ranking.maxed = true;
      freshActor.getAllSdpRankings().push(ranking);
      expect(freshActor.isLearnedSkill(901)).toBe(false);

      // Act
      SdpMasteryManager.reconcileAllForActor(freshActor);

      // Assert
      expect(freshActor.isLearnedSkill(901)).toBe(true);
    });

    it('does not learn a skill for subgroup-only panels without a mastery skill', () =>
    {
      // Arrange
      applyMasteryConfiguration(buildMasteryConfig({
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
      const freshActor = createTestActor();
      const ranking = new PanelRanking('org_t1', freshActor.actorId());
      freshActor.getAllSdpRankings().push(ranking);

      // Act
      ranking.rankUp();

      // Assert
      expect(ranking.isPanelMaxed()).toBe(true);
      expect(freshActor.isLearnedSkill(901)).toBe(false);
    });

    it('does not strip a lower-tier mastery skill when a higher tier has no mastery skill', () =>
    {
      // Arrange
      applyMasteryConfiguration(buildMasteryConfig({
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
      }));
      const freshActor = createTestActor();
      const rankingT1 = new PanelRanking('mastery_t1', freshActor.actorId());
      rankingT1.currentRank = 1;
      rankingT1.maxed = true;
      freshActor.getAllSdpRankings().push(rankingT1);
      rankingT1.applySubgroupMastery();

      const rankingT2 = new PanelRanking('org_t2', freshActor.actorId());
      rankingT2.currentRank = 1;
      rankingT2.maxed = true;
      freshActor.getAllSdpRankings().push(rankingT2);

      // Act
      rankingT2.applySubgroupMastery();

      // Assert
      expect(freshActor.isLearnedSkill(901)).toBe(true);
    });
  });
});
//endregion plugins/sdp/sdp-mastery.test.js
