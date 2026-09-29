//region plugins/crit/_component/game-battler-crit-math.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';

describe('J-CriticalFactors Game_Battler crit math (direct src import)', () =>
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

    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Actor.js');
  });

  /**
   * Builds an actor stubbed with a zero SDP bonus (SDP itself is out of scope for this suite).
   * @returns {object}
   */
  function buildActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.getSdpBonusForParameterKey = () => 0;
    actor.initMembers();
    return actor;
  }

  describe('baseCriticalMultiplier', () =>
  {
    it('adds all critMultiplierBase tags on top of the plugin-configured floor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplierBase: 40>' }, { note: '<critMultiplierBase: 10>' } ];

      // Act & Assert
      // floor (unconfigured plugin param default) = 0.5; tags sum to 50/100 = 0.5; total = 1.0.
      expect(actor.baseCriticalMultiplier()).toBe(1);
    });

    it('is just the plugin-configured floor when there are no critMultiplierBase tags', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [];

      // Act & Assert
      expect(actor.baseCriticalMultiplier()).toBe(0.5);
    });
  });

  describe('baseCriticalReduction', () =>
  {
    it('adds all critReductionBase tags on top of the plugin-configured floor', () =>
    {
      // Arrange- the unconfigured floor is 0, which would hide a dropped floor, so configure one.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReductionBase: 30>' } ];
      const savedFactor = globalThis.J.CRIT.Metadata.baseCtrFactor;
      globalThis.J.CRIT.Metadata.baseCtrFactor = 0.25;

      // Act
      const result = actor.baseCriticalReduction();

      // Assert
      // floor = 0.25; tag = 30/100 = 0.3; total = 0.55.
      expect(result).toBeCloseTo(0.55, 5);

      globalThis.J.CRIT.Metadata.baseCtrFactor = savedFactor;
    });
  });

  describe('getCriticalDamageMultiplier', () =>
  {
    it('sums all critMultiplier tags across note sources without dividing', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 15>' }, { note: '<critMultiplier: 5>' } ];

      // Act & Assert
      expect(actor.getCriticalDamageMultiplier()).toBe(20);
    });
  });

  describe('getCriticalDamageReduction', () =>
  {
    it('sums all critReduction tags across note sources without dividing', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 12>' } ];

      // Act & Assert
      expect(actor.getCriticalDamageReduction()).toBe(12);
    });

    it('lets a negative critReduction cancel out a positive one', () =>
    {
      // Arrange- a debuff stacked beside a piece of gear, the shape a "Careless" state takes in play.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 12>' }, { note: '<critReduction:-20>' } ];

      // Act & Assert
      expect(actor.getCriticalDamageReduction()).toBe(-8);
    });
  });

  describe('criticalDamageMultiplier', () =>
  {
    it('combines note bonuses and sdp bonuses into a single /100 factor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 20>' } ];

      // Act & Assert
      // nothing natural is bound here (J-Base's seam answers zero), and sdp is stubbed to 0.
      expect(actor.criticalDamageMultiplier()).toBe(0.2);
    });

    it('adds the natural bonus bound to cdm after the /100, since it arrives already a factor', () =>
    {
      // Arrange- 0.05 summed before the divide would come out as 0.0005; ctr's bonus must not leak in.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 20>' } ];
      actor.naturalBonus = key => (key === 'cdm' ? 0.05 : 0.9);

      // Act
      const result = actor.criticalDamageMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.25, 10);
    });

    it('hands its sdp panels the base multiplier in percent points, which a percent panel is a share of', () =>
    {
      // Arrange- a percent panel paying 7.5% of whatever base it is handed. Handed the bare 0.5 factor, it
      // would pay 0.0375 points, a hundredth of what it should; ctr's panels must not leak in.
      const actor = buildActor();
      actor.__testNoteSources = [];
      actor.getSdpBonusForParameterKey = (key, base) => (key === 'cdm' ? base * 0.075 : 9);

      // Act
      const result = actor.criticalDamageMultiplier();

      // Assert- 7.5% of the default 50 points is 3.75 points.
      expect(result).toBeCloseTo(0.0375, 10);
    });
  });

  describe('criticalDamageReduction', () =>
  {
    it('combines note bonuses and sdp bonuses into a single /100 factor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 40>' } ];

      // Act & Assert
      expect(actor.criticalDamageReduction()).toBe(0.4);
    });

    it('adds the natural bonus bound to ctr after the /100, since it arrives already a factor', () =>
    {
      // Arrange- 0.1 summed before the divide would come out as 0.001; cdm's bonus must not leak in.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 40>' } ];
      actor.naturalBonus = key => (key === 'ctr' ? 0.1 : 0.9);

      // Act
      const result = actor.criticalDamageReduction();

      // Assert
      expect(result).toBeCloseTo(0.5, 10);
    });

    it('hands its sdp panels the base reduction in percent points, which a percent panel is a share of', () =>
    {
      // Arrange- the base reduction is 0 unless granted, so grant 20. A percent panel paying 10% of whatever
      // base it is handed would pay 0.02 points against the bare factor; cdm's panels must not leak in.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReductionBase: 20>' } ];
      actor.getSdpBonusForParameterKey = (key, base) => (key === 'ctr' ? base * 0.1 : 9);

      // Act
      const result = actor.criticalDamageReduction();

      // Assert- 10% of 20 points is 2 points.
      expect(result).toBeCloseTo(0.02, 10);
    });
  });

});
//endregion plugins/crit/_component/game-battler-crit-math.test.js
