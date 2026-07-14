//region plugins/abs/ext/star/managers/battle-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star BattleManager (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { STAR: { Aliased: { BattleManager: new Map() } } } } };

    const FAKE_PREPARING = { name: 'Preparing', key: 1 };
    const FAKE_DISENGAGED = { name: 'Disengaged', key: 0 };
    vi.doMock('../../../../../../src/plugins/abs/ext/star/_models/StarPhases.js', () => ({
      default: { PREPARING: FAKE_PREPARING, DISENGAGED: FAKE_DISENGAGED },
    }));
    vi.doMock('../../../../../../src/plugins/abs/ext/star/_models/StarPhase.js', () => ({ default: class {} }));
    vi.doMock('../../../../../../src/plugins/abs/ext/star/_models/StarOrigin.js', () => ({ default: class {} }));

    class FakeTimer
    {
      constructor(maxTime)
      {
        this.maxTime = maxTime;
        this._complete = false;
      }

      reset()
      {
        this.resetCalled = true;
      }

      setMaxTime(maxTime)
      {
        this.maxTime = maxTime;
      }

      isTimerComplete()
      {
        return this._complete;
      }

      update()
      {
        this.updateCalled = true;
      }

      forceComplete()
      {
        this._complete = true;
      }
    }

    globalThis.JABS_Timer = FakeTimer;

    originalInitMembers = vi.fn();
    globalThis.BattleManager = { initMembers: originalInitMembers, enemyMap: undefined };

    await import('../../../../../../src/plugins/abs/ext/star/managers/BattleManager.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
  });

  describe('enemyMap', () =>
  {
    it('defaults to an object with an empty events array', () =>
    {
      expect(globalThis.BattleManager.enemyMap).toEqual({ events: [] });
    });
  });

  describe('initMembers', () =>
  {
    it('calls the original then defaults all star-battle members', () =>
    {
      // Act
      globalThis.BattleManager.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(globalThis.BattleManager.origin()).toBeNull();
      expect(globalThis.BattleManager.isInBattle()).toBe(false);
      expect(globalThis.BattleManager.getStarPhase()).toMatchObject({ name: 'Preparing' });
    });

    it('does not overwrite an already-set star phase', () =>
    {
      // Arrange
      globalThis.BattleManager.initMembers();
      globalThis.BattleManager.setStarPhase({ name: 'In-battle', key: 2 });

      // Act
      globalThis.BattleManager.initMembers();

      // Assert
      expect(globalThis.BattleManager.getStarPhase()).toMatchObject({ name: 'In-battle' });
    });
  });

  describe('getStarPhase / setStarPhase', () =>
  {
    it('defaults to DISENGAGED when no phase has been set at all', () =>
    {
      // Arrange- bypass initMembers entirely.
      delete globalThis.BattleManager._starPhase;

      // Act / Assert
      expect(globalThis.BattleManager.getStarPhase()).toMatchObject({ name: 'Disengaged' });
    });

    it('reflects whatever phase was set', () =>
    {
      globalThis.BattleManager.setStarPhase({ name: 'Finished', key: 3 });
      expect(globalThis.BattleManager.getStarPhase()).toMatchObject({ name: 'Finished' });
    });
  });

  describe('wait timer', () =>
  {
    it('setWait resets the timer and assigns a new max time', () =>
    {
      globalThis.BattleManager.initMembers();
      globalThis.BattleManager.setWait(120);
      const timer = globalThis.BattleManager.getWaitTimer();
      expect(timer.resetCalled).toBe(true);
      expect(timer.maxTime).toBe(120);
    });

    it('isWaiting returns false once the timer completes', () =>
    {
      globalThis.BattleManager.initMembers();
      globalThis.BattleManager.getWaitTimer()
        .forceComplete();
      expect(globalThis.BattleManager.isWaiting()).toBe(false);
    });

    it('KNOWN BUG: isWaiting returns undefined (not false) while the timer is still running, despite the @returns {boolean} contract- there is no explicit return for the not-yet-complete path', () =>
    {
      globalThis.BattleManager.initMembers();
      expect(globalThis.BattleManager.isWaiting()).toBeUndefined();
    });

    it('updateTimer ticks the wait timer', () =>
    {
      globalThis.BattleManager.initMembers();
      vi.spyOn(console, 'log').mockImplementation(() => {});
      globalThis.BattleManager.updateTimer();
      expect(globalThis.BattleManager.getWaitTimer().updateCalled).toBe(true);
      console.log.mockRestore();
    });

    it('clearWait force-completes the timer', () =>
    {
      globalThis.BattleManager.initMembers();
      globalThis.BattleManager.clearWait();
      expect(globalThis.BattleManager.getWaitTimer().isTimerComplete()).toBe(true);
    });
  });

  describe('battle engagement flags', () =>
  {
    it('engageInBattle/disengageInBattle/isInBattle track the flag', () =>
    {
      globalThis.BattleManager.initMembers();
      expect(globalThis.BattleManager.isInBattle()).toBe(false);
      globalThis.BattleManager.engageInBattle();
      expect(globalThis.BattleManager.isInBattle()).toBe(true);
      globalThis.BattleManager.disengageInBattle();
      expect(globalThis.BattleManager.isInBattle()).toBe(false);
    });
  });

  describe('setupStarBattle', () =>
  {
    it('sets up the troop, starts the battle event hook, engages battle, and reserves a transfer', () =>
    {
      // Arrange
      globalThis.BattleManager.initMembers();
      globalThis.BattleManager.setup = vi.fn();
      globalThis.BattleManager.setEventCallback = vi.fn();
      globalThis.$gameTroop = { troop: () => ({ id: 4 }) };
      globalThis.$gameSystem = { onBattleStart: vi.fn() };
      globalThis.$gamePlayer = { makeEncounterCount: vi.fn(), reserveTransfer: vi.fn() };
      const origin = { mapId: 1, x: 2, y: 3 };

      // Act
      globalThis.BattleManager.setupStarBattle(origin, 9);

      // Assert
      expect(globalThis.BattleManager.setup).toHaveBeenCalledWith(4, true, true);
      expect(globalThis.$gameSystem.onBattleStart).toHaveBeenCalledTimes(1);
      expect(globalThis.BattleManager.isInBattle()).toBe(true);
      expect(globalThis.BattleManager.origin()).toBe(origin);
      expect(globalThis.$gamePlayer.reserveTransfer).toHaveBeenCalledWith(9, 14, 9);
    });
  });
});
//endregion plugins/abs/ext/star/managers/battle-manager.test.js
