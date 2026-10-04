//region plugins/pixel/core/objects/game-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultPixelGameMap,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

/**
 * Pixel core's `Game_Character` move-route layer. Under pixel movement a single route command no
 * longer covers a whole tile, so each movement command has to be repeated for a tile's worth of
 * frames before the route advances- otherwise scripted movement crawls a fraction of the distance
 * the event author asked for. These tests drive the real repeat cycle frame by frame.
 */
describe('J-Pixelistics Game_Character move routes (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Character.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Character.js');

    // J-Base's search and its memory, globals once J-Base has loaded- the real ones, since the tests pin
    // the paths found and when a search is skipped.
    ({ default: globalThis.TilePathSearch } = await import('../../../../../src/plugins/_base/core/core/TilePathSearch.js'));
    ({ default: globalThis.PathSearchMemory } = await import('../../../../../src/plugins/_base/core/core/PathSearchMemory.js'));

    // the engine's frame counter, which is all the memory reads off it.
    globalThis.Graphics = { frameCount: 0 };
  });

  beforeEach(() =>
  {
    globalThis.$gameMap = buildDefaultPixelGameMap();
  });

  /**
   * Builds a character part-way through a move route, with the processed commands recorded so
   * repetition is observable frame by frame.
   * @param {object[]} commandList The move route command list.
   * @returns {Game_Character}
   */
  function makeRoutedCharacter(commandList)
  {
    const character = new globalThis.Game_Character();
    character.initMembers();
    character.setMoveSpeed(4);
    character._moveRoute = {
      list: commandList,
      repeat: false,
      skippable: false,
    };
    character._moveRouteIndex = 0;
    character._waitCount = 0;

    character.processedCommands = [];
    character.processMoveCommand = function(command)
    {
      this.processedCommands.push(command);
      this.setMovePressed(false);
    };

    return character;
  }

  //region searchLimit
  describe('searchLimit', () =>
  {
    it('searches considerably further than vanilla when pathing', () =>
    {
      // Arrange: pixel movement covers a tile in many small steps, so a short search limit
      // gives up on routes that are perfectly walkable.
      const character = new globalThis.Game_Character();
      character.initMembers();

      // Act
      const limit = character.searchLimit();

      // Assert
      expect(limit)
        .toBe(40);
    });
  });
  //endregion searchLimit

  //region findDirectionTo
  describe('findDirectionTo', () =>
  {
    /**
     * Installs a map drawn as rows of text, where `#` is a wall, with the engine's own geometry.
     * @param {string[]} rows The grid, with x along a row and y down the list.
     * @returns {function(number, number, number): boolean} Whether a step from a tile may be taken.
     */
    const aMap = rows =>
    {
      globalThis.$gameMap = {
        width: () => rows[0].length,
        distance: (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1),
        roundXWithDirection: (x, direction) => x + (direction === 6 ? 1 : 0) - (direction === 4 ? 1 : 0),
        roundYWithDirection: (y, direction) => y + (direction === 2 ? 1 : 0) - (direction === 8 ? 1 : 0),
        deltaX: (x1, x2) => x1 - x2,
        deltaY: (y1, y2) => y1 - y2,
        // the lookup's own behavior is tested beside it; here the search simply runs inside it.
        searchWithEventIndex: vi.fn(search => search()),
      };

      return (x, y, direction) =>
      {
        const x2 = $gameMap.roundXWithDirection(x, direction);
        const y2 = $gameMap.roundYWithDirection(y, direction);
        return y2 >= 0 && y2 < rows.length && x2 >= 0 && x2 < rows[0].length && rows[y2][x2] !== '#';
      };
    };

    /**
     * Builds a character standing at a point on the current map, passing wherever the map allows.
     * @param {number} x The character's x coordinate.
     * @param {number} y The character's y coordinate.
     * @param {function(number, number, number): boolean} canPass Whether a step from a tile may be taken.
     * @returns {Game_Character}
     */
    const aCharacterAt = (x, y, canPass) =>
    {
      const character = Object.create(globalThis.Game_Character.prototype);
      character.x = x;
      character.y = y;
      character.canPass = canPass;
      character.deltaXFrom = goalX => $gameMap.deltaX(character.x, goalX);
      character.deltaYFrom = goalY => $gameMap.deltaY(character.y, goalY);

      return character;
    };

    it('has nowhere to go when standing exactly on the goal', () =>
    {
      // Arrange
      const canPass = aMap([ '...' ]);
      const character = aCharacterAt(1, 0, canPass);

      // Act
      const direction = character.findDirectionTo(1, 0);

      // Assert
      expect(direction)
        .toBe(0);
    });

    it.each([
      // each way round is the only one, and heading straight for the goal would say otherwise.
      [ 'down', [ '.#.', '...' ], [ 0, 0 ], [ 2, 0 ], 2 ],
      [ 'left', [ '...', '.##', '...' ], [ 1, 0 ], [ 1, 2 ], 4 ],
      [ 'right', [ '...', '##.', '...' ], [ 1, 0 ], [ 1, 2 ], 6 ],
      [ 'up', [ '...', '.#.', '##.' ], [ 0, 1 ], [ 2, 1 ], 8 ],
    ])('steps %s when that is where the way round begins', (_, rows, [ startX, startY ], [ goalX, goalY ], expected) =>
    {
      // Arrange - a wall between the two, so the first step is one only the search knows to take.
      const canPass = aMap(rows);
      const character = aCharacterAt(startX, startY, canPass);

      // Act
      const direction = character.findDirectionTo(goalX, goalY);

      // Assert
      expect(direction)
        .toBe(expected);
    });

    it('searches from the tile a character stands on, not from its fractional coordinates', () =>
    {
      // Arrange - a fifth of a tile off the grid, with the wall forcing a detour along the bottom. A
      // search that started from 0.2 could never arrive, and heading straight for the goal says right.
      const canPass = aMap([ '.#..', '....' ]);
      const character = aCharacterAt(0.2, 0, canPass);

      // Act
      const direction = character.findDirectionTo(2, 0);

      // Assert - down, the way round the wall.
      expect(direction)
        .toBe(2);
    });

    it.each([
      [ 'left, when the goal lies farther off to the left', [ 0.3, 0 ], [ 0.1, 0 ], 4 ],
      [ 'right, when the goal lies farther off to the right', [ 0.1, 0 ], [ 0.3, 0 ], 6 ],
      [ 'up, when the goal lies farther off above', [ 0, 0.3 ], [ 0, 0.1 ], 8 ],
      [ 'down, when the goal lies farther off below', [ 0, 0.1 ], [ 0, 0.3 ], 2 ],
    ])('heads straight %s when no step gets any closer', (_, [ startX, startY ], [ goalX, goalY ], expected) =>
    {
      // Arrange - both ends round onto the same tile, so the grid has nothing to offer.
      const canPass = aMap([ '..', '..' ]);
      const character = aCharacterAt(startX, startY, canPass);

      // Act
      const direction = character.findDirectionTo(goalX, goalY);

      // Assert
      expect(direction)
        .toBe(expected);
    });

    it('runs its search with the map\'s event lookup built', () =>
    {
      // Arrange
      const canPass = aMap([ '...' ]);
      const character = aCharacterAt(0, 0, canPass);

      // Act
      character.findDirectionTo(2, 0);

      // Assert
      expect($gameMap.searchWithEventIndex).toHaveBeenCalledTimes(1);
    });

    it('answers a search that just failed from memory instead of searching again', () =>
    {
      // Arrange - walled off from its goal, so the first search fails, then asked again a frame later.
      const canPass = vi.fn(aMap([ '.#.' ]));
      const character = aCharacterAt(0, 0, canPass);
      Graphics.frameCount = 500;
      const first = character.findDirectionTo(2, 0);
      const asked = canPass.mock.calls.length;
      Graphics.frameCount = 501;

      // Act
      const second = character.findDirectionTo(2, 0);

      // Assert - the same answer, and not one more question about the map.
      expect(second)
        .toBe(first);
      expect(asked)
        .toBeGreaterThan(0);
      expect(canPass.mock.calls)
        .toHaveLength(asked);
    });

    it('has nowhere to go on a looping map where the goal measures no distance away', () =>
    {
      // Arrange - a goal one full loop around the map: a different coordinate, but the same place.
      const canPass = aMap([ '..', '..' ]);
      $gameMap.deltaX = () => 0;
      const character = aCharacterAt(0, 0, canPass);

      // Act
      const direction = character.findDirectionTo(2, 0);

      // Assert
      expect(direction)
        .toBe(0);
    });
  });
  //endregion findDirectionTo

  //region processMoveCommand
  describe('processMoveCommand', () =>
  {
    it('clears the held-input flag, since a route is never player-driven', () =>
    {
      // Arrange: leaving the flag set would make the follower train treat scripted movement
      // as though the player were holding a direction.
      const character = new globalThis.Game_Character();
      character.initMembers();
      character.setMovePressed(true);

      // Act
      character.processMoveCommand({ code: 1 });

      // Assert
      expect(character.isMovePressed())
        .toBe(false);
    });
  });
  //endregion processMoveCommand

  //region updateRoutineMove
  describe('updateRoutineMove', () =>
  {
    it('uses the pixel-repeating cadence for ordinary events', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 }, { code: 2 } ]);

      // Act
      character.updateRoutineMove();

      // Assert: the route stayed on its first command rather than advancing immediately.
      expect(character.moveRouteIndex())
        .toBe(0);
    });

    it('defers to vanilla cadence for JABS action entities', () =>
    {
      // Arrange: action entities are not events with authored routes; repeating their commands
      // would stretch a projectile's movement over a whole tile's worth of frames.
      const previousAbs = globalThis.J.ABS;
      globalThis.J.ABS = {};
      const character = makeRoutedCharacter([ { code: 1 }, { code: 2 } ]);
      character.isJabsAction = () => true;

      // Act
      character.updateRoutineMove();

      // Assert: vanilla advances the route on the very first frame.
      expect(character.moveRouteIndex())
        .toBe(1);

      // restore the bare-global namespace rather than leaking it into later tests in this file.
      globalThis.J.ABS = previousAbs;
    });
  });
  //endregion updateRoutineMove

  //region handlePixelRoutineMove
  describe('handlePixelRoutineMove', () =>
  {
    it('burns a frame off the wait counter instead of moving', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 } ]);
      character.setWaitCount(3);

      // Act
      character.handlePixelRoutineMove();

      // Assert
      expect(character.waitCount())
        .toBe(2);
    });

    it('processes no command at all while waiting', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 } ]);
      character.setWaitCount(3);

      // Act
      character.handlePixelRoutineMove();

      // Assert
      expect(character.processedCommands.length)
        .toBe(0);
    });

    it('treats commanded movement as always successful', () =>
    {
      // Arrange: a route is an authored instruction, not a collision negotiation.
      const character = makeRoutedCharacter([ { code: 1 } ]);
      character.setMovementSuccess(false);

      // Act
      character.handlePixelRoutineMove();

      // Assert
      expect(character.isMovementSucceeded())
        .toBe(true);
    });

    it('stops cleanly when the route index points past the end of the list', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 } ]);
      character._moveRouteIndex = 5;

      // Act
      character.handlePixelRoutineMove();

      // Assert
      expect(character.processedCommands.length)
        .toBe(0);
    });

    it('begins a repeat cycle upon reaching a movement command', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 } ]);

      // Act
      character.handlePixelRoutineMove();

      // Assert
      expect(character.isRepeatMoveActive())
        .toBe(true);
    });

    it('seeds the repeat counter with a full tile worth of frames', () =>
    {
      // Arrange: at move speed 4 a frame covers 0.0625 tiles, so a tile takes 16 frames.
      const character = makeRoutedCharacter([ { code: 1 } ]);

      // Act
      character.handlePixelRoutineMove();

      // Assert: one frame of the cycle has already been consumed by this call.
      expect(character.getRepeatMoveCount())
        .toBe(15);
    });

    it('holds the route on the same command while the cycle runs', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 }, { code: 2 } ]);

      // Act: two frames into a sixteen-frame cycle.
      character.handlePixelRoutineMove();
      character.handlePixelRoutineMove();

      // Assert
      expect(character.moveRouteIndex())
        .toBe(0);
    });

    it('repeats the same command every frame of the cycle', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 }, { code: 2 } ]);

      // Act
      character.handlePixelRoutineMove();
      character.handlePixelRoutineMove();
      character.handlePixelRoutineMove();

      // Assert: the very same command object was dispatched all three frames.
      expect(character.processedCommands)
        .toEqual([ { code: 1 }, { code: 1 }, { code: 1 } ]);
    });

    it('advances to the next command once the cycle is exhausted', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 }, { code: 2 } ]);

      // Act: run the full sixteen-frame tile.
      for (let frame = 0; frame < 16; frame++)
      {
        character.handlePixelRoutineMove();
      }

      // Assert
      expect(character.moveRouteIndex())
        .toBe(1);
    });

    it('ends the repeat cycle once the counter reaches zero', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 }, { code: 2 } ]);

      // Act
      for (let frame = 0; frame < 16; frame++)
      {
        character.handlePixelRoutineMove();
      }

      // Assert
      expect(character.isRepeatMoveActive())
        .toBe(false);
    });

    it('advances immediately for a command that is not repeatable', () =>
    {
      // Arrange: only the movement codes stretch across a tile; a wait or a script command
      // means exactly what it says and must not be run sixteen times.
      const character = makeRoutedCharacter([ { code: 45 }, { code: 1 } ]);

      // Act
      character.handlePixelRoutineMove();

      // Assert
      expect(character.moveRouteIndex())
        .toBe(1);
    });
  });
  //endregion handlePixelRoutineMove

  //region canStartPixelRepeatMove
  describe('canStartPixelRepeatMove', () =>
  {
    it('declines to start a second cycle while one is already running', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 } ]);
      character.beginRepeatMove();

      // Act
      const canStart = character.canStartPixelRepeatMove({ code: 1 });

      // Assert
      expect(canStart)
        .toBe(false);
    });

    it('declines commands that are not movement commands', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 45 } ]);

      // Act
      const canStart = character.canStartPixelRepeatMove({ code: 45 });

      // Assert
      expect(canStart)
        .toBe(false);
    });

    it('accepts a movement command when no cycle is running', () =>
    {
      // Arrange
      const character = makeRoutedCharacter([ { code: 1 } ]);

      // Act
      const canStart = character.canStartPixelRepeatMove({ code: 1 });

      // Assert
      expect(canStart)
        .toBe(true);
    });
  });
  //endregion canStartPixelRepeatMove
});
//endregion plugins/pixel/core/objects/game-character.test.js