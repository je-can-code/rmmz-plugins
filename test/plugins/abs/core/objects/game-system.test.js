//region plugins/abs/core/objects/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The respawn registry J-ABS hangs off `Game_System`. Fixtures deliberately carry near-miss
 * siblings- a second map, a second event- so "found the one asked for" and "found everything"
 * remain distinguishable programs.
 */
describe('J-ABS Game_System augments (direct src import)', () =>
{
  let Game_System;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Game_System: new Map() } } };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.initMembers = vi.fn();
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../src/plugins/abs/core/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  /**
   * Builds a system with the respawn registry initialized.
   */
  const buildSystem = () =>
  {
    const system = new Game_System();
    system.initMembers();
    return system;
  };

  describe('initMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(globalThis.J.ABS.Aliased.Game_System.get('initMembers')).toHaveBeenCalledTimes(1);
    });

    it('seeds an empty respawn registry', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(system.respawnRegistry()).toBeInstanceOf(Map);
      expect(system.respawnRegistry().size).toBe(0);
    });
  });

  describe('respawnRecord', () =>
  {
    it('returns null for a map with no tracked records', () =>
    {
      // Arrange- a sibling map IS tracked, so an untracked map must still resolve to nothing.
      const system = buildSystem();
      system.setRespawnRecord(2, 5, { method: 'seconds' });

      // Act
      const result = system.respawnRecord(1, 5);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null for an untracked event on a tracked map', () =>
    {
      // Arrange- a sibling event IS tracked on the same map.
      const system = buildSystem();
      system.setRespawnRecord(1, 6, { method: 'seconds' });

      // Act
      const result = system.respawnRecord(1, 5);

      // Assert
      expect(result).toBeNull();
    });

    it('returns the record tracked for the exact map and event', () =>
    {
      // Arrange- sibling map and sibling event both carry decoys.
      const system = buildSystem();
      const wanted = { method: 'seconds', due: 100 };
      system.setRespawnRecord(1, 5, wanted);
      system.setRespawnRecord(1, 6, { method: 'never' });
      system.setRespawnRecord(2, 5, { method: 'never' });

      // Act
      const result = system.respawnRecord(1, 5);

      // Assert
      expect(result).toBe(wanted);
    });
  });

  describe('setRespawnRecord', () =>
  {
    it('replaces an existing record for the same event outright', () =>
    {
      // Arrange
      const system = buildSystem();
      system.setRespawnRecord(1, 5, { method: 'seconds', due: 100 });
      const newer = { method: 'seconds', due: 900 };

      // Act
      system.setRespawnRecord(1, 5, newer);

      // Assert
      expect(system.respawnRecord(1, 5)).toBe(newer);
      expect(system.respawnRecordsForMap(1)).toHaveLength(1);
    });
  });

  describe('clearRespawnRecord', () =>
  {
    it('does nothing for a map with no tracked records', () =>
    {
      // Arrange- the sibling map's record must survive the no-op.
      const system = buildSystem();
      system.setRespawnRecord(2, 5, { method: 'seconds' });

      // Act
      system.clearRespawnRecord(1, 5);

      // Assert
      expect(system.respawnRecord(2, 5)).not.toBeNull();
    });

    it('drops only the named record, leaving its siblings tracked', () =>
    {
      // Arrange
      const system = buildSystem();
      system.setRespawnRecord(1, 5, { method: 'seconds' });
      system.setRespawnRecord(1, 6, { method: 'never' });

      // Act
      system.clearRespawnRecord(1, 5);

      // Assert
      expect(system.respawnRecord(1, 5)).toBeNull();
      expect(system.respawnRecord(1, 6)).not.toBeNull();
    });

    it('drops the emptied map from the registry once its last record clears', () =>
    {
      // Arrange
      const system = buildSystem();
      system.setRespawnRecord(1, 5, { method: 'seconds' });

      // Act
      system.clearRespawnRecord(1, 5);

      // Assert
      expect(system.respawnRegistry().has(1)).toBe(false);
    });
  });

  describe('clearAllRespawnRecords', () =>
  {
    /**
     * Builds a record stub carrying only the predicate the world-wide wipe consults.
     * @param {boolean} permanent Whether this record declares permanence.
     */
    const buildRecord = permanent => ({ isPermanent: () => permanent });

    it('empties the whole registry when permanence is overruled', () =>
    {
      // Arrange- a permanent record on a second map must go too, not just the pending one.
      const system = buildSystem();
      system.setRespawnRecord(1, 5, buildRecord(false));
      system.setRespawnRecord(2, 6, buildRecord(true));

      // Act
      system.clearAllRespawnRecords(true);

      // Assert
      expect(system.respawnRegistry().size).toBe(0);
    });

    it('spares permanent records when permanence is honored', () =>
    {
      // Arrange
      const system = buildSystem();
      const permanent = buildRecord(true);
      system.setRespawnRecord(1, 5, buildRecord(false));
      system.setRespawnRecord(1, 6, permanent);

      // Act
      system.clearAllRespawnRecords(false);

      // Assert
      expect(system.respawnRecord(1, 5)).toBeNull();
      expect(system.respawnRecord(1, 6)).toBe(permanent);
    });

    it('clears pending records across every tracked map, not only the first', () =>
    {
      // Arrange
      const system = buildSystem();
      system.setRespawnRecord(1, 5, buildRecord(false));
      system.setRespawnRecord(2, 6, buildRecord(false));

      // Act
      system.clearAllRespawnRecords(false);

      // Assert
      expect(system.respawnRecord(1, 5)).toBeNull();
      expect(system.respawnRecord(2, 6)).toBeNull();
    });

    it('drops a map from the registry once its last pending record clears', () =>
    {
      // Arrange- the sibling map keeps a permanent record, so it must survive the prune.
      const system = buildSystem();
      system.setRespawnRecord(1, 5, buildRecord(false));
      system.setRespawnRecord(2, 6, buildRecord(true));

      // Act
      system.clearAllRespawnRecords(false);

      // Assert
      expect(system.respawnRegistry().has(1)).toBe(false);
      expect(system.respawnRegistry().has(2)).toBe(true);
    });
  });

  describe('respawnRecordsForMap', () =>
  {
    it('returns an empty collection for an untracked map', () =>
    {
      // Arrange- a sibling map is tracked; the untracked one must still come back empty.
      const system = buildSystem();
      system.setRespawnRecord(2, 5, { method: 'seconds' });

      // Act
      const result = system.respawnRecordsForMap(1);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns only the requested map\'s event-to-record pairs', () =>
    {
      // Arrange
      const system = buildSystem();
      const first = { method: 'seconds', due: 100 };
      const second = { method: 'never', due: 0 };
      system.setRespawnRecord(1, 5, first);
      system.setRespawnRecord(1, 6, second);
      system.setRespawnRecord(2, 7, { method: 'seconds', due: 500 });

      // Act
      const result = system.respawnRecordsForMap(1);

      // Assert
      expect(result).toEqual([ [ 5, first ], [ 6, second ] ]);
    });
  });
});
//endregion plugins/abs/core/objects/game-system.test.js