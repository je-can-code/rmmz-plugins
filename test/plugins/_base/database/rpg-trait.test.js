//region plugins/_base/database/rpg-trait.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('RPG_Trait (direct src import)', () =>
{
  let RPG_Trait;

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.TextManager = {
      param: (id) => `param${id}`,
      xparam: (id) => `xparam${id}`,
      sparam: (id) => `sparam${id}`,
    };

    ({ default: RPG_Trait } = await import('../../../../src/plugins/_base/database/_data/RPG_Trait.js'));
  });

  beforeEach(() =>
  {
    globalThis.$dataSystem = {
      elements: [ 'None', 'Fire', 'Ice' ],
      weaponTypes: [ '', 'Sword' ],
      armorTypes: [ '', 'Shield' ],
      equipTypes: [ '', 'Weapon', 'Armor' ],
      skillTypes: [ '', 'Magic' ],
    };
    globalThis.$dataStates = [ null, { name: 'Poison' } ];
    globalThis.$dataSkills = [ null, { name: 'Fireball' } ];
  });

  function trait(code, dataId = 0, value = 1)
  {
    return new RPG_Trait({ code, dataId, value });
  }

  describe('fromValues (static)', () =>
  {
    it('builds an equivalent instance from the given code/dataId/value', () =>
    {
      // Arrange & Act
      const result = RPG_Trait.fromValues(21, 2, 1.5);

      // Assert
      expect(result.code).toBe(21);
      expect(result.dataId).toBe(2);
      expect(result.value).toBe(1.5);
    });
  });

  describe('constructor', () =>
  {
    it('maps code/dataId/value from the source object', () =>
    {
      // Arrange & Act
      const result = trait(21, 2, 1.5);

      // Assert
      expect(result.code).toBe(21);
      expect(result.dataId).toBe(2);
      expect(result.value).toBe(1.5);
    });
  });

  describe('textNameAndValue', () =>
  {
    it('joins textName() and textValue() with a space', () =>
    {
      // Arrange
      const t = trait(33, 0, 2);

      // Act
      const result = t.textNameAndValue();

      // Assert
      expect(result).toBe(`${t.textName()} ${t.textValue()}`);
    });
  });

  describe('textName', () =>
  {
    it.each([
      [ 11, 'Fire dmg' ],
      [ 12, 'param1 debuff rate' ],
      [ 13, 'Poison resist' ],
      [ 14, 'Immune to' ],
      [ 21, 'param1' ],
      [ 22, 'xparam1' ],
      [ 23, 'sparam1' ],
      [ 31, 'Element:' ],
      [ 32, 'Poison on-hit' ],
      [ 33, 'Skill Speed' ],
      [ 34, 'Times' ],
      [ 35, 'Basic Attack w/' ],
      [ 41, 'Unlock:' ],
      [ 42, 'Lock:' ],
      [ 43, 'Learn:' ],
      [ 44, 'Seal:' ],
      [ 51, 'Sword' ],
      [ 52, 'Shield' ],
      [ 53, 'Weapon' ],
      [ 54, 'Weapon' ],
      [ 61, 'Another turn chance:' ],
      [ 63, 'TRANSFERABLE TRAITS' ],
    ])('code %i resolves to "%s"', (code, expected) =>
    {
      // Arrange
      const t = trait(code, 1, 1);

      // Act & Assert
      expect(t.textName()).toBe(expected);
    });

    it('code 55 resolves to "Enable" when dataId is truthy', () =>
    {
      expect(trait(55, 1).textName()).toBe('Enable');
    });

    it('code 55 resolves to "Disable" when dataId is falsy', () =>
    {
      expect(trait(55, 0).textName()).toBe('Disable');
    });

    it('code 62 delegates to translateSpecialFlag', () =>
    {
      expect(trait(62, 0).textName()).toBe('Autobattle');
    });

    it('code 64 delegates to translatePartyAbility', () =>
    {
      expect(trait(64, 0).textName()).toBe('Encounter Half');
    });

    it('returns the fallback label for an unrecognized code', () =>
    {
      expect(trait(9999).textName()).toBe('Is this a custom trait?');
    });
  });

  describe('textValue', () =>
  {
    it('code 11 shows a "-" prefix when the elemental rate calculation is positive (resistance)', () =>
    {
      // value=0.5 -> 100-(0.5*100)=50 (>0) -> "-50%"
      expect(trait(11, 1, 0.5).textValue()).toBe('-50%');
    });

    it('code 11 shows a "+" prefix when the elemental rate calculation is non-positive (weakness)', () =>
    {
      // value=1.5 -> 100-(1.5*100)=-50 (<=0) -> "+50%"
      expect(trait(11, 1, 1.5).textValue()).toBe('+50%');
    });

    it('code 12 shows a "+" prefix when the debuff rate delta is non-negative', () =>
    {
      // value=1.5 -> (1.5*100)-100=50 (>=0) -> "+50%"
      expect(trait(12, 1, 1.5).textValue()).toBe('+50%');
    });

    it('code 12 shows a "-" prefix when the debuff rate delta is negative', () =>
    {
      // value=0.5 -> (0.5*100)-100=-50 (<0) -> "-50%"
      expect(trait(12, 1, 0.5).textValue()).toBe('-50%');
    });

    it('code 13 shows a "+" prefix when the state rate calculation is positive', () =>
    {
      // value=0.5 -> 100-(0.5*100)=50 (>0) -> "+50%"
      expect(trait(13, 1, 0.5).textValue()).toBe('+50%');
    });

    it('code 13 shows a "-" prefix when the state rate calculation is non-positive', () =>
    {
      // value=1.5 -> 100-(1.5*100)=-50 (<=0) -> "-50%"
      expect(trait(13, 1, 1.5).textValue()).toBe('-50%');
    });

    it('code 14 resolves to the state name', () =>
    {
      expect(trait(14, 1).textValue()).toBe('Poison');
    });

    it('code 21 shows a "+" prefix when the b-param delta is non-negative', () =>
    {
      expect(trait(21, 0, 1.5).textValue()).toBe('+50%');
    });

    it('code 21 shows no prefix when the b-param delta is negative', () =>
    {
      expect(trait(21, 0, 0.5).textValue()).toBe('-50%');
    });

    it('code 22 omits the percent sign for dataId 0 (hit) with a non-negative value', () =>
    {
      expect(trait(22, 0, 0.5).textValue()).toBe('+50');
    });

    it('code 22 omits the percent sign for dataId 0 (hit) with a negative value', () =>
    {
      expect(trait(22, 0, -0.5).textValue()).toBe('-50');
    });

    it('code 22 includes the percent sign for any dataId other than 0, non-negative value', () =>
    {
      expect(trait(22, 1, 0.5).textValue()).toBe('+50%');
    });

    it('code 22 includes the percent sign for any dataId other than 0, negative value', () =>
    {
      expect(trait(22, 1, -0.5).textValue()).toBe('-50%');
    });

    it('code 23 omits the percent sign for dataId 1 (grd) with a non-negative delta', () =>
    {
      expect(trait(23, 1, 1.5).textValue()).toBe('+50');
    });

    it('code 23 omits the percent sign for dataId 1 (grd) with a negative delta', () =>
    {
      expect(trait(23, 1, 0.5).textValue()).toBe('-50');
    });

    it('code 23 includes the percent sign for any dataId other than 1, non-negative delta', () =>
    {
      expect(trait(23, 2, 1.5).textValue()).toBe('+50%');
    });

    it('code 23 includes the percent sign for any dataId other than 1, negative delta', () =>
    {
      expect(trait(23, 2, 0.5).textValue()).toBe('-50%');
    });

    it('code 31 resolves to the element name', () =>
    {
      expect(trait(31, 1).textValue()).toBe('Fire');
    });

    it('code 32 resolves to the raw value as a percent', () =>
    {
      expect(trait(32, 1, 0.5).textValue()).toBe('50%');
    });

    it('code 33 shows a "+" prefix for a non-negative value', () =>
    {
      expect(trait(33, 0, 2).textValue()).toBe('+2');
    });

    it('code 33 shows a "-" prefix for a negative value', () =>
    {
      expect(trait(33, 0, -2).textValue()).toBe('-2');
    });

    it('code 34 shows a "+" prefix for a non-negative value', () =>
    {
      expect(trait(34, 0, 3).textValue()).toBe('+3');
    });

    it('code 34 shows a "-" prefix for a negative value', () =>
    {
      expect(trait(34, 0, -3).textValue()).toBe('-3');
    });

    it('code 35 resolves to the skill name', () =>
    {
      expect(trait(35, 1).textValue()).toBe('Fireball');
    });

    it.each([
      [ 41, 'Magic' ],
      [ 42, 'Magic' ],
      [ 43, 'Fireball' ],
      [ 44, 'Fireball' ],
      [ 51, 'proficiency' ],
      [ 52, 'proficiency' ],
      [ 53, 'is locked' ],
      [ 54, 'is sealed' ],
      [ 55, 'Dual-wield' ],
      [ 62, '' ],
      [ 63, '' ],
      [ 64, '' ],
    ])('code %i resolves to "%s"', (code, expected) =>
    {
      expect(trait(code, 1).textValue()).toBe(expected);
    });

    it('code 61 resolves to the value as a rounded percent', () =>
    {
      expect(trait(61, 0, 0.5).textValue()).toBe('50%');
    });

    it('returns the fallback label for an unrecognized code', () =>
    {
      expect(trait(9999).textValue()).toBe('is this a custom trait?');
    });
  });

  describe('translateSpecialFlag', () =>
  {
    it.each([
      [ 0, 'Autobattle' ],
      [ 1, 'Empowered Guard' ],
      [ 2, 'Cover/Substitute' ],
      [ 3, 'Preserve TP' ],
    ])('dataId %i resolves to "%s"', (dataId, expected) =>
    {
      expect(trait(62, dataId).translateSpecialFlag()).toBe(expected);
    });

    it('returns undefined for an unrecognized dataId', () =>
    {
      expect(trait(62, 999).translateSpecialFlag()).toBeUndefined();
    });
  });

  describe('translatePartyAbility', () =>
  {
    it.each([
      [ 0, 'Encounter Half' ],
      [ 1, 'Encounter None' ],
      [ 2, 'Prevent Surprise' ],
      [ 3, 'Frequent Pre-emptive' ],
      [ 4, 'Gold Dropped 2x' ],
      [ 5, 'Loot Drop Chance 2x' ],
    ])('dataId %i resolves to "%s"', (dataId, expected) =>
    {
      expect(trait(64, dataId).translatePartyAbility()).toBe(expected);
    });

    it('returns undefined for an unrecognized dataId', () =>
    {
      expect(trait(64, 999).translatePartyAbility()).toBeUndefined();
    });
  });
});
//endregion plugins/_base/database/rpg-trait.test.js
