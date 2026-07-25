//region plugins/abs/ext/food/allyai/jabs-skill-slot-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_SkillSlotManager (unit, all downstream dependencies mocked)', () =>
{
  let originalGetEquippedAllySlots;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { Aliased: { JABS_SkillSlotManager: new Map() } } } } };
    globalThis.JABS_Button = { UsableItem: 'usableItem' };

    function JABS_SkillSlotManager()
    {
    }

    originalGetEquippedAllySlots = vi.fn();
    JABS_SkillSlotManager.prototype.getEquippedAllySlots = originalGetEquippedAllySlots;
    globalThis.JABS_SkillSlotManager = JABS_SkillSlotManager;

    await import('../../../../../../src/plugins/abs/ext/food/allyai/JABS_SkillSlotManager.js');
  });

  beforeEach(() =>
  {
    originalGetEquippedAllySlots.mockReset();
  });

  describe('getEquippedAllySlots', () =>
  {
    it('filters out the usable-item slot from the original result', () =>
    {
      // Arrange
      const mainhand = { key: 'mainhand' };
      const usableItem = { key: 'usableItem' };
      originalGetEquippedAllySlots.mockReturnValue([ mainhand, usableItem ]);
      const manager = Object.create(globalThis.JABS_SkillSlotManager.prototype);

      // Act
      const result = manager.getEquippedAllySlots();

      // Assert
      expect(result).toEqual([ mainhand ]);
    });
  });
});
//endregion plugins/abs/ext/food/allyai/jabs-skill-slot-manager.test.js
