//region plugins/natural/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerShippedNaturalParameters,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Actors are the only battler type that grows, so this is where level-up turns growth tags into the
 * running totals every parameter reads. The engine's own parameters are wrapped here too, each one
 * adding its natural bonus onto the value the engine computed- and an id the engine uses that natural
 * growth has no key for must pass through exactly as the engine made it.
 *
 * The fixture's engine answers 10 for every base parameter, 0.25 for every ex-parameter and 1 for
 * every sp-parameter, which makes every wrapper's contribution observable as an exact number.
 */
describe('J-NaturalGrowth Game_Actor (direct src import)', () =>
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

    await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Actor.js');

    await registerShippedNaturalParameters();
  });

  let actor;

  beforeEach(() =>
  {
    actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.getAllNotes = function()
    {
      return this.__notes ?? [];
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
    const original = globalThis.J.NATURAL.Aliased.Game_Actor.get(methodName);
    globalThis.J.NATURAL.Aliased.Game_Actor.set(methodName, spy);

    return () => globalThis.J.NATURAL.Aliased.Game_Actor.set(methodName, original);
  }

  //region lifecycle
  describe('setup', () =>
  {
    it('performs the original logic, then refreshes every parameter buff', () =>
    {
      // Arrange
      const original = vi.fn();
      const restore = stubOriginal('setup', original);
      actor.refreshAllParameterBuffs = vi.fn();

      // Act
      actor.setup(3);

      // Assert
      expect(original).toHaveBeenCalledWith(3);
      expect(actor.refreshAllParameterBuffs).toHaveBeenCalledTimes(1);

      restore();
    });
  });

  describe('onBattlerDataChange', () =>
  {
    it('performs the original logic, then refreshes every parameter buff', () =>
    {
      // Arrange
      const original = vi.fn();
      const restore = stubOriginal('onBattlerDataChange', original);
      actor.refreshAllParameterBuffs = vi.fn();

      // Act
      actor.onBattlerDataChange();

      // Assert
      expect(original).toHaveBeenCalledTimes(1);
      expect(actor.refreshAllParameterBuffs).toHaveBeenCalledTimes(1);

      restore();
    });
  });

  describe('maxTp', () =>
  {
    it('reports the calculated max tech rather than the engine default', () =>
    {
      // Arrange
      actor.actualMaxTp = () => 137;

      // Act & Assert
      expect(actor.maxTp()).toBe(137);
    });
  });
  //endregion lifecycle

  //region engine parameters
  describe('paramBase', () =>
  {
    it('adds the natural bonus of the base parameter the id names', () =>
    {
      // Arrange: atk is id 2; a def buff is present too and must not be the one that lands.
      actor.setNaturalBuffPlus('atk', 7);
      actor.setNaturalBuffPlus('def', 50);

      // Act & Assert
      expect(actor.paramBase(2)).toBe(17);
    });

    it('passes an id outside the engine\'s eight through exactly as the engine made it', () =>
    {
      // Arrange: every real key carries a buff, so any bonus at all would show.
      actor.setNaturalBuffPlus('atk', 7);

      // Act & Assert
      expect(actor.paramBase(8)).toBe(10);
    });
  });

  describe('paramBaseBeforeNatural', () =>
  {
    it('reports the engine\'s base without any natural bonus', () =>
    {
      // Arrange
      actor.setNaturalBuffPlus('atk', 7);

      // Act & Assert
      expect(actor.paramBaseBeforeNatural(2)).toBe(10);
    });
  });

  describe('xparam', () =>
  {
    it('adds the natural bonus of the ex-parameter the id names, scaled from its percent', () =>
    {
      // Arrange: hit is id 0; an eva buff is present too and must not be the one that lands.
      actor.setNaturalBuffPlus('hit', 100);
      actor.setNaturalBuffPlus('eva', 50);

      // Act & Assert
      expect(actor.xparam(0)).toBeCloseTo(1.25, 10);
    });

    it('passes an id outside the engine\'s ten through exactly as the engine made it', () =>
    {
      // Arrange
      actor.setNaturalBuffPlus('hit', 100);

      // Act & Assert
      expect(actor.xparam(10)).toBe(0.25);
    });
  });

  describe('xparamBeforeNatural', () =>
  {
    it('reports the engine\'s value without any natural bonus', () =>
    {
      // Arrange
      actor.setNaturalBuffPlus('hit', 100);

      // Act & Assert
      expect(actor.xparamBeforeNatural(0)).toBe(0.25);
    });
  });

  describe('sparam', () =>
  {
    it('adds the natural bonus of the sp-parameter the id names, scaled from its percent', () =>
    {
      // Arrange: tgr is id 0; a grd buff is present too and must not be the one that lands.
      actor.setNaturalBuffPlus('tgr', 200);
      actor.setNaturalBuffPlus('grd', 50);

      // Act & Assert
      expect(actor.sparam(0)).toBeCloseTo(3, 10);
    });

    it('passes an id outside the engine\'s ten through exactly as the engine made it', () =>
    {
      // Arrange
      actor.setNaturalBuffPlus('tgr', 200);

      // Act & Assert
      expect(actor.sparam(10)).toBe(1);
    });
  });

  describe('sparamBeforeNatural', () =>
  {
    it('reports the engine\'s value without any natural bonus', () =>
    {
      // Arrange
      actor.setNaturalBuffPlus('tgr', 200);

      // Act & Assert
      expect(actor.sparamBeforeNatural(0)).toBe(1);
    });
  });
  //endregion engine parameters

  //region growth
  describe('levelUp', () =>
  {
    it('performs the original logic, then applies this level\'s growths', () =>
    {
      // Arrange
      const original = vi.fn();
      const restore = stubOriginal('levelUp', original);
      actor.applyNaturalGrowths = vi.fn();

      // Act
      actor.levelUp();

      // Assert
      expect(original).toHaveBeenCalledTimes(1);
      expect(actor.applyNaturalGrowths).toHaveBeenCalledTimes(1);

      restore();
    });
  });

  describe('applyNaturalGrowths', () =>
  {
    it('grows every bound parameter by its own tags, once', () =>
    {
      // Arrange: an engine parameter and J-NaturalGrowth's own max tech, bound by the same registry.
      actor.__notes = [ { note: '<atkGrowthPlus:[5]>\n<mtpGrowthPlus:[12]>' } ];

      // Act
      actor.applyNaturalGrowths();

      // Assert
      expect(actor.naturalGrowthPlus('atk')).toBe(5);
      expect(actor.naturalGrowthPlus('mtp')).toBe(12);
    });
  });

  describe('applyNaturalGrowth', () =>
  {
    it('adds the flat growth the notes carry onto the running total', () =>
    {
      // Arrange: a level already gained.
      actor.modNaturalGrowthPlus('atk', 5);
      actor.__notes = [ { note: '<atkGrowthPlus:[5]>' } ];

      // Act
      actor.applyNaturalGrowth('atk');

      // Assert
      expect(actor.naturalGrowthPlus('atk')).toBe(10);
    });

    it('records no flat entry when the notes carry no flat growth', () =>
    {
      // Arrange: a rate growth is present, so the growth ran and chose not to write the flat one.
      actor.__notes = [ { note: '<atkGrowthRate:[10]>' } ];

      // Act
      actor.applyNaturalGrowth('atk');

      // Assert
      expect(actor.naturalGrowthPlusTable()).toEqual({});
    });

    it('adds the percent growth the notes carry onto the running total', () =>
    {
      // Arrange
      actor.__notes = [ { note: '<atkGrowthRate:[10]>' } ];

      // Act
      actor.applyNaturalGrowth('atk');

      // Assert
      expect(actor.naturalGrowthRate('atk')).toBe(10);
    });

    it('records no percent entry when the notes carry no percent growth', () =>
    {
      // Arrange: a flat growth is present, so the growth ran and chose not to write the percent one.
      actor.__notes = [ { note: '<atkGrowthPlus:[5]>' } ];

      // Act
      actor.applyNaturalGrowth('atk');

      // Assert
      expect(actor.naturalGrowthRateTable()).toEqual({});
    });

    it('gives the formulas the parameter\'s engine base as b', () =>
    {
      // Arrange: atk's engine base is 10, so a tenth of it is 1.
      actor.__notes = [ { note: '<atkGrowthPlus:[b * 0.1]>' } ];

      // Act
      actor.applyNaturalGrowth('atk');

      // Assert
      expect(actor.naturalGrowthPlus('atk')).toBeCloseTo(1, 10);
    });
  });
  //endregion growth
});
//endregion plugins/natural/core/objects/game-actor.test.js
