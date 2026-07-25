//region plugins/abs/ext/allyai/managers/jabs-skill-slot-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_SkillSlotManager (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {};
    globalThis.JABS_Button = { Tool: 'tool', Dodge: 'dodge', Mainhand: 'mainhand' };

    function JABS_SkillSlotManager()
    {
    }

    globalThis.JABS_SkillSlotManager = JABS_SkillSlotManager;

    await import('../../../../../../src/plugins/abs/ext/allyai/managers/JABS_SkillSlotManager.js');
  });

  describe('getEquippedAllySlots', () =>
  {
    it('excludes the tool and dodge slots from the equipped slot list', () =>
    {
      // Arrange
      const mainhand = { key: 'mainhand' };
      const tool = { key: 'tool' };
      const dodge = { key: 'dodge' };
      const manager = Object.create(globalThis.JABS_SkillSlotManager.prototype);
      manager.getEquippedSlots = () => [ mainhand, tool, dodge ];

      // Act
      const result = manager.getEquippedAllySlots();

      // Assert
      expect(result).toEqual([ mainhand ]);
    });
  });
});
//endregion plugins/abs/ext/allyai/managers/jabs-skill-slot-manager.test.js
