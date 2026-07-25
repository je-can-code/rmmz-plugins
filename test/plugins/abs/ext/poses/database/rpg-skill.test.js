//region plugins/abs/ext/poses/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Poses RPG_Skill (unit, all downstream dependencies mocked)', () =>
{
  const POSE_SUFFIX_REGEX = Symbol('PoseSuffix');

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.POSES namespace- only the shape this one file reads.
    globalThis.J = {
      ABS: {
        EXT: {
          POSES: {
            RegExp: { PoseSuffix: POSE_SUFFIX_REGEX },
          },
        },
      },
    };

    // RPGManager is a downstream dependency (different file); mock it entirely rather than
    // exercising its real note-parsing logic.
    globalThis.RPGManager = { getArrayFromNotesByRegex: vi.fn() };

    // RPG_Skill.prototype only needs to exist for defineProperty to attach getters to.
    function RPG_Skill()
    {
    }

    globalThis.RPG_Skill = RPG_Skill;

    // the file under test- patches globalThis.RPG_Skill.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/poses/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getArrayFromNotesByRegex.mockReset();
  });

  describe('jabsPoseData', () =>
  {
    it('reads the pose array from notes via the pose suffix regex', () =>
    {
      // Arrange
      const skill = Object.create(globalThis.RPG_Skill.prototype);
      const poseArray = [ 'suffix', 2, 15 ];
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(poseArray);

      // Act
      const result = skill.jabsPoseData;

      // Assert
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledWith(skill, POSE_SUFFIX_REGEX, true);
      expect(result).toBe(poseArray);
    });
  });

  describe('jabsPoseSuffix', () =>
  {
    it('reads the zeroth index of the pose data', () =>
    {
      // Arrange
      const skill = Object.create(globalThis.RPG_Skill.prototype);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 'suffix', 2, 15 ]);

      // Act
      const result = skill.jabsPoseSuffix;

      // Assert
      expect(result).toBe('suffix');
    });
  });

  describe('jabsPoseIndex', () =>
  {
    it('reads the first index of the pose data', () =>
    {
      // Arrange
      const skill = Object.create(globalThis.RPG_Skill.prototype);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 'suffix', 2, 15 ]);

      // Act
      const result = skill.jabsPoseIndex;

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('jabsPoseDuration', () =>
  {
    it('reads the second index of the pose data', () =>
    {
      // Arrange
      const skill = Object.create(globalThis.RPG_Skill.prototype);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 'suffix', 2, 15 ]);

      // Act
      const result = skill.jabsPoseDuration;

      // Assert
      expect(result).toBe(15);
    });
  });
});
//endregion plugins/abs/ext/poses/database/rpg-skill.test.js
