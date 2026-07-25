//region plugins/abs/core/models/jabs-battle-memory.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JABS_BattleMemory (direct src import)', () =>
{
  let JABS_BattleMemory;

  beforeAll(async () =>
  {
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: JABS_BattleMemory } = await import('../../../../../src/plugins/abs/core/models/JABS_BattleMemory.js'));
  });

  describe('constructor / initialize', () =>
  {
    it('sets every field from the constructor arguments', () =>
    {
      const memory = new JABS_BattleMemory(5, 10, 2, 40);

      expect(memory.battlerId).toBe(5);
      expect(memory.skillId).toBe(10);
      expect(memory.effectiveness).toBe(2);
      expect(memory.damageApplied).toBe(40);
    });

    it('registers itself with the SerializableRegistry on module load', () =>
    {
      expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(JABS_BattleMemory);
    });
  });

  describe('wasEffective', () =>
  {
    it('is true when effectiveness is at least 1', () =>
    {
      const memory = new JABS_BattleMemory(5, 10, 1, 40);
      expect(memory.wasEffective()).toBe(true);
    });

    it('is false when effectiveness is below 1', () =>
    {
      const memory = new JABS_BattleMemory(5, 10, 0, 40);
      expect(memory.wasEffective()).toBe(false);
    });
  });
});
//endregion plugins/abs/core/models/jabs-battle-memory.test.js
