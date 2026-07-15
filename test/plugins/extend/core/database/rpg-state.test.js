//region plugins/extend/core/database/rpg-state.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RPG_State ext/extend augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      EXTEND: {
        RegExp: {
          Extend: /<extend:(.*)>/i,
          StateExtendType: /<extendStateType:(.*)>/i,
        },
      },
    };

    function StubRPGState()
    {
    }

    globalThis.RPG_State = StubRPGState;

    globalThis.RPGManager = {
      getArrayFromNotesByRegex: vi.fn(),
      getStringsFromNoteByRegex: vi.fn(),
    };

    await import('../../../../../src/plugins/extend/core/database/RPG_State.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('isStateExtension', () =>
  {
    it('is true when an id-extension list is present', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 1, 2 ]);
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue(null);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.isStateExtension;

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when a type-extension is present', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue('poison');
      const state = new globalThis.RPG_State();

      // Act
      const result = state.isStateExtension;

      // Assert
      expect(result).toEqual(true);
    });

    it('is false when neither extension tag is present', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue(null);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.isStateExtension;

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('getStateExtensions', () =>
  {
    it('returns the parsed id list from the note', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 3, 4 ]);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.getStateExtensions;

      // Assert
      expect(result).toEqual([ 3, 4 ]);
    });
  });

  describe('getStateExtensionTypes', () =>
  {
    it('returns the parsed type list from the note', () =>
    {
      // Arrange
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue([ 'poison', 'burn' ]);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.getStateExtensionTypes;

      // Assert
      expect(result).toEqual([ 'poison', 'burn' ]);
    });
  });
});
//endregion plugins/extend/core/database/rpg-state.test.js
