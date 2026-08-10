//region plugins/_base/core/database/rpg-equip-item-this-params.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installJBaseHostGlobals } from '../_component/fixtures/install-j-base-host-globals.js';

/**
 * What an equip is worth *of its own*, per parameter.
 *
 * RMMZ gives equipment a `params` array for eight base parameters and nothing for the twenty ex- and
 * sp-parameters, which arrive only as traits - and a trait has no amount of its own, it multiplies what
 * the battler already has. The `<this{PARAM}:N>` tags are that missing field, so a percentage can one day
 * scale the item rather than its wearer.
 *
 * The real patterns are used rather than stand-ins: a test carrying its own copy of the regexes would
 * pass just as happily if every one of them were wrong.
 */
describe('RPG_EquipItem this-parameter bases (direct src import)', () =>
{
  let RPG_EquipItem;

  beforeAll(async () =>
  {
    installJBaseHostGlobals();

    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: RPG_EquipItem } = await import('../../../../../src/plugins/_base/core/database/core/RPG_EquipItem.js'));
  });

  /**
   * Builds an equip carrying the given note and base parameter array.
   * @param {string} note The note to parse tags out of.
   * @param {number[]} [params] The editor's base parameter array.
   * @returns {RPG_EquipItem}
   */
  const equip = (note, params = [ 0, 0, 0, 0, 0, 0, 0, 0 ]) => new RPG_EquipItem({
    id: 1,
    name: 'Test Blade',
    note,
    meta: {},
    description: '',
    iconIndex: 0,
    traits: [],
    etypeId: 1,
    params,
    price: 0,
  }, 1);

  /**
   * Builds a note declaring every named tag at a distinct value, so a mis-wired switch case cannot hide
   * behind two indices happening to hold the same number.
   * @param {string[]} stats The tag stat names, in index order.
   * @returns {string}
   */
  const distinctNote = stats => stats.map((stat, index) => `<this${stat}:${(index + 1) * 3}>`)
    .join('\n');

  const B_PARAMS = [ 'Mhp', 'Mmp', 'Atk', 'Def', 'Mat', 'Mdf', 'Agi', 'Luk' ];
  const X_PARAMS = [ 'Hit', 'Eva', 'Cri', 'Cev', 'Mev', 'Mrf', 'Cnt', 'Hrg', 'Mrg', 'Trg' ];
  const S_PARAMS = [ 'Tgr', 'Grd', 'Rec', 'Pha', 'Mcr', 'Tcr', 'Pdr', 'Mdr', 'Fdr', 'Exr' ];

  //region base parameters
  describe('thisBParamBonus', () =>
  {
    it.each(B_PARAMS.map((stat, index) => [ stat, index, (index + 1) * 3 ]))(
      'reads this%s off index %i as %i',
      (stat, index, expected) =>
      {
        // Arrange- every base tag is present at its own value, so an index wired to the wrong getter
        // returns a number belonging to a different stat rather than coincidentally the right one.
        const item = equip(distinctNote(B_PARAMS));

        // Act
        const result = item.thisBParamBonus(index);

        // Assert
        expect(result)
          .toBe(expected);
      });

    it('answers zero for a parameter id that is not a base parameter', () =>
    {
      // Arrange
      const item = equip(distinctNote(B_PARAMS));

      // Act
      const result = item.thisBParamBonus(99);

      // Assert
      expect(result)
        .toBe(0);
    });
  });

  describe('thisBParam', () =>
  {
    it('sums the editor field and the tag, because both say the same thing', () =>
    {
      // Arrange- a refinement merge can land a tag on a row that already carried a number in the field,
      // so neither wins.
      const item = equip('<thisAtk:15>', [ 0, 0, 40, 0, 0, 0, 0, 0 ]);

      // Act
      const result = item.thisBParam(2);

      // Assert
      expect(result)
        .toBe(55);
    });

    it('reports the editor field alone when no tag is present', () =>
    {
      // Arrange
      const item = equip(String.empty, [ 0, 0, 40, 0, 0, 0, 0, 0 ]);

      // Act
      const result = item.thisBParam(2);

      // Assert
      expect(result)
        .toBe(40);
    });

    it('reports the tag alone when the editor field is zero', () =>
    {
      // Arrange
      const item = equip('<thisAtk:15>');

      // Act
      const result = item.thisBParam(2);

      // Assert
      expect(result)
        .toBe(15);
    });

    it('sums two declarations of the same tag rather than keeping one', () =>
    {
      // Arrange- the summing reader is what makes a merged note honest; the last-wins reader would have
      // silently discarded one of these.
      const item = equip('<thisAtk:15>\n<thisAtk:5>');

      // Act
      const result = item.thisBParam(2);

      // Assert
      expect(result)
        .toBe(20);
    });
  });
  //endregion base parameters

  //region max tech
  describe('thisMtp', () =>
  {
    it('reads its tag, being the one base parameter with no editor field', () =>
    {
      // Arrange- RMMZ fixed tech at a flat hundred rather than modelling it, so the tag is all there is.
      const item = equip('<thisMtp:50>');

      // Act
      const result = item.thisMtp();

      // Assert
      expect(result)
        .toBe(50);
    });

    it('is not satisfied by the bearer-granting maxTp tag', () =>
    {
      // Arrange- `<maxTp:N>` grants its wearer extra tech; this asks what the equip itself is worth. Two
      // near-identical names meaning different things is exactly the pair worth pinning.
      const item = equip('<maxTp:50>');

      // Act
      const result = item.thisMtp();

      // Assert
      expect(result)
        .toBe(0);
    });
  });
  //endregion max tech

  //region ex-parameters
  describe('thisXParam', () =>
  {
    it.each(X_PARAMS.map((stat, index) => [ stat, index, (index + 1) * 3 ]))(
      'reads this%s off index %i as %i',
      (stat, index, expected) =>
      {
        // Arrange
        const item = equip(distinctNote(X_PARAMS));

        // Act
        const result = item.thisXParam(index);

        // Assert
        expect(result)
          .toBe(expected);
      });

    it('answers zero for an id that is not an ex-parameter', () =>
    {
      // Arrange
      const item = equip(distinctNote(X_PARAMS));

      // Act
      const result = item.thisXParam(99);

      // Assert
      expect(result)
        .toBe(0);
    });
  });
  //endregion ex-parameters

  //region sp-parameters
  describe('thisSParam', () =>
  {
    it.each(S_PARAMS.map((stat, index) => [ stat, index, (index + 1) * 3 ]))(
      'reads this%s off index %i as %i',
      (stat, index, expected) =>
      {
        // Arrange
        const item = equip(distinctNote(S_PARAMS));

        // Act
        const result = item.thisSParam(index);

        // Assert
        expect(result)
          .toBe(expected);
      });

    it('answers zero for an id that is not an sp-parameter', () =>
    {
      // Arrange
      const item = equip(distinctNote(S_PARAMS));

      // Act
      const result = item.thisSParam(99);

      // Assert
      expect(result)
        .toBe(0);
    });
  });
  //endregion sp-parameters

  //region own rates
  describe('ownRate', () =>
  {
    /**
     * Builds an equip carrying the given traits.
     *
     * Every fixture below includes two near-miss siblings: one sharing the code with a different dataId,
     * one sharing the dataId with a different code. Without both, `code === c && dataId === d` and a bare
     * `true` are the same program, and no assertion can tell them apart.
     * @param {{code: number, dataId: number, value: number}[]} traits The traits to carry.
     * @returns {RPG_EquipItem}
     */
    const traited = traits => new RPG_EquipItem({
      id: 1,
      name: 'Test Blade',
      note: String.empty,
      meta: {},
      description: '',
      iconIndex: 0,
      traits,
      etypeId: 1,
      params: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
      price: 0,
    }, 1);

    /**
     * The two decoys every case carries, targeting parameter id 2.
     * @type {{code: number, dataId: number, value: number}[]}
     */
    const decoys = [
      // same family, different parameter - catches a reader that ignores dataId.
      {
        code: 21,
        dataId: 5,
        value: 9.0,
      },
      // same parameter, different family - catches a reader that ignores code.
      {
        code: 23,
        dataId: 2,
        value: 7.0,
      },
    ];

    it('subtracts the 1.0 baseline for a base parameter rate', () =>
    {
      // Arrange
      const subject = traited([
        ...decoys, {
          code: 21,
          dataId: 2,
          value: 1.25,
        },
      ]);

      // Act
      const result = subject.ownRate(21, 2);

      // Assert
      expect(result)
        .toBeCloseTo(1.25);
    });

    it('subtracts the 1.0 baseline for an sp-parameter rate', () =>
    {
      // Arrange- the decoy on code 23 sits at dataId 2, so this asks for a different parameter entirely.
      const subject = traited([
        ...decoys, {
          code: 23,
          dataId: 1,
          value: 1.1,
        },
      ]);

      // Act
      const result = subject.ownRate(23, 1);

      // Assert
      expect(result)
        .toBeCloseTo(1.1);
    });

    it('does not subtract a baseline for an ex-parameter, which counts up from zero', () =>
    {
      // Arrange- this is the branch that separates the two arms of the baseline conditional. Code 22
      // stores 0.25 to mean the same thing codes 21 and 23 spell as 1.25.
      const subject = traited([
        ...decoys, {
          code: 22,
          dataId: 2,
          value: 0.25,
        },
      ]);

      // Act
      const result = subject.ownRate(22, 2);

      // Assert
      expect(result)
        .toBeCloseTo(1.25);
    });

    it('answers the neutral multiplier when no trait matches', () =>
    {
      // Arrange- both decoys are present and neither may be counted.
      const subject = traited(decoys);

      // Act
      const result = subject.ownRate(21, 2);

      // Assert
      expect(result)
        .toBeCloseTo(1.0);
    });

    it('sums two matching traits rather than keeping one', () =>
    {
      // Arrange- refinement concatenates payloads onto a base, so an item genuinely carries several of
      // these; keeping only the last would silently discard refinement work.
      const subject = traited([
        ...decoys, {
          code: 21,
          dataId: 2,
          value: 1.25,
        }, {
          code: 21,
          dataId: 2,
          value: 1.5,
        },
      ]);

      // Act
      const result = subject.ownRate(21, 2);

      // Assert- 1.0 + 0.25 + 0.5.
      expect(result)
        .toBeCloseTo(1.75);
    });

    it('carries a reducing trait below the neutral multiplier', () =>
    {
      // Arrange- the measured data holds values like 0.83 on damage-rate parameters, and a reduction has
      // to survive as a reduction rather than being floored into a no-op.
      const subject = traited([
        ...decoys, {
          code: 23,
          dataId: 6,
          value: 0.83,
        },
      ]);

      // Act
      const result = subject.ownRate(23, 6);

      // Assert
      expect(result)
        .toBeCloseTo(0.83);
    });

    it('counts a trait sitting below a JAFTING divider', () =>
    {
      // Arrange- worn gear can carry a divider; the offhand relics do. Its below-divider traits are live
      // when equipped, so a divider-aware reader would silently ignore half of such an item.
      const subject = traited([
        ...decoys, {
          code: 63,
          dataId: 3,
          value: 1,
        }, {
          code: 21,
          dataId: 2,
          value: 1.05,
        },
      ]);

      // Act
      const result = subject.ownRate(21, 2);

      // Assert
      expect(result)
        .toBeCloseTo(1.05);
    });
  });
  //endregion own rates

  //region the transposable pair
  describe('the Trg and Tgr pair', () =>
  {
    it('keeps tech regeneration and target rate apart despite the transposition', () =>
    {
      // Arrange- one letter order apart, unrelated meanings. A reader that confused them would report a
      // plausible number for the wrong stat and nothing would look wrong.
      const item = equip('<thisTrg:7>\n<thisTgr:11>');

      // Act
      const techRegen = item.thisTrg();
      const targetRate = item.thisTgr();

      // Assert
      expect(techRegen)
        .toBe(7);
      expect(targetRate)
        .toBe(11);
    });
  });
  //endregion the transposable pair
});
//endregion plugins/_base/core/database/rpg-equip-item-this-params.test.js