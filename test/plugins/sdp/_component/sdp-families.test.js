//region plugins/sdp/_component/sdp-families.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';

/**
 * @param {object} overrides
 * @returns {object}
 */
function buildFamilyConfig(overrides = {})
{
  return {
    subgroups: overrides.subgroups ?? [
      {
        key: 'ghosty',
        name: 'Ghosty',
        iconIndex: -1,
        description: 'test subgroup',
      },
      {
        key: 'wisp',
        name: 'Wisp',
        iconIndex: -1,
        description: 'test subgroup',
      },
    ],
    families: overrides.families ?? [
      {
        key: 'undead',
        name: 'Undead',
        iconIndex: 48,
        description: 'undead family',
        subgroupKeys: [ 'ghosty' ],
      },
    ],
    sdps: overrides.sdps ?? [],
  };
}

describe('J-SDP families (direct src import)', () =>
{
  let SdpFamilyFilter;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJSdp();
    await import('../../../../src/plugins/sdp/core/_metadata/initialization.js');

    // sdp's own Game_Actor.js patches globalThis.Game_Actor.prototype with unlockSdpByKey/getSdpByKey,
    // which buildCycleForActor()'s test actors rely on.
    await import('../../../../src/plugins/sdp/core/objects/Game_Actor.js');

    ({ default: SdpFamilyFilter } = await import('../../../../src/plugins/sdp/core/managers/SdpFamilyFilter.js'));
  });

  describe('classifyConfiguration', () =>
  {
    it('builds familyKeyBySubgroupKey from families.subgroupKeys', () =>
    {
      // Arrange & Act
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(buildFamilyConfig());

      // Assert
      expect(classified.families()).toHaveLength(1);
    });

    it('maps the enrolled subgroup key to its owning family key', () =>
    {
      // Arrange & Act
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(buildFamilyConfig());

      // Assert
      expect(classified.familyKeyBySubgroupKey().get('ghosty')).toBe('undead');
    });

    it('omits a subgroup with no owning family from familyKeyBySubgroupKey', () =>
    {
      // Arrange & Act
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(buildFamilyConfig());

      // Assert
      expect(classified.familyKeyBySubgroupKey().has('wisp')).toBe(false);
    });

    it('throws when a family references an unknown subgroup', () =>
    {
      // Arrange
      const config = buildFamilyConfig({
        families: [
          {
            key: 'undead',
            name: 'Undead',
            iconIndex: 48,
            description: '',
            subgroupKeys: [ 'missing' ],
          },
        ],
      });

      // Act & Assert
      expect(() => globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/unknown subgroup/i);
    });

    it('throws when a subgroup is assigned to multiple families', () =>
    {
      // Arrange
      const config = buildFamilyConfig({
        families: [
          {
            key: 'undead',
            name: 'Undead',
            iconIndex: 48,
            description: '',
            subgroupKeys: [ 'ghosty' ],
          },
          {
            key: 'also_undead',
            name: 'Also Undead',
            iconIndex: 48,
            description: '',
            subgroupKeys: [ 'ghosty' ],
          },
        ],
      });

      // Act & Assert
      expect(() => globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config))
        .toThrow(/assigned to multiple families/i);
    });
  });

  describe('SdpFamilyFilter.resolvePanelFamilyFilterKey', () =>
  {
    let ghostyPanel;
    let loosePanel;

    beforeAll(() =>
    {
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(
        buildFamilyConfig({
          sdps: [
            {
              name: 'Ghosty T1',
              key: 'ghosty_t1',
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
              mastery: {
                subgroupKey: 'ghosty',
                subgroupTier: 1,
                masterySkillId: 0,
              },
            },
            {
              name: 'Loose',
              key: 'loose_panel',
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
              mastery: {
                subgroupKey: '',
                subgroupTier: 0,
                masterySkillId: 0,
              },
            },
          ],
        })
      );

      ghostyPanel = classified.panels().find(panel => panel.key === 'ghosty_t1');
      loosePanel = classified.panels().find(panel => panel.key === 'loose_panel');

      globalThis.J.SDP.Metadata.families = classified.families();
      globalThis.J.SDP.Metadata.familiesMap = classified.familiesMap();
      globalThis.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
    });

    it('resolves a panel enrolled in a family-owned subgroup to that family key', () =>
    {
      // Arrange & Act & Assert
      expect(SdpFamilyFilter.resolvePanelFamilyFilterKey(ghostyPanel)).toBe('undead');
    });

    it('resolves a panel with no subgroup enrollment to UNKNOWN', () =>
    {
      // Arrange & Act & Assert
      expect(SdpFamilyFilter.resolvePanelFamilyFilterKey(loosePanel)).toBe(SdpFamilyFilter.UNKNOWN);
    });
  });

  describe('SdpFamilyFilter.buildCycleForActor', () =>
  {
    /**
     * @param {object} config
     */
    function applyFamilyTestConfiguration(config)
    {
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration(config);
      const panelMap = new Map();

      classified.panels()
        .forEach(panel => panelMap.set(panel.key, panel));

      globalThis.J.SDP.Metadata.panels = classified.panels();
      globalThis.J.SDP.Metadata.panelsMap = panelMap;
      globalThis.J.SDP.Metadata.families = classified.families();
      globalThis.J.SDP.Metadata.familiesMap = classified.familiesMap();
      globalThis.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
    }

    /**
     * @returns {object}
     */
    function buildFamilyFilterTestActor()
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

      globalThis.$gameActors._byId[actorId] = actor;

      return actor;
    }

    it('omits Unsorted from the family cycle when the actor has no loose panels', () =>
    {
      // Arrange
      applyFamilyTestConfiguration(buildFamilyConfig({
        sdps: [
          {
            name: 'Ghosty T1',
            key: 'ghosty_t1',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: false,
            description: '',
            topFlavorText: '',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            mastery: {
              subgroupKey: 'ghosty',
              subgroupTier: 1,
              masterySkillId: 0,
            },
          },
        ],
      }));
      const actor = buildFamilyFilterTestActor();
      actor.unlockSdpByKey('ghosty_t1');

      // Act
      const cycle = SdpFamilyFilter.buildCycleForActor(actor);

      // Assert
      expect(cycle).toEqual([ SdpFamilyFilter.ALL, 'undead' ]);
    });

    it('includes Unsorted in the family cycle when the actor has loose panels', () =>
    {
      // Arrange
      applyFamilyTestConfiguration(buildFamilyConfig({
        sdps: [
          {
            name: 'Loose',
            key: 'loose_panel',
            iconIndex: '1',
            rarity: 0,
            unlockedByDefault: false,
            description: '',
            topFlavorText: '',
            maxRank: '1',
            baseCost: '0',
            flatGrowthCost: '0',
            multGrowthCost: '1',
            panelParameters: [],
            panelRewards: [],
            mastery: {
              subgroupKey: '',
              subgroupTier: 0,
              masterySkillId: 0,
            },
          },
        ],
      }));
      const actor = buildFamilyFilterTestActor();
      actor.unlockSdpByKey('loose_panel');

      // Act
      const cycle = SdpFamilyFilter.buildCycleForActor(actor);

      // Assert
      expect(cycle).toEqual([ SdpFamilyFilter.ALL, SdpFamilyFilter.UNKNOWN ]);
    });
  });
});
//endregion plugins/sdp/_component/sdp-families.test.js
