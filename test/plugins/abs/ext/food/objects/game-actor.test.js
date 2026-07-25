//region plugins/abs/ext/food/objects/game-actor.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food Game_Actor (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {};
    globalThis.JABS_Button = { UsableItem: 'usableItem' };

    function Game_Actor()
    {
    }

    globalThis.Game_Actor = Game_Actor;

    await import('../../../../../../src/plugins/abs/ext/food/objects/Game_Actor.js');
  });

  describe('getUsableItemSkillSlot', () =>
  {
    it('reads the usable-item slot from the skill slot manager', () =>
    {
      // Arrange
      const slot = { key: 'usableItem' };
      const actor = Object.create(globalThis.Game_Actor.prototype);
      const getSkillSlotByKey = vi.fn(() => slot);
      actor.getSkillSlotManager = () => ({ getSkillSlotByKey });

      // Act
      const result = actor.getUsableItemSkillSlot();

      // Assert
      expect(getSkillSlotByKey).toHaveBeenCalledWith('usableItem');
      expect(result).toBe(slot);
    });
  });
});
//endregion plugins/abs/ext/food/objects/game-actor.test.js
