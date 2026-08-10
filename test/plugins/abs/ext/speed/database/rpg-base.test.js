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

    globalThis.RPGManager = { getSumFromNoteByRegex: vi.fn() };

    function RPG_Base()
    {
    }

    globalThis.RPG_Base = RPG_Base;

    await import('../../../../../../src/plugins/abs/ext/speed/database/RPG_Base.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getSumFromNoteByRegex.mockReset();
  });

  describe('jabsSpeedBoost', () =>
  {
    it('sums the walk-speed-boost tag across the note rather than keeping the last', () =>
    {
      // a boost declared twice on one row means both apply - `refreshSpeedBoots` adds these up across
      // every note source, so a per-source read that kept only the last would drop one silently.
      // Arrange
      const dbObject = Object.create(globalThis.RPG_Base.prototype);
      globalThis.RPGManager.getSumFromNoteByRegex.mockReturnValue(25);

      // Act
      const result = dbObject.jabsSpeedBoost;

      // Assert
      expect(globalThis.RPGManager.getSumFromNoteByRegex).toHaveBeenCalledWith(dbObject, WALK_SPEED_BOOST_REGEX, true);
      expect(result).toBe(25);
    });
  });
});
//endregion plugins/abs/ext/speed/database/rpg-base.test.js
