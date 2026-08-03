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
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

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

    it('resolves a panel enrolled in a subgroup with no owning family to UNKNOWN', () =>
    {
      // Arrange: enrolled in 'ghosty', but its family mapping is missing (defensive branch —
      // classifyConfiguration normally guarantees every enrolled subgroup maps to a family).
      globalThis.J.SDP.Metadata.familyKeyBySubgroupKey.delete('ghosty');

      // Act
      const result = SdpFamilyFilter.resolvePanelFamilyFilterKey(ghostyPanel);

      // Assert
      expect(result).toBe(SdpFamilyFilter.UNKNOWN);

      // restore the mapping so later tests in this file aren't affected.
      globalThis.J.SDP.Metadata.familyKeyBySubgroupKey.set('ghosty', 'undead');
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

    it('orders families in the cycle by their authored order, not unlock order', () =>
    {
      // Arrange
      applyFamilyTestConfiguration(buildFamilyConfig({
        subgroups: [
          {
            key: 'ghosty',
            name: 'Ghosty',
            iconIndex: -1,
            description: 'test subgroup',
          },
          {
            key: 'wolf',
            name: 'Wolf',
            iconIndex: -1,
            description: 'test subgroup',
          },
        ],
        families: [
          {
            key: 'undead',
            name: 'Undead',
            iconIndex: 48,
            description: 'undead family',
            subgroupKeys: [ 'ghosty' ],
          },
          {
            key: 'beast',
            name: 'Beast',
            iconIndex: 49,
            description: 'beast family',
            subgroupKeys: [ 'wolf' ],
          },
        ],
        sdps: [
          {
            name: 'Wolf T1',
            key: 'wolf_t1',
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
            mastery: { subgroupKey: 'wolf', subgroupTier: 1, masterySkillId: 0 },
          },
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
            mastery: { subgroupKey: 'ghosty', subgroupTier: 1, masterySkillId: 0 },
          },
        ],
      }));
      const actor = buildFamilyFilterTestActor();

      // unlock beast's panel before undead's, to prove cycle order comes from
      // J.SDP.Metadata.families order, not from the order the actor unlocked things in.
      actor.unlockSdpByKey('wolf_t1');
      actor.unlockSdpByKey('ghosty_t1');

      // Act
      const cycle = SdpFamilyFilter.buildCycleForActor(actor);

      // Assert
      expect(cycle).toEqual([ SdpFamilyFilter.ALL, 'undead', 'beast' ]);
    });

    it('skips a ranking whose key has no matching panel in the metadata', () =>
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
            mastery: { subgroupKey: 'ghosty', subgroupTier: 1, masterySkillId: 0 },
          },
        ],
      }));
      const actor = buildFamilyFilterTestActor();
      actor.unlockSdpByKey('ghosty_t1');

      // a phantom ranking with no corresponding panel in panelsMap.
      actor.unlockSdpByKey('phantom_key');

      // Act
      const cycle = SdpFamilyFilter.buildCycleForActor(actor);

      // Assert
      expect(cycle).toEqual([ SdpFamilyFilter.ALL, 'undead' ]);
    });
  });

  describe('SdpFamilyFilter.panelMatchesFilter', () =>
  {
    let ghostyPanel;

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
              mastery: { subgroupKey: 'ghosty', subgroupTier: 1, masterySkillId: 0 },
            },
          ],
        })
      );

      ghostyPanel = classified.panels().find(panel => panel.key === 'ghosty_t1');

      globalThis.J.SDP.Metadata.families = classified.families();
      globalThis.J.SDP.Metadata.familiesMap = classified.familiesMap();
      globalThis.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
    });

    it('matches any panel when the filter key is ALL', () =>
    {
      // Arrange & Act & Assert
      expect(SdpFamilyFilter.panelMatchesFilter(ghostyPanel, SdpFamilyFilter.ALL)).toBe(true);
    });

    it('matches a panel whose resolved family key equals the filter key', () =>
    {
      // Arrange & Act & Assert
      expect(SdpFamilyFilter.panelMatchesFilter(ghostyPanel, 'undead')).toBe(true);
    });

    it('does not match a panel whose resolved family key differs from the filter key', () =>
    {
      // Arrange & Act & Assert
      expect(SdpFamilyFilter.panelMatchesFilter(ghostyPanel, 'beast')).toBe(false);
    });
  });

  describe('SdpFamilyFilter.familyOrderIndex/subgroupOrderIndex/comparePanels/displayNameForFilterKey/iconIndexForFilterKey', () =>
  {
    let ghostyT1;
    let ghostyT2;
    let wispT1;
    let wolfT1;
    let looseA;
    let looseB;

    beforeAll(() =>
    {
      const classified = globalThis.J.SDP.Metadata.constructor.classifyConfiguration({
        subgroups: [
          {
            key: 'ghosty',
            name: 'Ghosty',
            iconIndex: -1,
            description: '',
          },
          {
            key: 'wisp',
            name: 'Wisp',
            iconIndex: -1,
            description: '',
          },
          {
            key: 'wolf',
            name: 'Wolf',
            iconIndex: -1,
            description: '',
          },
        ],
        families: [
          {
            key: 'undead',
            name: 'Undead',
            iconIndex: 48,
            description: '',
            subgroupKeys: [ 'ghosty', 'wisp' ],
          },
          {
            key: 'beast',
            name: 'Beast',
            iconIndex: -1,
            description: '',
            subgroupKeys: [ 'wolf' ],
          },
        ],
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
            mastery: { subgroupKey: 'ghosty', subgroupTier: 1, masterySkillId: 0 },
          },
          {
            name: 'Ghosty T2',
            key: 'ghosty_t2',
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
            mastery: { subgroupKey: 'ghosty', subgroupTier: 2, masterySkillId: 0 },
          },
          {
            name: 'Wisp T1',
            key: 'wisp_t1',
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
            mastery: { subgroupKey: 'wisp', subgroupTier: 1, masterySkillId: 0 },
          },
          {
            name: 'Wolf T1',
            key: 'wolf_t1',
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
            mastery: { subgroupKey: 'wolf', subgroupTier: 1, masterySkillId: 0 },
          },
          {
            name: 'Loose A',
            key: 'loose_a',
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
            mastery: { subgroupKey: '', subgroupTier: 0, masterySkillId: 0 },
          },
          {
            name: 'Loose B',
            key: 'loose_b',
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
            mastery: { subgroupKey: '', subgroupTier: 0, masterySkillId: 0 },
          },
        ],
      });

      const panels = classified.panels();
      ghostyT1 = panels.find(panel => panel.key === 'ghosty_t1');
      ghostyT2 = panels.find(panel => panel.key === 'ghosty_t2');
      wispT1 = panels.find(panel => panel.key === 'wisp_t1');
      wolfT1 = panels.find(panel => panel.key === 'wolf_t1');
      looseA = panels.find(panel => panel.key === 'loose_a');
      looseB = panels.find(panel => panel.key === 'loose_b');

      globalThis.J.SDP.Metadata.families = classified.families();
      globalThis.J.SDP.Metadata.familiesMap = classified.familiesMap();
      globalThis.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
    });

    describe('familyOrderIndex', () =>
    {
      it('returns the authored index of a known family', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.familyOrderIndex('undead')).toBe(0);
        expect(SdpFamilyFilter.familyOrderIndex('beast')).toBe(1);
      });

      it('returns MAX_SAFE_INTEGER for an unknown family key', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.familyOrderIndex('nonexistent')).toBe(Number.MAX_SAFE_INTEGER);
      });
    });

    describe('subgroupOrderIndex', () =>
    {
      it('returns the authored index of a subgroup within its family', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.subgroupOrderIndex('undead', 'ghosty')).toBe(0);
        expect(SdpFamilyFilter.subgroupOrderIndex('undead', 'wisp')).toBe(1);
      });

      it('returns MAX_SAFE_INTEGER when the family key does not exist', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.subgroupOrderIndex('nonexistent', 'ghosty')).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('returns MAX_SAFE_INTEGER when the subgroup is not owned by the family', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.subgroupOrderIndex('undead', 'wolf')).toBe(Number.MAX_SAFE_INTEGER);
      });
    });

    describe('comparePanels', () =>
    {
      it('orders by family index first', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.comparePanels(ghostyT1, wolfT1)).toBeLessThan(0);
      });

      it('falls back to subgroup index when family indices tie', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.comparePanels(ghostyT1, wispT1)).toBeLessThan(0);
      });

      it('falls back to subgroup tier when subgroup indices tie', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.comparePanels(ghostyT1, ghostyT2)).toBeLessThan(0);
      });

      it('falls back to key comparison when the hierarchy fully ties', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.comparePanels(looseA, looseB)).toBeLessThan(0);
      });
    });

    describe('displayNameForFilterKey', () =>
    {
      it('returns the ALL display label', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.displayNameForFilterKey(SdpFamilyFilter.ALL)).toBe('All families');
      });

      it('returns the UNKNOWN display label', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.displayNameForFilterKey(SdpFamilyFilter.UNKNOWN)).toBe('Unsorted');
      });

      it("returns the family's authored name for a known family key", () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.displayNameForFilterKey('undead')).toBe('Undead');
      });

      it('falls back to the filter key itself when the family is not found', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.displayNameForFilterKey('nonexistent')).toBe('nonexistent');
      });
    });

    describe('iconIndexForFilterKey', () =>
    {
      it('returns the SDP icon index for ALL', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.iconIndexForFilterKey(SdpFamilyFilter.ALL))
          .toBe(globalThis.J.SDP.Metadata.sdpIconIndex);
      });

      it('returns icon 8 for UNKNOWN', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.iconIndexForFilterKey(SdpFamilyFilter.UNKNOWN)).toBe(8);
      });

      it("returns the family's authored icon index when it is set", () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.iconIndexForFilterKey('undead')).toBe(48);
      });

      it('falls back to the SDP icon index when the family icon index is negative', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.iconIndexForFilterKey('beast'))
          .toBe(globalThis.J.SDP.Metadata.sdpIconIndex);
      });

      it('falls back to the SDP icon index when the filter key matches no family', () =>
      {
        // Arrange & Act & Assert
        expect(SdpFamilyFilter.iconIndexForFilterKey('nonexistent'))
          .toBe(globalThis.J.SDP.Metadata.sdpIconIndex);
      });
    });
  });
});
//endregion plugins/sdp/_component/sdp-families.test.js
