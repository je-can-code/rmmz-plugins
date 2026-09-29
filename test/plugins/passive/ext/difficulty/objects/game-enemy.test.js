//region plugins/passive/ext/difficulty/objects/game-enemy.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Every enemy draws its difficulty states from the one source the applied difficulty keeps on $gameTemp.
 * The alias has to add that source without disturbing the sources J-Passive already found, and without
 * mutating the list the original handed back.
 */
describe('Game_Enemy difficulty passive sources (direct src import)', () =>
{
  let originalSources;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { DIFFICULTY: { Aliased: { Game_Enemy: new Map() } } } } };

    globalThis.Game_Enemy = function Game_Enemy()
    {
    };

    // stands in for J-Passive's own source list.
    globalThis.Game_Enemy.prototype.getPassiveStateSources = function()
    {
      return originalSources;
    };

    await import('../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Enemy.js');
  });

  it('appends the enemy difficulty sources after the ones J-Passive found', () =>
  {
    // Arrange- the actor side holds a different source, which an enemy must never draw from.
    originalSources = [ 'class', 'weapon' ];
    globalThis.$gameTemp = {
      actorDifficultySources: () => [ 'actor-difficulty' ],
      enemyDifficultySources: () => [ 'enemy-difficulty' ],
    };

    // Act
    const sources = new globalThis.Game_Enemy().getPassiveStateSources();

    // Assert
    expect(sources).toEqual([ 'class', 'weapon', 'enemy-difficulty' ]);
  });

  it('answers only the original sources when no layer grants enemies a state', () =>
  {
    // Arrange
    originalSources = [ 'class' ];
    globalThis.$gameTemp = { enemyDifficultySources: () => [] };

    // Act
    const sources = new globalThis.Game_Enemy().getPassiveStateSources();

    // Assert
    expect(sources).toEqual([ 'class' ]);
  });

  it('leaves the list J-Passive handed back untouched', () =>
  {
    // Arrange
    originalSources = [ 'class' ];
    globalThis.$gameTemp = { enemyDifficultySources: () => [ 'enemy-difficulty' ] };

    // Act
    new globalThis.Game_Enemy().getPassiveStateSources();

    // Assert
    expect(originalSources).toEqual([ 'class' ]);
  });
});
//endregion plugins/passive/ext/difficulty/objects/game-enemy.test.js
