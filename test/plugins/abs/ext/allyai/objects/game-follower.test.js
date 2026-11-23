//region plugins/abs/ext/allyai/objects/game-follower.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Follower (unit, all downstream dependencies mocked)', () =>
{
  let originalChaseCharacter;
  let originalSetDirectionFix;
  let originalRealMoveSpeed;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          ALLYAI: {
            Aliased: { Game_Follower: new Map() },
            Metadata: { StanceCatchUpSpeedBoost: 1 },
          },
        },
      },
    };

    function Game_Follower()
    {
    }

    originalChaseCharacter = vi.fn();
    originalSetDirectionFix = vi.fn();
    originalRealMoveSpeed = vi.fn(() => 4);
    Game_Follower.prototype.chaseCharacter = originalChaseCharacter;
    Game_Follower.prototype.setDirectionFix = originalSetDirectionFix;
    Game_Follower.prototype.realMoveSpeed = originalRealMoveSpeed;
    globalThis.Game_Follower = Game_Follower;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Follower.js');
  });

  beforeEach(() =>
  {
    originalChaseCharacter.mockReset();
    originalSetDirectionFix.mockReset();
    globalThis.$gamePlayer = { deltaXFrom: vi.fn(() => 1), deltaYFrom: vi.fn(() => 2) };
    globalThis.$gameMap = { _interpreter: { isRunning: () => true } };
  });

  function buildFollower(overrides = {})
  {
    const follower = Object.create(globalThis.Game_Follower.prototype);
    follower.isVisible = () => true;
    follower.getJabsBattler = () => ({ isEngaged: () => false });
    return Object.assign(follower, overrides);
  }

  describe('chaseCharacter', () =>
  {
    it('performs the original logic when this follower cannot obey jabs ai', () =>
    {
      // Arrange
      const follower = buildFollower({ canObeyJabsAi: () => false });
      const character = { id: 'char' };

      // Act
      follower.chaseCharacter(character);

      // Assert
      expect(originalChaseCharacter).toHaveBeenCalledWith(character);
    });

    it('does not chase when this follower can obey jabs ai (JABS controls it instead)', () =>
    {
      // Arrange
      const follower = buildFollower({ canObeyJabsAi: () => true });

      // Act
      follower.chaseCharacter({});

      // Assert
      expect(originalChaseCharacter).not.toHaveBeenCalled();
    });
  });

  describe('canObeyJabsAi', () =>
  {
    it('is false when not visible', () =>
    {
      const follower = buildFollower({ isVisible: () => false });
      expect(follower.canObeyJabsAi()).toBe(false);
    });

    it('is false when there is no jabs battler', () =>
    {
      const follower = buildFollower({ getJabsBattler: () => null });
      expect(follower.canObeyJabsAi()).toBe(false);
    });

    it('is true when visible and a jabs battler exists', () =>
    {
      const follower = buildFollower();
      expect(follower.canObeyJabsAi()).toBe(true);
    });
  });

  describe('setDirectionFix', () =>
  {
    it('performs the original logic directly when there is no jabs battler', () =>
    {
      // Arrange
      const follower = buildFollower({ getJabsBattler: () => null });

      // Act
      follower.setDirectionFix(true);

      // Assert
      expect(originalSetDirectionFix).toHaveBeenCalledWith(true);
    });

    it('does not apply the fix while the battler is engaged', () =>
    {
      // Arrange
      const follower = buildFollower({ getJabsBattler: () => ({ isEngaged: () => true }) });

      // Act
      follower.setDirectionFix(true);

      // Assert
      expect(originalSetDirectionFix).not.toHaveBeenCalled();
    });

    it('does not apply the fix while no map interpreter event is running', () =>
    {
      // Arrange
      globalThis.$gameMap._interpreter.isRunning = () => false;
      const follower = buildFollower();

      // Act
      follower.setDirectionFix(true);

      // Assert
      expect(originalSetDirectionFix).not.toHaveBeenCalled();
    });

    it('applies the fix when not engaged and an event is running', () =>
    {
      // Arrange
      const follower = buildFollower();

      // Act
      follower.setDirectionFix(true);

      // Assert
      expect(originalSetDirectionFix).toHaveBeenCalledWith(true);
    });
  });

  describe('jumpToPlayer', () =>
  {
    it('jumps by the delta from the player position', () =>
    {
      // Arrange
      const follower = buildFollower({ x: 5, y: 5, jump: vi.fn() });

      // Act
      follower.jumpToPlayer();

      // Assert
      expect(globalThis.$gamePlayer.deltaXFrom).toHaveBeenCalledWith(5);
      expect(globalThis.$gamePlayer.deltaYFrom).toHaveBeenCalledWith(5);
      expect(follower.jump).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('realMoveSpeed', () =>
  {
    it('moves at the party\'s pace while not catching up to its stance', () =>
    {
      // Arrange
      const follower = buildFollower({ isCatchingUpToStance: () => false });

      // Act
      const speed = follower.realMoveSpeed();

      // Assert
      expect(originalRealMoveSpeed).toHaveBeenCalledTimes(1);
      expect(speed).toBe(4);
    });

    it('sprints one speed step faster while catching up to its stance', () =>
    {
      // Arrange
      const follower = buildFollower({ isCatchingUpToStance: () => true });

      // Act
      const speed = follower.realMoveSpeed();

      // Assert
      expect(speed).toBe(5);
    });
  });

  describe('isCatchingUpToStance', () =>
  {
    it('is not catching up without a battler', () =>
    {
      // Arrange
      const follower = buildFollower({ getJabsBattler: () => undefined });

      // Act & Assert
      expect(follower.isCatchingUpToStance()).toBe(false);
    });

    it('is catching up when its battler is', () =>
    {
      // Arrange
      const follower = buildFollower({ getJabsBattler: () => ({ isStanceCatchingUp: () => true }) });

      // Act & Assert
      expect(follower.isCatchingUpToStance()).toBe(true);
    });

    it('is not catching up when its battler is not', () =>
    {
      // Arrange
      const follower = buildFollower({ getJabsBattler: () => ({ isStanceCatchingUp: () => false }) });

      // Act & Assert
      expect(follower.isCatchingUpToStance()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-follower.test.js
