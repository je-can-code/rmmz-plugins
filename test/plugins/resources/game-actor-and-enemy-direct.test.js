//region plugins/resources/game-actor-and-enemy-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor / Game_Enemy hcrSources (resources core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();

    // trivial placeholder classes; hcrSources is patched on their prototypes and only reads back
    // whatever these instance methods return, so no inheritance chain is required here.
    function Game_Actor()
    {
    }

    function Game_Enemy()
    {
    }

    globalThis.Game_Actor = Game_Actor;
    globalThis.Game_Enemy = Game_Enemy;

    await import('../../../src/plugins/resources/core/objects/Game_Actor.js');
    await import('../../../src/plugins/resources/core/objects/Game_Enemy.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_Actor;
    delete globalThis.Game_Enemy;
  });

  it('Game_Actor.hcrSources concatenates database data, class, equips, and states in order', () =>
  {
    const actor = new globalThis.Game_Actor();
    const databaseData = { id: 'actorData' };
    const currentClass = { id: 'classData' };
    const equips = [ { id: 'equipA' }, { id: 'equipB' } ];
    const states = [ { id: 'stateA' } ];

    actor.databaseData = () => databaseData;
    actor.currentClass = () => currentClass;
    actor.equippedEquips = () => equips;
    actor.allStates = () => states;

    expect(actor.hcrSources()).toEqual([ databaseData, currentClass, ...equips, ...states ]);
  });

  it('Game_Enemy.hcrSources concatenates database data and states in order', () =>
  {
    const enemy = new globalThis.Game_Enemy();
    const databaseData = { id: 'enemyData' };
    const states = [ { id: 'stateA' }, { id: 'stateB' } ];

    enemy.databaseData = () => databaseData;
    enemy.allStates = () => states;

    expect(enemy.hcrSources()).toEqual([ databaseData, ...states ]);
  });
});
//endregion plugins/resources/game-actor-and-enemy-direct.test.js
