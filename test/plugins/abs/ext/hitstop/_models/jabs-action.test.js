//region plugins/abs/ext/hitstop/_models/jabs-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Hitstop JABS_Action (unit, all downstream dependencies mocked)', () =>
{
  const HITSTOP_REGEX = Symbol('Hitstop');
  const NO_HITSTOP_REGEX = Symbol('NoHitstop');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          HITSTOP: {
            RegExp: { Hitstop: HITSTOP_REGEX, NoHitstop: NO_HITSTOP_REGEX },
          },
        },
      },
    };

    globalThis.RPGManager = {
      getNumberFromNoteByRegex: vi.fn(),
      checkForBooleanFromNoteByRegex: vi.fn(),
    };

    function JABS_Action()
    {
    }

    globalThis.JABS_Action = JABS_Action;

    // the file under test- patches globalThis.JABS_Action.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset();
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset();
  });

  function buildAction()
  {
    const action = Object.create(globalThis.JABS_Action.prototype);
    const skill = { id: 1 };
    action.getBaseSkill = () => skill;
    return { action, skill };
  }

  describe('getHitstopFrames', () =>
  {
    it('returns the tagged frames when present', () =>
    {
      // Arrange
      const { action, skill } = buildAction();
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(6);

      // Act
      const result = action.getHitstopFrames();

      // Assert
      expect(globalThis.RPGManager.getNumberFromNoteByRegex).toHaveBeenCalledWith(skill, HITSTOP_REGEX, true);
      expect(result).toBe(6);
    });

    it('returns 0 when the tag is absent', () =>
    {
      // Arrange
      const { action } = buildAction();
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(0);

      // Act
      const result = action.getHitstopFrames();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('skillDisablesHitstop', () =>
  {
    it('returns true when the skill is tagged with <noHitstop>', () =>
    {
      // Arrange
      const { action, skill } = buildAction();
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);

      // Act
      const result = action.skillDisablesHitstop();

      // Assert
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(skill, NO_HITSTOP_REGEX);
      expect(result).toBe(true);
    });

    it('returns false when the tag is absent', () =>
    {
      // Arrange
      const { action } = buildAction();
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);

      // Act
      const result = action.skillDisablesHitstop();

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/hitstop/_models/jabs-action.test.js
