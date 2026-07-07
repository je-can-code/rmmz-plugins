//region plugins/sks/skill-equip-slot.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('SkillEquipSlot', () =>
{
  /** @type {typeof import('../../../src/plugins/sks/core/_models/SkillEquipSlot.js').default} */
  let SkillEquipSlot;

  beforeAll(async () =>
  {
    // SkillEquipSlot.js calls SerializableRegistry.register(...) as an import-time side effect
    // (so JsonEx restores keep prototype methods after a save load). Stub it before a dynamic
    // import evaluates the module, since a static import would be hoisted ahead of any setup.
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: SkillEquipSlot } = await import('../../../src/plugins/sks/core/_models/SkillEquipSlot.js'));
  });

  afterAll(() =>
  {
    delete globalThis.SerializableRegistry;
  });

  it('registers itself with SerializableRegistry on import', () =>
  {
    expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(SkillEquipSlot);
  });

  it('stores the given index and skillId', () =>
  {
    const slot = new SkillEquipSlot(2, 57);

    expect(slot.index).toBe(2);
    expect(slot.skillId).toBe(57);
  });
});
//endregion plugins/sks/skill-equip-slot.test.js
