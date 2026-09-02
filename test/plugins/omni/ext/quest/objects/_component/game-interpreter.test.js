//region plugins/omni/ext/quest/objects/_component/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Interpreter ext/quest augments (direct src import)', () =>
{
  let Game_Interpreter;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { OMNI: { EXT: { QUEST: { Aliased: { Game_Interpreter: new Map() } } } } };

    function StubGameInterpreter()
    {
    }

    StubGameInterpreter.prototype.shouldHideChoiceBranch = vi.fn();
    StubGameInterpreter.prototype.eventId = vi.fn();
    globalThis.Game_Interpreter = StubGameInterpreter;

    globalThis.Game_Event = {
      filterInvalidEventCommand: vi.fn(),
      filterCommentCommandsByChoiceQuestConditional: vi.fn(),
      toQuestConditional: vi.fn(),
      questConditionalMet: vi.fn(),
    };

    await import('../../../../../../../src/plugins/omni/ext/quest/objects/Game_Interpreter.js');

    // J-Base accessors the production code now reads through.
    globalThis.Game_Interpreter.prototype.list = function() { return this._list; };
    globalThis.Game_Interpreter.prototype.index = function() { return this._index; };
    ({ Game_Interpreter } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameMap = { event: vi.fn() };
    globalThis.$dataCommonEvents = [];
  });

  /**
   * The commands on the page of whichever map event spawned this interpreter. A choice inside a
   * called common event runs on a child interpreter that inherited the caller's event id, so the
   * map event behind it resolves to something real and entirely unrelated. Staged as a near-miss
   * throughout: reaching for it instead of the executing list yields a different command.
   */
  const spawningEventCommands = [ { code: 108, parameters: [ '<spawner>' ] } ];

  /**
   * The command sitting at the evaluated index of the list actually being executed.
   */
  const executingCommand = { code: 108, parameters: [ '<executing>' ] };

  /**
   * Builds an interpreter executing the given commands on behalf of a map event whose own page
   * holds something else entirely.
   */
  function makeInterpreterExecuting(commandList)
  {
    const interpreter = new Game_Interpreter();
    interpreter._list = commandList;
    interpreter.eventId.mockReturnValue(1);
    globalThis.$gameMap.event.mockReturnValue({ page: () => ({ list: spawningEventCommands }) });

    return interpreter;
  }

  describe('shouldHideChoiceBranch', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const interpreter = makeInterpreterExecuting([ executingCommand ]);
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

      // Act
      interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch')).toHaveBeenCalledWith(0);
    });

    it('short-circuits to hidden when the default logic already hides the branch', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(true);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert- nothing downstream is staged, so the short-circuit is the only thing that can have
      // produced a verdict here; the untouched validity filter is what proves it never looked.
      expect(result).toEqual(true);
      expect(globalThis.Game_Event.filterInvalidEventCommand).not.toHaveBeenCalled();
    });

    it('does not hide when the subcommand is not a valid event command', () =>
    {
      // Arrange- everything downstream is primed to hide the branch: the text of this command reads
      // as a choice conditional and that conditional is unmet. Only the command not being a parsable
      // comment in the first place can keep the branch visible, which is the point- a line of
      // dialogue that happens to quote the tag is not a condition.
      const interpreter = makeInterpreterExecuting([ executingCommand ]);
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);
      globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional.mockReturnValue(true);
      globalThis.Game_Event.questConditionalMet.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(false);
      expect(globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional).not.toHaveBeenCalled();
    });

    it('does not hide when the subcommand is not a choice quest conditional', () =>
    {
      // Arrange
      const interpreter = makeInterpreterExecuting([ executingCommand ]);
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(false);
    });

    it('does not hide when the parsed quest conditional is met', () =>
    {
      // Arrange
      const interpreter = makeInterpreterExecuting([ executingCommand ]);
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional.mockReturnValue(true);
      globalThis.Game_Event.questConditionalMet.mockReturnValue(true);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(false);
    });

    it('hides the branch when the parsed quest conditional is not met', () =>
    {
      // Arrange
      const interpreter = makeInterpreterExecuting([ executingCommand ]);
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional.mockReturnValue(true);
      globalThis.Game_Event.questConditionalMet.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(true);
    });

    it('resolves the subcommand against the executing list, not the spawning map event page', () =>
    {
      // Arrange- the common-event-called-from-a-map-event shape. each list holds a different command
      // at the evaluated index, so which one reaches the validity filter is the only thing that
      // distinguishes the two sources.
      const interpreter = makeInterpreterExecuting([ executingCommand ]);
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(globalThis.Game_Event.filterInvalidEventCommand).toHaveBeenCalledWith(executingCommand);
      expect(globalThis.Game_Event.filterInvalidEventCommand)
        .not
        .toHaveBeenCalledWith(spawningEventCommands.at(0));
      expect(result).toEqual(false);
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/game-interpreter.test.js
