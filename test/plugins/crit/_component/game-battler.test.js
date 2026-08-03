//region plugins/crit/_component/game-battler.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  installNaturalCompanionStubs,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';

describe('J-CriticalFactors Game_Battler (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCritHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    // stand-in for J-NaturalGrowth's Game_Battler.js, which crit's own Game_Battler.js aliases/calls.
    installNaturalCompanionStubs();

    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    // patches globalThis.Game_BattlerBase.prototype/Game_Battler.prototype directly, no vm involved.
    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Actor.js');
  });

  /**
   * @returns {object}
   */
  function buildActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.getSdpBonusForParameterKey = () => 0;
    actor.initMembers();
    return actor;
  }

  describe('initNaturalGrowthParameters', () =>
  {
    it('stores crit natural growth slots after initMembers when J.NATURAL is present', () =>
    {
      // Arrange & Act
      const actor = buildActor();

      // Assert
      expect(actor._j._natural._cdmPlus).toBe(0);
      expect(actor._j._natural._cdmRate).toBe(0);
      expect(actor._j._natural._ctrPlus).toBe(0);
      expect(actor._j._natural._ctrRate).toBe(0);
    });
  });

  describe('baseCriticalMultiplier', () =>
  {
    it('adds critMultiplierBase notes on top of the plugin-configured floor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplierBase: 40>' } ];

      // Act & Assert
      // floor (unconfigured plugin param default) = 0.5; tag = 40/100 = 0.4; total = 0.9.
      expect(actor.baseCriticalMultiplier()).toBeCloseTo(0.9, 5);
    });
  });

  describe('criticalDamageMultiplier / criticalDamageReduction', () =>
  {
    it('reports no crit damage multiplier for a battler carrying no cdm sources', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act & Assert: notes, natural growths and sdp bonuses all contribute nothing here, so the
      // summed factor has to land on the zero sentinel rather than a stray base value.
      expect(actor.criticalDamageMultiplier()).toBe(0);
    });

    it('reports no crit damage reduction for a battler carrying no ctr sources', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act & Assert
      expect(actor.criticalDamageReduction()).toBe(0);
    });
  });

  describe('isForceCritProcs', () =>
  {
    it('is true when a note source carries <forceCritProcs>', () =>
    {
      // Arrange
      const withTag = buildActor();
      withTag.__testNoteSources = [ { note: '<forceCritProcs>' } ];

      // Act & Assert
      expect(withTag.isForceCritProcs()).toBe(true);
    });

    it('is false without the tag', () =>
    {
      // Arrange
      const withoutTag = buildActor();
      withoutTag.__testNoteSources = [ { note: '<knockback:4>' } ];

      // Act & Assert
      expect(withoutTag.isForceCritProcs()).toBe(false);
    });
  });
});
//endregion plugins/crit/_component/game-battler.test.js
