//region plugins/sdp/game-actor-param-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';
import { buildVitestSdpConfigJson } from './fixtures/build-sdp-config-json.js';

const ATK_PARAM_ID = 2;
const MHP_PARAM_ID = 0;

/**
 * Overrides the base (pre-SDP) ATK stub so ATK panels have a nonzero base to modify.
 */
function hookBaseAtk100()
{
  const inner = globalThis.J.SDP.Aliased.Game_Actor.get('param');
  globalThis.J.SDP.Aliased.Game_Actor.set('param', function(paramId)
  {
    if (paramId === ATK_PARAM_ID)
    {
      return 100;
    }

    return inner.call(this, paramId);
  });
}

/**
 * Overrides the base (pre-SDP) MHP stub so MHP panels have a nonzero base to modify.
 */
function hookBaseMhp100()
{
  const inner = globalThis.J.SDP.Aliased.Game_Actor.get('param');
  globalThis.J.SDP.Aliased.Game_Actor.set('param', function(paramId)
  {
    if (paramId === MHP_PARAM_ID)
    {
      return 100;
    }

    return inner.call(this, paramId);
  });
}

/**
 * @param {number} id
 * @returns {object}
 */
function makeActor(id)
{
  const actor = new globalThis.Game_Actor();
  actor.initMembers();
  actor.actorId = function()
  {
    return id;
  };
  return actor;
}

describe('J-SDP Game_Actor.param (ATK) and Game_Party SDP helpers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    const { default: StatDistributionPanel } = await import('../../../src/plugins/sdp/core/models/StatDistributionPanel.js');
    const { default: PanelParameter } = await import('../../../src/plugins/sdp/core/models/PanelParameter.js');
    const { default: PanelRarity } = await import('../../../src/plugins/sdp/core/models/PanelRarity.js');
    const sdpConfigJson = buildVitestSdpConfigJson(StatDistributionPanel, PanelParameter, PanelRarity);

    installSdpHostGlobals(globalThis, sdpConfigJson);

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    await import('../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Actor.js');

    // sdp's own Game_Actor.js#getSdpBonusForCoreParam relies on this bare global to translate a
    // core param id (e.g. ATK=2, MHP=0) into its registry key (e.g. 'atk', 'mhp').
    ({ default: globalThis.ParameterKeys } = await import('../../../src/plugins/_base/core/ParameterKeys.js'));

    setPluginContextToJSdp();
    await import('../../../src/plugins/sdp/core/_metadata/initialization.js');

    await import('../../../src/plugins/sdp/core/objects/Game_Actor.js');
    await import('../../../src/plugins/sdp/core/objects/Game_Party.js');

    hookBaseAtk100();
  });

  beforeEach(() =>
  {
    globalThis.$gameActors._byId = {};
  });

  describe('Game_Actor.param ATK bonuses', () =>
  {
    it('adds flat per-rank ATK linearly to param(2)', () =>
    {
      // Arrange
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_atk_flat');
      actor.rankUpPanel('vitest_atk_flat');
      actor.rankUpPanel('vitest_atk_flat');

      // Act & Assert
      expect(actor.param(ATK_PARAM_ID)).toBe(108);
    });

    it('scales percent per-rank ATK off the base param before the SDP bonus', () =>
    {
      // Arrange
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_atk_pct');
      actor.rankUpPanel('vitest_atk_pct');
      actor.rankUpPanel('vitest_atk_pct');

      // Act & Assert
      expect(actor.param(ATK_PARAM_ID)).toBe(120);
    });

    it('reduces ATK for a negative flat per-rank panel', () =>
    {
      // Arrange
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_atk_flat_neg');
      actor.rankUpPanel('vitest_atk_flat_neg');
      actor.rankUpPanel('vitest_atk_flat_neg');

      // Act & Assert
      expect(actor.param(ATK_PARAM_ID)).toBe(94);
    });

    it('reduces ATK for a negative percent per-rank panel', () =>
    {
      // Arrange
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_atk_pct_neg');
      actor.rankUpPanel('vitest_atk_pct_neg');

      // Act & Assert
      expect(actor.param(ATK_PARAM_ID)).toBe(92);
    });

    it('floors ATK at 0 when panel downs would push it negative', () =>
    {
      // Arrange
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_atk_crush');
      for (let i = 0; i < 10; i++)
      {
        actor.rankUpPanel('vitest_atk_crush');
      }

      // Act & Assert
      expect(actor.param(ATK_PARAM_ID)).toBe(0);
    });

    it('stacks multiple panels that both target ATK', () =>
    {
      // Arrange
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_atk_flat');
      actor.unlockSdpByKey('vitest_atk_pct');
      actor.rankUpPanel('vitest_atk_flat');
      actor.rankUpPanel('vitest_atk_pct');

      // Act & Assert
      expect(actor.param(ATK_PARAM_ID)).toBe(114);
    });
  });

  describe('Game_Actor.param MHP floor', () =>
  {
    it('floors MHP at 1 when panel downs would push it negative', () =>
    {
      // Arrange
      hookBaseMhp100();
      const actor = makeActor(1);
      actor.unlockSdpByKey('vitest_mhp_crush');
      for (let i = 0; i < 10; i++)
      {
        actor.rankUpPanel('vitest_mhp_crush');
      }

      // Act & Assert
      expect(actor.param(MHP_PARAM_ID)).toBe(1);
    });
  });

  describe('Game_Party SDP helpers', () =>
  {
    it('getSdpRankByActorAndKey returns the current rank for a known actor', () =>
    {
      // Arrange
      const actor = makeActor(7);
      globalThis.$gameActors._byId[7] = actor;
      const party = new globalThis.Game_Party();
      party.initialize();
      actor.unlockSdpByKey('vitest_atk_flat');
      actor.rankUpPanel('vitest_atk_flat');
      actor.rankUpPanel('vitest_atk_flat');

      // Act & Assert
      expect(party.getSdpRankByActorAndKey(7, 'vitest_atk_flat')).toBe(2);
    });

    it('getSdpRankByActorAndKey returns 0 for a missing actor', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initialize();

      // Act & Assert
      expect(party.getSdpRankByActorAndKey(999, 'vitest_atk_flat')).toBe(0);
    });

    it('isSdpUnlocked is true once every registered actor has the panel unlocked', () =>
    {
      // Arrange
      const a1 = makeActor(1);
      const a2 = makeActor(2);
      globalThis.$gameActors._byId[1] = a1;
      globalThis.$gameActors._byId[2] = a2;
      const party = new globalThis.Game_Party();
      party.initialize();

      // Act
      party.unlockSdp('vitest_atk_flat');

      // Assert
      expect(party.isSdpUnlocked('vitest_atk_flat')).toBe(true);
    });

    it('isSdpUnlocked becomes false once any registered actor locks the panel', () =>
    {
      // Arrange
      const a1 = makeActor(1);
      const a2 = makeActor(2);
      globalThis.$gameActors._byId[1] = a1;
      globalThis.$gameActors._byId[2] = a2;
      const party = new globalThis.Game_Party();
      party.initialize();
      party.unlockSdp('vitest_atk_flat');

      // Act
      a2.lockSdpByKey('vitest_atk_flat');

      // Assert
      expect(party.isSdpUnlocked('vitest_atk_flat')).toBe(false);
    });
  });
});
//endregion plugins/sdp/game-actor-param-party.test.js
