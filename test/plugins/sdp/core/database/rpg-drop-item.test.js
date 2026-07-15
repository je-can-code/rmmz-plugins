//region plugins/sdp/core/database/rpg-drop-item.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('RPG_DropItem ext/sdp augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    function StubRPGDropItem()
    {
    }

    globalThis.RPG_DropItem = StubRPGDropItem;

    await import('../../../../../src/plugins/sdp/core/database/RPG_DropItem.js');
  });

  describe('sdpKey getter/getSdpKey/setSdpKey', () =>
  {
    it('returns undefined when no key has been set', () =>
    {
      // Arrange
      const drop = new globalThis.RPG_DropItem();

      // Act
      const result = drop.sdpKey;

      // Assert
      expect(result).toEqual(undefined);
    });

    it('reflects a key set via setSdpKey', () =>
    {
      // Arrange
      const drop = new globalThis.RPG_DropItem();

      // Act
      drop.setSdpKey('panel-1');

      // Assert
      expect(drop.sdpKey).toEqual('panel-1');
      expect(drop.getSdpKey()).toEqual('panel-1');
    });
  });

  describe('isSdpDrop', () =>
  {
    it('returns false when there is no sdp key', () =>
    {
      // Arrange
      const drop = new globalThis.RPG_DropItem();

      // Act
      const result = drop.isSdpDrop();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when an sdp key is set', () =>
    {
      // Arrange
      const drop = new globalThis.RPG_DropItem();
      drop.setSdpKey('panel-1');

      // Act
      const result = drop.isSdpDrop();

      // Assert
      expect(result).toEqual(true);
    });
  });
});
//endregion plugins/sdp/core/database/rpg-drop-item.test.js
