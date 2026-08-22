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
    globalThis.Game_Interpreter.prototype.commonEventId = function() { return this._commonEventId; };
    globalThis.Game_Interpreter.prototype.index = function() { return this._index; };
    ({ Game_Interpreter } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameMap = { event: vi.fn() };
    globalThis.$dataCommonEvents = [];
  });

  function makeEventWithPage(commandList)
  {
    return { page: () => ({ list: commandList }) };
  }

  describe('shouldHideChoiceBranch', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage([ {} ]));
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

      // Assert
      expect(result).toEqual(true);
      expect(globalThis.$gameMap.event).not.toHaveBeenCalled();
    });

    it('does not hide when the subcommand is not a valid event command', () =>
    {
      // Arrange- everything downstream is primed to hide the branch: the text of this command reads
      // as a choice conditional and that conditional is unmet. Only the command not being a parsable
      // comment in the first place can keep the branch visible, which is the point- a line of
      // dialogue that happens to quote the tag is not a condition.
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage([ {} ]));
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
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage([ {} ]));
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
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage([ {} ]));
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
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage([ {} ]));
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional.mockReturnValue(true);
      globalThis.Game_Event.questConditionalMet.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(true);
    });

    it('falls back to the common event command list when there is no map event for this interpreter', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch').mockReturnValue(false);
      interpreter.eventId.mockReturnValue(0);
      interpreter._commonEventId = 5;
      globalThis.$gameMap.event.mockReturnValue(null);
      const commonEvents = [];
      commonEvents[5] = { list: [ {} ] };
      globalThis.$dataCommonEvents = commonEvents;
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

      // Act/Assert (no throw)
      expect(() => interpreter.shouldHideChoiceBranch(0)).not.toThrow();
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/game-interpreter.test.js
