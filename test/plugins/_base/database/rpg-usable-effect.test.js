//region plugins/_base/database/rpg-usable-effect.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('RPG_UsableEffect (direct src import)', () =>
{
  let RPG_UsableEffect;

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: RPG_UsableEffect } = await import('../../../../src/plugins/_base/database/_data/RPG_UsableEffect.js'));
  });

  function effect(code, dataId = 0, value1 = 0, value2 = 0)
  {
    return new RPG_UsableEffect({ code, dataId, value1, value2 });
  }

  describe('constructor', () =>
  {
    it('maps code/dataId/value1/value2 from the source object', () =>
    {
      // Arrange & Act
      const result = effect(11, 1, 0.5, 10);

      // Assert
      expect(result.code).toBe(11);
      expect(result.dataId).toBe(1);
      expect(result.value1).toBe(0.5);
      expect(result.value2).toBe(10);
    });
  });

  describe('textName', () =>
  {
    it.each([
      [ 11, 'Recover Life' ],
      [ 12, 'Recover Magi' ],
      [ 13, 'Recover Tech' ],
      [ 21, 'Add State' ],
      [ 22, 'Remove State' ],
      [ 31, 'Add Buff' ],
      [ 32, 'Add Debuff' ],
      [ 33, 'Remove Buff' ],
      [ 34, 'Remove Debuff' ],
      [ 41, 'Special' ],
      [ 42, 'Core Stat Growth' ],
      [ 43, 'Learn Skill' ],
      [ 44, 'Execute Common Event' ],
    ])('code %i resolves to "%s"', (code, expected) =>
    {
      expect(effect(code).textName()).toBe(expected);
    });

    it('warns and returns "UNKNOWN" for an unsupported code', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = effect(9999).textName();

      // Assert
      expect(result).toBe('UNKNOWN');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('9999'));
      warnSpy.mockRestore();
    });
  });

  describe('textValue', () =>
  {
    describe('code 11 (recover HP)', () =>
    {
      it('shows only the flat amount when only value2 is set', () =>
      {
        expect(effect(11, 0, 0, 25).textValue()).toBe('25');
      });

      it('shows only the percent amount when only value1 is set', () =>
      {
        expect(effect(11, 0, 0.5, 0).textValue()).toBe('50%');
      });

      it('shows both the flat and percent amounts when both are set', () =>
      {
        expect(effect(11, 0, 0.5, 25).textValue()).toBe('25 50%');
      });

      it('shows "0" when neither flat nor percent is set', () =>
      {
        expect(effect(11, 0, 0, 0).textValue()).toBe('0');
      });
    });

    it.each([
      [ 12, 'Recover Magi' ],
      [ 13, 'Recover Tech' ],
      [ 21, 'Add State' ],
      [ 22, 'Remove State' ],
      [ 31, 'Add Buff' ],
      [ 32, 'Add Debuff' ],
      [ 33, 'Remove Buff' ],
      [ 34, 'Remove Debuff' ],
      [ 41, 'Special' ],
      [ 42, 'Core Stat Growth' ],
      [ 43, 'Learn Skill' ],
      [ 44, 'Execute Common Event' ],
    ])('code %i resolves to "%s"', (code, expected) =>
    {
      expect(effect(code).textValue()).toBe(expected);
    });

    it('warns and returns "UNKNOWN" for an unsupported code', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = effect(9999).textValue();

      // Assert
      expect(result).toBe('UNKNOWN');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('9999'));
      warnSpy.mockRestore();
    });
  });
});
//endregion plugins/_base/database/rpg-usable-effect.test.js
