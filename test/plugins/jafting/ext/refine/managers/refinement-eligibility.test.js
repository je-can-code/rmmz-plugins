//region plugins/jafting/ext/refine/managers/refinement-eligibility.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// trait merging is JaftingManager's job and has its own coverage; these tests are about the policy layered on top of
// it, so the two numbers it contributes - how many traits a donor carries, and how many the merge would produce -
// are handed over directly rather than derived through a real merge.
vi.mock('../../../../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js', () => ({
  default: {
    parseTraits: equip => new Array(equip.traitCount ?? 0).fill({}),
    determineRefinementOutput: (base, material) => ({
      traitCount: (base.traitCount ?? 0) + (material.traitCount ?? 0),
    }),
  },
}));

import RefinementEligibility
  from '../../../../../../src/plugins/jafting/ext/refine/managers/RefinementEligibility.js';

/**
 * The refinement lists ask two questions of every row, and the order they are asked in is the whole reason this
 * class exists. Eligibility used to be worked out while a row was being drawn, which left the ordering pass nothing
 * to read - so a player hunting for their one valid donor scrolled past every invalid one to reach it.
 *
 * The policy itself is deliberately uneven, and the seam is permanence: a role this equip can never fill is dropped
 * from the list outright, while a ceiling it has merely reached stays visible and sinks to the bottom. Collapsing
 * those two into one "unusable" would either tease the player with rows they can never pick, or hide the fact that
 * their favourite weapon is finished.
 */
