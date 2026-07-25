//region plugins/popups/ext/abs/database/rpg-state.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RPG_State ext/abs augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      POPUPS: {
        EXT: {
          ABS: {
            RegExp: {
              NoHpSlipPopup: /<noHpSlipPopup>/i,
              NoMpSlipPopup: /<noMpSlipPopup>/i,
              NoTpSlipPopup: /<noTpSlipPopup>/i,
              NoAnySlipPopup: /<noAnySlipPopup>/i,
            },
          },
        },
      },
    };

    globalThis.RPGManager = { checkForBooleanFromNoteByRegex: vi.fn() };

    function StubRPGState()
    {
    }

    globalThis.RPG_State = StubRPGState;

    await import('../../../../../../src/plugins/popups/ext/abs/database/RPG_State.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('popupsNoHpSlip', () =>
  {
    it('checks the note against the NoHpSlipPopup regex', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.popupsNoHpSlip;

      // Assert
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(state, globalThis.J.POPUPS.EXT.ABS.RegExp.NoHpSlipPopup);
      expect(result).toEqual(true);
    });
  });

  describe('popupsNoMpSlip', () =>
  {
    it('checks the note against the NoMpSlipPopup regex', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.popupsNoMpSlip;

      // Assert
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(state, globalThis.J.POPUPS.EXT.ABS.RegExp.NoMpSlipPopup);
      expect(result).toEqual(false);
    });
  });

  describe('popupsNoTpSlip', () =>
  {
    it('checks the note against the NoTpSlipPopup regex', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.popupsNoTpSlip;

      // Assert
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(state, globalThis.J.POPUPS.EXT.ABS.RegExp.NoTpSlipPopup);
      expect(result).toEqual(true);
    });
  });

  describe('popupsNoAnySlip', () =>
  {
    it('checks the note against the NoAnySlipPopup regex', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const state = new globalThis.RPG_State();

      // Act
      const result = state.popupsNoAnySlip;

      // Assert
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(state, globalThis.J.POPUPS.EXT.ABS.RegExp.NoAnySlipPopup);
      expect(result).toEqual(true);
    });
  });
});
//endregion plugins/popups/ext/abs/database/rpg-state.test.js
