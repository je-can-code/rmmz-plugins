//region plugins/abs/ext/food/models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalApplyUsableItemEffects;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: { FOOD: { Aliased: { JABS_Battler: new Map() } } },
        DefaultValues: { CooldownlessItems: 0 },
      },
    };
    globalThis.JABS_Button = { UsableItem: 'usableItem' };

    vi.doMock('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainResolver.js', () => ({
      default: { resolveEat: vi.fn() },
    }));

    globalThis.LootLogBuilder = vi.fn(function()
    {
      this.setupUsedLastItem = vi.fn().mockReturnThis();
      this.build = vi.fn(() => ({ built: true }));
    });
    globalThis.$mapLogs = { loot: { addLog: vi.fn() } };

    function JABS_Battler()
    {
    }

    originalApplyUsableItemEffects = vi.fn();
    JABS_Battler.prototype.applyUsableItemEffects = originalApplyUsableItemEffects;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/food/models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalApplyUsableItemEffects.mockReset();
    globalThis.$mapLogs.loot.addLog.mockReset();
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    battler.createToolLog = vi.fn();
    battler.modCooldownCounter = vi.fn();
    return Object.assign(battler, overrides);
  }

  describe('applyUsableItemEffects', () =>
  {
    it('defers entirely to the original logic when the item does not exist', () =>
    {
      // Arrange
      globalThis.$dataItems = {};
      const battler = buildBattler();

      // Act
      battler.applyUsableItemEffects(999, false);

      // Assert
      expect(originalApplyUsableItemEffects).toHaveBeenCalledWith(999, false);
    });

    it('defers entirely to the original logic when the item is not food', () =>
    {
      // Arrange
      globalThis.$dataItems = { 5: { id: 5, jabsFoodType: null } };
      const battler = buildBattler();

      // Act
      battler.applyUsableItemEffects(5, true);

      // Assert
      expect(originalApplyUsableItemEffects).toHaveBeenCalledWith(5, true);
    });

    it('consumes the item, flags the slot for refresh, and resolves the eat', async () =>
    {
      // Arrange
      const { default: JABS_FoodChainResolver } =
        await import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainResolver.js');
      const item = { id: 5, jabsFoodType: 'protein' };
      globalThis.$dataItems = { 5: item };
      globalThis.$gameParty = { items: () => [ item ] };
      const usableItemSlot = { flagSkillSlotForRefresh: vi.fn() };
      const skillSlotManager = { getUsableItemSlot: () => usableItemSlot, clearSlot: vi.fn() };
      const rawBattler = { consumeItem: vi.fn(), getSkillSlotManager: () => skillSlotManager };
      const battler = buildBattler({ getBattler: () => rawBattler });

      // Act
      battler.applyUsableItemEffects(5, false);

      // Assert
      expect(rawBattler.consumeItem).toHaveBeenCalledWith(item);
      expect(usableItemSlot.flagSkillSlotForRefresh).toHaveBeenCalledTimes(1);
      expect(JABS_FoodChainResolver.resolveEat).toHaveBeenCalledWith(5, battler);
      expect(battler.createToolLog).toHaveBeenCalledWith(item);
      expect(originalApplyUsableItemEffects).not.toHaveBeenCalled();
    });

    it('applies the standard cooldown when the party still has the item afterward', () =>
    {
      // Arrange
      const item = { id: 5, jabsFoodType: 'protein' };
      globalThis.$dataItems = { 5: item };
      globalThis.$gameParty = { items: () => [ item ] };
      const skillSlotManager = { getUsableItemSlot: () => ({ flagSkillSlotForRefresh: vi.fn() }), clearSlot: vi.fn() };
      const rawBattler = { consumeItem: vi.fn(), getSkillSlotManager: () => skillSlotManager };
      const battler = buildBattler({ getBattler: () => rawBattler });

      // Act
      battler.applyUsableItemEffects(5, false);

      // Assert
      expect(battler.modCooldownCounter).toHaveBeenCalledWith('usableItem', 0);
      expect(skillSlotManager.clearSlot).not.toHaveBeenCalled();
    });

    it('auto-unequips the slot and logs when the party has run out of the item', () =>
    {
      // Arrange
      const item = { id: 5, jabsFoodType: 'protein' };
      globalThis.$dataItems = { 5: item };
      globalThis.$gameParty = { items: () => [] };
      const skillSlotManager = { getUsableItemSlot: () => ({ flagSkillSlotForRefresh: vi.fn() }), clearSlot: vi.fn() };
      const rawBattler = { consumeItem: vi.fn(), getSkillSlotManager: () => skillSlotManager };
      const battler = buildBattler({ getBattler: () => rawBattler });

      // Act
      battler.applyUsableItemEffects(5, false);

      // Assert
      expect(skillSlotManager.clearSlot).toHaveBeenCalledWith('usableItem');
      expect(globalThis.$mapLogs.loot.addLog).toHaveBeenCalledWith({ built: true });
      expect(battler.modCooldownCounter).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/food/models/jabs-battler.test.js
