//region plugins/extend/core/database/rpg-base.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RPG_Base ext/extend augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      EXTEND: {
        RegExp: {
          Extend: /<extend:(.*)>/i,
          ExtendType: /<extendType:(.*)>/i,
        },
      },
    };

    function StubRPGBase()
    {
    }

    globalThis.RPG_Base = StubRPGBase;

    globalThis.RPGManager = {
      getArrayFromNotesByRegex: vi.fn(),
      getStringsFromNoteByRegex: vi.fn(),
    };

    await import('../../../../../src/plugins/extend/core/database/RPG_Base.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('isExtension', () =>
  {
    it('is true when an id-extension list is present', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 1, 2 ]);
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue(null);
      const dbObject = new globalThis.RPG_Base();

      // Act
      const result = dbObject.isExtension;

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when a type-extension is present', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue('poison');
      const dbObject = new globalThis.RPG_Base();

      // Act
      const result = dbObject.isExtension;

      // Assert
      expect(result).toEqual(true);
    });

    it('is false when neither extension tag is present', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue(null);
      const dbObject = new globalThis.RPG_Base();

      // Act
      const result = dbObject.isExtension;

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('getExtensions', () =>
  {
    it('returns the parsed id list from the note', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 3, 4 ]);
      const dbObject = new globalThis.RPG_Base();

      // Act
      const result = dbObject.getExtensions;

      // Assert
      expect(result).toEqual([ 3, 4 ]);
    });
  });

  describe('getExtensionTypes', () =>
  {
    it('returns the parsed type list from the note', () =>
    {
      // Arrange
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue([ 'poison', 'burn' ]);
      const dbObject = new globalThis.RPG_Base();

      // Act
      const result = dbObject.getExtensionTypes;

      // Assert
      expect(result).toEqual([ 'poison', 'burn' ]);
    });
  });
});
//endregion plugins/extend/core/database/rpg-base.test.js
