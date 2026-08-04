//region plugins/_base/ext/save/objects/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The files scene, replaced before the module under test can pull it in.
 *
 * This is the one file in the save ship that has to be mocked rather than stubbed: it imports the
 * scene at module scope, and the scene drags the entire view layer - PIXI, `Window_Base`, the filters
 * that compile shaders - in behind it. The command being tested is two lines and none of them care
 * what a scene looks like, so the whole of it is this one call.
 */
const callFromSavePoint = vi.fn();

vi.mock('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Files.js', () => ({
  default: {
    callFromSavePoint: () => callFromSavePoint(),
  },
}));

describe('Game_Interpreter save-point command (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // the augment binds to whichever engine global is standing there at import time.
    globalThis.Game_Interpreter = function Game_Interpreter()
    {
    };
    globalThis.Game_Interpreter.prototype = {};

    await import('../../../../../../src/plugins/_base/ext/save/objects/Game_Interpreter.js');
  });

  beforeEach(() =>
  {
    callFromSavePoint.mockClear();
  });

  describe('command352()', () =>
  {
    it('opens the files scene instead of vanilla save screen', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();

      // Act
      interpreter.command352();

      // Assert
      expect(callFromSavePoint).toHaveBeenCalledTimes(1);
    });

    it('reports the command handled, so the event page continues past it', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();

      // Act
      const handled = interpreter.command352();

      // Assert
      expect(handled).toBe(true);
    });
  });
});
//endregion plugins/_base/ext/save/objects/game-interpreter.test.js