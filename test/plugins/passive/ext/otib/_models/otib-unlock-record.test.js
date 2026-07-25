//region plugins/passive/ext/otib/_models/otib-unlock-record.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('OtibUnlockRecord (direct src import)', () =>
{
  let OtibUnlockRecord;
  let FakeSerializableRegistry;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeSerializableRegistry = { register: vi.fn() };
    globalThis.SerializableRegistry = FakeSerializableRegistry;

    ({ default: OtibUnlockRecord } = await import('../../../../../../src/plugins/passive/ext/otib/_models/OtibUnlockRecord.js'));
  });

  describe('constructor', () =>
  {
    it('assigns the itemId and stateIds', () =>
    {
      // Arrange/Act
      const record = new OtibUnlockRecord(7, [ 1, 2 ]);

      // Assert
      expect(record.itemId).toEqual(7);
      expect(record.stateIds).toEqual([ 1, 2 ]);
    });
  });

  describe('module import side effect', () =>
  {
    it('registers itself with SerializableRegistry', () =>
    {
      // Arrange/Act/Assert (registration happened at import time in beforeAll)
      expect(FakeSerializableRegistry.register).toHaveBeenCalledWith(OtibUnlockRecord);
    });
  });
});
//endregion plugins/passive/ext/otib/_models/otib-unlock-record.test.js