describe('RefinementEligibility (direct src import)', () =>
{
  /**
   * Builds an equip with only the surface this policy reads.
   * @param {object} [overrides] Fields to set on the equip.
   * @returns {object}
   */
  function equip(overrides = {})
  {
    return {
      id: 1,
      etypeId: 1,
      iconIndex: 50,
      traitCount: 1,
      jaftingUnrefinable: false,
      jaftingNotRefinementBase: false,
      jaftingNotRefinementMaterial: false,
      jaftingRefinedCount: 0,
      jaftingMaxRefineCount: 0,
      jaftingMaxTraitCount: 0,
      ...overrides,
    };
  }

  beforeEach(() =>
  {
    globalThis.String.empty = '';

    globalThis.J = {
      JAFTING: {
        EXT: {
          REFINE: {
            Messages: {
              AlreadyMaxRefineCount: 'max refines',
              AlreadyMaxTraitCount: 'max traits',
              NoTraitsOnMaterial: 'no traits',
              ExceedRefineCount: 'over refines',
              ExceedTraitCount: 'over traits',
            },
          },
        },
      },
    };

    globalThis.JaftingSalvageManager = { getLedgerForDatum: () => null };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.JaftingSalvageManager;
  });

  //region permanence
  describe('isPermanentlyExcluded', () =>
  {
    it('excludes gear barred from refinement altogether', () =>
    {
      // Arrange & Act & Assert - true for either role, so the base list is asked here.
      expect(RefinementEligibility.isPermanentlyExcluded(equip({ jaftingUnrefinable: true }), true)).toBe(true);
    });

    it('excludes a base-barred equip from the base list', () =>
    {
      // Arrange & Act & Assert
      expect(RefinementEligibility.isPermanentlyExcluded(equip({ jaftingNotRefinementBase: true }), true))
        .toBe(true);
    });

    it('keeps a base-barred equip in the donor list, where it is still fine', () =>
    {
      // Arrange - the flags are per-role, so barring one role must not bar the other.
      const datum = equip({ jaftingNotRefinementBase: true });

      // Act & Assert
      expect(RefinementEligibility.isPermanentlyExcluded(datum, false)).toBe(false);
    });

    it('excludes a donor-barred equip from the donor list', () =>
    {
      // Arrange & Act & Assert
      expect(RefinementEligibility.isPermanentlyExcluded(equip({ jaftingNotRefinementMaterial: true }), false))
        .toBe(true);
    });

    it('keeps a donor-barred equip in the base list', () =>
    {
      // Arrange & Act & Assert
      expect(RefinementEligibility.isPermanentlyExcluded(equip({ jaftingNotRefinementMaterial: true }), true))
        .toBe(false);
    });

    it('keeps ordinary gear in either list', () =>
    {
      // Arrange & Act & Assert
      expect(RefinementEligibility.isPermanentlyExcluded(equip(), false)).toBe(false);
    });
  });
  //endregion permanence

  //region judging a base
  describe('evaluateAsBase', () =>
  {
    it('allows an unremarkable equip', () =>
    {
      // Arrange & Act
      const verdict = RefinementEligibility.evaluate(equip(), true, null);

      // Assert - the icon stays the equip's own when nothing is wrong.
      expect(verdict.enabled).toBe(true);
      expect(verdict.iconIndex).toBe(50);
    });

    it('treats a refine cap of zero as no cap at all', () =>
    {
      // Arrange - zero means unlimited, not "none allowed".
      const datum = equip({ jaftingMaxRefineCount: 0, jaftingRefinedCount: 9 });

      // Act
      const verdict = RefinementEligibility.evaluate(datum, true, null);

      // Assert
      expect(verdict.enabled).toBe(true);
    });

    it('bars an equip that has been refined as far as it goes', () =>
    {
      // Arrange
      const datum = equip({ jaftingMaxRefineCount: 3, jaftingRefinedCount: 3 });

      // Act
      const verdict = RefinementEligibility.evaluate(datum, true, null);

      // Assert - capped rather than blocked: this is an achievement, and the list keeps showing it.
      expect(verdict.enabled).toBe(false);
      expect(verdict.iconIndex).toBe(RefinementEligibility.CappedIcon);
      expect(verdict.errorText).toContain('max refines');
    });

    it('treats a trait cap of zero as no cap at all', () =>
    {
      // Arrange
      const datum = equip({ jaftingMaxTraitCount: 0, traitCount: 12 });

      // Act
      const verdict = RefinementEligibility.evaluate(datum, true, null);

      // Assert
      expect(verdict.enabled).toBe(true);
    });

    it('bars an equip already holding its maximum traits', () =>
    {
      // Arrange
      const datum = equip({ jaftingMaxTraitCount: 2, traitCount: 2 });

      // Act
      const verdict = RefinementEligibility.evaluate(datum, true, null);

      // Assert
      expect(verdict.enabled).toBe(false);
      expect(verdict.errorText).toContain('max traits');
    });
  });
  //endregion judging a base

  //region judging a donor
  describe('evaluateAsMaterial', () =>
  {
    it('bars a donor with nothing below the divider to give', () =>
    {
      // Arrange - refinement moves traits, so a donor without any is useless by definition.
      const datum = equip({ traitCount: 0 });

      // Act
      const verdict = RefinementEligibility.evaluate(datum, false, null);

      // Assert
      expect(verdict.enabled).toBe(false);
      expect(verdict.errorText).toContain('no traits');
    });

    it('allows a donor with traits while no base has been chosen', () =>
    {
      // Arrange - every remaining ceiling is measured against the base, so there is nothing yet to measure.
      // Act
      const verdict = RefinementEligibility.evaluate(equip(), false, null);

      // Assert
      expect(verdict.enabled).toBe(true);
    });

    it('bars a donor that would push the base past its refine ceiling', () =>
    {
      // Arrange
      const base = equip({ jaftingMaxRefineCount: 2, jaftingRefinedCount: 2 });
      const donor = equip({ jaftingRefinedCount: 1 });

      // Act
      const verdict = RefinementEligibility.evaluate(donor, false, base);

      // Assert - blocked rather than capped: it is this pairing that fails, not the donor itself.
      expect(verdict.enabled).toBe(false);
      expect(verdict.iconIndex).toBe(RefinementEligibility.BlockedIcon);
      expect(verdict.errorText).toContain('over refines');
    });

    it('ignores the refine ceiling when the base is uncapped', () =>
    {
      // Arrange
      const base = equip({ jaftingMaxRefineCount: 0, jaftingRefinedCount: 40 });
      const donor = equip({ jaftingRefinedCount: 40 });

      // Act
      const verdict = RefinementEligibility.evaluate(donor, false, base);

      // Assert
      expect(verdict.enabled).toBe(true);
    });

    it('allows a donor that lands exactly on the refine ceiling', () =>
    {
      // Arrange - the boundary is inclusive, so hitting the cap exactly is still allowed.
      const base = equip({ jaftingMaxRefineCount: 3, jaftingRefinedCount: 2 });
      const donor = equip({ jaftingRefinedCount: 1 });

      // Act
      const verdict = RefinementEligibility.evaluate(donor, false, base);

      // Assert
      expect(verdict.enabled).toBe(true);
    });

    it('bars a donor whose traits overflow the merged result', () =>
    {
      // Arrange
      const base = equip({ jaftingMaxTraitCount: 3, traitCount: 2 });
      const donor = equip({ traitCount: 2 });

      // Act
      const verdict = RefinementEligibility.evaluate(donor, false, base);

      // Assert
      expect(verdict.enabled).toBe(false);
      expect(verdict.iconIndex).toBe(RefinementEligibility.CappedIcon);
      expect(verdict.errorText).toContain('over traits');
    });

    it('allows a donor whose traits still fit under a capped base', () =>
    {
      // Arrange - a cap that exists and is not reached, which is the ordinary case for any base carrying one.
      const base = equip({ jaftingMaxTraitCount: 3, traitCount: 1 });
      const donor = equip({ traitCount: 1 });

      // Act
      const verdict = RefinementEligibility.evaluate(donor, false, base);

      // Assert
      expect(verdict.enabled).toBe(true);
      expect(verdict.iconIndex).toBe(50);
    });

    it('ignores the trait ceiling when the base is uncapped', () =>
    {
      // Arrange
      const base = equip({ jaftingMaxTraitCount: 0, traitCount: 9 });
      const donor = equip({ traitCount: 9 });

      // Act
      const verdict = RefinementEligibility.evaluate(donor, false, base);

      // Assert
      expect(verdict.enabled).toBe(true);
    });
  });
  //endregion judging a donor

  //region lineage
  describe('hasStampedLineage', () =>
  {
    it('counts any refined equip as stamped', () =>
    {
      // Arrange & Act & Assert
      expect(RefinementEligibility.hasStampedLineage(equip({ jaftingRefinedCount: 1 }))).toBe(true);
    });

    it('does not count an equip with no ledger at all', () =>
    {
      // Arrange & Act & Assert
      expect(RefinementEligibility.hasStampedLineage(equip())).toBe(false);
    });

    it('does not count an equip whose ledger records nothing', () =>
    {
      // Arrange - an empty stamp is real storage carrying no history, which is not a story worth sorting on.
      globalThis.JaftingSalvageManager.getLedgerForDatum = () => ({ rows: [] });

      // Act & Assert
      expect(RefinementEligibility.hasStampedLineage(equip())).toBe(false);
    });

    it('counts an equip carrying dismantle history', () =>
    {
      // Arrange
      globalThis.JaftingSalvageManager.getLedgerForDatum = () => ({ rows: [ { t: 'i', id: 1, n: 1 } ] });

      // Act & Assert
      expect(RefinementEligibility.hasStampedLineage(equip())).toBe(true);
    });
  });
  //endregion lineage

  //region ordering
  describe('compareCandidates', () =>
  {
    /**
     * Wraps an equip with a verdict, as the list does before ordering.
     * @param {object} datum The equip.
     * @param {boolean} enabled Whether it was judged usable.
     * @returns {{ equip: object, verdict: { enabled: boolean } }}
     */
    function candidate(datum, enabled)
    {
      return {
        equip: datum,
        verdict: { enabled },
      };
    }

    it('puts a usable row above an unusable one', () =>
    {
      // Arrange & Act
      const order = RefinementEligibility.compareCandidates(candidate(equip(), true), candidate(equip(), false));

      // Assert
      expect(order).toBeLessThan(0);
    });

    it('puts an unusable row below a usable one', () =>
    {
      // Arrange - the comparator has to answer both directions consistently or the sort is undefined.
      // Act
      const order = RefinementEligibility.compareCandidates(candidate(equip(), false), candidate(equip(), true));

      // Assert
      expect(order).toBeGreaterThan(0);
    });

    it('puts a row with history above stock gear of the same usability', () =>
    {
      // Arrange
      const stamped = equip({ jaftingRefinedCount: 1 });

      // Act
      const order = RefinementEligibility.compareCandidates(candidate(stamped, true), candidate(equip(), true));

      // Assert
      expect(order).toBeLessThan(0);
    });

    it('puts stock gear below a row with history', () =>
    {
      // Arrange
      const stamped = equip({ jaftingRefinedCount: 1 });

      // Act
      const order = RefinementEligibility.compareCandidates(candidate(equip(), true), candidate(stamped, true));

      // Assert
      expect(order).toBeGreaterThan(0);
    });

    it('orders weapons before armor when neither has history', () =>
    {
      // Arrange - etypeId 1 is the weapon slot; everything above it is armor.
      const armor = equip({ etypeId: 4 });

      // Act
      const order = RefinementEligibility.compareCandidates(candidate(equip(), true), candidate(armor, true));

      // Assert
      expect(order).toBeLessThan(0);
    });

    it('groups copies of one template by id when all else matches', () =>
    {
      // Arrange
      const later = equip({ id: 9 });

      // Act
      const order = RefinementEligibility.compareCandidates(candidate(equip(), true), candidate(later, true));

      // Assert
      expect(order).toBeLessThan(0);
    });

    it('reports two identical rows as equal', () =>
    {
      // Arrange & Act
      const order = RefinementEligibility.compareCandidates(candidate(equip(), true), candidate(equip(), true));

      // Assert
      expect(order).toBe(0);
    });
  });
  //endregion ordering
});
//endregion plugins/jafting/ext/refine/managers/refinement-eligibility.test.js