//region plugins/jafting/refine-jafting-manager-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JaftingManager from '../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js';
import JAFTING_Trait from '../../../src/plugins/jafting/ext/refine/__models/JAFTING_Trait.js';

/**
 * Direct-import coverage for JaftingManager. It statically imports the real JAFTING_Trait, but
 * everything else it touches- TraitResolver, RPG_Trait, $gameParty, $dataWeapons/$dataArmors,
 * JaftingSalvageLedger, console- is a bare global (never imported, since those live in J-Base / JAFTING
 * core and are only guaranteed to exist once the whole plugin bundle has loaded). Each is stubbed
 * minimally so this file can assert JaftingManager's own branching without re-implementing
 * TraitResolver's actual merge algorithm.
 */
describe('JaftingManager (direct src import)', () =>
{
  beforeEach(() =>
  {
    // J-Base's initialization.js normally defines this sentinel (see the "Return value contracts"
    // convention- methods return typed sentinels, never null/undefined); parseTraits relies on it
    // directly, so it must exist even though _base's initialization module is not imported here.
    if (!Object.prototype.hasOwnProperty.call(Array, 'empty'))
    {
      Object.defineProperty(Array, 'empty', { value: [], configurable: true });
    }

    globalThis.RPG_Trait = {
      fromValues: vi.fn((code, dataId, value) => ({ code, dataId, value })),
    };

    globalThis.TraitResolver = {
      consolidate: vi.fn(traits => traits),
      refineTraits: vi.fn((baseTraits, materialTraits) => baseTraits.concat(materialTraits)),
    };

    globalThis.JaftingSalvageLedger = {
      isMaterialArmorDatum: vi.fn(() => false),
      isMaterialWeaponDatum: vi.fn(() => false),
    };

    globalThis.$gameParty = {
      getRefinementCounter: vi.fn(() => 2001),
      incrementRefinementCounter: vi.fn(),
      gainItem: vi.fn(),
      addRefinedWeapon: vi.fn(),
      addRefinedArmor: vi.fn(),
      equipItems: vi.fn(() => []),
    };

    globalThis.$dataWeapons = {};
    globalThis.$dataArmors = {};

    // JAFTING_Trait.divider() (reached when determineRefinementOutput adds a fresh divider trait) reads
    // this J-Base constant as a bare global.
    globalThis.J = { BASE: { Traits: { NO_DISAPPEAR: 63 } } };
  });

  afterEach(() =>
  {
    delete globalThis.RPG_Trait;
    delete globalThis.TraitResolver;
    delete globalThis.JaftingSalvageLedger;
    delete globalThis.$gameParty;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.J;
  });

  /**
   * Builds a minimal fake equip mirroring the RPG_EquipItem surface JaftingManager reads.
   *
   * @param {object} opts
   * @returns {object}
   */
  function fakeEquip(opts = {})
  {
    return {
      traits: [],
      etypeId: 1,
      jaftingRefinedCount: 0,
      jaftingMaxRefineCount: 0,
      jaftingMaxTraitCount: 0,
      jaftingUnrefinable: false,
      jaftingNotRefinementBase: false,
      _updateIndex: vi.fn(),
      ...opts,
    };
  }

  describe('parseTraits', () =>
  {
    it('returns Array.empty when there is no divider trait (code 63)', () =>
    {
      const equip = fakeEquip({ traits: [ { code: 1, dataId: 0, value: 5 } ] });

      expect(JaftingManager.parseTraits(equip)).toEqual([]);
    });

    it('returns Array.empty when the divider is the last trait (nothing after it)', () =>
    {
      const equip = fakeEquip({ traits: [ { code: 63, dataId: 3, value: 1 } ] });

      expect(JaftingManager.parseTraits(equip)).toEqual([]);
    });

    it('consolidates and maps every trait after the divider into JAFTING_Trait instances', () =>
    {
      const afterDivider = [ { code: 21, dataId: 0, value: 1.1 }, { code: 22, dataId: 0, value: 1.2 } ];
      const equip = fakeEquip({ traits: [ { code: 63, dataId: 3, value: 1 }, ...afterDivider ] });

      const parsed = JaftingManager.parseTraits(equip);

      expect(TraitResolver.consolidate).toHaveBeenCalledWith(afterDivider);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toBeInstanceOf(JAFTING_Trait);
      expect(parsed[0]._code).toBe(21);
    });
  });

  describe('determineRefinementOutput', () =>
  {
    it('returns null when either base or material is missing', () =>
    {
      expect(JaftingManager.determineRefinementOutput(null, fakeEquip())).toBe(null);
      expect(JaftingManager.determineRefinementOutput(fakeEquip(), null)).toBe(null);
    });

    it('merges traits via TraitResolver.refineTraits and appends them after a fresh divider', () =>
    {
      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 }, { code: 21, dataId: 0, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(function generate()
        {
          return { traits: [ ...this.traits ], jaftingRefinedCount: 0 };
        }),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 }, { code: 22, dataId: 0, value: 1 } ],
      });

      const output = JaftingManager.determineRefinementOutput(base, material);

      expect(base._generate).toHaveBeenCalledWith(base, 1);
      // both merged traits landed after the divider- one from base's parsed list, one from material's.
      expect(output.traits.map(t => t.code)).toEqual([ 63, 21, 22 ]);
    });

    it('strips a merged seal-slot trait (code 54) that would seal the base equip own etype slot', () =>
    {
      globalThis.TraitResolver.refineTraits = vi.fn(() => [
        { code: 54, dataId: 5, value: 1 },
        { code: 21, dataId: 0, value: 1 },
      ]);

      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(() => ({ traits: [], jaftingRefinedCount: 0 })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip();

      const output = JaftingManager.determineRefinementOutput(base, material);

      // the seal-slot trait targeting base's own etypeId (5) is filtered out; the other survives.
      expect(output.traits.some(t => t.code === 54)).toBe(false);
      expect(output.traits.some(t => t.code === 21)).toBe(true);
    });

    it('truncates an existing divider tail on the generated output before appending merged traits', () =>
    {
      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(() => ({
          traits: [ { code: 63, dataId: 3, value: 1 }, { code: 99, dataId: 0, value: 1 } ],
          jaftingRefinedCount: 0,
        })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip();

      globalThis.TraitResolver.refineTraits = vi.fn(() => [ { code: 21, dataId: 0, value: 1 } ]);

      const output = JaftingManager.determineRefinementOutput(base, material);

      // the stale code-99 trait after the output's own pre-existing divider is dropped before merging.
      expect(output.traits.map(t => t.code)).toEqual([ 63, 21 ]);
    });

    it('carries the material jaftingRefinedCount forward (minus the default +1) when the material was itself refined', () =>
    {
      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(() => ({ traits: [ { code: 63, dataId: 3, value: 1 } ], jaftingRefinedCount: 0 })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip({ jaftingRefinedCount: 3 });

      const output = JaftingManager.determineRefinementOutput(base, material);

      // 0 (output base) + 3 (material's count) - 1 (default +1 offset) = 2.
      expect(output.jaftingRefinedCount).toBe(2);
    });
  });

  describe('createRefinedOutput / generateRefinedEquip', () =>
  {
    it('routes weapon-shaped outputs into $dataWeapons and armor-shaped outputs into $dataArmors', () =>
    {
      const weaponOutput = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0 });
      JaftingManager.createRefinedOutput(weaponOutput);

      expect($dataWeapons[2001]).toBe(weaponOutput);
      expect($gameParty.addRefinedWeapon).toHaveBeenCalledWith(weaponOutput);

      const armorOutput = fakeEquip({ atypeId: 1, name: 'Shield', jaftingRefinedCount: 0 });
      JaftingManager.createRefinedOutput(armorOutput);

      expect($dataArmors[2001]).toBe(armorOutput);
      expect($gameParty.addRefinedArmor).toHaveBeenCalledWith(armorOutput);
    });

    it('appends "+1" the first time an equip is refined', () =>
    {
      const output = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0 });

      JaftingManager.createRefinedOutput(output);

      expect(output.name).toBe('Sword +1');
    });

    it('replaces the "+n" suffix on subsequent refinements', () =>
    {
      const output = fakeEquip({ wtypeId: 1, name: 'Sword +1', jaftingRefinedCount: 1 });

      JaftingManager.createRefinedOutput(output);

      expect(output.name).toBe('Sword +2');
    });

    it('appends a fresh "+n" suffix if a later refine has no existing "+" to replace', () =>
    {
      const output = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 1 });

      JaftingManager.createRefinedOutput(output);

      expect(output.name).toBe('Sword +2');
    });

    it('assigns the party refinement counter as the new index and advances it', () =>
    {
      $gameParty.getRefinementCounter.mockReturnValue(2050);
      const output = fakeEquip({
        wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0, _updateIndex: vi.fn(),
      });

      JaftingManager.createRefinedOutput(output);

      expect(output._updateIndex).toHaveBeenCalledWith(2050);
      expect($gameParty.incrementRefinementCounter).toHaveBeenCalledWith(JaftingManager.RefinementTypes.Weapon);
      expect($gameParty.gainItem).toHaveBeenCalledWith($dataWeapons[2050], 1);
    });

    it('throws for an equip that is neither weapon nor armor shaped', () =>
    {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => JaftingManager.generateRefinedEquip($dataWeapons, fakeEquip({ jaftingRefinedCount: 0 }), 'weapon'))
        .toThrow(/please stop crafting/);

      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('partyHasEnterableRefinementBase', () =>
  {
    it('is false when the party has no equipped items at all', () =>
    {
      $gameParty.equipItems.mockReturnValue([]);

      expect(JaftingManager.partyHasEnterableRefinementBase()).toBe(false);
    });

    it('filters out configured material-type equips before checking eligibility', () =>
    {
      const materialEquip = fakeEquip();
      globalThis.JaftingSalvageLedger.isMaterialArmorDatum.mockImplementation(e => e === materialEquip);
      $gameParty.equipItems.mockReturnValue([ materialEquip ]);

      expect(JaftingManager.partyHasEnterableRefinementBase()).toBe(false);
    });

    it('skips equips that are unrefinable, max-refined, max-traited, or flagged not-a-base', () =>
    {
      const unrefinable = fakeEquip({ jaftingUnrefinable: true });
      const maxRefined = fakeEquip({ jaftingMaxRefineCount: 1, jaftingRefinedCount: 1 });
      const maxTraited = fakeEquip({ jaftingMaxTraitCount: 1, traits: [ { code: 63, dataId: 3, value: 1 }, { code: 1, dataId: 0, value: 1 } ] });
      const notBase = fakeEquip({ jaftingNotRefinementBase: true });

      $gameParty.equipItems.mockReturnValue([ unrefinable, maxRefined, maxTraited, notBase ]);

      expect(JaftingManager.partyHasEnterableRefinementBase()).toBe(false);
    });

    it('is true once at least one equip clears every exclusion', () =>
    {
      const eligible = fakeEquip();
      $gameParty.equipItems.mockReturnValue([ fakeEquip({ jaftingUnrefinable: true }), eligible ]);

      expect(JaftingManager.partyHasEnterableRefinementBase()).toBe(true);
    });
  });
});
//endregion plugins/jafting/refine-jafting-manager-direct.test.js
