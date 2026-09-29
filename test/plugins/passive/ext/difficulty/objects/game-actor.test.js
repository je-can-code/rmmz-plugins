//region plugins/passive/ext/difficulty/objects/game-actor.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Every actor draws its difficulty states from the one source the applied difficulty keeps on $gameTemp.
 * The alias has to add that source without disturbing the sources J-Passive already found, and without
 * mutating the list the original handed back.
 */
describe('Game_Actor difficulty passive sources (direct src import)', () =>
{
  let originalSources;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { DIFFICULTY: { Aliased: { Game_Actor: new Map() } } } } };

    globalThis.Game_Actor = function Game_Actor()
    {
    };

    // stands in for J-Passive's own source list.
    globalThis.Game_Actor.prototype.getPassiveStateSources = function()
    {
      return originalSources;
    };

    await import('../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Actor.js');
  });

  it('appends the actor difficulty sources after the ones J-Passive found', () =>
  {
    // Arrange- the enemy side holds a different source, which an actor must never draw from.
    originalSources = [ 'class', 'weapon' ];
    globalThis.$gameTemp = {
      actorDifficultySources: () => [ 'actor-difficulty' ],
      enemyDifficultySources: () => [ 'enemy-difficulty' ],
    };

    // Act
    const sources = new globalThis.Game_Actor().getPassiveStateSources();

    // Assert
    expect(sources).toEqual([ 'class', 'weapon', 'actor-difficulty' ]);
  });

  it('answers only the original sources when no layer grants actors a state', () =>
  {
    // Arrange
    originalSources = [ 'class' ];
    globalThis.$gameTemp = { actorDifficultySources: () => [] };

    // Act
    const sources = new globalThis.Game_Actor().getPassiveStateSources();

    // Assert
    expect(sources).toEqual([ 'class' ]);
  });

  it('leaves the list J-Passive handed back untouched', () =>
  {
    // Arrange
    originalSources = [ 'class' ];
    globalThis.$gameTemp = { actorDifficultySources: () => [ 'actor-difficulty' ] };

    // Act
    new globalThis.Game_Actor().getPassiveStateSources();

    // Assert
    expect(originalSources).toEqual([ 'class' ]);
  });
});
//endregion plugins/passive/ext/difficulty/objects/game-actor.test.js
