//region plugins/time/core/objects/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from '../../_component/fixtures/install-time-host-globals.js';

/**
 * The tag-matching outcomes- an hour or day or season choice being shown or hidden- are covered by
 * the component test that drives real comment tags through the whole chain. What is covered here is
 * the plumbing around that decision: the early exits, and where the command list is sourced from
 * when the choice belongs to a common event rather than a map event.
 */
describe('Game_Interpreter ext/time augments (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../../../src/plugins/time/core/_models/Game_Time.js'));

    await import('../../../../../src/plugins/time/core/objects/Game_Event.js');
    await import('../../../../../src/plugins/time/core/objects/Game_Interpreter.js');

    globalThis.$gameTime = new Game_Time();
  });

  beforeEach(() =>
  {
    // by default nothing else wants the branch hidden, so time gets to decide on its own.
    globalThis.J.TIME.Aliased.Game_Interpreter.set('shouldHideChoiceBranch', () => false);
  });

  /**
   * Builds an interpreter positioned on a map event whose active page holds the given commands.
   */
  const interpreterOnEvent = commands =>
  {
    globalThis.$gameMap = {
      event: () => ({
        page: () => ({ list: commands }),
      }),
    };

    const interpreter = new globalThis.Game_Interpreter();
    interpreter.eventId = () => 1;

    return interpreter;
  };

  /**
   * Builds an interpreter running a common event, which has no map event behind it.
   */
  const interpreterOnCommonEvent = commands =>
  {
    globalThis.$gameMap = { event: () => null };
    globalThis.$dataCommonEvents = [ null, { list: commands } ];

    const interpreter = new globalThis.Game_Interpreter();
    interpreter.eventId = () => 0;
    interpreter.commonEventId = () => 1;

    return interpreter;
  };

  /**
   * Wraps a comment string in the event command shape RMMZ produces for it.
   */
  const comment = text => ({
    code: 108,
    indent: 0,
    parameters: [ text ],
  });

  describe('shouldHideChoiceBranch', () =>
  {
    it('hides the branch outright when something else already wanted it hidden', () =>
    {
      // Arrange
      globalThis.J.TIME.Aliased.Game_Interpreter.set('shouldHideChoiceBranch', () => true);
      const interpreter = interpreterOnEvent([ comment('<hourChoice:9>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      // the time conditional is never consulted; an earlier reason to hide wins immediately.
      expect(result).toBe(true);
    });

    it('shows the branch when the command carries no comment to interpret', () =>
    {
      // Arrange
      const interpreter = interpreterOnEvent([
        {
          code: 108,
          indent: 0,
          parameters: [ '' ],
        },
      ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(false);
    });

    it('shows the branch when the comment is not a time conditional tag', () =>
    {
      // Arrange
      const interpreter = interpreterOnEvent([ comment('<someUnrelatedTag:12>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(false);
    });

    it('reads the command list off the common event when there is no map event', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
      const interpreter = interpreterOnCommonEvent([ comment('<hourChoice:9>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      // the tagged hour matches the clock, so the branch stays visible- which it could only work out
      // by having found the command list on the common event.
      expect(result).toBe(false);
    });

    it('hides a common event branch whose tagged hour does not match', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
      const interpreter = interpreterOnCommonEvent([ comment('<hourChoice:17>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/time/core/objects/game-interpreter.test.js
