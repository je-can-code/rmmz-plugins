//region plugins/omni/ext/monster/objects/_component/game-party.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Party (omni ext/monster, direct src import)', () =>
{
  /** @type {typeof import('../../../../../../../src/plugins/omni/ext/monster/__models/MonsterpediaObservations.js').default} */
  let MonsterpediaObservations;

  beforeEach(async () =>
  {
    vi.resetModules();

    function Game_Party()
    {
    }

    Game_Party.prototype.initOmnipediaMembers = vi.fn();
    Game_Party.prototype.isOmnipediaInitialized = function()
    {
      return !!this._j?._omni;
    };

    globalThis.Game_Party = Game_Party;
    globalThis.J = { OMNI: { EXT: { MONSTER: { Aliased: { Game_Party: new Map() } } } } };

    // MonsterpediaObservations.js calls SerializableRegistry.register(...) as an import-time side effect.
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: MonsterpediaObservations } =
      await import('../../../../../../../src/plugins/omni/ext/monster/__models/MonsterpediaObservations.js'));

    // the file under test- patches globalThis.Game_Party.prototype directly, no vm involved.
    await import('../../../../../../../src/plugins/omni/ext/monster/objects/Game_Party.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_Party;
    delete globalThis.J;
    delete globalThis.SerializableRegistry;
  });

  describe('initOmnipediaMembers / initMonsterpediaMembers', () =>
  {
    it('calls the original hook and sets up the monsterpedia namespace with an empty saveables array and cache', () =>
    {
      const party = new globalThis.Game_Party();
      const originalHook = globalThis.J.OMNI.EXT.MONSTER.Aliased.Game_Party.get('initOmnipediaMembers');

      party.initOmnipediaMembers();

      expect(originalHook).toHaveBeenCalled();
      expect(party.getSavedMonsterpediaObservations()).toEqual([]);
      expect(party.getMonsterpediaObservationsCache()).toEqual(new Map());
    });
  });

  describe('getOrCreateMonsterpediaObservationsById', () =>
  {
    it('creates and caches a new MonsterpediaObservations when none exists for the enemyId', () =>
    {
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();

      const observations = party.getOrCreateMonsterpediaObservationsById(3);

      expect(observations).toBeInstanceOf(MonsterpediaObservations);
      expect(observations.id).toBe(3);
      expect(party.getMonsterpediaObservationsCache()
        .get(3)).toBe(observations);
    });

    it('returns the existing cached observations instead of creating a new one', () =>
    {
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();

      const first = party.getOrCreateMonsterpediaObservationsById(3);
      const second = party.getOrCreateMonsterpediaObservationsById(3);

      expect(second).toBe(first);
    });
  });

  describe('translateMonsterpediaCacheForSaving / translateMonsterpediaSaveablesToCache', () =>
  {
    it('mirrors cache entries into the saveable array keyed by enemyId', () =>
    {
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();

      const observation = new MonsterpediaObservations(5);
      party.getMonsterpediaObservationsCache()
        .set(5, observation);

      party.translateMonsterpediaCacheForSaving();

      expect(party.getSavedMonsterpediaObservations()[5]).toBe(observation);
    });

    it('rebuilds the cache from the saveable array, skipping falsy slots', () =>
    {
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();

      const observation = new MonsterpediaObservations(2);
      const saveables = party.getSavedMonsterpediaObservations();
      saveables[2] = observation;
      // sparse array slots (e.g. index 0/1 here) are skipped by forEach entirely, and this loop also
      // explicitly guards against any falsy entry that did get iterated.

      party.translateMonsterpediaSaveablesToCache();

      const cache = party.getMonsterpediaObservationsCache();
      expect(cache.get(2)).toBe(observation);
      expect(cache.size).toBe(1);
    });

    it('skips a slot that was explicitly emptied rather than merely never filled', () =>
    {
      // Arrange- a sparse hole is skipped by `forEach` on its own, but a slot holding null is
      // iterated. Caching it would put an entry the monsterpedia then tries to render.
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();
      const observation = new MonsterpediaObservations(2);
      const saveables = party.getSavedMonsterpediaObservations();
      saveables[1] = null;
      saveables[2] = observation;

      // Act
      party.translateMonsterpediaSaveablesToCache();

      // Assert
      const cache = party.getMonsterpediaObservationsCache();
      expect(cache.has(1)).toBe(false);
      expect(cache.size).toBe(1);
    });
  });

  describe('synchronizeMonsterpediaDataBeforeSave / synchronizeMonsterpediaAfterLoad', () =>
  {
    it('folds the cache back into the saveables before a save', () =>
    {
      // Arrange- every monster observed this session lives only in the cache until this runs.
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();
      const observation = { id: 7 };
      party.getMonsterpediaObservationsCache()
        .set(7, observation);

      // Act
      party.synchronizeMonsterpediaDataBeforeSave();

      // Assert
      expect(party.getSavedMonsterpediaObservations())
        .toContain(observation);
    });

    it('rebuilds the cache from the saveables on load', () =>
    {
      // Arrange- the saveables are what a savefile carries and the cache is the live view, so a load
      // that skipped this would leave every monster reading as never observed.
      const party = new globalThis.Game_Party();
      party.initOmnipediaMembers();
      const observation = { id: 7 };
      party.getSavedMonsterpediaObservations()[7] = observation;

      // Act
      party.synchronizeMonsterpediaAfterLoad();

      // Assert
      expect(party.getMonsterpediaObservationsCache()
        .get(7)).toBe(observation);
    });
  });
});
//endregion plugins/omni/ext/monster/objects/_component/game-party.test.js
