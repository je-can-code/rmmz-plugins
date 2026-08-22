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
import NoteResolver from '../../../../src/plugins/_base/core/managers/NoteResolver.js';

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

    // the real merger, not a stub: note merging is the half of a refinement this file exists to prove,
    // and a stubbed one would only confirm that JaftingManager calls something.
    globalThis.NoteResolver = NoteResolver;

    // JAFTING_Trait.divider() (reached when determineRefinementOutput adds a fresh divider trait) reads
    // this J-Base constant as a bare global, and the transferable divider pattern is read the same way.
    globalThis.J = {
      BASE: { Traits: { NO_DISAPPEAR: 63 } },
      JAFTING: {
        EXT: {
          REFINE: { RegExp: { TransferrableEffectsBelow: /<transferrableEffectsBelow>/i } },
        },
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.RPG_Trait;
    delete globalThis.TraitResolver;
    delete globalThis.JaftingSalvageLedger;
    delete globalThis.$gameParty;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.NoteResolver;
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

  //region transferable note effects
  describe('parseNoteEffects', () =>
  {
    it('returns nothing when the note carries no divider', () =>
    {
      // Arrange- silence means an equip offers nothing, which is what stops a donor's identity from
      // being laundered onto a base.
      const equip = fakeEquip({ note: '<skillId:1>\n<bonusHits:2>' });

      // Act
      const result = JaftingManager.parseNoteEffects(equip);

      // Assert
      expect(result).toBe('');
    });

    it('returns only what sits below the divider', () =>
    {
      // Arrange- the tag above must not leak; it is the equip's own.
      const equip = fakeEquip({ note: '<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:2>' });

      // Act
      const result = JaftingManager.parseNoteEffects(equip);

      // Assert
      expect(result).toBe('<bonusHits:2>');
    });

    it('returns nothing when the divider is the last line', () =>
    {
      // Arrange
      const equip = fakeEquip({ note: '<skillId:1>\n<transferrableEffectsBelow>' });

      // Act
      const result = JaftingManager.parseNoteEffects(equip);

      // Assert
      expect(result).toBe('');
    });
  });

  describe('countRefinedEffects', () =>
  {
    /**
     * Builds an equip carrying the given traits below a divider.
     * @param {string} note The equip's note.
     * @param {number} traitsBelow How many traits sit below the trait divider.
     * @returns {object}
     */
    const withEffects = (note, traitsBelow) => fakeEquip({
      note,
      traits: [
        { code: 31, dataId: 1, value: 0 },
        { code: 63, dataId: 0, value: 0 },
        ...new Array(traitsBelow)
          .fill(0)
          .map((_, i) => ({ code: 22, dataId: i, value: 0.1 })),
      ],
    });

    it('counts the traits below the divider when the note offers nothing', () =>
    {
      // Arrange - a note with no divider contributes no effects, so only the traits are counted.
      const equip = withEffects('<skillId:1>\n<bonusHits:2>', 3);

      // Act
      const result = JaftingManager.countRefinedEffects(equip);

      // Assert
      expect(result).toBe(3);
    });

    it('counts note effects alongside the traits', () =>
    {
      // Arrange - two traits and two transferable note lines is four effects, not two.
      const equip = withEffects('<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:2>\n<speedBoost:5>', 2);

      // Act
      const result = JaftingManager.countRefinedEffects(equip);

      // Assert
      expect(result).toBe(4);
    });

    it('counts note effects on an equip carrying no traits at all', () =>
    {
      // Arrange - the channel that used to go entirely uncounted.
      const equip = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:2>\n<speedBoost:5>' });

      // Act
      const result = JaftingManager.countRefinedEffects(equip);

      // Assert
      expect(result).toBe(2);
    });

    it('counts a divider with nothing under it as no note effects', () =>
    {
      // Arrange - an empty offer must not read as one effect.
      const equip = withEffects('<skillId:1>\n<transferrableEffectsBelow>', 1);

      // Act
      const result = JaftingManager.countRefinedEffects(equip);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('parseRetainedNote', () =>
  {
    it('keeps the whole note when there is no divider', () =>
    {
      // Arrange- nothing was offered, so nothing is separable.
      const equip = fakeEquip({ note: '<skillId:1>\n<maxRefineCount:6>' });

      // Act
      const result = JaftingManager.parseRetainedNote(equip);

      // Assert
      expect(result).toBe('<skillId:1>\n<maxRefineCount:6>');
    });

    it('drops the divider and everything under it', () =>
    {
      // Arrange
      const equip = fakeEquip({ note: '<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:2>' });

      // Act
      const result = JaftingManager.parseRetainedNote(equip);

      // Assert
      expect(result).toBe('<skillId:1>');
    });

    it('answers empty for an equip with no note at all', () =>
    {
      // Arrange- database rows routinely carry a null note.
      const equip = fakeEquip({ note: null });

      // Act
      const result = JaftingManager.parseRetainedNote(equip);

      // Assert
      expect(result).toBe('');
    });

    it('drops the empty leading line a note beginning with a newline produces', () =>
    {
      // Arrange- splitting on newlines yields an empty first element for such a note, and carrying it
      // through would put a blank line at the head of every refined equip's note.
      const equip = fakeEquip({ note: '\n<skillId:1>' });

      // Act
      const result = JaftingManager.parseRetainedNote(equip);

      // Assert
      expect(result).toBe('<skillId:1>');
    });
  });

  describe('transferPolicyFor', () =>
  {
    it('marks a key whose values are all plain numbers as summing', () =>
    {
      // Act
      const { summingKeys, accumulatingKeys } = JaftingManager.transferPolicyFor('<bonusHits:2>', '<bonusHits:3>');

      // Assert
      expect(summingKeys).toEqual([ 'bonushits' ]);
      expect(accumulatingKeys).toEqual([]);
    });

    it('marks a formula key as accumulating', () =>
    {
      // Act
      const { summingKeys, accumulatingKeys } = JaftingManager.transferPolicyFor('<cdmBuffPlus:[a.atk]>', '');

      // Assert
      expect(summingKeys).toEqual([]);
      expect(accumulatingKeys).toEqual([ 'cdmbuffplus' ]);
    });

    it('marks a boolean key as accumulating', () =>
    {
      // Act
      const { summingKeys, accumulatingKeys } = JaftingManager.transferPolicyFor('<ignoreParry>', '');

      // Assert
      expect(summingKeys).toEqual([]);
      expect(accumulatingKeys).toEqual([ 'ignoreparry' ]);
    });

    it('disqualifies a key that is numeric on one side and a formula on the other', () =>
    {
      // Arrange & Act- totalling a mixed pair would invent a value, so the whole key steps back to
      // accumulating rather than summing what it can and dropping the rest.
      const { summingKeys, accumulatingKeys } = JaftingManager.transferPolicyFor('<k:2>', '<k:[a.atk]>');

      // Assert
      expect(summingKeys).toEqual([]);
      expect(accumulatingKeys).toEqual([ 'k' ]);
    });

    it('stays disqualified when the formula is seen before the number', () =>
    {
      // Arrange & Act- the reverse order of the case above. A classification that overwrote its verdict
      // on every sighting rather than only downgrading it would call this one summing.
      const { summingKeys, accumulatingKeys } = JaftingManager.transferPolicyFor('<k:[a.atk]>', '<k:2>');

      // Assert
      expect(summingKeys).toEqual([]);
      expect(accumulatingKeys).toEqual([ 'k' ]);
    });

    it('classifies each key on its own', () =>
    {
      // Arrange- a note carrying both shapes must not have one shape decide for the other.
      const base = '<bonusHits:2>\n<cdmBuffPlus:[a.atk]>';

      // Act
      const { summingKeys, accumulatingKeys } = JaftingManager.transferPolicyFor(base, '');

      // Assert
      expect(summingKeys).toEqual([ 'bonushits' ]);
      expect(accumulatingKeys).toEqual([ 'cdmbuffplus' ]);
    });
  });

  describe('tagValuesOf', () =>
  {
    it('keys a value tag by its key and holds the value as authored', () =>
    {
      // Arrange & Act- brackets and spacing survive, because interpreting them is a registry's job.
      const result = JaftingManager.tagValuesOf('<cdmBuffPlus:[a.atk * 1.5]>');

      // Assert
      expect(result.get('cdmBuffPlus')).toEqual([ '[a.atk * 1.5]' ]);
    });

    it('reports a boolean tag presence as its value', () =>
    {
      // Arrange & Act- there is no value to show, and an empty right-hand column reads as broken.
      const result = JaftingManager.tagValuesOf('<ignoreParry>');

      // Assert
      expect(result.get('ignoreParry')).toEqual([ 'yes' ]);
    });

    it('keeps two distinct values under one key', () =>
    {
      // Arrange
      const note = '<cdmBuffPlus:[a.atk]>\n<cdmBuffPlus:[a.def]>';

      // Act
      const result = JaftingManager.tagValuesOf(note);

      // Assert
      expect(result.get('cdmBuffPlus')).toEqual([ '[a.atk]', '[a.def]' ]);
    });

    it('collapses an identical value written twice', () =>
    {
      // Arrange- matching how the merger buckets them, so the display cannot disagree with the note.
      const note = '<bonusHits:2>\n<bonusHits:2>';

      // Act
      const result = JaftingManager.tagValuesOf(note);

      // Assert
      expect(result.get('bonusHits')).toEqual([ '2' ]);
    });

    it('answers empty for a note with no tags', () =>
    {
      // Act
      const result = JaftingManager.tagValuesOf('just some prose');

      // Assert
      expect(result.size).toBe(0);
    });
  });

  describe('buildNoteEffectComparison', () =>
  {
    it('reports a donor-only effect as having no previous value', () =>
    {
      // Arrange
      const base = fakeEquip({ note: '<skillId:1>' });
      const result = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:2>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert
      expect(rows).toEqual([ { key: 'bonusHits', before: null, after: '2' } ]);
    });

    it('reports both sides of a value the merge moved', () =>
    {
      // Arrange
      const base = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:2>' });
      const result = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:4>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert
      expect(rows).toEqual([ { key: 'bonusHits', before: '2', after: '4' } ]);
    });

    it('reports a carried effect as unchanged rather than as a gain', () =>
    {
      // Arrange- the same formula on both sides collapses to one line, so nothing moved.
      const base = fakeEquip({ note: '<transferrableEffectsBelow>\n<cdmBuffPlus:[a.atk]>' });
      const result = fakeEquip({ note: '<transferrableEffectsBelow>\n<cdmBuffPlus:[a.atk]>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert
      expect(rows).toEqual([ { key: 'cdmBuffPlus', before: '[a.atk]', after: '[a.atk]' } ]);
    });

    it('joins several values under one key', () =>
    {
      // Arrange- two distinct formulas accumulated, which is what the player gained.
      const base = fakeEquip({ note: '<transferrableEffectsBelow>\n<cdmBuffPlus:[a.atk]>' });
      const result = fakeEquip({ note: '<transferrableEffectsBelow>\n<cdmBuffPlus:[a.atk]>\n<cdmBuffPlus:[a.def]>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert
      expect(rows).toEqual([ { key: 'cdmBuffPlus', before: '[a.atk]', after: '[a.atk], [a.def]' } ]);
    });

    it('ignores effects that never crossed the divider', () =>
    {
      // Arrange- the identity halves of both equips must not appear as transferable effects.
      const base = fakeEquip({ note: '<thisHit:20>\n<transferrableEffectsBelow>\n<bonusHits:1>' });
      const result = fakeEquip({ note: '<thisHit:20>\n<transferrableEffectsBelow>\n<bonusHits:1>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert- thisHit sits above the divider on both sides and is nobody's payload.
      expect(rows).toEqual([ { key: 'bonusHits', before: '1', after: '1' } ]);
    });

    it('orders rows by key so one pairing always reads the same way', () =>
    {
      // Arrange
      const base = fakeEquip({ note: null });
      const result = fakeEquip({ note: '<transferrableEffectsBelow>\n<speedBoost:1>\n<bonusHits:1>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert
      expect(rows.map(row => row.key)).toEqual([ 'bonusHits', 'speedBoost' ]);
    });

    it('answers empty when neither side has anything transferable', () =>
    {
      // Arrange
      const base = fakeEquip({ note: '<skillId:1>' });
      const result = fakeEquip({ note: '<skillId:1>' });

      // Act
      const rows = JaftingManager.buildNoteEffectComparison(base, result);

      // Assert
      expect(rows).toEqual([]);
    });
  });

  describe('mergeTransferableNotes', () =>
  {
    it('leaves the base note alone when the donor offers nothing', () =>
    {
      // Arrange- a donor with no divider gives nothing, and the base never had a payload either.
      const base = fakeEquip({ note: '<skillId:1>' });
      const material = fakeEquip({ note: '<bonusHits:9>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert- the donor's bonusHits sat above no divider at all, so it is not on offer.
      expect(result).toBe('<skillId:1>');
    });

    it('writes a divider and the payload onto a base that had none', () =>
    {
      // Arrange
      const base = fakeEquip({ note: '<skillId:1>' });
      const material = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:2>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert
      expect(result).toBe('<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:2>');
    });

    it('totals a numeric payload the base already carried', () =>
    {
      // Arrange- refining the same material twice, which is the case duplicate lines cannot express.
      const base = fakeEquip({ note: '<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:2>' });
      const material = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:2>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert
      expect(result).toBe('<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:4>');
    });

    it('stacks two distinct formulas side by side', () =>
    {
      // Arrange
      const base = fakeEquip({ note: '<transferrableEffectsBelow>\n<cdmBuffPlus:[a.atk]>' });
      const material = fakeEquip({ note: '<transferrableEffectsBelow>\n<cdmBuffPlus:[a.def]>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert
      expect(result).toBe('<transferrableEffectsBelow>\n<cdmBuffPlus:[a.atk]>\n<cdmBuffPlus:[a.def]>');
    });

    it('never lets the base own effects reach the payload', () =>
    {
      // Arrange- the base's this-parameter bases are its identity. If these crossed the divider, ten
      // donated swords would stack ten weapons' worth of flat attack onto one.
      const base = fakeEquip({ note: '<thisHit:20>\n<maxRefineCount:6>' });
      const material = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:1>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert
      expect(result).toBe('<thisHit:20>\n<maxRefineCount:6>\n<transferrableEffectsBelow>\n<bonusHits:1>');
    });

    it('never lets the donor own effects reach the payload either', () =>
    {
      // Arrange- the donor's identity sits above its divider and stays with the donor.
      const base = fakeEquip({ note: '<skillId:1>' });
      const material = fakeEquip({ note: '<thisHit:99>\n<transferrableEffectsBelow>\n<bonusHits:1>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert
      expect(result).toBe('<skillId:1>\n<transferrableEffectsBelow>\n<bonusHits:1>');
    });

    it('omits the leading blank line when the base has no note of its own', () =>
    {
      // Arrange
      const base = fakeEquip({ note: null });
      const material = fakeEquip({ note: '<transferrableEffectsBelow>\n<bonusHits:1>' });

      // Act
      const result = JaftingManager.mergeTransferableNotes(base, material);

      // Assert
      expect(result).toBe('<transferrableEffectsBelow>\n<bonusHits:1>');
    });
  });
  //endregion transferable note effects

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
      // Arrange- the two near misses carry this test. A seal aimed at some *other* slot is a perfectly
      // good thing for a refinement to hand over, and an ordinary parameter trait whose dataId happens
      // to equal the base's etype is not a seal at all. Only the trait matching on both counts may go,
      // and with one candidate a filter that dropped every 54, or every dataId 5, would look identical.
      globalThis.TraitResolver.refineTraits = vi.fn(() => [
        { code: 54, dataId: 5, value: 1 },
        { code: 54, dataId: 4, value: 1 },
        { code: 21, dataId: 5, value: 1 },
      ]);

      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(() => ({ traits: [], jaftingRefinedCount: 0 })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip();

      // Act
      const output = JaftingManager.determineRefinementOutput(base, material);

      // Assert- the fresh divider, then both survivors, and nothing else.
      expect(output.traits.map(t => [ t.code, t.dataId ])).toEqual([ [ 63, 3 ], [ 54, 4 ], [ 21, 5 ] ]);
    });

    it('writes a divider onto a generated output that arrived without one', () =>
    {
      // Arrange- the divider is the whole declaration of what an equip is offering, so an output that
      // appended its merged traits with no divider above them would hand over its entire trait list
      // the next time it was donated. The leading code-22 trait is a near miss for the divider search:
      // a search that answered "found it" for any trait would truncate this equip's own traits away.
      globalThis.TraitResolver.refineTraits = vi.fn(() => [ { code: 21, dataId: 0, value: 1 } ]);

      const base = fakeEquip({
        traits: [],
        etypeId: 5,
        _generate: vi.fn(() => ({
          traits: [ { code: 22, dataId: 1, value: 1 } ],
          jaftingRefinedCount: 0,
        })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip();

      // Act
      const output = JaftingManager.determineRefinementOutput(base, material);

      // Assert
      expect(output.traits.map(t => t.code)).toEqual([ 22, 63, 21 ]);
    });

    it('truncates an existing divider tail on the generated output before appending merged traits', () =>
    {
      // Arrange- the code-22 trait sits above the divider and is the output's own, so it has to be
      // untouched by the truncation. It is also what stops a divider search that simply answered zero
      // from passing: that would cut this trait off along with the stale tail.
      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(() => ({
          traits: [
            { code: 22, dataId: 1, value: 1 },
            { code: 63, dataId: 3, value: 1 },
            { code: 99, dataId: 0, value: 1 },
          ],
          jaftingRefinedCount: 0,
        })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip();

      globalThis.TraitResolver.refineTraits = vi.fn(() => [ { code: 21, dataId: 0, value: 1 } ]);

      const output = JaftingManager.determineRefinementOutput(base, material);

      // the stale code-99 trait after the output's own pre-existing divider is dropped before merging.
      expect(output.traits.map(t => t.code)).toEqual([ 22, 63, 21 ]);
    });

    it('leaves the base jaftingRefinedCount untouched by however refined the material was', () =>
    {
      // Arrange- a base four refinements deep, and a donor carrying three of its own. The donor's
      // history is what a player spent building it; charging the base for it is what used to make a
      // max-refined weapon unusable as a donor.
      const base = fakeEquip({
        traits: [ { code: 63, dataId: 3, value: 1 } ],
        etypeId: 5,
        _generate: vi.fn(() => ({
          traits: [ { code: 63, dataId: 3, value: 1 } ],
          jaftingRefinedCount: 4,
        })),
        _index: vi.fn(() => 1),
      });
      const material = fakeEquip({ jaftingRefinedCount: 3 });

      // Act
      const output = JaftingManager.determineRefinementOutput(base, material);

      // Assert- 4, the base's own count. Not 7 or 6 (the donor's history added), and not 0 (reset).
      // The single count this refinement costs is applied later, by stampRefinedOutput.
      expect(output.jaftingRefinedCount).toBe(4);
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

    it('refuses an output that is neither weapon nor armor', () =>
    {
      // Arrange - there is no third datastore to pick, and guessing one would leave an orphaned row
      // behind when the lineage step then failed anyway.
      const neither = fakeEquip({ name: 'Potion', jaftingRefinedCount: 0 });

      // Act & Assert
      expect(() => JaftingManager.createRefinedOutput(neither, baseLineage(), materialLineage()))
        .toThrow(/neither weapon nor armor/);
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
      // a static row sits at the slot its id names, so the two agree.
      const datum = { id: 12, _key: () => 12, isWeapon: () => true, isArmor: () => false };

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
      const datum = { id: 12, _key: () => 12, isWeapon: () => false, isArmor: () => true };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage.kind).toBe('a');
    });

    it('falls back to the item letter for a datum that is neither weapon nor armor', () =>
    {
      // Arrange
      const datum = { id: 3, _key: () => 3, isWeapon: () => false, isArmor: () => false };

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

      // a second refined weapon the party also owns, sitting ahead of the wanted one in the list. A
      // lookup that took whatever came first would return this one, and with a list of one there is
      // nothing to tell "the entry at this slot" apart from "the first entry".
      const otherSlot = JaftingRefinementLineage.refinement(
        2002,
        JaftingRefinementLineage.leaf('w', 7),
        JaftingRefinementLineage.leaf('w', 8),
        null);
      $gameParty.getRefinedWeapons = vi.fn(() => [ otherSlot, tracked ]);

      // a refined row is a clone of its base, so it keeps the base's id forever and only its slot
      // moves into the dynamic range. Giving this datum id 2001 would describe a shape the game
      // never builds, and would let an implementation that asks about the id pass.
      const datum = { id: 5, _key: () => 2001, isWeapon: () => true, isArmor: () => false };

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
      const datum = { id: 5, _key: () => 2001, isWeapon: () => false, isArmor: () => true };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert
      expect(lineage).toBe(tracked);
    });

    it('falls back to a leaf when a dynamic-slot datum has no recorded provenance', () =>
    {
      // Arrange
      $gameParty.getRefinedWeapons = vi.fn(() => []);
      const datum = { id: 5, _key: () => 2001, isWeapon: () => true, isArmor: () => false };

      // Act
      const lineage = JaftingManager.lineageForDatum(datum);

      // Assert- a dynamic row nobody recorded degrades to the database row it was cloned from,
      // which is the most that can honestly be said about it.
      expect(lineage.isLeaf()).toBe(true);
      expect(lineage.id).toBe(5);
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

    it('filters out configured material-type weapons as well as armors', () =>
    {
      // Arrange - the weapon-side exclusion is a separate branch from the armor one.
      const materialWeapon = fakeEquip();
      globalThis.JaftingSalvageLedger.isMaterialWeaponDatum.mockImplementation(e => e === materialWeapon);
      $gameParty.equipItems.mockReturnValue([ materialWeapon ]);

      // Act & Assert
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

    it('is true for an equip with room left under caps that genuinely exist', () =>
    {
      // Arrange - both ceilings are set and neither is reached. Every other case here uses a cap of zero
      // or one already met, so both comparisons leave via the same arm and neither is constrained; a
      // reader that treated any non-zero cap as "full" would pass all of them.
      const roomToSpare = fakeEquip({
        jaftingMaxRefineCount: 3,
        jaftingRefinedCount: 1,
        jaftingMaxTraitCount: 4,
        traits: [ { code: 63, dataId: 3, value: 1 }, { code: 1, dataId: 0, value: 1 } ],
      });

      $gameParty.equipItems.mockReturnValue([ roomToSpare ]);

      // Act & Assert
      expect(JaftingManager.partyHasEnterableRefinementBase()).toBe(true);
    });
  });
});
//endregion plugins/jafting/_component/refine-jafting-manager-direct.test.js
