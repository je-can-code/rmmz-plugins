//region plugins/_base/objects/game-actors.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('J-Base Game_Actors (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extension (rmmz_core.js), not part of this plugin- a fresh
    // array per access, matching the real getter (not a shared/mutation-prone singleton).
    Object.defineProperty(Array, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => Array.of(),
    });

    function Game_Actors()
    {
    }

    globalThis.Game_Actors = Game_Actors;

    await import('../../../../src/plugins/_base/objects/Game_Actors.js');
  });

  beforeEach(() =>
  {
    globalThis.$dataActors = [];
  });

  function buildActors()
  {
    return new globalThis.Game_Actors();
  }

  describe('actorIds', () =>
  {
    it('skips the null entry always present at index 0', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null ];

      // Act
      const result = buildActors().actorIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('skips an actor with an empty name', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null, { id: 1, name: '' } ];

      // Act
      const result = buildActors().actorIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('skips an actor whose name starts with a space', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null, { id: 1, name: ' hidden' } ];

      // Act
      const result = buildActors().actorIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('skips an actor whose name starts with double equals', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null, { id: 1, name: '==separator' } ];

      // Act
      const result = buildActors().actorIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('skips an actor whose name starts with a double underscore', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null, { id: 1, name: '__hidden' } ];

      // Act
      const result = buildActors().actorIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('includes the id of a normally-named actor', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null, { id: 1, name: 'Rupert' } ];

      // Act
      const result = buildActors().actorIds();

      // Assert
      expect(result).toEqual([ 1 ]);
    });
  });

  describe('actors', () =>
  {
    it('maps each valid actor id through actor(id)', () =>
    {
      // Arrange
      const actorsInstance = buildActors();
      actorsInstance.actorIds = () => [ 1, 2 ];
      actorsInstance.actor = (id) => ({ id });

      // Act
      const result = actorsInstance.actors();

      // Assert
      expect(result).toEqual([ { id: 1 }, { id: 2 } ]);
    });
  });

  describe('existingActors', () =>
  {
    it('hands back the backing store without materializing anything', () =>
    {
      // Arrange- a database actor exists, but the store has never been asked for it.
      globalThis.$dataActors = [ null, { id: 1, name: 'Rupert' } ];
      const actorsInstance = buildActors();
      actorsInstance._data = [];
      actorsInstance.actor = () =>
      {
        throw new Error('existingActors must never construct an actor');
      };

      // Act
      const result = actorsInstance.existingActors();

      // Assert
      expect(result).toEqual([]);
    });

    it('preserves the holes of a sparse, id-indexed store', () =>
    {
      // Arrange- ids 1 and 3 were built, id 2 never was.
      const actorsInstance = buildActors();
      const store = [];
      store[ 1 ] = { id: 1 };
      store[ 3 ] = { id: 3 };
      actorsInstance._data = store;

      // Act
      const result = actorsInstance.existingActors();
      const visited = [];
      result.forEach(actor => visited.push(actor));

      // Assert- length spans the ids, but iteration only ever sees the two real actors.
      expect(result.length).toBe(4);
      expect(visited).toEqual([ { id: 1 }, { id: 3 } ]);
    });
  });
});
//endregion plugins/_base/objects/game-actors.test.js
