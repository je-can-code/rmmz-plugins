//region plugins/passive/ext/conditional/managers/auto-modify-cooldown-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('AutoModifyCooldownManager (direct src import)', () =>
{
  let AutoModifyCooldownManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.JABS_Button = {
      Mainhand: 'mainhand', Offhand: 'offhand', Tool: 'tool', Dodge: 'dodge',
      CombatSkill1: 'combat1', CombatSkill2: 'combat2', CombatSkill3: 'combat3', CombatSkill4: 'combat4',
    };

    ({ default: AutoModifyCooldownManager } =
      await import('../../../../../../src/plugins/passive/ext/conditional/managers/AutoModifyCooldownManager.js'));
  });

  /**
   * Builds a fake cooldown with a spy-able modBaseFrames.
   * @param {number} frames Current remaining frames.
   * @param {number} maxFrames Full/total duration.
   * @returns {object}
   */
  function makeCooldown(frames, maxFrames)
  {
    return { frames, maxFrames, modBaseFrames: vi.fn() };
  }

  /**
   * Builds a fake battler exposing just the surface AutoModifyCooldownManager reads: a skill slot
   * manager whose equipped slots each carry a key and a cooldown.
   * @param {{key: string, cooldown: object}[]} slots
   * @returns {object}
   */
  function makeBattler(slots)
  {
    return {
      getSkillSlotManager: () => ({
        getEquippedSlots: () => slots.map(({ key, cooldown }) => ({ key, getCooldown: () => cooldown })),
      }),
    };
  }

  describe('static properties', () =>
  {
    it('declares its rules property', () =>
    {
      // Arrange & Act & Assert
      expect(AutoModifyCooldownManager.rulesProperty).toBe('autoModifyCooldownRules');
    });

    it('does not require tuple[0] to be a positive id, since it is a signed amount', () =>
    {
      // Arrange & Act & Assert
      expect(AutoModifyCooldownManager.requiresPositiveId).toBe(false);
    });
  });

  describe('resolveKeys', () =>
  {
    it('resolves single to just the target key', () =>
    {
      // Arrange & Act
      const keys = AutoModifyCooldownManager.resolveKeys('single', 'mainhand');

      // Assert
      expect(keys).toEqual([ 'mainhand' ]);
    });

    it('resolves single with no target key to an empty list', () =>
    {
      // Arrange & Act
      const keys = AutoModifyCooldownManager.resolveKeys('single', undefined);

      // Assert
      expect(keys).toEqual([]);
    });

    it('resolves combat to the four combat-skill slots', () =>
    {
      // Arrange & Act
      const keys = AutoModifyCooldownManager.resolveKeys('combat', undefined);

      // Assert
      expect(keys).toEqual([ 'combat1', 'combat2', 'combat3', 'combat4' ]);
    });

    it('resolves all to mainhand/offhand/tool/dodge plus the four combat-skill slots', () =>
    {
      // Arrange & Act
      const keys = AutoModifyCooldownManager.resolveKeys('all', undefined);

      // Assert
      expect(keys).toEqual([
        'mainhand', 'offhand', 'tool', 'dodge', 'combat1', 'combat2', 'combat3', 'combat4',
      ]);
    });

    it('resolves an unrecognized range to an empty list', () =>
    {
      // Arrange & Act
      const keys = AutoModifyCooldownManager.resolveKeys('nonsense', undefined);

      // Assert
      expect(keys).toEqual([]);
    });
  });

  describe('dispatch', () =>
  {
    it('returns false for an unrecognized unit', () =>
    {
      // Arrange
      const cooldown = makeCooldown(100, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -10, [ -10, 'onKill', 0, 'nonsense', 'all' ]);

      // Assert
      expect(result).toBe(false);
      expect(cooldown.modBaseFrames).not.toHaveBeenCalled();
    });

    it('returns false when range resolves to no keys', () =>
    {
      // Arrange
      const cooldown = makeCooldown(100, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -10, [ -10, 'onKill', 0, 'percent', 'single' ]);

      // Assert
      expect(result).toBe(false);
      expect(cooldown.modBaseFrames).not.toHaveBeenCalled();
    });

    it('returns false when no matching slot is currently on cooldown', () =>
    {
      // Arrange- ready (frames === 0) slots have nothing to modify.
      const cooldown = makeCooldown(0, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -10, [ -10, 'onKill', 0, 'percent', 'all' ]);

      // Assert
      expect(result).toBe(false);
      expect(cooldown.modBaseFrames).not.toHaveBeenCalled();
    });

    it('ignores slots whose key is outside the resolved range', () =>
    {
      // Arrange- range is 'combat', but the only active slot is mainhand.
      const cooldown = makeCooldown(100, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -10, [ -10, 'onKill', 0, 'percent', 'combat' ]);

      // Assert
      expect(result).toBe(false);
      expect(cooldown.modBaseFrames).not.toHaveBeenCalled();
    });

    it('applies a percent-of-total reduction to every matching active cooldown', () =>
    {
      // Arrange
      const mainhand = makeCooldown(100, 300);
      const offhand = makeCooldown(50, 200);
      const battler = makeBattler([
        { key: 'mainhand', cooldown: mainhand },
        { key: 'offhand', cooldown: offhand },
      ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -10, [ -10, 'onKill', 0, 'percent', 'all' ]);

      // Assert- 10% of maxFrames, not of the current remaining frames.
      expect(result).toBe(true);
      expect(mainhand.modBaseFrames).toHaveBeenCalledWith(-30);
      expect(offhand.modBaseFrames).toHaveBeenCalledWith(-20);
    });

    it('applies a flat frame modification regardless of maxFrames', () =>
    {
      // Arrange
      const mainhand = makeCooldown(100, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown: mainhand } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -60, [ -60, 'onKill', 0, 'flat', 'all' ]);

      // Assert
      expect(result).toBe(true);
      expect(mainhand.modBaseFrames).toHaveBeenCalledWith(-60);
    });

    it('defaults range to all when the tuple omits it', () =>
    {
      // Arrange
      const mainhand = makeCooldown(100, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown: mainhand } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, -10, [ -10, 'onKill', 0, 'percent' ]);

      // Assert
      expect(result).toBe(true);
      expect(mainhand.modBaseFrames).toHaveBeenCalledWith(-30);
    });

    it('restricts to a single named slot when range is single', () =>
    {
      // Arrange
      const mainhand = makeCooldown(100, 300);
      const offhand = makeCooldown(100, 300);
      const battler = makeBattler([
        { key: 'mainhand', cooldown: mainhand },
        { key: 'offhand', cooldown: offhand },
      ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(
        battler, -10, [ -10, 'onKill', 0, 'percent', 'single', 'mainhand' ]
      );

      // Assert
      expect(result).toBe(true);
      expect(mainhand.modBaseFrames).toHaveBeenCalledWith(-30);
      expect(offhand.modBaseFrames).not.toHaveBeenCalled();
    });

    it('supports positive amounts to increase cooldowns instead of reducing them', () =>
    {
      // Arrange
      const mainhand = makeCooldown(100, 300);
      const battler = makeBattler([ { key: 'mainhand', cooldown: mainhand } ]);

      // Act
      const result = AutoModifyCooldownManager.dispatch(battler, 10, [ 10, 'onKill', 0, 'percent', 'all' ]);

      // Assert
      expect(result).toBe(true);
      expect(mainhand.modBaseFrames).toHaveBeenCalledWith(30);
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/auto-modify-cooldown-manager.test.js
