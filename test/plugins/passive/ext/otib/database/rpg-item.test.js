//region plugins/passive/ext/otib/database/rpg-item.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('RPG_Item ext/otib augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { OTIB: { RegExp: { OtibStateIds: /<otib:(\[.*])>/i } } } } };

    function StubRPGItem()
    {
    }

    globalThis.RPG_Item = StubRPGItem;

    globalThis.RPGManager = { getNumbersFromNoteByRegex: vi.fn() };

    await import('../../../../../../src/plugins/passive/ext/otib/database/RPG_Item.js');
  });

  describe('otibStateIds', () =>
  {
    it('reads the OtibStateIds note tag via RPGManager', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumbersFromNoteByRegex.mockReturnValue([ 5, 6 ]);
      const item = new globalThis.RPG_Item();

      // Act
      const result = item.otibStateIds;

      // Assert
      expect(globalThis.RPGManager.getNumbersFromNoteByRegex).toHaveBeenCalledWith(item, globalThis.J.PASSIVE.EXT.OTIB.RegExp.OtibStateIds);
      expect(result).toEqual([ 5, 6 ]);
    });
  });
});
//endregion plugins/passive/ext/otib/database/rpg-item.test.js
