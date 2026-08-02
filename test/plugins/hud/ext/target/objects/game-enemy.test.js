//region plugins/hud/ext/target/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Enemy (J-HUD-TargetFrame) (direct src import)', () =>
{
  let enemyData;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      HUD: {
        EXT: {
          TARGET: {
            RegExp: {
              TargetFrameText: /<targetFrameText:([\w :"'.!+\-*/\\]*)>/i,
              TargetFrameIcon: /<targetFrameIcon:(\d+)>/i,
              HideTargetFrame: /<hideTargetFrame>/i,
              HideTargetText: /<hideTargetFrameText>/i,
              HideTargetHP: /<hideTargetHpBar>/i,
              HideTargetMP: /<hideTargetMpBar>/i,
              HideTargetTP: /<hideTargetTpBar>/i,
            },
          },
        },
      },
    };

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    function Game_Enemy()
    {
    }

    Game_Enemy.prototype.enemy = function()
    {
      return enemyData;
    };

    globalThis.Game_Enemy = Game_Enemy;

    await import('../../../../../../src/plugins/hud/ext/target/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    enemyData = { note: String.empty };
  });

  describe('targetFrameText', () =>
  {
    it('extracts the target frame text notetag from the enemy note', () =>
    {
      // Arrange
      enemyData.note = '<targetFrameText:the boss>';
      const enemy = new globalThis.Game_Enemy();

      // Act
      const result = enemy.targetFrameText();

      // Assert
      expect(result).toBe('the boss');
    });

    it('returns the empty string when the notetag is absent', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act
      const result = enemy.targetFrameText();

      // Assert
      expect(result).toBe(String.empty);
    });
  });

  describe('targetFrameIcon', () =>
  {
    it('extracts a numeric icon index from the target frame icon notetag', () =>
    {
      // Arrange
      enemyData.note = '<targetFrameIcon:64>';
      const enemy = new globalThis.Game_Enemy();

      // Act
      const result = enemy.targetFrameIcon();

      // Assert
      expect(result).toBe(64);
    });

    it('returns 0 when the notetag is absent', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act
      const result = enemy.targetFrameIcon();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('showTargetFrame', () =>
  {
    it('returns false when the hide-target-frame notetag is present', () =>
    {
      // Arrange
      enemyData.note = '<hideTargetFrame>';
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetFrame()).toBe(false);
    });

    it('returns true by default when no notetag is present', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetFrame()).toBe(true);
    });
  });

  describe('showTargetHpBar', () =>
  {
    it('returns false when the hide-hp-bar notetag is present', () =>
    {
      // Arrange
      enemyData.note = '<hideTargetHpBar>';
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetHpBar()).toBe(false);
    });

    it('returns true by default when no notetag is present', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetHpBar()).toBe(true);
    });
  });

  describe('showTargetMpBar', () =>
  {
    it('returns false when the hide-mp-bar notetag is present', () =>
    {
      // Arrange
      enemyData.note = '<hideTargetMpBar>';
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetMpBar()).toBe(false);
    });

    it('returns true by default when no notetag is present', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetMpBar()).toBe(true);
    });
  });

  describe('showTargetTpBar', () =>
  {
    it('returns false when the hide-tp-bar notetag is present', () =>
    {
      // Arrange
      enemyData.note = '<hideTargetTpBar>';
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetTpBar()).toBe(false);
    });

    it('returns true by default when no notetag is present', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetTpBar()).toBe(true);
    });
  });

  describe('showTargetText', () =>
  {
    it('returns false when the hide-target-text notetag is present', () =>
    {
      // Arrange
      enemyData.note = '<hideTargetFrameText>';
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetText()).toBe(false);
    });

    it('returns true by default when no notetag is present', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act & Assert
      expect(enemy.showTargetText()).toBe(true);
    });
  });
});
//endregion plugins/hud/ext/target/objects/game-enemy.test.js
