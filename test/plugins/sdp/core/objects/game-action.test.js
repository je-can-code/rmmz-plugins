//region plugins/sdp/core/objects/game-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Action ext/sdp augments (direct src import)', () =>
{
  let Game_Action;

  beforeAll(async () =>
  {
    globalThis.J = { SDP: { Aliased: { Game_Action: new Map() }, RegExp: { SdpPoints: /<sdpPoints:(\d+)>/i } } };

    function StubGameAction()
    {
    }

    StubGameAction.prototype.applyGlobal = vi.fn();
    StubGameAction.prototype.apply = vi.fn();
    globalThis.Game_Action = StubGameAction;

    globalThis.RPGManager = { getNumberFromNoteByRegex: vi.fn() };

    await import('../../../../../src/plugins/sdp/core/objects/Game_Action.js');
    ({ Game_Action } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameParty = { unlockSdp: vi.fn() };
  });

  describe('applyGlobal/applySdpUnlock/canUnlockSdp/applySdpUnlockEffect', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue(null);

      // Act
      action.applyGlobal();

      // Assert
      expect(globalThis.J.SDP.Aliased.Game_Action.get('applyGlobal')).toHaveBeenCalled();
    });

    it('does not unlock when there is no item', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue(null);

      // Act
      action.applyGlobal();

      // Assert
      expect(globalThis.$gameParty.unlockSdp).not.toHaveBeenCalled();
    });

    it('does not unlock when the item is a skill', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue({ isSkill: () => true, sdpKey: 'panel-1' });

      // Act
      action.applyGlobal();

      // Assert
      expect(globalThis.$gameParty.unlockSdp).not.toHaveBeenCalled();
    });

    it('does not unlock when the item has no sdpKey', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue({ isSkill: () => false, sdpKey: undefined });

      // Act
      action.applyGlobal();

      // Assert
      expect(globalThis.$gameParty.unlockSdp).not.toHaveBeenCalled();
    });

    it('unlocks the sdp keyed on the item when eligible', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue({ isSkill: () => false, sdpKey: 'panel-1' });

      // Act
      action.applyGlobal();

      // Assert
      expect(globalThis.$gameParty.unlockSdp).toHaveBeenCalledWith('panel-1');
    });
  });

  describe('apply/applySdpPointMod/isSdpPointMod/modSdpPointsOnApply', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue(null);
      const target = { isEnemy: () => false };

      // Act
      action.apply(target);

      // Assert
      expect(globalThis.J.SDP.Aliased.Game_Action.get('apply')).toHaveBeenCalledWith(target);
    });

    it('does not modify points when there is no item', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue(null);
      const target = { isEnemy: () => false, modSdpPoints: vi.fn() };

      // Act
      action.apply(target);

      // Assert
      expect(target.modSdpPoints).not.toHaveBeenCalled();
    });

    it('does not modify points when the item is a skill', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue({ isSkill: () => true });
      const target = { isEnemy: () => false, modSdpPoints: vi.fn() };

      // Act
      action.apply(target);

      // Assert
      expect(target.modSdpPoints).not.toHaveBeenCalled();
    });

    it('does not modify points when the target is an enemy', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue({ isSkill: () => false });
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(5);
      const target = { isEnemy: () => true, modSdpPoints: vi.fn() };

      // Act
      action.apply(target);

      // Assert
      expect(target.modSdpPoints).not.toHaveBeenCalled();
    });

    it('does not modify points when the note has zero sdp points', () =>
    {
      // Arrange
      const action = new Game_Action();
      action.item = vi.fn().mockReturnValue({ isSkill: () => false });
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(0);
      const target = { isEnemy: () => false, modSdpPoints: vi.fn() };

      // Act
      action.apply(target);

      // Assert
      expect(target.modSdpPoints).not.toHaveBeenCalled();
    });

    it('modifies the target sdp points by the note-derived amount when eligible', () =>
    {
      // Arrange
      const action = new Game_Action();
      const item = { isSkill: () => false };
      action.item = vi.fn().mockReturnValue(item);
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(7);
      const target = { isEnemy: () => false, modSdpPoints: vi.fn() };

      // Act
      action.apply(target);

      // Assert
      expect(target.modSdpPoints).toHaveBeenCalledWith(7);
    });
  });
});
//endregion plugins/sdp/core/objects/game-action.test.js
