//region plugins/message/_component/game-interpreter.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Interpreter message augments (direct src import)', () =>
{
  let Game_Interpreter;
  let originalSetupChoices;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalSetupChoices = vi.fn();

    globalThis.J = { MESSAGE: { Aliased: { Game_Interpreter: new Map() } } };

    function StubGameInterpreter()
    {
    }

    StubGameInterpreter.prototype.setupChoices = originalSetupChoices;
    StubGameInterpreter.prototype.currentCommand = vi.fn();
    StubGameInterpreter.prototype.eventId = vi.fn();
    globalThis.Game_Interpreter = StubGameInterpreter;

    globalThis.Game_Event = {
      filterInvalidEventCommand: vi.fn(),
      filterCommentCommandsForBasicConditionals: vi.fn(),
      toBasicConditional: vi.fn(),
    };

    globalThis.$gameMessage = {
      backupChoices: vi.fn(),
      hideChoice: vi.fn(),
    };

    await import('../../../../src/plugins/message/core/objects/Game_Interpreter.js');
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

  describe('setupChoices', () =>
  {
    it('calls through to the original aliased setup, backs up choices, and evaluates visibility', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();
      const evaluateSpy = vi.spyOn(Game_Interpreter.prototype, 'evaluateChoicesForVisibility')
        .mockImplementation(() => {});
      const params = [ 'p1', 'p2' ];

      // Act
      interpreter.setupChoices(params);

      // Assert
      expect(originalSetupChoices).toHaveBeenCalledWith(params);
      expect(globalThis.$gameMessage.backupChoices).toHaveBeenCalled();
      expect(evaluateSpy).toHaveBeenCalledWith(params);

      evaluateSpy.mockRestore();
    });
  });

  describe('evaluateChoicesForVisibility', () =>
  {
    it('delegates to hideSpecificChoiceBranches', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();
      const hideSpy = vi.spyOn(Game_Interpreter.prototype, 'hideSpecificChoiceBranches')
        .mockImplementation(() => {});
      const params = [ 'p1' ];

      // Act
      interpreter.evaluateChoicesForVisibility(params);

      // Assert
      expect(hideSpy).toHaveBeenCalledWith(params);

      hideSpy.mockRestore();
    });
  });

  describe('hideSpecificChoiceBranches', () =>
  {
    it('groups sub-commands under each choice option and hides only the groups containing a hidden sub-command', () =>
    {
      // Arrange
      // a realistic "Show Choices" command block: start(102) -> optionA(402) -> subA(108) ->
      // optionB(402) -> subB(108) -> end(404), all at indent 0 except the sub-commands at indent 1.
      //
      // every other entry is a near-miss that has to survive selection. an event page routinely
      // holds more than one choice block, and each of the four window checks (start, end, the
      // in-range test, the indent test) is the only thing separating this block's options from an
      // identically-coded option belonging to a neighbouring or nested block. with a page holding
      // exactly one block, every one of those checks could be replaced by "yes" unnoticed.
      const previousOption = { code: 402, indent: 0 };
      const previousEnd = { code: 404, indent: 0 };
      const beforeCommand = { code: 108, indent: 0 };
      const startCommand = { code: 102, indent: 0 };
      const optionA = { code: 402, indent: 0 };
      const subA = { code: 108, indent: 1 };
      const nestedEnd = { code: 404, indent: 1 };
      const optionB = { code: 402, indent: 0 };
      const subB = { code: 108, indent: 1 };
      const endCommand = { code: 404, indent: 0 };
      const afterCommand = { code: 108, indent: 0 };
      const nextOption = { code: 402, indent: 0 };
      const commandList = [
        previousOption, previousEnd, beforeCommand, startCommand, optionA, subA, nestedEnd, optionB, subB,
        endCommand, afterCommand, nextOption ];

      const interpreter = new Game_Interpreter();
      interpreter.currentCommand.mockReturnValue(startCommand);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage(commandList));

      // optionA's sub-command index (5) reports hidden; optionB's (8) does not.
      const hideSpy = vi.spyOn(Game_Interpreter.prototype, 'shouldHideChoiceBranch')
        .mockImplementation(index => index === 5);

      // Act
      interpreter.hideSpecificChoiceBranches([]);

      // Assert
      // three groups get evaluated: optionA's (hidden), optionB's (visible), and the trailing
      // end-marker's own group, which is always empty and therefore never hidden. the call count is
      // load-bearing- a window check that let a neighbouring block's option through would still
      // produce these three calls first, and only show up as a fourth.
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(1, 0, true);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(2, 1, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(3, 2, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenCalledTimes(3);

      hideSpy.mockRestore();
    });

    it('falls back to the common event command list when there is no map event for this interpreter', () =>
    {
      // Arrange
      const startCommand = { code: 102, indent: 0 };
      const optionA = { code: 402, indent: 0 };
      const endCommand = { code: 404, indent: 0 };
      const commandList = [ startCommand, optionA, endCommand ];

      const interpreter = new Game_Interpreter();
      interpreter.currentCommand.mockReturnValue(startCommand);
      interpreter.eventId.mockReturnValue(0);
      interpreter._commonEventId = 5;
      globalThis.$gameMap.event.mockReturnValue(null);
      const commonEvents = [];
      commonEvents[5] = { list: commandList };
      globalThis.$dataCommonEvents = commonEvents;

      const hideSpy = vi.spyOn(Game_Interpreter.prototype, 'shouldHideChoiceBranch')
        .mockReturnValue(false);

      // Act
      interpreter.hideSpecificChoiceBranches([]);

      // Assert- the common event's own list was walked, producing the single option's group plus
      // the terminator's always-empty one.
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(1, 0, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(2, 1, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenCalledTimes(2);

      hideSpy.mockRestore();
    });
  });

  describe('shouldHideChoiceBranch', () =>
  {
    function makeInterpreter(commandList)
    {
      const interpreter = new Game_Interpreter();
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage(commandList));
      return interpreter;
    }

    it('does not hide when the subcommand is not a valid event command', () =>
    {
      // Arrange- every later gate is armed to answer "hide it", so the only thing that can produce
      // a visible branch here is this validity check refusing to look any further. Left unarmed,
      // the conditional filter below would independently answer false and this test would pass
      // whether or not the validity check ran at all.
      const interpreter = makeInterpreter([ { code: 108, indent: 1 } ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);
      globalThis.Game_Event.filterCommentCommandsForBasicConditionals.mockReturnValue(true);
      globalThis.Game_Event.toBasicConditional.mockReturnValue({ isMet: () => false });

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(false);
    });

    it('does not hide when the subcommand is not a basic conditional comment', () =>
    {
      // Arrange
      const interpreter = makeInterpreter([ { code: 108, indent: 1 } ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsForBasicConditionals.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(false);
    });

    it('does not hide when the parsed conditional is met', () =>
    {
      // Arrange
      const interpreter = makeInterpreter([ { code: 108, indent: 1 } ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsForBasicConditionals.mockReturnValue(true);
      globalThis.Game_Event.toBasicConditional.mockReturnValue({ isMet: () => true });

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(false);
    });

    it('hides when the parsed conditional is not met', () =>
    {
      // Arrange
      const interpreter = makeInterpreter([ { code: 108, indent: 1 } ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsForBasicConditionals.mockReturnValue(true);
      globalThis.Game_Event.toBasicConditional.mockReturnValue({ isMet: () => false });

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(true);
    });

    it('falls back to the common event command list when there is no map event for this interpreter', () =>
    {
      // Arrange
      const subCommand = { code: 108, indent: 1 };
      const interpreter = new Game_Interpreter();
      interpreter.eventId.mockReturnValue(0);
      interpreter._commonEventId = 5;
      globalThis.$gameMap.event.mockReturnValue(null);
      const commonEvents = [];
      commonEvents[5] = { list: [ subCommand ] };
      globalThis.$dataCommonEvents = commonEvents;
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert- the command handed to the validity filter is the one that came out of the common
      // event's own list, which is the only evidence the fallback was taken at all.
      expect(globalThis.Game_Event.filterInvalidEventCommand).toHaveBeenCalledWith(subCommand);
      expect(result).toBe(false);
    });
  });

  describe('setChoiceHidden', () =>
  {
    it('hides the given choice index by default', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();

      // Act
      interpreter.setChoiceHidden(2);

      // Assert
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenCalledWith(2, true);
    });

    it('passes through an explicit shouldHide value', () =>
    {
      // Arrange
      const interpreter = new Game_Interpreter();

      // Act
      interpreter.setChoiceHidden(3, false);

      // Assert
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenCalledWith(3, false);
    });
  });
});
//endregion plugins/message/_component/game-interpreter.test.js
