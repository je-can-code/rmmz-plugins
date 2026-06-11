//region plugins/sdp/sdp-families.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSdpPluginVm } from './sdp-vm.js';

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

describe('J-SDP families', () =>
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

  it('builds familyKeyBySubgroupKey from families.subgroupKeys', () =>
  {
    const classified = sandbox.J.SDP.Metadata.constructor.classifyConfiguration(
      buildFamilyConfig()
    );

    expect(classified.families()).toHaveLength(1);
    expect(classified.familyKeyBySubgroupKey().get('ghosty')).toBe('undead');
    expect(classified.familyKeyBySubgroupKey().has('wisp')).toBe(false);
  });

  it('throws when a family references an unknown subgroup', () =>
  {
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

    expect(() => sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config))
      .toThrow(/unknown subgroup/i);
  });

  it('throws when a subgroup is assigned to multiple families', () =>
  {
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

    expect(() => sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config))
      .toThrow(/assigned to multiple families/i);
  });

  it('resolves panel family filter keys through subgroup enrollment', () =>
  {
    const classified = sandbox.J.SDP.Metadata.constructor.classifyConfiguration(
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

    const ghostyPanel = classified.panels().find(panel => panel.key === 'ghosty_t1');
    const loosePanel = classified.panels().find(panel => panel.key === 'loose_panel');

    sandbox.J.SDP.Metadata.families = classified.families();
    sandbox.J.SDP.Metadata.familiesMap = classified.familiesMap();
    sandbox.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();

    expect(sandbox.SdpFamilyFilter.resolvePanelFamilyFilterKey(ghostyPanel)).toBe('undead');
    expect(sandbox.SdpFamilyFilter.resolvePanelFamilyFilterKey(loosePanel))
      .toBe(sandbox.SdpFamilyFilter.UNKNOWN);
  });

  /**
   * @param {object} config
   */
  function applyFamilyTestConfiguration(config)
  {
    const classified = sandbox.J.SDP.Metadata.constructor.classifyConfiguration(config);
    const panelMap = new Map();

    classified.panels()
      .forEach(panel => panelMap.set(panel.key, panel));

    sandbox.J.SDP.Metadata.panels = classified.panels();
    sandbox.J.SDP.Metadata.panelsMap = panelMap;
    sandbox.J.SDP.Metadata.families = classified.families();
    sandbox.J.SDP.Metadata.familiesMap = classified.familiesMap();
    sandbox.J.SDP.Metadata.familyKeyBySubgroupKey = classified.familyKeyBySubgroupKey();
  }

  /**
   * @returns {object}
   */
  function buildFamilyFilterTestActor()
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

    sandbox.$gameActors._byId[actorId] = actor;

    return actor;
  }

  it('omits Unsorted from the family cycle when the actor has no loose panels', () =>
  {
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

    expect(sandbox.SdpFamilyFilter.buildCycleForActor(actor))
      .toEqual([
        sandbox.SdpFamilyFilter.ALL,
        'undead',
      ]);
  });

  it('includes Unsorted in the family cycle when the actor has loose panels', () =>
  {
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

    expect(sandbox.SdpFamilyFilter.buildCycleForActor(actor))
      .toEqual([
        sandbox.SdpFamilyFilter.ALL,
        sandbox.SdpFamilyFilter.UNKNOWN,
      ]);
  });
});
//endregion plugins/sdp/sdp-families.test.js