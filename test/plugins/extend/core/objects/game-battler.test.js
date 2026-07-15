//region plugins/extend/core/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Battler ext/extend augments (direct src import)', () =>
{
  let Game_Battler;
  let FakeOverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeOverlayManager = { getExtendedSkill: vi.fn(), getExtendedState: vi.fn() };
    vi.doMock('../../../../../src/plugins/extend/core/managers/OverlayManager.js', () => ({ default: FakeOverlayManager }));

    function StubGameBattler()
    {
    }

    globalThis.Game_Battler = StubGameBattler;

    await import('../../../../../src/plugins/extend/core/objects/Game_Battler.js');
    ({ Game_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('skill', () =>
  {
    it('resolves the skill through OverlayManager.getExtendedSkill', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      const extendedSkill = {};
      FakeOverlayManager.getExtendedSkill.mockReturnValue(extendedSkill);

      // Act
      const result = battler.skill(5);

      // Assert
      expect(FakeOverlayManager.getExtendedSkill).toHaveBeenCalledWith(battler, 5);
      expect(result).toBe(extendedSkill);
    });
  });

  describe('state', () =>
  {
    it('resolves the state through OverlayManager.getExtendedState', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      const extendedState = {};
      FakeOverlayManager.getExtendedState.mockReturnValue(extendedState);

      // Act
      const result = battler.state(9);

      // Assert
      expect(FakeOverlayManager.getExtendedState).toHaveBeenCalledWith(battler, 9);
      expect(result).toBe(extendedState);
    });
  });
});
//endregion plugins/extend/core/objects/game-battler.test.js
