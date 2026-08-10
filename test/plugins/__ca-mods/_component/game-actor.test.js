//region plugins/__ca-mods/_component/game-actor.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installCaModsHostGlobals } from './fixtures/install-ca-mods-host-globals.js';

describe('CAMods Game_Actor (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    installCaModsHostGlobals();

    // J-Base first- __ca-mods's own initialization.js and patch files assume J.BASE already exists.
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- patches the real, engine-provided Game_Actor.prototype.
    await import('../../../../src/plugins/__ca-mods/core/objects/Game_Actor.js');
  });

  afterAll(() =>
  {
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  /**
   * Builds a bare Game_Actor without running the real `initialize()`/`setup()` chain (which
   * requires a populated `$dataActors` database entry)- tests assign only the state each method
   * under test actually reads.
   * @returns {Game_Actor}
   */
  function buildActor()
  {
    return Object.create(globalThis.Game_Actor.prototype);
  }

  describe('equipSlots', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataSystem = { equipTypes: [ String.empty, 'weapon', 'shield', 'head', 'body', 'accessory' ] };
    });

    afterEach(() =>
    {
      delete globalThis.$dataSystem;
    });

    it('appends a duplicate of the 5th equip type (accessory) to the base slots', () =>
    {
      const actor = buildActor();
      actor.isDualWield = () => false;

      // base engine slots for 5 equip types (index 1-5, excluding the blank 0th type) are [1,2,3,4,5];
      // __ca-mods appends a second 5 so actors get two accessory slots.
      expect(actor.equipSlots()).toEqual([ 1, 2, 3, 4, 5, 5 ]);
    });
  });

  describe('performMapDamage', () =>
  {
    it('always flashes the screen and plays the damage animation, regardless of battle state', () =>
    {
      const actor = buildActor();

      globalThis.$gameScreen = { startFlashForDamage: vi.fn() };
      globalThis.$gamePlayer = { requestAnimation: vi.fn() };

      actor.performMapDamage();

      expect(globalThis.$gameScreen.startFlashForDamage).toHaveBeenCalledTimes(1);
      expect(globalThis.$gamePlayer.requestAnimation).toHaveBeenCalledWith(59);

      delete globalThis.$gameScreen;
      delete globalThis.$gamePlayer;
    });
  });

  describe('basicFloorDamage', () =>
  {
    afterEach(() =>
    {
      delete globalThis.$dataMap;
      delete globalThis.RPGManager;
    });

    it('falls back to the original engine logic when there is no $dataMap', () =>
    {
      const actor = buildActor();
      globalThis.$dataMap = null;

      // the real engine's basicFloorDamage() always returns a flat 10.
      expect(actor.basicFloorDamage()).toBe(10);
    });

    it('falls back to the original engine logic when $dataMap has no meta', () =>
    {
      const actor = buildActor();
      globalThis.$dataMap = {};

      expect(actor.basicFloorDamage()).toBe(10);
    });

    it('routes basicFloorDamage through the calculated version once the map carries meta', () =>
    {
      // Arrange- the engine's flat 10 is what a map without any damage-floor tags gets; a tagged map
      // must reach the calculation instead, or every damage floor in the game deals the same amount.
      const actor = buildActor();
      globalThis.$dataMap = { note: String.empty, meta: {} };
      const calculateFloorDamage = vi.spyOn(actor, 'calculateFloorDamage').mockReturnValue(42);

      // Act
      const damage = actor.basicFloorDamage();

      // Assert
      expect(damage).toBe(42);
      expect(calculateFloorDamage).toHaveBeenCalled();

      calculateFloorDamage.mockRestore();
    });

    it('uses calculateFloorDamage() when $dataMap and its meta are both present', () =>
    {
      const actor = buildActor();
      // mhp is a read-only getter on the real Game_BattlerBase prototype (derived from param(0));
      // shadow it with an own-property override instead of assigning through the inherited setter-less accessor.
      Object.defineProperty(actor, 'mhp', { value: 200 });
      globalThis.$dataMap = { note: String.empty, meta: {} };
      globalThis.RPGManager = {
        getNumbersFromNoteByRegex: (referenceData, structure) =>
        {
          // distinguish the flat-damage tag lookup from the percent-damage tag lookup by regex identity.
          if (structure.source.includes('damageFlat')) return [ 5 ];
          if (structure.source.includes('damagePerc')) return [ 10 ];
          return [];
        },
      };

      // floorDamageSources() only contributes $dataMap, whose note is non-empty ("" is still
      // falsy, so extractFloorDamageRate's !referenceData.note guard would bail- give it a
      // non-empty note so it actually parses).
      globalThis.$dataMap.note = 'x';

      // flat(5) + percent(10% of 200 mhp = 20) = 25.
      expect(actor.calculateFloorDamage()).toBe(25);
    });
  });

  describe('extractFloorDamageRate', () =>
  {
    afterEach(() =>
    {
      delete globalThis.RPGManager;
    });

    it('returns 0 without parsing when the reference data has no note', () =>
    {
      const actor = buildActor();

      expect(actor.extractFloorDamageRate({ note: String.empty })).toBe(0);
    });
  });

  describe('floorDamageSources', () =>
  {
    afterEach(() =>
    {
      delete globalThis.$dataMap;
    });

    it('includes $dataMap as the sole source', () =>
    {
      const actor = buildActor();
      globalThis.$dataMap = { id: 'map' };

      expect(actor.floorDamageSources()).toEqual([ { id: 'map' } ]);
    });
  });

  describe('refreshAutoEquippedSkills', () =>
  {
    it('auto-equips every learned skill not already present in an equipped slot', () =>
    {
      const actor = buildActor();
      const jabsProcessLearnedSkill = vi.fn();

      actor.skills = () => [ { id: 10 }, { id: 20 } ];
      actor.getAllEquippedSkills = () => [ { id: 10 } ];
      actor.jabsProcessLearnedSkill = jabsProcessLearnedSkill;

      actor.refreshAutoEquippedSkills();

      // skill 10 is already in a slot, so only skill 20 should be auto-processed.
      expect(jabsProcessLearnedSkill).toHaveBeenCalledTimes(1);
      expect(jabsProcessLearnedSkill).toHaveBeenCalledWith(20);
    });
  });
});
//endregion plugins/__ca-mods/_component/game-actor.test.js
