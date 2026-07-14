//region plugins/abs/ext/speed/database/rpg-base.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed RPG_Base (unit, all downstream dependencies mocked)', () =>
{
  const WALK_SPEED_BOOST_REGEX = Symbol('WalkSpeedBoost');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          SPEED: {
            RegExp: { WalkSpeedBoost: WALK_SPEED_BOOST_REGEX },
          },
        },
      },
    };

    globalThis.RPGManager = { getNumberFromNoteByRegex: vi.fn() };

    function RPG_Base()
    {
    }

    globalThis.RPG_Base = RPG_Base;

    await import('../../../../../../src/plugins/abs/ext/speed/database/RPG_Base.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset();
  });

  describe('jabsSpeedBoost', () =>
  {
    it('reads the walk-speed-boost tag from notes', () =>
    {
      // Arrange
      const dbObject = Object.create(globalThis.RPG_Base.prototype);
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(25);

      // Act
      const result = dbObject.jabsSpeedBoost;

      // Assert
      expect(globalThis.RPGManager.getNumberFromNoteByRegex).toHaveBeenCalledWith(dbObject, WALK_SPEED_BOOST_REGEX, true);
      expect(result).toBe(25);
    });
  });
});
//endregion plugins/abs/ext/speed/database/rpg-base.test.js
