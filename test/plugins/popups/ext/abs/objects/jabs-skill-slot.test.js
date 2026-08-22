//region plugins/popups/ext/abs/objects/jabs-skill-slot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_SkillSlot ext/abs augments (direct src import)', () =>
{
  let JABS_SkillSlot;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { POPUPS: { EXT: { ABS: { Aliased: { JABS_SkillSlot: new Map() } } }, notifyComboChainCleared: vi.fn() } };

    function StubJABSSkillSlot(key)
    {
      this.key = key;
    }

    StubJABSSkillSlot.prototype.handleComboReadiness = vi.fn();
    globalThis.JABS_SkillSlot = StubJABSSkillSlot;

    globalThis.JABS_AiManager = { getAllBattlers: vi.fn().mockReturnValue([]) };

    await import('../../../../../../src/plugins/popups/ext/abs/objects/JABS_SkillSlot.js');
    ({ JABS_SkillSlot } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.JABS_AiManager.getAllBattlers.mockReturnValue([]);
  });

  describe('handleComboReadiness', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const slot = new JABS_SkillSlot('main');
      slot.getCooldown = vi.fn().mockReturnValue({ needsComboClear: () => false });

      // Act
      slot.handleComboReadiness();

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.JABS_SkillSlot.get('handleComboReadiness')).toHaveBeenCalled();
    });

    it('does not notify a combo clear when the cooldown does not need one', () =>
    {
      // Arrange- a battler that genuinely owns this slot is standing by, so the empty battler roster
      // and the owner check are both taken off the table; only needsComboClear can refuse here.
      const slot = new JABS_SkillSlot('main');
      slot.getCooldown = vi.fn().mockReturnValue({ needsComboClear: () => false });
      const skillSlotManager = { getSkillSlotByKey: vi.fn().mockReturnValue(slot) };
      const candidate = { getBattler: () => ({ getSkillSlotManager: () => skillSlotManager }) };
      globalThis.JABS_AiManager.getAllBattlers.mockReturnValue([ candidate ]);

      // Act
      slot.handleComboReadiness();

      // Assert
      expect(globalThis.J.POPUPS.notifyComboChainCleared).not.toHaveBeenCalled();
    });

    it('notifies the combo chain cleared for the battler owning this exact slot instance', () =>
    {
      // Arrange
      const slot = new JABS_SkillSlot('main');
      slot.getCooldown = vi.fn().mockReturnValue({ needsComboClear: () => true });
      const skillSlotManager = { getSkillSlotByKey: vi.fn().mockReturnValue(slot) };
      const candidate = { getBattler: () => ({ getSkillSlotManager: () => skillSlotManager }) };
      globalThis.JABS_AiManager.getAllBattlers.mockReturnValue([ candidate ]);

      // Act
      slot.handleComboReadiness();

      // Assert
      expect(globalThis.J.POPUPS.notifyComboChainCleared).toHaveBeenCalledWith(candidate, 'main');
    });

    it('does not notify when no battler owns this exact slot instance', () =>
    {
      // Arrange
      const slot = new JABS_SkillSlot('main');
      slot.getCooldown = vi.fn().mockReturnValue({ needsComboClear: () => true });
      const otherSlot = {};
      const skillSlotManager = { getSkillSlotByKey: vi.fn().mockReturnValue(otherSlot) };
      const candidate = { getBattler: () => ({ getSkillSlotManager: () => skillSlotManager }) };
      globalThis.JABS_AiManager.getAllBattlers.mockReturnValue([ candidate ]);

      // Act
      slot.handleComboReadiness();

      // Assert
      expect(globalThis.J.POPUPS.notifyComboChainCleared).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/popups/ext/abs/objects/jabs-skill-slot.test.js
