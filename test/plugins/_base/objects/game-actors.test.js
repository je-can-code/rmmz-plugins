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
});
//endregion plugins/_base/objects/game-actors.test.js
