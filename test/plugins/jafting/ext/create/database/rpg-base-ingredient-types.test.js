//region plugins/jafting/ext/create/database/rpg-base-ingredient-types.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Ingredient types are what let a recipe ask for a kind of thing rather than one database row, so the
 * tag has to be repeatable on a single entry. `RPGManager` strips the global flag and scans a note
 * line-by-line, which makes repetition work by putting each tag on its own line - and makes two tags
 * sharing a line silently yield only the first. Both halves are covered here: that the getter
 * delegates, and that the pattern behaves the way the authoring guidance claims.
 */
describe('RPG_Base ingredientTypes (direct src import)', () =>
{
  let IngredientType;

  beforeAll(async () =>
  {
    vi.resetModules();

    IngredientType = /<ingredientType:[ ]?(\w+)>/i;

    globalThis.J = { JAFTING: { EXT: { CREATE: { RegExp: { IngredientType } } } } };

    function StubRPGBase()
    {
    }

    globalThis.RPG_Base = StubRPGBase;
    globalThis.RPGManager = { getStringsFromNoteByRegex: vi.fn(() => []) };

    await import('../../../../../../src/plugins/jafting/ext/create/database/RPG_Base.js');
  });

  it('declares the same pattern in initialization as this file asserts against', async () =>
  {
    // Arrange - importing initialization pulls the whole metadata chain, so read the declaration
    // rather than executing it. This is what stops the test's copy drifting from the shipped regex.
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(
      new URL('../../../../../../src/plugins/jafting/ext/create/_metadata/initialization.js', import.meta.url),
      'utf8');

    // Act
    const declared = /RegExp\.IngredientType = (\/.+\/\w*);/.exec(source);

    // Assert
    expect(declared).not.toBeNull();
    expect(declared[ 1 ]).toBe(IngredientType.toString());
  });

  beforeEach(() =>
  {
    RPGManager.getStringsFromNoteByRegex.mockClear();
  });

  describe('the getter', () =>
  {
    it('delegates to the note reader with the ingredient type pattern', () =>
    {
      // Arrange
      const datum = new RPG_Base();
      RPGManager.getStringsFromNoteByRegex.mockReturnValue([ 'protein', 'meat' ]);

      // Act
      const result = datum.ingredientTypes();

      // Assert
      expect(result).toEqual([ 'protein', 'meat' ]);
      expect(RPGManager.getStringsFromNoteByRegex).toHaveBeenCalledWith(datum, IngredientType);
    });

    it('reports no types when the note reader finds none', () =>
    {
      // Arrange - most database entries are not ingredients, and that is a meaningful answer.
      const datum = new RPG_Base();
      RPGManager.getStringsFromNoteByRegex.mockReturnValue([]);

      // Act
      const result = datum.ingredientTypes();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('the pattern', () =>
  {
    /**
     * Mirrors how RPGManager scans a note: strip the global and sticky flags, split on newlines, and
     * exec once per line taking the first capture.
     * @param {string} note The note to scan.
     * @returns {string[]}
     */
    function scan(note)
    {
      const safeFlags = IngredientType.flags.replace('g', '')
        .replace('y', '');
      const scanner = new RegExp(IngredientType.source, safeFlags);

      return note.split(/[\r\n]+/)
        .map(line => scanner.exec(line))
        .filter(result => result !== null)
        .map(([ , captured ]) => captured);
    }

    it('captures one type from one line', () =>
    {
      // Arrange, Act
      const result = scan('<ingredientType:protein>');

      // Assert
      expect(result).toEqual([ 'protein' ]);
    });

    it('captures a type from each of several lines', () =>
    {
      // Arrange, Act
      const result = scan('<ingredientType:protein>\n<ingredientType:meat>\n<ingredientType:flank>');

      // Assert
      expect(result).toEqual([ 'protein', 'meat', 'flank' ]);
    });

    it('captures only the first of two tags sharing a line', () =>
    {
      // Arrange - this is the authoring constraint the scanning strategy imposes.
      // Act
      const result = scan('<ingredientType:protein> <ingredientType:meat>');

      // Assert
      expect(result).toEqual([ 'protein' ]);
    });

    it('tolerates one optional space after the colon', () =>
    {
      // Arrange, Act
      const result = scan('<ingredientType: protein>');

      // Assert
      expect(result).toEqual([ 'protein' ]);
    });

    it('matches regardless of casing', () =>
    {
      // Arrange, Act
      const result = scan('<INGREDIENTTYPE:protein>');

      // Assert
      expect(result).toEqual([ 'protein' ]);
    });

    it('ignores unrelated tags on other lines', () =>
    {
      // Arrange, Act
      const result = scan('<level:5>\n<ingredientType:meat>\n<drops:[i,74,5]>');

      // Assert
      expect(result).toEqual([ 'meat' ]);
    });
  });
});
//endregion plugins/jafting/ext/create/database/rpg-base-ingredient-types.test.js
