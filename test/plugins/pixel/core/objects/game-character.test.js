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