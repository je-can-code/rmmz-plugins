//region plugins/abs/ext/star/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star Game_Player (unit, all downstream dependencies mocked)', () =>
{
  let originalClearTransferInfo;
  let originalExecuteEncounter;
  const FAKE_PREPARING = { name: 'Preparing', key: 1 };

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { STAR: { Aliased: { Game_Player: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/star/_models/StarPhases.js', () => ({
      default: { PREPARING: FAKE_PREPARING },
    }));

    function Game_Player()
    {
    }

    originalClearTransferInfo = vi.fn();
    originalExecuteEncounter = vi.fn();
    Game_Player.prototype.clearTransferInfo = originalClearTransferInfo;
    Game_Player.prototype.executeEncounter = originalExecuteEncounter;
    globalThis.Game_Player = Game_Player;

    await import('../../../../../../src/plugins/abs/ext/star/objects/Game_Player.js');
  });

  beforeEach(() =>
  {
    originalClearTransferInfo.mockReset();
    originalExecuteEncounter.mockReset();
    globalThis.$gameMap = { postTransferEnemyParsing: vi.fn() };
    globalThis.BattleManager = { setStarPhase: vi.fn(), origin: vi.fn() };
  });

  function buildPlayer()
  {
    return Object.create(globalThis.Game_Player.prototype);
  }

  describe('clearTransferInfo', () =>
  {
    it('performs the original logic then parses enemy data on the map', () =>
    {
      const player = buildPlayer();
      player.clearTransferInfo();
      expect(originalClearTransferInfo).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameMap.postTransferEnemyParsing).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeEncounter', () =>
  {
    it('prepares star battle when an encounter occurred', () =>
    {
      originalExecuteEncounter.mockReturnValue(true);
      const player = buildPlayer();
      const result = player.executeEncounter();
      expect(globalThis.BattleManager.setStarPhase).toHaveBeenCalledWith(FAKE_PREPARING);
      expect(result).toBe(true);
    });

    it('does not prepare star battle when no encounter occurred', () =>
    {
      originalExecuteEncounter.mockReturnValue(false);
      const player = buildPlayer();
      const result = player.executeEncounter();
      expect(globalThis.BattleManager.setStarPhase).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('reserveOriginTransfer', () =>
  {
    it('reserves a transfer to the battle manager origin location', () =>
    {
      globalThis.BattleManager.origin.mockReturnValue({ mapId: 3, x: 5, y: 9 });
      const player = buildPlayer();
      player.reserveTransfer = vi.fn();

      player.reserveOriginTransfer();

      expect(player.reserveTransfer).toHaveBeenCalledWith(3, 5, 9);
    });
  });
});
//endregion plugins/abs/ext/star/objects/game-player.test.js
