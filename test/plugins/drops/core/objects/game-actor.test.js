//region plugins/drops/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * Actors are where reward bonuses actually come from - notetags on their equipment and states, SDP
 * panels they have ranked, and natural buffs and growths. The two multipliers are assembled the same
 * way and differ only in which tag and which key they read, so they share an assembler. Natural bonuses
 * arrive from J-Base's seam already in factor units, which is why they join after the percent-points
 * are scaled down rather than before. Every battler exposes `gdr`/`dor` so enemies can be asked the
 * same question and answer zero.
 */
describe('J-DropsControl Game_Actor (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Actor.js');
  });

  let actor;
  let previousSdp;

  beforeEach(() =>
  {
    previousSdp = globalThis.J.SDP;

    actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.getAllNotes = function()
    {
      return this.__notes ?? [];
    };
  });

  /**
   * Restores the bare-global SDP namespace so a scenario that toggles it cannot leak into the next.
   */
  function restoreNamespaces()
  {
    globalThis.J.SDP = previousSdp;
  }

  //region multiplier assembly
  describe('rewardMultiplierFactor', () =>
  {
    it('contributes nothing from an actor carrying no tags, panels or natural bonuses', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBe(0);

      restoreNamespaces();
    });

    it('scales summed percent-points down into a factor', () =>
    {
      // Arrange: a tag granting twenty percent-points becomes a factor of 0.2 that callers add
      // on top of a neutral base.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBeCloseTo(0.2, 10);

      restoreNamespaces();
    });

    it('sums panel bonuses with notetag bonuses before scaling', () =>
    {
      // Arrange: both are expressed in percent-points, so they have to be added before the
      // divide rather than each being scaled and rounded separately.
      globalThis.J.SDP = {};
      actor.getSdpBonusForParameterKey = () => 5;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBeCloseTo(0.25, 10);

      restoreNamespaces();
    });

    it('asks nothing of panels when SDP is not installed', () =>
    {
      // Arrange: J-SDP is optional, and its bonus accessor only exists when it is present.
      globalThis.J.SDP = undefined;
      actor.getSdpBonusForParameterKey = () => 999;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert: the panel's 999 never reached the factor.
      expect(result).toBeCloseTo(0.2, 10);

      restoreNamespaces();
    });

    it('adds the natural bonus bound to the multiplier\'s own key after the scaling, not before it', () =>
    {
      // Arrange: a natural bonus of 0.1 is already a factor. Summed with the percent-points before the
      // divide it would come out as 0.001; the other key's bonus must not be picked up at all.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];
      actor.naturalBonus = key => (key === 'dor' ? 0.1 : 7);

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });
  });

  describe('getGoldMultiplier', () =>
  {
    it('reads the gold tag rather than the drop tag', () =>
    {
      // Arrange: the two multipliers share an assembler, so it matters that each passes its own
      // structure- swapping them would make gold respond to drop tags.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<goldMultiplier:30>' } ];

      // Act
      const result = actor.getGoldMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });

    it('ignores a drop multiplier tag entirely', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:30>' } ];

      // Act
      const result = actor.getGoldMultiplier();

      // Assert
      expect(result).toBe(0);

      restoreNamespaces();
    });

    it('takes the natural bonus bound to gdr rather than the one bound to dor', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<goldMultiplier:30>' } ];
      actor.naturalBonus = key => (key === 'gdr' ? 0.05 : 0.5);

      // Act
      const result = actor.getGoldMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.35, 10);

      restoreNamespaces();
    });
  });

  describe('getDropMultiplierBonus', () =>
  {
    it('takes the natural bonus bound to dor rather than the one bound to gdr', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];
      actor.naturalBonus = key => (key === 'dor' ? 0.1 : 0.5);

      // Act
      const result = actor.getDropMultiplierBonus();

      // Assert
      expect(result).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });
  });
  //endregion multiplier assembly

  //region natural bases
  describe('baseGoldMultiplier', () =>
  {
    it('reports the gold tags alone as a factor, leaving out panels and natural bonuses', () =>
    {
      // Arrange: a drop tag, a panel and a natural bonus are all present, and none of them belong.
      globalThis.J.SDP = {};
      actor.getSdpBonusForParameterKey = () => 5;
      actor.naturalBonus = () => 0.1;
      actor.__notes = [ { note: '<goldMultiplier:30>\n<dropMultiplier:70>' } ];

      // Act
      const result = actor.baseGoldMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });
  });

  describe('baseDropMultiplier', () =>
  {
    it('reports the drop tags alone as a factor, leaving out panels and natural bonuses', () =>
    {
      // Arrange: a gold tag, a panel and a natural bonus are all present, and none of them belong.
      globalThis.J.SDP = {};
      actor.getSdpBonusForParameterKey = () => 5;
      actor.naturalBonus = () => 0.1;
      actor.__notes = [ { note: '<goldMultiplier:30>\n<dropMultiplier:70>' } ];

      // Act
      const result = actor.baseDropMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.7, 10);

      restoreNamespaces();
    });
  });
  //endregion natural bases

  //region battler-wide properties
  describe('gdr and dor properties', () =>
  {
    it('reports zero for a battler with no reward model of its own', () =>
    {
      // Arrange: enemies answer the same questions actors do, so every consumer can ask without
      // first working out what kind of battler it is holding.
      const battler = new globalThis.Game_Battler();
      battler.initMembers();

      // Act & Assert
      expect([ battler.gdr, battler.dor ]).toEqual([ 0, 0 ]);

      restoreNamespaces();
    });

    it('routes an actor gdr through its gold multiplier', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<goldMultiplier:30>' } ];

      // Act & Assert
      expect(actor.gdr).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });

    it('routes an actor dor through its drop multiplier', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act & Assert
      expect(actor.dor).toBeCloseTo(0.2, 10);

      restoreNamespaces();
    });
  });
  //endregion battler-wide properties
});
//endregion plugins/drops/core/objects/game-actor.test.js
