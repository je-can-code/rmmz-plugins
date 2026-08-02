//region plugins/jafting/_component/refine-jafting-manager-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// JaftingManager reaches JaftingRefinementLineage through a real ES module binding, and that model
// registers itself with the save registry at module scope. Both of the globals that registration
// reads therefore have to exist before the import graph is evaluated, which is what vi.hoisted buys.
vi.hoisted(() =>
{
  globalThis.SerializableRegistry = { register: () => {} };
  globalThis.JaftingSalvageLedgerSnapshot = class JaftingSalvageLedgerSnapshot {};
  globalThis.String.empty = '';
});

import JaftingManager from '../../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js';
import JaftingRefinementLineage from '../../../../src/plugins/jafting/ext/refine/__models/JaftingRefinementLineage.js';
import JAFTING_Trait from '../../../../src/plugins/jafting/ext/refine/__models/JAFTING_Trait.js';

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
    /**
     * The two provenance nodes every commit hands down, standing in for a base and material that
     * were both plain database rows.
     */
    const baseLineage = () => JaftingRefinementLineage.leaf('w', 5);

    /**
     * @returns {JaftingRefinementLineage}
     */
    const materialLineage = () => JaftingRefinementLineage.leaf('w', 9);

    it('routes weapon-shaped outputs into $dataWeapons and armor-shaped outputs into $dataArmors', () =>
    {
      // Arrange
      const weaponOutput = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0 });
      const armorOutput = fakeEquip({ atypeId: 1, name: 'Shield', jaftingRefinedCount: 0 });

      // Act
      JaftingManager.createRefinedOutput(weaponOutput, baseLineage(), materialLineage());
      JaftingManager.createRefinedOutput(armorOutput, baseLineage(), materialLineage());

      // Assert
      expect($dataWeapons[2001]).toBe(weaponOutput);
      expect($dataArmors[2001]).toBe(armorOutput);
    });

    it('records provenance rather than the refined equip itself', () =>
    {
      // Arrange
      const output = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0 });

      // Act
      JaftingManager.createRefinedOutput(output, baseLineage(), materialLineage());

      // Assert
      const [ [ recorded ] ] = $gameParty.addRefinedWeapon.mock.calls;
      expect(recorded.index).toBe(2001);
      expect(recorded.base.id).toBe(5);
      expect(recorded.material.id).toBe(9);
    });

    it('carries the output ledger onto the lineage node, since replay cannot re-derive it', () =>
    {
      // Arrange
      const ledger = { rows: [ { t: 'w', id: 9, n: 1 } ] };
      const output = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0 });
      output._jaftingSalvageLedger = ledger;

      // Act
      JaftingManager.createRefinedOutput(output, baseLineage(), materialLineage());

      // Assert
      expect($gameParty.addRefinedWeapon.mock.calls[0][0].ledger).toBe(ledger);
    });

    it('appends "+1" the first time an equip is refined', () =>
    {
      // Arrange
      const output = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0 });

      // Act
      JaftingManager.createRefinedOutput(output, baseLineage(), materialLineage());

      // Assert
      expect(output.name).toBe('Sword +1');
    });

    it('replaces the "+n" suffix on subsequent refinements', () =>
    {
      // Arrange
      const output = fakeEquip({ wtypeId: 1, name: 'Sword +1', jaftingRefinedCount: 1 });

      // Act
      JaftingManager.createRefinedOutput(output, baseLineage(), materialLineage());

      // Assert
      expect(output.name).toBe('Sword +2');
    });

    it('appends a fresh "+n" suffix if a later refine has no existing "+" to replace', () =>
    {
      // Arrange
      const output = fakeEquip({ wtypeId: 1, name: 'Sword', jaftingRefinedCount: 1 });

      // Act
      JaftingManager.createRefinedOutput(output, baseLineage(), materialLineage());

      // Assert
      expect(output.name).toBe('Sword +2');
    });

    it('assigns the party refinement counter as the new index and advances it', () =>
    {
      // Arrange
      $gameParty.getRefinementCounter.mockReturnValue(2050);
      const output = fakeEquip({
        wtypeId: 1, name: 'Sword', jaftingRefinedCount: 0, _updateIndex: vi.fn(),
      });

      // Act
      JaftingManager.createRefinedOutput(output, baseLineage(), materialLineage());

      // Assert
      expect(output._updateIndex).toHaveBeenCalledWith(2050);
      expect($gameParty.incrementRefinementCounter).toHaveBeenCalledWith(JaftingManager.RefinementTypes.Weapon);
      expect($gameParty.gainItem).toHaveBeenCalledWith($dataWeapons[2050], 1);
    });

    it('throws for an equip that is neither weapon nor armor shaped', () =>
    {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const shapeless = fakeEquip({ jaftingRefinedCount: 0 });

      // Act
      // Assert
      expect(() =>
        JaftingManager.generateRefinedEquip($dataWeapons, shapeless, 'weapon', baseLineage(), materialLineage()))
        .toThrow(/please stop crafting/);

      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('lineageForDatum', () =>
  {
    it('describes a plain database weapon as a weapon leaf', () =>
    {
      // Arrange
      const datum = { id: 12, isWeapon: () => true, isArmor: () => false };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage.isLeaf()).toBe(true);
      expect(lineage.kind).toBe('w');
      expect(lineage.id).toBe(12);
    });

    it('describes a plain database armor as an armor leaf', () =>
    {
      // Arrange
      const datum = { id: 12, isWeapon: () => false, isArmor: () => true };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage.kind).toBe('a');
    });

    it('falls back to the item letter for a datum that is neither weapon nor armor', () =>
    {
      // Arrange
      const datum = { id: 3, isWeapon: () => false, isArmor: () => false };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage.kind).toBe('i');
    });

    it('nests the recorded provenance when the input was itself a refined row', () =>
    {
      // Arrange
      const tracked = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      $gameParty.getRefinedWeapons = vi.fn(() => [ tracked ]);
      const datum = { id: 2001, isWeapon: () => true, isArmor: () => false };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage).toBe(tracked);
    });

    it('reads the armor list when a refined armor is the input', () =>
    {
      // Arrange
      const tracked = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('a', 5),
        JaftingRefinementLineage.leaf('a', 9),
        null);
      $gameParty.getRefinedArmors = vi.fn(() => [ tracked ]);
      const datum = { id: 2001, isWeapon: () => false, isArmor: () => true };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage).toBe(tracked);
    });

    it('falls back to a leaf when a dynamic-slot datum has no recorded provenance', () =>
    {
      // Arrange
      $gameParty.getRefinedWeapons = vi.fn(() => []);
      const datum = { id: 2001, isWeapon: () => true, isArmor: () => false };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage.isLeaf()).toBe(true);
      expect(lineage.id).toBe(2001);
    });
  });

  describe('replayLineage', () =>
  {
    it('resolves a leaf straight out of the live datastore', () =>
    {
      // Arrange
      const row = fakeEquip({ name: 'Sword' });
      $dataWeapons[5] = row;

      // Act
      const replayed = JaftingManager.replayLineage(JaftingRefinementLineage.leaf('w', 5));

      // Assert
      expect(replayed).toBe(row);
    });

    it('resolves an armor leaf out of $dataArmors', () =>
    {
      // Arrange
      const row = fakeEquip({ name: 'Shield' });
      $dataArmors[7] = row;

      // Act
      const replayed = JaftingManager.replayLineage(JaftingRefinementLineage.leaf('a', 7));

      // Assert
      expect(replayed).toBe(row);
    });

    it('resolves an item leaf out of $dataItems', () =>
    {
      // Arrange
      globalThis.$dataItems = { 3: fakeEquip({ name: 'Potion' }) };

      // Act
      const replayed = JaftingManager.replayLineage(JaftingRefinementLineage.leaf('i', 3));

      // Assert
      expect(replayed.name).toBe('Potion');
    });

    it('throws naming the row when a leaf points at a database entry that is gone', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(() => JaftingManager.replayLineage(JaftingRefinementLineage.leaf('w', 404)))
        .toThrow(/'w:404'/);
    });

    it('throws when a lineage carries a datastore letter nothing maps to', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(() => JaftingManager.replayLineage(JaftingRefinementLineage.leaf('z', 1)))
        .toThrow(/unknown datastore letter/);
    });

    it('re-derives a refinement from whatever the database says now', () =>
    {
      // Arrange
      $dataWeapons[5] = fakeEquip({
        name: 'Sword',
        traits: [ { code: 63, dataId: 0, value: 1 } ],
        _generate: (overrides, index) => fakeEquip({
          name: overrides.name,
          index,
          traits: [ { code: 63, dataId: 0, value: 1 } ],
          jaftingRefinedCount: 0,
          _updateIndex(newIndex) { this.index = newIndex; },
        }),
        _index: () => 5,
      });
      $dataWeapons[9] = fakeEquip({ traits: [ { code: 63, dataId: 0, value: 1 }, { code: 21, dataId: 2, value: 1.1 } ] });
      const lineage = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);

      // Act
      const replayed = JaftingManager.replayLineage(lineage);

      // Assert
      expect(replayed.name).toBe('Sword +1');
      expect(replayed.index).toBe(2001);
    });

    it('reattaches the captured ledger, which replay has no way to re-derive', () =>
    {
      // Arrange
      const ledger = { rows: [ { t: 'w', id: 9, n: 1 } ] };
      $dataWeapons[5] = fakeEquip({
        name: 'Sword',
        _generate: () => fakeEquip({ name: 'Sword', jaftingRefinedCount: 0, _updateIndex: vi.fn() }),
        _index: () => 5,
      });
      $dataWeapons[9] = fakeEquip({});
      const lineage = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        ledger);

      // Act
      const replayed = JaftingManager.replayLineage(lineage);

      // Assert
      expect(replayed._jaftingSalvageLedger).toBe(ledger);
    });

    it('replays a nested refinement before the one that consumed it', () =>
    {
      // Arrange
      // the real `_generate` carries jaftingRefinedCount across the clone (the refine ext aliases
      // RPG_Base._generate to do exactly that), and the suffix logic depends on it.
      const cloneOf = (name, refinedCount) => fakeEquip({
        name,
        traits: [ { code: 63, dataId: 0, value: 1 } ],
        jaftingRefinedCount: refinedCount,
        _generate(overrides) { return cloneOf(overrides.name, overrides.jaftingRefinedCount); },
        _index: () => 5,
        _updateIndex(newIndex) { this.index = newIndex; },
      });
      $dataWeapons[5] = cloneOf('Sword', 0);
      $dataWeapons[9] = fakeEquip({ traits: [ { code: 63, dataId: 0, value: 1 } ] });
      const inner = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      const outer = JaftingRefinementLineage.refinement(
        2002,
        inner,
        JaftingRefinementLineage.leaf('w', 9),
        null);

      // Act
      const replayed = JaftingManager.replayLineage(outer);

      // Assert
      expect(replayed.name).toBe('Sword +2');
      expect(replayed.index).toBe(2002);
    });

    it('produces the same result on a second replay of the same lineage', () =>
    {
      // Arrange
      const cloneOf = name => fakeEquip({
        name,
        traits: [ { code: 63, dataId: 0, value: 1 } ],
        jaftingRefinedCount: 0,
        _generate(overrides) { return cloneOf(overrides.name); },
        _index: () => 5,
        _updateIndex(newIndex) { this.index = newIndex; },
      });
      $dataWeapons[5] = cloneOf('Sword');
      $dataWeapons[9] = fakeEquip({ traits: [ { code: 63, dataId: 0, value: 1 } ] });
      const lineage = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);

      // Act
      const first = JaftingManager.replayLineage(lineage);
      const second = JaftingManager.replayLineage(lineage);

      // Assert
      expect(second.name).toBe(first.name);
      expect(second.jaftingRefinedCount).toBe(first.jaftingRefinedCount);
    });

    it('picks up a rebalanced base row rather than a value frozen at save time', () =>
    {
      // Arrange
      const cloneOf = source => fakeEquip({
        name: source.name,
        params: [ ...source.params ],
        traits: [ { code: 63, dataId: 0, value: 1 } ],
        jaftingRefinedCount: 0,
        _generate(overrides) { return cloneOf(overrides); },
        _index: () => 5,
        _updateIndex(newIndex) { this.index = newIndex; },
      });
      $dataWeapons[5] = cloneOf({ name: 'Sword', params: [ 0, 0, 10, 0, 0, 0, 0, 0 ] });
      $dataWeapons[9] = fakeEquip({ traits: [ { code: 63, dataId: 0, value: 1 } ] });
      const lineage = JaftingRefinementLineage.refinement(
        2001,
        JaftingRefinementLineage.leaf('w', 5),
        JaftingRefinementLineage.leaf('w', 9),
        null);
      const [ , , before ] = JaftingManager.replayLineage(lineage).params;

      // Act
      $dataWeapons[5].params[2] = 25;
      const [ , , after ] = JaftingManager.replayLineage(lineage).params;

      // Assert
      expect(before).toBe(10);
      expect(after).toBe(25);
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
//endregion plugins/jafting/_component/refine-jafting-manager-direct.test.js
