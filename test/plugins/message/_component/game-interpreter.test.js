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

    // a J-Base accessor the production code reads through.
    StubGameInterpreter.prototype.list = vi.fn();
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

  /**
   * The commands belonging to the map event that spawned the interpreter, which are never the
   * commands a child interpreter is actually executing- a `Show Choices` inside a called common
   * event runs on a child that inherited the caller's event id. Staged as a near-miss on every
   * test below: anything that reaches for the map event's page picks these up instead.
   */
  const spawningEventCommands = [
    { code: 108, indent: 0, parameters: [ '<spawner>' ] },
    { code: 402, indent: 0 },
    { code: 404, indent: 0 } ];

  /**
   * Builds an interpreter executing the given commands on behalf of a map event that holds entirely
   * different ones.
   */
  function makeInterpreterExecuting(commandList)
  {
    const interpreter = new Game_Interpreter();
    interpreter.list.mockReturnValue(commandList);
    interpreter.eventId.mockReturnValue(1);
    globalThis.$gameMap.event.mockReturnValue({ page: () => ({ list: spawningEventCommands }) });

    return interpreter;
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

      const interpreter = makeInterpreterExecuting(commandList);
      interpreter.currentCommand.mockReturnValue(startCommand);

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

    it('walks the executing command list rather than the page of the map event that spawned it', () =>
    {
      // Arrange- this is the common-event-called-from-a-map-event shape. the child interpreter
      // carries the caller's event id, so the map event resolves to something real and wrong; its
      // page holds no copy of the current command, which reduces the whole search window to nothing
      // and silently leaves every choice visible.
      const startCommand = { code: 102, indent: 0 };
      const optionA = { code: 402, indent: 0 };
      const endCommand = { code: 404, indent: 0 };
      const commandList = [ startCommand, optionA, endCommand ];

      const interpreter = makeInterpreterExecuting(commandList);
      interpreter.currentCommand.mockReturnValue(startCommand);

      const hideSpy = vi.spyOn(Game_Interpreter.prototype, 'shouldHideChoiceBranch')
        .mockReturnValue(false);

      // Act
      interpreter.hideSpecificChoiceBranches([]);

      // Assert- the executing list was walked, producing the single option's group plus the
      // terminator's always-empty one. reading the spawning event's page instead yields zero.
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(1, 0, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenNthCalledWith(2, 1, false);
      expect(globalThis.$gameMessage.hideChoice).toHaveBeenCalledTimes(2);

      hideSpy.mockRestore();
    });
  });

  describe('shouldHideChoiceBranch', () =>
  {
    it('does not hide when the subcommand is not a valid event command', () =>
    {
      // Arrange- every later gate is armed to answer "hide it", so the only thing that can produce
      // a visible branch here is this validity check refusing to look any further. Left unarmed,
      // the conditional filter below would independently answer false and this test would pass
      // whether or not the validity check ran at all.
      const interpreter = makeInterpreterExecuting([ { code: 108, indent: 1 } ]);
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
      const interpreter = makeInterpreterExecuting([ { code: 108, indent: 1 } ]);
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
      const interpreter = makeInterpreterExecuting([ { code: 108, indent: 1 } ]);
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
      const interpreter = makeInterpreterExecuting([ { code: 108, indent: 1 } ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(true);
      globalThis.Game_Event.filterCommentCommandsForBasicConditionals.mockReturnValue(true);
      globalThis.Game_Event.toBasicConditional.mockReturnValue({ isMet: () => false });

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(result).toEqual(true);
    });

    it('resolves the subcommand against the executing list, not the spawning map event page', () =>
    {
      // Arrange- index 0 holds a different command in each list, so which one reaches the validity
      // filter is the only thing that distinguishes the two sources.
      const subCommand = { code: 108, indent: 1, parameters: [ '<executing>' ] };
      const interpreter = makeInterpreterExecuting([ subCommand ]);
      globalThis.Game_Event.filterInvalidEventCommand.mockReturnValue(false);

      // Act
      const result = interpreter.shouldHideChoiceBranch(0);

      // Assert
      expect(globalThis.Game_Event.filterInvalidEventCommand).toHaveBeenCalledWith(subCommand);
      expect(globalThis.Game_Event.filterInvalidEventCommand)
        .not
        .toHaveBeenCalledWith(spawningEventCommands.at(0));
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
