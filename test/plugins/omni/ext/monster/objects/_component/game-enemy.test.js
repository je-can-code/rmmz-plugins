//region plugins/omni/ext/monster/objects/_component/game-enemy.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Enemy (omni ext/monster, direct src import)', () =>
{
  let observations;

  beforeEach(async () =>
  {
    vi.resetModules();

    function Game_Enemy()
    {
    }

    Game_Enemy.prototype.onDeath = vi.fn();
    Game_Enemy.prototype.makeDropItems = vi.fn(() => []);
    Game_Enemy.prototype.battlerId = function()
    {
      return 42;
    };

    globalThis.Game_Enemy = Game_Enemy;
    globalThis.J = { OMNI: { EXT: { MONSTER: { Aliased: { Game_Enemy: new Map() } } } } };

    observations = {
      numberDefeated: 0,
      knowsName: false,
      knowsFamily: false,
      knowsDescription: false,
      knowsParameters: false,
      isDropKnown: vi.fn(() => false),
      addKnownDrop: vi.fn(),
      isElementalisticKnown: vi.fn(() => false),
      addKnownElementalistic: vi.fn(),
    };
    globalThis.$gameParty = { getOrCreateMonsterpediaObservationsById: vi.fn(() => observations) };

    // the file under test- patches globalThis.Game_Enemy.prototype directly, no vm involved.
    await import('../../../../../../../src/plugins/omni/ext/monster/objects/Game_Enemy.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_Enemy;
    delete globalThis.J;
    delete globalThis.$gameParty;
  });

  describe('getMonsterPediaObservations', () =>
  {
    it('delegates to $gameParty, keyed by this enemy\'s battlerId', () =>
    {
      const enemy = new globalThis.Game_Enemy();

      expect(enemy.getMonsterPediaObservations()).toBe(observations);
      expect(globalThis.$gameParty.getOrCreateMonsterpediaObservationsById).toHaveBeenCalledWith(42);
    });
  });

  describe('onDeath / updateMonsterpediaObservation', () =>
  {
    it('calls the original hook and learns all monsterpedia facets, incrementing the defeat count', () =>
    {
      const enemy = new globalThis.Game_Enemy();
      const originalOnDeath = globalThis.J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.get('onDeath');

      enemy.onDeath();

      expect(originalOnDeath).toHaveBeenCalled();
      expect(observations.numberDefeated).toBe(1);
      expect(observations.knowsName).toBe(true);
      expect(observations.knowsFamily).toBe(true);
      expect(observations.knowsDescription).toBe(true);
      expect(observations.knowsParameters).toBe(true);
    });
  });

  describe('makeDropItems / observeDrop', () =>
  {
    it('observes each drop the original logic returns', () =>
    {
      const enemy = new globalThis.Game_Enemy();
      const drops = [ { kind: 'i', id: 1 }, { kind: 'w', id: 2 } ];
      globalThis.J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.set('makeDropItems', vi.fn(() => drops));

      const result = enemy.makeDropItems();

      expect(result).toBe(drops);
      expect(observations.addKnownDrop).toHaveBeenCalledWith('i', 1);
      expect(observations.addKnownDrop).toHaveBeenCalledWith('w', 2);
    });

    it('does not attempt to observe drops when there are none', () =>
    {
      const enemy = new globalThis.Game_Enemy();
      globalThis.J.OMNI.EXT.MONSTER.Aliased.Game_Enemy.set('makeDropItems', vi.fn(() => []));

      enemy.makeDropItems();

      expect(observations.addKnownDrop).not.toHaveBeenCalled();
    });

    it('observeDrop skips recording an already-known drop', () =>
    {
      const enemy = new globalThis.Game_Enemy();
      observations.isDropKnown.mockReturnValue(true);

      enemy.observeDrop({ kind: 'a', id: 3 });

      expect(observations.addKnownDrop).not.toHaveBeenCalled();
    });
  });

  describe('observeElement', () =>
  {
    it('records a newly-observed element', () =>
    {
      const enemy = new globalThis.Game_Enemy();

      enemy.observeElement(5);

      expect(observations.addKnownElementalistic).toHaveBeenCalledWith(5);
    });

    it('skips recording an already-known element', () =>
    {
      const enemy = new globalThis.Game_Enemy();
      observations.isElementalisticKnown.mockReturnValue(true);

      enemy.observeElement(5);

      expect(observations.addKnownElementalistic).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/monster/objects/_component/game-enemy.test.js
