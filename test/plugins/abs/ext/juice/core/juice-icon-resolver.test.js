//region plugins/abs/ext/juice/core/juice-icon-resolver.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JuiceIconResolver.js is a dependency-free static class reading the `$data*` tables as bare
 * globals, so it is imported directly and the tables are stubbed on the realm. `Diagnostics` comes
 * from the shared setup file; its `warn` is spied per test and restored by hand, because a spy left
 * on a bare global leaks into every test that follows it in this file.
 */
describe('JuiceIconResolver (unit, database tables stubbed)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/core/JuiceIconResolver.js').default} */
  let JuiceIconResolver;

  /** @type {import('vitest').MockInstance} */
  let warn;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: JuiceIconResolver } =
      await import('../../../../../../src/plugins/abs/ext/juice/core/JuiceIconResolver.js'));
  });

  beforeEach(() =>
  {
    // index 0 is the engine's own null row in every database table, hence the leading nulls.
    // each table carries a sibling the lookup has to walk past, so "reads id 2" and "reads the
    // first row it finds" are not the same program.
    globalThis.$dataItems = [ null, { iconIndex: 11 }, { iconIndex: 12 } ];
    globalThis.$dataWeapons = [ null, { iconIndex: 21 }, { iconIndex: 22 } ];
    globalThis.$dataArmors = [ null, { iconIndex: 31 }, { iconIndex: 32 } ];
    globalThis.$dataSkills = [ null, { iconIndex: 41 }, { iconIndex: 42 } ];

    warn = vi.spyOn(Diagnostics, 'warn').mockImplementation(() =>
    {
    });
  });

  afterEach(() =>
  {
    warn.mockRestore();
  });

  describe('resolve()', () =>
  {
    it('hands back a raw index untouched', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Icon Index', 195);

      // Assert
      expect(iconIndex).toEqual(195);
      expect(warn).not.toHaveBeenCalled();
    });

    it('reads the icon off an item row', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Item', 2);

      // Assert
      expect(iconIndex).toEqual(12);
    });

    it('reads the icon off a weapon row', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Weapon', 2);

      // Assert
      expect(iconIndex).toEqual(22);
    });

    it('reads the icon off an armor row', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Armor', 2);

      // Assert
      expect(iconIndex).toEqual(32);
    });

    it('reads the icon off a skill row', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Skill', 2);

      // Assert
      expect(iconIndex).toEqual(42);
    });

    it('warns and blanks the icon for a source it does not know', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Enemy', 1);

      // Assert
      expect(iconIndex).toEqual(0);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('warns and blanks the icon for an id no row answers to', () =>
    {
      // Arrange: id 7 is past the end of a table that does hold rows, which is the author typo.
      // Act
      const iconIndex = JuiceIconResolver.resolve('Item', 7);

      // Assert
      expect(iconIndex).toEqual(0);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('warns and blanks the icon for the engine null row at index zero', () =>
    {
      // Arrange / Act
      const iconIndex = JuiceIconResolver.resolve('Item', 0);

      // Assert
      expect(iconIndex).toEqual(0);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('tableFor()', () =>
  {
    it('hands back null for a source it does not know', () =>
    {
      // Arrange / Act / Assert
      expect(JuiceIconResolver.tableFor('Enemy')).toEqual(null);
    });

    it('hands back the table each known source names', () =>
    {
      // Arrange / Act / Assert: four sources, four distinct tables, none standing in for another.
      expect(JuiceIconResolver.tableFor('Item')).toBe(globalThis.$dataItems);
      expect(JuiceIconResolver.tableFor('Weapon')).toBe(globalThis.$dataWeapons);
      expect(JuiceIconResolver.tableFor('Armor')).toBe(globalThis.$dataArmors);
      expect(JuiceIconResolver.tableFor('Skill')).toBe(globalThis.$dataSkills);
    });
  });
});
//endregion plugins/abs/ext/juice/core/juice-icon-resolver.test.js