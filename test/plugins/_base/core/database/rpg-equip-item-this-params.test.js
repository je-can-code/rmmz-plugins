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