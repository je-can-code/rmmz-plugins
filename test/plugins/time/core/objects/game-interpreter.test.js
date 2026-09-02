//region plugins/time/core/objects/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from '../../_component/fixtures/install-time-host-globals.js';

/**
 * The tag-matching outcomes- an hour or day or season choice being shown or hidden- are covered by
 * the component test that drives real comment tags through the whole chain. What is covered here is
 * the plumbing around that decision: the early exits, and the fact that the commands surrounding a
 * choice are read off the list being executed rather than the page of the event that spawned it.
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
   * The commands on the page of whichever map event spawned this interpreter. A choice inside a
   * called common event runs on a child interpreter that inherited the caller's event id, so the
   * map event behind it resolves to something real and entirely unrelated. Staged as a near-miss
   * throughout: it carries a tag that would flip every outcome below if it were ever consulted.
   */
  const spawningEventCommands = [
    {
      code: 108,
      indent: 0,
      parameters: [ '<hourChoice:23>' ],
    } ];

  /**
   * Builds an interpreter executing the given commands on behalf of a map event whose own page
   * holds something else entirely.
   */
  const interpreterExecuting = commands =>
  {
    globalThis.$gameMap = {
      event: () => ({
        page: () => ({ list: spawningEventCommands }),
      }),
    };

    const interpreter = new globalThis.Game_Interpreter();
    interpreter.eventId = () => 1;
    interpreter.list = () => commands;

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
      const interpreter = interpreterExecuting([ comment('<hourChoice:9>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      // the time conditional is never consulted; an earlier reason to hide wins immediately.
      expect(result).toBe(true);
    });

    it('shows the branch when the command carries no comment to interpret', () =>
    {
      // Arrange
      const interpreter = interpreterExecuting([
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
      const interpreter = interpreterExecuting([ comment('<someUnrelatedTag:12>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(false);
    });

    it('shows the branch when the tag is a page conditional rather than a choice conditional', () =>
    {
      // Arrange
      // a near miss for the choice filter: this is a real TIME tag, and one the conditional switch
      // would happily parse, but page tags govern which event page runs rather than which choice is
      // offered. the tagged hour deliberately disagrees with the clock, so anything that did treat
      // it as a choice conditional would hide this branch instead of showing it.
      globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
      const interpreter = interpreterExecuting([ comment('<hourPage:17>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(false);
    });

    it('shows the branch when the tag-shaped text belongs to a command that is not a comment', () =>
    {
      // Arrange
      // the shared fixture's command filter only asks whether there is a payload at all; the shipped
      // J-Base filter also rejects any command whose code is not one of the comment codes, and that
      // rejection is what is under test here. the payload itself is a genuine, currently-unmet choice
      // conditional, so the command's code is the only thing keeping this branch visible.
      const previousFilter = globalThis.Game_Event.filterInvalidEventCommand;
      globalThis.Game_Event.filterInvalidEventCommand = command => command.code === 108;

      globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
      const interpreter = interpreterExecuting([
        {
          // 401 is a line of message text, not a comment.
          code: 401,
          indent: 0,
          parameters: [ '<hourChoice:17>' ],
        },
      ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);
      globalThis.Game_Event.filterInvalidEventCommand = previousFilter;

      // Assert
      expect(result).toBe(false);
    });

    it('reads the executing command list rather than the spawning map event page', () =>
    {
      // Arrange
      // the common-event-called-from-a-map-event shape. both lists carry a real hour choice tag, so
      // the source is the only thing deciding the verdict: the executing list agrees with the clock,
      // while the spawning event's page disagrees with it.
      globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
      const interpreter = interpreterExecuting([ comment('<hourChoice:9>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(false);
    });

    it('hides a branch in a called common event whose tagged hour does not match', () =>
    {
      // Arrange
      globalThis.$gameTime.setTime(0, 0, 9, 1, 1, 2020);
      const interpreter = interpreterExecuting([ comment('<hourChoice:17>') ]);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/time/core/objects/game-interpreter.test.js
