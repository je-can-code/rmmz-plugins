//region plugins/abs/core/_component/game-battler-skill-slots.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance. The skill slot manager starts with zero slots
 * (setupActorSlots/setupEnemySlots are subclass-driven, not part of base initMembers), so tests
 * that need a slot add one explicitly via the real manager's addSlot.
 * @returns {object}
 */
function buildBattler()
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  return battler;
}

describe('J-ABS Game_Battler skill slot management (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    // JABS_SkillSlot.canBeLocked reads JABS_Button.Mainhand/Offhand as a bare global to know
    // which slots are lockproof; abs/ext/input owns the real JABS_Button, so stub the two keys.
    globalThis.JABS_Button = { Mainhand: 'mainhand', Offhand: 'offhand' };

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  it('getSkillSlotManager returns the real per-battler manager instance', () =>
  {
    // Arrange
    const battler = buildBattler();

    // Act & Assert
    expect(battler.getSkillSlotManager()).toBe(battler._j._abs._equippedSkills);
  });

  it('getAllEquippedSkills forwards to the manager\'s getAllSlots', () =>
  {
    // Arrange
    const battler = buildBattler();
    battler.getSkillSlotManager()
      .addSlot('mainhand', 5);

    // Act & Assert
    expect(battler.getAllEquippedSkills()).toEqual(battler.getSkillSlotManager()
      .getAllSlots());
  });

  it('findSlotForSkillId locates the slot carrying the given skill id', () =>
  {
    // Arrange
    const battler = buildBattler();
    battler.getSkillSlotManager()
      .addSlot('mainhand', 7);

    // Act
    const found = battler.findSlotForSkillId(7);

    // Assert
    expect(found.key).toBe('mainhand');
  });

  describe('getEquippedSkillId', () =>
  {
    it('returns the id of the skill in an existing slot', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('mainhand', 9);

      // Act & Assert
      expect(battler.getEquippedSkillId('mainhand')).toBe(9);
    });

    it('returns 0 when the slot key does not exist on this battler', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getEquippedSkillId('missing')).toBe(0);
    });
  });

  it('getSkillSlot forwards to the manager\'s getSkillSlotByKey', () =>
  {
    // Arrange
    const battler = buildBattler();
    battler.getSkillSlotManager()
      .addSlot('mainhand', 3);

    // Act & Assert
    expect(battler.getSkillSlot('mainhand').id).toBe(3);
  });

  it('getEmptySecondarySkills forwards to the manager\'s getEmptySecondarySlots', () =>
  {
    // Arrange
    const battler = buildBattler();
    const slotManager = battler.getSkillSlotManager();
    const spy = vi.spyOn(slotManager, 'getEmptySecondarySlots');

    // Act
    battler.getEmptySecondarySkills();

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  describe('setEquippedSkill', () =>
  {
    it('does nothing when the slot manager is unavailable', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._j._abs._equippedSkills = null;

      // Act & Assert
      expect(() => battler.setEquippedSkill('mainhand', 1)).not.toThrow();
    });

    it('assigns the skill id and lock state to an existing slot when an update is needed', () =>
    {
      // Arrange- 'tool' is not one of the lockproof mainhand/offhand slots, so the lock actually takes.
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('tool', 0);

      // Act
      battler.setEquippedSkill('tool', 5, true);

      // Assert
      const slot = battler.getSkillSlot('tool');
      expect(slot.id).toBe(5);
      expect(slot.isLocked()).toBe(true);
    });

    it('does not touch the slot when no update is needed', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('mainhand', 5);
      const slotManager = battler.getSkillSlotManager();
      const spy = vi.spyOn(slotManager, 'setSlot');

      // Act
      battler.setEquippedSkill('mainhand', 5, false);

      // Assert
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('flags the slot for refresh and requests a hud input-frame refresh when the hud input ext is active', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('mainhand', 0);
      globalThis.J.HUD = { EXT: { INPUT: true } };
      globalThis.$hudManager = { requestRefreshInputFrame: vi.fn() };
      const slot = battler.getSkillSlot('mainhand');
      const flagSpy = vi.spyOn(slot, 'flagSkillSlotForRefresh');

      // Act
      battler.setEquippedSkill('mainhand', 8);

      // Assert
      expect(flagSpy).toHaveBeenCalled();
      expect(globalThis.$hudManager.requestRefreshInputFrame).toHaveBeenCalledTimes(1);
      flagSpy.mockRestore();
      delete globalThis.J.HUD;
      delete globalThis.$hudManager;
    });
  });

  describe('needsSlotUpdate', () =>
  {
    it('is true when the slot does not currently exist', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.needsSlotUpdate('missing', 1, false)).toBe(true);
    });

    it('is true when the lock state differs', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('mainhand', 5);

      // Act & Assert
      expect(battler.needsSlotUpdate('mainhand', 5, true)).toBe(true);
    });

    it('is true when the skill id differs', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('mainhand', 5);

      // Act & Assert
      expect(battler.needsSlotUpdate('mainhand', 6, false)).toBe(true);
    });

    it('is false when neither the lock state nor the skill id differ', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('mainhand', 5);

      // Act & Assert
      expect(battler.needsSlotUpdate('mainhand', 5, false)).toBe(false);
    });
  });

  describe('slot locking', () =>
  {
    // 'tool'/'combat1' are used here (not mainhand/offhand) since those two are lockproof by design.
    it('isSlotLocked reflects the slot\'s current lock state', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('tool', 1);
      battler.getSkillSlotManager()
        .setSlot('tool', 1, true);

      // Act & Assert
      expect(battler.isSlotLocked('tool')).toBe(true);
    });

    it('unlockSlot clears the lock on a single slot', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillSlotManager()
        .addSlot('tool', 1);
      battler.getSkillSlotManager()
        .setSlot('tool', 1, true);

      // Act
      battler.unlockSlot('tool');

      // Assert
      expect(battler.isSlotLocked('tool')).toBe(false);
    });

    it('unlockAllSlots clears the lock on every slot', () =>
    {
      // Arrange
      const battler = buildBattler();
      const slotManager = battler.getSkillSlotManager();
      slotManager.addSlot('tool', 1);
      slotManager.addSlot('combat1', 2);
      slotManager.setSlot('tool', 1, true);
      slotManager.setSlot('combat1', 2, true);

      // Act
      battler.unlockAllSlots();

      // Assert
      expect(battler.isSlotLocked('tool')).toBe(false);
      expect(battler.isSlotLocked('combat1')).toBe(false);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-skill-slots.test.js
