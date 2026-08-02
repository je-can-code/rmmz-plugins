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
      // commands before/after the block exercise both sides of the in-range window check.
      const beforeCommand = { code: 108, indent: 0 };
      const startCommand = { code: 102, indent: 0 };
      const optionA = { code: 402, indent: 0 };
      const subA = { code: 108, indent: 1 };
      const optionB = { code: 402, indent: 0 };
      const subB = { code: 108, indent: 1 };
      const endCommand = { code: 404, indent: 0 };
      const afterCommand = { code: 108, indent: 0 };
      const commandList = [ beforeCommand, startCommand, optionA, subA, optionB, subB, endCommand, afterCommand ];

      const interpreter = new Game_Interpreter();
      interpreter.currentCommand.mockReturnValue(startCommand);
      interpreter.eventId.mockReturnValue(1);
      globalThis.$gameMap.event.mockReturnValue(makeEventWithPage(commandList));

      // optionA's sub-command index (2) reports hidden; optionB's (4) does not.
      const hideSpy = vi.spyOn(Game_Interpreter.prototype, 'shouldHideChoiceBranch')
        .mockImplementation(index => index === 2);

      // Act
      interpreter.hideSpecificChoiceBranches([]);

      // Assert
      // three groups get evaluated: optionA's (hidden), optionB's (visible), and the trailing
      // end-marker's own group, which is always empty and therefore never hidden.
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(1, 0, true);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(2, 1, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(3, 2, false);

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

      // Act/Assert (no throw)
      expect(() => interpreter.hideSpecificChoiceBranches([])).not.toThrow();

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
      // Arrange
      const interpreter = makeInterpreter([ { code: 108, indent: 1 } ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

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
      const interpreter = new Game_Interpreter();
      interpreter.eventId.mockReturnValue(0);
      interpreter._commonEventId = 5;
      globalThis.$gameMap.event.mockReturnValue(null);
      const commonEvents = [];
      commonEvents[5] = { list: [ { code: 108, indent: 1 } ] };
      globalThis.$dataCommonEvents = commonEvents;
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

      // Act/Assert (no throw)
      expect(() => interpreter.shouldHideChoiceBranch(0)).not.toThrow();
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
