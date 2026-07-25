//region plugins/extend/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Enemy ext/extend augments (direct src import)', () =>
{
  let Game_Enemy;
  let FakeOverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeOverlayManager = { invalidate: vi.fn() };
    vi.doMock('../../../../../src/plugins/extend/core/managers/OverlayManager.js', () => ({ default: FakeOverlayManager }));

    globalThis.J = { EXTEND: { Aliased: { Game_Enemy: new Map() } } };

    function StubGameEnemy()
    {
    }

    StubGameEnemy.prototype.learnSkill = vi.fn();
    globalThis.Game_Enemy = StubGameEnemy;

    await import('../../../../../src/plugins/extend/core/objects/Game_Enemy.js');
    ({ Game_Enemy } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('learnSkill', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const enemy = new Game_Enemy();

      // Act
      enemy.learnSkill(5);

      // Assert
      expect(globalThis.J.EXTEND.Aliased.Game_Enemy.get('learnSkill')).toHaveBeenCalledWith(5);
    });

    it('invalidates the overlay cache for this enemy', () =>
    {
      // Arrange
      const enemy = new Game_Enemy();

      // Act
      enemy.learnSkill(5);

      // Assert
      expect(FakeOverlayManager.invalidate).toHaveBeenCalledWith(enemy);
    });
  });
});
//endregion plugins/extend/core/objects/game-enemy.test.js
