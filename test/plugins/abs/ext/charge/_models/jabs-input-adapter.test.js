//region plugins/abs/ext/charge/_models/jabs-input-adapter.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge JABS_InputAdapter (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: {} };
    globalThis.JABS_Button = { Mainhand: 'mainhand', Offhand: 'offhand' };
    globalThis.JABS_InputAdapter = {};

    await import('../../../../../../src/plugins/abs/ext/charge/_models/JABS_InputAdapter.js');
  });

  function buildBattler(overrides = {})
  {
    return Object.assign({
      canBattlerUseAttacks: () => true,
      canBattlerUseSkills: () => true,
      isCastingOrChanneling: () => false,
      isGuardSkillByKey: () => false,
      executeChargeAction: vi.fn(),
    }, overrides);
  }

  describe('mainhand', () =>
  {
    it('executes charging when allowed', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      globalThis.JABS_InputAdapter.performMainhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).toHaveBeenCalledWith('mainhand', true);
    });

    it('does not execute charging when the battler cannot use attacks', () =>
    {
      // Arrange
      const battler = buildBattler({ canBattlerUseAttacks: () => false });

      // Act
      globalThis.JABS_InputAdapter.performMainhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });

    it('does not execute charging while casting or channeling', () =>
    {
      // Arrange
      const battler = buildBattler({ isCastingOrChanneling: () => true });

      // Act
      globalThis.JABS_InputAdapter.performMainhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });
  });

  describe('offhand', () =>
  {
    it('executes charging when allowed', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      globalThis.JABS_InputAdapter.performOffhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).toHaveBeenCalledWith('offhand', true);
    });

    it('does not execute charging when the offhand slot is a guard skill', () =>
    {
      // Arrange
      const battler = buildBattler({ isGuardSkillByKey: () => true });

      // Act
      globalThis.JABS_InputAdapter.performOffhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });

    it('does not execute charging when the battler cannot use attacks', () =>
    {
      // Arrange
      const battler = buildBattler({ canBattlerUseAttacks: () => false });

      // Act
      globalThis.JABS_InputAdapter.performOffhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });

    it('does not execute charging while casting or channeling', () =>
    {
      // Arrange
      const battler = buildBattler({ isCastingOrChanneling: () => true });

      // Act
      globalThis.JABS_InputAdapter.performOffhandActionCharging(true, battler);

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });
  });

  describe('combat skills', () =>
  {
    it('executes charging when allowed', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      globalThis.JABS_InputAdapter.performCombatSkillCharging(true, battler, 'combat-skill-1');

      // Assert
      expect(battler.executeChargeAction).toHaveBeenCalledWith('combat-skill-1', true);
    });

    it('does not execute charging when the battler cannot use skills', () =>
    {
      // Arrange
      const battler = buildBattler({ canBattlerUseSkills: () => false });

      // Act
      globalThis.JABS_InputAdapter.performCombatSkillCharging(true, battler, 'combat-skill-1');

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });

    it('does not execute charging while casting or channeling', () =>
    {
      // Arrange
      const battler = buildBattler({ isCastingOrChanneling: () => true });

      // Act
      globalThis.JABS_InputAdapter.performCombatSkillCharging(true, battler, 'combat-skill-1');

      // Assert
      expect(battler.executeChargeAction).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/charge/_models/jabs-input-adapter.test.js
