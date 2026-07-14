//region plugins/abs/ext/star/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star Game_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalUpdate;
  const PHASES = {
    DISENGAGED: { name: 'Disengaged', key: 0 },
    PREPARING: { name: 'Preparing', key: 1 },
    INBATTLE: { name: 'In-battle', key: 2 },
    FINISHED: { name: 'Finished', key: 3 },
    CLEANUP: { name: 'Clean-up', key: 4 },
    BACKTOMAP: { name: 'Back-to-map', key: 5 },
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { STAR: { Aliased: { Game_Map: new Map() }, DefaultValues: { EnemyMap: 5, MaxEnemyCount: 8 } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/star/_models/StarPhases.js', () => ({ default: PHASES }));

    class FakeOrigin
    {
      constructor(mapId, x, y)
      {
        this.mapId = mapId;
        this.x = x;
        this.y = y;
      }
    }

    vi.doMock('../../../../../../src/plugins/abs/ext/star/_models/StarOrigin.js', () => ({ default: FakeOrigin }));

    function Game_Map()
    {
    }

    originalUpdate = vi.fn();
    Game_Map.prototype.update = originalUpdate;
    globalThis.Game_Map = Game_Map;

    await import('../../../../../../src/plugins/abs/ext/star/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    originalUpdate.mockReset();
    globalThis.BattleManager = {
      isInBattle: vi.fn(() => false),
      updateTimer: vi.fn(),
      isWaiting: vi.fn(() => false),
      getStarPhase: vi.fn(() => PHASES.DISENGAGED),
      setStarPhase: vi.fn(),
      setupStarBattle: vi.fn(),
      playBattleBgm: vi.fn(),
      playVictoryMe: vi.fn(),
      enemyMap: { events: [] },
    };
    globalThis.$gameMap = { mapId: () => 1, _events: [] };
    globalThis.$gamePlayer = { x: 0, y: 0, reserveOriginTransfer: vi.fn() };
    globalThis.$gameTroop = { areEnemiesAlive: vi.fn(() => true), members: vi.fn(() => []) };
    globalThis.$dataMap = { meta: {}, events: [] };
    globalThis.AudioManager = { fadeOutBgm: vi.fn(), stopMe: vi.fn() };
    globalThis.JsonEx = { makeDeepCopy: vi.fn((x) => ({ ...x })) };
    globalThis.Game_Event = vi.fn();
  });

  function buildMap()
  {
    return Object.create(globalThis.Game_Map.prototype);
  }

  describe('update / updateStarBattle', () =>
  {
    it('performs the original logic then updates star battle', () =>
    {
      const map = buildMap();
      map.updateStarBattle = vi.fn();
      map.update();
      expect(originalUpdate).toHaveBeenCalledTimes(1);
      expect(map.updateStarBattle).toHaveBeenCalledTimes(1);
    });

    it('ticks the battle timer while in battle', () =>
    {
      globalThis.BattleManager.isInBattle.mockReturnValue(true);
      const map = buildMap();
      map.updateStarBattlePhases = vi.fn();

      map.updateStarBattle();

      expect(globalThis.BattleManager.updateTimer).toHaveBeenCalledTimes(1);
    });

    it('does not tick the timer while not in battle', () =>
    {
      const map = buildMap();
      map.updateStarBattlePhases = vi.fn();

      map.updateStarBattle();

      expect(globalThis.BattleManager.updateTimer).not.toHaveBeenCalled();
    });

    it('does not update phases while the battle manager is waiting', () =>
    {
      globalThis.BattleManager.isWaiting.mockReturnValue(true);
      const map = buildMap();
      map.updateStarBattlePhases = vi.fn();

      map.updateStarBattle();

      expect(map.updateStarBattlePhases).not.toHaveBeenCalled();
    });

    it('updates phases when not waiting', () =>
    {
      const map = buildMap();
      map.updateStarBattlePhases = vi.fn();

      map.updateStarBattle();

      expect(map.updateStarBattlePhases).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStarBattlePhases', () =>
  {
    it('does nothing while disengaged', () =>
    {
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.DISENGAGED);
      const map = buildMap();
      map.starPhasePrepare = vi.fn();
      map.starPhaseInBattle = vi.fn();
      map.starPhaseFinished = vi.fn();

      map.updateStarBattlePhases();

      expect(map.starPhasePrepare).not.toHaveBeenCalled();
      expect(map.starPhaseInBattle).not.toHaveBeenCalled();
      expect(map.starPhaseFinished).not.toHaveBeenCalled();
    });

    it('prepares during the preparing phase', () =>
    {
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.PREPARING);
      const map = buildMap();
      map.starPhasePrepare = vi.fn();

      map.updateStarBattlePhases();

      expect(map.starPhasePrepare).toHaveBeenCalledTimes(1);
    });

    it('runs the in-battle phase during in-battle', () =>
    {
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.INBATTLE);
      const map = buildMap();
      map.starPhaseInBattle = vi.fn();

      map.updateStarBattlePhases();

      expect(map.starPhaseInBattle).toHaveBeenCalledTimes(1);
    });

    it('runs the finished phase during finished', () =>
    {
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.FINISHED);
      const map = buildMap();
      map.starPhaseFinished = vi.fn();

      map.updateStarBattlePhases();

      expect(map.starPhaseFinished).toHaveBeenCalledTimes(1);
    });

    it('does nothing during cleanup or back-to-map', () =>
    {
      const map = buildMap();
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.CLEANUP);
      expect(() => map.updateStarBattlePhases()).not.toThrow();
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.BACKTOMAP);
      expect(() => map.updateStarBattlePhases()).not.toThrow();
    });
  });

  describe('starPhasePrepare', () =>
  {
    it('uses the current map\'s battleMap metadata when present', () =>
    {
      globalThis.$dataMap.meta = { battleMap: 42 };
      const map = buildMap();

      map.starPhasePrepare();

      expect(globalThis.BattleManager.setupStarBattle).toHaveBeenCalledWith(expect.any(Object), 42);
      expect(globalThis.BattleManager.playBattleBgm).toHaveBeenCalledTimes(1);
    });

    it('falls back to the default enemy map when there is no battleMap metadata', () =>
    {
      globalThis.$dataMap.meta = {};
      const map = buildMap();

      map.starPhasePrepare();

      expect(globalThis.BattleManager.setupStarBattle).toHaveBeenCalledWith(expect.any(Object), 5);
    });

    it('builds the origin from the current map id and player coordinates', () =>
    {
      globalThis.$gamePlayer.x = 7;
      globalThis.$gamePlayer.y = 3;
      const map = buildMap();

      map.starPhasePrepare();

      const [ origin ] = globalThis.BattleManager.setupStarBattle.mock.calls[0];
      expect(origin).toMatchObject({ mapId: 1, x: 7, y: 3 });
    });
  });

  describe('postTransferEnemyParsing', () =>
  {
    it('does nothing outside of the preparing phase', () =>
    {
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.INBATTLE);
      const map = buildMap();
      map.generateStarEnemy = vi.fn();

      map.postTransferEnemyParsing();

      expect(map.generateStarEnemy).not.toHaveBeenCalled();
      expect(globalThis.BattleManager.setStarPhase).not.toHaveBeenCalled();
    });

    it('generates each troop member and transitions to in-battle', () =>
    {
      globalThis.BattleManager.getStarPhase.mockReturnValue(PHASES.PREPARING);
      const enemy1 = { id: 1 };
      const enemy2 = { id: 2 };
      globalThis.$gameTroop.members.mockReturnValue([ enemy1, enemy2 ]);
      const map = buildMap();
      map.generateStarEnemy = vi.fn();

      map.postTransferEnemyParsing();

      expect(map.generateStarEnemy).toHaveBeenCalledTimes(2);
      expect(globalThis.BattleManager.setStarPhase).toHaveBeenCalledWith(PHASES.INBATTLE);
    });
  });

  describe('generateStarEnemy', () =>
  {
    it('warns and stops when the enemy count limit is exceeded', () =>
    {
      const map = buildMap();
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      map.generateStarEnemy({ enemyId: () => 1 }, 8);

      expect(console.warn).toHaveBeenCalled();
      expect(globalThis.$gameMap._events[8]).toBeUndefined();
      console.warn.mockRestore();
    });

    it('clones the enemy map event and places it at the correct index', () =>
    {
      globalThis.BattleManager.enemyMap = { events: [ null, { id: 'template' } ] };
      globalThis.$dataMap.events = [ null, { x: 4, y: 6 } ];
      const map = buildMap();
      const gameEnemy = { enemyId: () => 1 };

      map.generateStarEnemy(gameEnemy, 0);

      expect(globalThis.JsonEx.makeDeepCopy).toHaveBeenCalledWith({ id: 'template' });
      expect(globalThis.$dataMap.events[1]).toMatchObject({ x: 4, y: 6 });
      expect(globalThis.Game_Event).toHaveBeenCalledWith(5, 1);
      expect(globalThis.$gameMap._events[0]).toBeInstanceOf(globalThis.Game_Event);
    });
  });

  describe('starPhaseInBattle', () =>
  {
    beforeEach(() =>
    {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('does nothing while enemies remain', () =>
    {
      globalThis.$gameTroop.areEnemiesAlive.mockReturnValue(true);
      const map = buildMap();
      map.onStarVictory = vi.fn();

      map.starPhaseInBattle();

      expect(map.onStarVictory).not.toHaveBeenCalled();
    });

    it('KNOWN LIMITATION (downstream of the Game_Troop bug): checks areEnemiesAlive() directly rather than a live count, so this always reflects whatever areEnemiesAlive() currently reports', () =>
    {
      globalThis.$gameTroop.areEnemiesAlive.mockReturnValue(false);
      const map = buildMap();
      map.onStarVictory = vi.fn();

      map.starPhaseInBattle();

      expect(map.onStarVictory).toHaveBeenCalledTimes(1);
    });
  });

  describe('onStarVictory', () =>
  {
    it('fades out music, plays victory music, sets the finished phase, and starts the wait timer', () =>
    {
      const map = buildMap();
      globalThis.BattleManager.setWait = vi.fn();

      map.onStarVictory();

      expect(globalThis.AudioManager.fadeOutBgm).toHaveBeenCalledWith(1);
      expect(globalThis.BattleManager.playVictoryMe).toHaveBeenCalledTimes(1);
      expect(globalThis.BattleManager.setStarPhase).toHaveBeenCalledWith(PHASES.FINISHED);
      expect(globalThis.BattleManager.setWait).toHaveBeenCalledWith(240);
    });
  });

  describe('starPhaseFinished', () =>
  {
    it('returns the player to origin, stops music, disengages, and marks disengaged', () =>
    {
      globalThis.BattleManager.disengageInBattle = vi.fn();
      const map = buildMap();
      map.returnPlayerToOrigin = vi.fn();

      map.starPhaseFinished();

      expect(map.returnPlayerToOrigin).toHaveBeenCalledTimes(1);
      expect(globalThis.AudioManager.stopMe).toHaveBeenCalledTimes(1);
      expect(globalThis.BattleManager.setStarPhase).toHaveBeenCalledWith(PHASES.DISENGAGED);
      expect(globalThis.BattleManager.disengageInBattle).toHaveBeenCalledTimes(1);
    });
  });

  describe('returnPlayerToOrigin', () =>
  {
    it('reserves the player\'s transfer back to their origin', () =>
    {
      const map = buildMap();
      map.returnPlayerToOrigin();
      expect(globalThis.$gamePlayer.reserveOriginTransfer).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/star/objects/game-map.test.js
