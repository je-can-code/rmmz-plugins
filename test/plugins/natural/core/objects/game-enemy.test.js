//region plugins/natural/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerShippedNaturalParameters,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Enemies get buffs but never growth - they have no levels to grow with - so every natural bonus on an
 * enemy is a buff. That makes the parameter overrides here pure pass-throughs that add the buff onto
 * whatever the engine already computed, and the thing worth pinning is that they stay additive: an
 * enemy with no tags at all must read exactly the same parameters it would have without this plugin.
 *
 * The fixture's engine answers 0 for every enemy parameter, so a wrapper's contribution is the whole
 * of what each assertion sees.
 */
describe('J-NaturalGrowth Game_Enemy (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Enemy.js');

    await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Enemy.js');

    await registerShippedNaturalParameters();
  });

  let enemy;

  beforeEach(() =>
  {
    enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy._enemyDb = {
      id: 1, name: '', note: '', exp: 100, gold: 50, sdpPoints: 5,
    };
  });

  /**
   * Swaps one of this plugin's captured originals for a spy for the length of a test.
   * @param {string} methodName The aliased method whose original to replace.
   * @param {Function} spy The stand-in original.
   * @returns {Function} Restores the real original.
   */
  function stubOriginal(methodName, spy)
  {
    const original = globalThis.J.NATURAL.Aliased.Game_Enemy.get(methodName);
    globalThis.J.NATURAL.Aliased.Game_Enemy.set(methodName, spy);

    return () => globalThis.J.NATURAL.Aliased.Game_Enemy.set(methodName, original);
  }

  //region lifecycle
  describe('setup', () =>
  {
    it('performs the original logic, then refreshes every parameter buff', () =>
    {
      // Arrange
      const original = vi.fn();
      const restore = stubOriginal('setup', original);
      enemy.refreshAllParameterBuffs = vi.fn();

      // Act
      enemy.setup(7, 3, 4);

      // Assert
      expect(original).toHaveBeenCalledWith(7, 3, 4);
      expect(enemy.refreshAllParameterBuffs).toHaveBeenCalledTimes(1);

      restore();
    });
  });

  describe('onBattlerDataChange', () =>
  {
    it('performs the original logic, then refreshes every parameter buff', () =>
    {
      // Arrange: states and equipment carry buff tags, so anything altering the battler's data
      // invalidates the cached buff values computed from it.
      const original = vi.fn();
      const restore = stubOriginal('onBattlerDataChange', original);
      enemy.refreshAllParameterBuffs = vi.fn();

      // Act
      enemy.onBattlerDataChange();

      // Assert
      expect(original).toHaveBeenCalledTimes(1);
      expect(enemy.refreshAllParameterBuffs).toHaveBeenCalledTimes(1);

      restore();
    });
  });

  describe('maxTp', () =>
  {
    it('reports the calculated max tech rather than the engine default', () =>
    {
      // Arrange
      enemy.actualMaxTp = () => 88;

      // Act & Assert
      expect(enemy.maxTp()).toBe(88);
    });
  });
  //endregion lifecycle

  //region engine parameters
  describe('paramBase', () =>
  {
    it('adds the buff of the base parameter the id names', () =>
    {
      // Arrange: def is id 3; an atk buff is present too and must not be the one that lands.
      enemy.setNaturalBuffPlus('def', 8);
      enemy.setNaturalBuffPlus('atk', 50);

      // Act & Assert
      expect(enemy.paramBase(3)).toBe(8);
    });

    it('passes an id outside the engine\'s eight through exactly as the engine made it', () =>
    {
      // Arrange
      enemy.setNaturalBuffPlus('def', 8);

      // Act & Assert
      expect(enemy.paramBase(8)).toBe(0);
    });
  });

  describe('paramBaseBeforeNatural', () =>
  {
    it('reports the engine\'s base without any buff', () =>
    {
      // Arrange
      enemy.setNaturalBuffPlus('def', 8);

      // Act & Assert
      expect(enemy.paramBaseBeforeNatural(3)).toBe(0);
    });
  });

  describe('xparam', () =>
  {
    it('adds the buff of the ex-parameter the id names, scaled from its percent', () =>
    {
      // Arrange: eva is id 1; a hit buff is present too and must not be the one that lands.
      enemy.setNaturalBuffPlus('eva', 30);
      enemy.setNaturalBuffPlus('hit', 90);

      // Act & Assert
      expect(enemy.xparam(1)).toBeCloseTo(0.3, 10);
    });

    it('passes an id outside the engine\'s ten through exactly as the engine made it', () =>
    {
      // Arrange
      enemy.setNaturalBuffPlus('eva', 30);

      // Act & Assert
      expect(enemy.xparam(10)).toBe(0);
    });
  });

  describe('xparamBeforeNatural', () =>
  {
    it('reports the engine\'s value without any buff', () =>
    {
      // Arrange
      enemy.setNaturalBuffPlus('eva', 30);

      // Act & Assert
      expect(enemy.xparamBeforeNatural(1)).toBe(0);
    });
  });

  describe('sparam', () =>
  {
    it('adds the buff of the sp-parameter the id names, scaled from its percent', () =>
    {
      // Arrange: grd is id 1; a tgr buff is present too and must not be the one that lands.
      enemy.setNaturalBuffPlus('grd', 40);
      enemy.setNaturalBuffPlus('tgr', 90);

      // Act & Assert
      expect(enemy.sparam(1)).toBeCloseTo(0.4, 10);
    });

    it('passes an id outside the engine\'s ten through exactly as the engine made it', () =>
    {
      // Arrange
      enemy.setNaturalBuffPlus('grd', 40);

      // Act & Assert
      expect(enemy.sparam(10)).toBe(0);
    });
  });

  describe('sparamBeforeNatural', () =>
  {
    it('reports the engine\'s value without any buff', () =>
    {
      // Arrange
      enemy.setNaturalBuffPlus('grd', 40);

      // Act & Assert
      expect(enemy.sparamBeforeNatural(1)).toBe(0);
    });
  });
  //endregion engine parameters

  //region rewards
  describe('refreshRewardBonuses', () =>
  {
    it('refreshes the experience, gold and SDP bonuses together', () =>
    {
      // Arrange
      enemy.refreshExpRewardBonuses = vi.fn();
      enemy.refreshGoldRewardBonuses = vi.fn();
      enemy.refreshSdpRewardBonuses = vi.fn();

      // Act
      enemy.refreshRewardBonuses();

      // Assert
      expect(enemy.refreshExpRewardBonuses).toHaveBeenCalledTimes(1);
      expect(enemy.refreshGoldRewardBonuses).toHaveBeenCalledTimes(1);
      expect(enemy.refreshSdpRewardBonuses).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshExpRewardBonuses', () =>
  {
    it('records the experience bonus its tags evaluate to', () =>
    {
      // Arrange: a gold tag rides along and must not be what lands on experience.
      enemy.getAllNotes = () => [ { note: '<expPlus:[25]>\n<goldPlus:[10]>' } ];

      // Act
      enemy.refreshExpRewardBonuses();

      // Assert
      expect(enemy.expPlus()).toBe(25);
    });
  });

  describe('refreshGoldRewardBonuses', () =>
  {
    it('records the gold bonus its tags evaluate to', () =>
    {
      // Arrange: an experience tag rides along and must not be what lands on gold.
      enemy.getAllNotes = () => [ { note: '<expPlus:[25]>\n<goldPlus:[10]>' } ];

      // Act
      enemy.refreshGoldRewardBonuses();

      // Assert
      expect(enemy.goldPlus()).toBe(10);
    });
  });

  /**
   * SDP is an optional sibling plugin, so this is one of the few places core is permitted a namespace
   * check. The pair below is what makes that check load-bearing: the buff is forced to a non-zero value
   * in both, so the only thing standing between a written bonus and an untouched one is the guard.
   */
  describe('refreshSdpRewardBonuses', () =>
  {
    beforeEach(() =>
    {
      enemy.naturalParamBuff = () => 7;
    });

    it('writes the calculated bonus when the SDP system is installed', () =>
    {
      // Arrange
      const previousSdp = globalThis.J.SDP;
      globalThis.J.SDP = {};

      // Act
      enemy.refreshSdpRewardBonuses();

      // Assert
      expect(enemy.sdpsPlus()).toBeCloseTo(7, 10);

      // restore the bare-global namespace rather than leaking it into later tests in this file.
      globalThis.J.SDP = previousSdp;
    });

    it('leaves the bonus untouched when the SDP system is absent', () =>
    {
      // Arrange: there is no panel currency to reward without SDP loaded, so the whole refresh is
      // skipped rather than writing a bonus nothing will ever read.
      // Act
      enemy.refreshSdpRewardBonuses();

      // Assert
      expect(enemy.sdpsPlus()).toBe(0);
    });
  });

  describe('exp', () =>
  {
    it('adds the experience bonus onto the database reward', () =>
    {
      // Arrange
      enemy.setExpPlus(25);

      // Act & Assert
      expect(enemy.exp()).toBe(125);
    });
  });

  describe('gold', () =>
  {
    it('adds the gold bonus onto the database reward', () =>
    {
      // Arrange
      enemy.setGoldPlus(10);

      // Act & Assert
      expect(enemy.gold()).toBe(60);
    });
  });

  describe('sdpPoints', () =>
  {
    it('adds the SDP bonus onto the database reward', () =>
    {
      // Arrange
      enemy.setSdpsPlus(3);

      // Act & Assert
      expect(enemy.sdpPoints()).toBe(8);
    });
  });
  //endregion rewards
});
//endregion plugins/natural/core/objects/game-enemy.test.js
