//region level-sync.test.js
import vm from 'node:vm';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { loadLevelSyncPluginVm } from './sync-vm.js';

describe('J-Level-Sync (out/level/ext/J-Level-Sync.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelSyncPluginVm(sandbox);
  });

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------

  function makeActor(realLevel)
  {
    return vm.runInContext(`
      (() => {
        const actor = new Game_Actor();
        actor.initMembers();
        actor._level = ${realLevel};
        return actor;
      })();
    `, sandbox);
  }

  function setSession(level, uplevel = false)
  {
    sandbox.$gameSystem.setContentSyncSession(level, uplevel);
  }

  function clearSession()
  {
    sandbox.$gameSystem.clearContentSyncSession();
  }

  function setMapSync(level, uplevel = false)
  {
    sandbox.$gameMap._j._levelSync._contentSyncLevel = level;
    sandbox.$gameMap._j._levelSync._contentSyncUplevel = uplevel;
  }

  function clearMapSync()
  {
    sandbox.$gameMap._j._levelSync._contentSyncLevel = null;
    sandbox.$gameMap._j._levelSync._contentSyncUplevel = false;
  }

  beforeEach(() =>
  {
    clearSession();
    clearMapSync();
  });

  // ---------------------------------------------------------------------------
  // cap-only mode (default)
  // ---------------------------------------------------------------------------

  describe('cap-only sync (uplevel = false)', () =>
  {
    it('clamps an overleveled actor down to the sync level', () =>
    {
      setSession(50, false);
      const actor = makeActor(90);

      expect(actor.getLevel()).toBe(50);
    });

    it('leaves an underleveled actor at their real level', () =>
    {
      setSession(50, false);
      const actor = makeActor(30);

      expect(actor.getLevel()).toBe(30);
    });

    it('leaves an actor at the sync level unchanged', () =>
    {
      setSession(50, false);
      const actor = makeActor(50);

      expect(actor.getLevel()).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // uplevel (exact) mode
  // ---------------------------------------------------------------------------

  describe('uplevel sync (uplevel = true)', () =>
  {
    it('clamps an overleveled actor down to the sync level', () =>
    {
      setSession(50, true);
      const actor = makeActor(90);

      expect(actor.getLevel()).toBe(50);
    });

    it('boosts an underleveled actor up to the sync level', () =>
    {
      setSession(50, true);
      const actor = makeActor(30);

      expect(actor.getLevel()).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // real _level is never mutated
  // ---------------------------------------------------------------------------

  describe('save data integrity', () =>
  {
    it('does not mutate _level after cap-only sync', () =>
    {
      setSession(50, false);
      const actor = makeActor(90);

      actor.getLevel();

      expect(actor._level).toBe(90);
    });

    it('does not mutate _level after uplevel sync', () =>
    {
      setSession(50, true);
      const actor = makeActor(30);

      actor.getLevel();

      expect(actor._level).toBe(30);
    });
  });

  // ---------------------------------------------------------------------------
  // session priority over map note
  // ---------------------------------------------------------------------------

  describe('session priority', () =>
  {
    it('session level wins over a conflicting map note', () =>
    {
      setSession(50, false);
      setMapSync(30, false);
      const actor = makeActor(90);

      expect(actor.getLevel()).toBe(50);
    });

    it('map note applies when no session is active', () =>
    {
      setMapSync(40, false);
      const actor = makeActor(90);

      expect(actor.getLevel()).toBe(40);
    });

    it('underleveled actor is unaffected by map note in cap-only mode', () =>
    {
      setMapSync(40, false);
      const actor = makeActor(20);

      expect(actor.getLevel()).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // clear session restores real level
  // ---------------------------------------------------------------------------

  describe('clearContentSync', () =>
  {
    it('restores the real effective level after clearing a session', () =>
    {
      setSession(50, false);
      const actor = makeActor(90);

      expect(actor.getLevel()).toBe(50);

      clearSession();

      expect(actor.getLevel()).toBe(90);
    });
  });

  // ---------------------------------------------------------------------------
  // isContentSynced
  // ---------------------------------------------------------------------------

  describe('isContentSynced()', () =>
  {
    it('returns false when no sync is active', () =>
    {
      const actor = makeActor(50);

      expect(actor.isContentSynced()).toBe(false);
    });

    it('returns true when a session is active', () =>
    {
      setSession(50, false);
      const actor = makeActor(90);

      expect(actor.isContentSynced()).toBe(true);
    });

    it('returns true when a map note sync is active', () =>
    {
      setMapSync(40, false);
      const actor = makeActor(90);

      expect(actor.isContentSynced()).toBe(true);
    });

    it('returns false after clearing the session', () =>
    {
      setSession(50, false);
      const actor = makeActor(90);

      clearSession();

      expect(actor.isContentSynced()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // EXP gate — getLevelForExp
  // ---------------------------------------------------------------------------

  describe('getLevelForExp()', () =>
  {
    it('returns real _level when sync-affects-exp is false (default)', () =>
    {
      setSession(50, false);
      const actor = makeActor(90);

      expect(actor.getLevelForExp()).toBe(90);
    });

    it('returns synced level when sync-affects-exp is true', () =>
    {
      const syncSandbox = { console };
      loadLevelSyncPluginVm(syncSandbox, { 'sync-affects-exp': 'true' });
      syncSandbox.$gameSystem.setContentSyncSession(50, false);
      syncSandbox.$gameMap._j._levelSync._contentSyncLevel = null;

      const actor = vm.runInContext(`
        const a = new Game_Actor();
        a.initMembers();
        a._level = 90;
        a;
      `, syncSandbox);

      expect(actor.getLevelForExp()).toBe(50);
    });

    it('returns real _level when no sync is active regardless of parameter', () =>
    {
      const actor = makeActor(75);

      expect(actor.getLevelForExp()).toBe(75);
    });
  });
});
//endregion level-sync.test.js
