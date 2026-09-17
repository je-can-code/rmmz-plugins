//region plugins/message/_component/game-interpreter.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Interpreter message augments (direct src import)', () =>
{
  let Game_Interpreter;
  let originalSetupChoices;
  let originalCommand101;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalSetupChoices = vi.fn();
    originalCommand101 = vi.fn();

    globalThis.J = { MESSAGE: { Aliased: { Game_Interpreter: new Map() } } };

    function StubGameInterpreter()
    {
    }

    StubGameInterpreter.prototype.setupChoices = originalSetupChoices;
    StubGameInterpreter.prototype.command101 = originalCommand101;
    StubGameInterpreter.prototype.currentCommand = vi.fn();
    StubGameInterpreter.prototype.eventId = vi.fn();

    // the two other handlers a finished message can hand off to.
    StubGameInterpreter.prototype.setupNumInput = vi.fn();
    StubGameInterpreter.prototype.setupItemChoice = vi.fn();

    // J-Base accessors the production code reads through.
    StubGameInterpreter.prototype.list = vi.fn();
    StubGameInterpreter.prototype.index = vi.fn();
    StubGameInterpreter.prototype.setIndex = vi.fn();
    StubGameInterpreter.prototype.nextEventCode = vi.fn();
    globalThis.Game_Interpreter = StubGameInterpreter;

    // the engine surfaces the welding cap is measured against, at the default resolution: a 36 pixel
    // row, a 12 pixel frame on each edge, a 624 pixel screen, and the 176 pixel four-row box the
    // scene builds a message window at - sixteen rows of room in all.
    globalThis.Window_Base = { prototype: { lineHeight: () => 36 } };
    globalThis.$gameSystem = { windowPadding: () => 12 };
    globalThis.Graphics = { boxHeight: 624 };
    globalThis.Scene_Message = { prototype: { messageWindowRect: () => ({ height: 176 }) } };

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

  describe('command101 welding', () =>
  {
    let sharedGameMessage;

    /**
     * The command every event list ends on, and the thing the walks below stop against.
     */
    const terminator = { code: 0, indent: 0, parameters: [] };

    /**
     * A `$gameMessage` that actually remembers whether the message being assembled asked for company.
     *
     * The production `add` is what lifts the code out of a line and raises the flag, and the weld
     * loop turns entirely on that flag changing between one message and the next - so a stub that
     * only recorded its calls would spin forever on the first message that asked for more.
     */
    function stubGameMessage()
    {
      const texts = [];
      let linked = false;

      return {
        texts: () => texts,
        hasMoreLink: () => linked,
        flagMoreLink: vi.fn(value =>
        {
          linked = value;
        }),
        add: vi.fn(line =>
        {
          if (line.includes('\\more') === true) linked = true;

          texts.push(line);
        }),
        backupChoices: vi.fn(),
        hideChoice: vi.fn(),
      };
    }

    /**
     * An interpreter standing on a given command in a given list, with an index that really moves.
     */
    function makeInterpreterAt(commandList, index)
    {
      const interpreter = new Game_Interpreter();
      let at = index;

      interpreter.list = () => commandList;
      interpreter.index = () => at;
      interpreter.setIndex = value =>
      {
        at = value;
      };
      interpreter.currentCommand = () => commandList.at(at);
      interpreter.nextEventCode = () => commandList.at(at + 1).code;

      return interpreter;
    }

    /**
     * The shape the original leaves behind: one Show Text read, standing on its last line, with
     * another Show Text of two lines waiting directly after it.
     */
    function twoMessageList(firstLine)
    {
      return [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ firstLine ] },
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'second.' ] },
        { code: 401, parameters: [ 'third.' ] },
        terminator ];
    }

    beforeEach(() =>
    {
      sharedGameMessage = globalThis.$gameMessage;
      originalCommand101.mockReturnValue(true);
    });

    afterEach(() =>
    {
      globalThis.$gameMessage = sharedGameMessage;
    });

    it('welds the message written after one that asked for more', () =>
    {
      // Arrange- the second message holds two lines, so a weld that read only the first would show.
      const interpreter = makeInterpreterAt(twoMessageList('first.\\more'), 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');

      // Act
      const started = interpreter.command101([]);

      // Assert
      expect(started).toBe(true);
      expect(globalThis.$gameMessage.texts()).toEqual([ 'first.\\more', 'second.', 'third.' ]);
      expect(interpreter.index()).toBe(4);
    });

    it('keeps welding for as long as each message in turn asks for more', () =>
    {
      // Arrange- three messages, the middle one asking for company of its own. A weld that read the
      // first message's answer twice instead of each message's own would stop after the second.
      const commands = [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'a.\\more' ] },
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'b.\\more' ] },
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'c.' ] },
        terminator ];

      const interpreter = makeInterpreterAt(commands, 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('a.\\more');

      // Act
      interpreter.command101([]);

      // Assert
      expect(globalThis.$gameMessage.texts()).toEqual([ 'a.\\more', 'b.\\more', 'c.' ]);
    });

    it('welds nothing when the original declined to start the message', () =>
    {
      // Arrange- everything else is armed to weld: the message asked for more, a Show Text is
      // waiting, and it has room. The original refusing is the only thing that can stop it, and it
      // leaves the command index where it found it so the interpreter can try again next frame.
      const interpreter = makeInterpreterAt(twoMessageList('first.\\more'), 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');
      originalCommand101.mockReturnValue(false);

      // Act
      const started = interpreter.command101([]);

      // Assert
      expect(started).toBe(false);
      expect(globalThis.$gameMessage.texts()).toEqual([ 'first.\\more' ]);
      expect(interpreter.index()).toBe(1);
    });

    it('welds nothing when the message never asked for more', () =>
    {
      // Arrange- a Show Text is waiting with room to spare, so the missing code is the only reason.
      const interpreter = makeInterpreterAt(twoMessageList('first.'), 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.');

      // Act
      interpreter.command101([]);

      // Assert
      expect(globalThis.$gameMessage.texts()).toEqual([ 'first.' ]);
      expect(interpreter.index()).toBe(1);
    });

    it('welds nothing when the command after the message is not another Show Text', () =>
    {
      // Arrange- the message asked for more, and what follows is a "Show Choices" instead.
      const commands = [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'first.\\more' ] },
        { code: 102, parameters: [ 'choices' ] },
        terminator ];

      const interpreter = makeInterpreterAt(commands, 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');

      const choicesSpy = vi.spyOn(Game_Interpreter.prototype, 'setupChoices')
        .mockImplementation(() => {});

      // Act
      interpreter.command101([]);

      // Assert- nothing welded, and the choices are left for the original's own dispatch rather than
      // being set up a second time on top of it.
      expect(globalThis.$gameMessage.texts()).toEqual([ 'first.\\more' ]);
      expect(interpreter.index()).toBe(1);
      expect(choicesSpy).not.toHaveBeenCalled();

      choicesSpy.mockRestore();
    });

    it('welds nothing when the next message would outgrow the screen', () =>
    {
      // Arrange- fifteen rows already assembled and a two-line message waiting, which is seventeen
      // rows against the sixteen a 624 pixel screen holds.
      const interpreter = makeInterpreterAt(twoMessageList('nearly full.\\more'), 1);
      globalThis.$gameMessage = stubGameMessage();

      const filler = Array.from({ length: 14 }, (unused, index) => `line ${index}.`);
      filler.forEach(line => globalThis.$gameMessage.add(line));
      globalThis.$gameMessage.add('nearly full.\\more');

      // Act
      interpreter.command101([]);

      // Assert- the chain stops before the message that would overflow rather than half-welding it.
      expect(globalThis.$gameMessage.texts()).toHaveLength(15);
      expect(globalThis.$gameMessage.texts()
        .at(14)).toBe('nearly full.\\more');
      expect(interpreter.index()).toBe(1);
    });

    it('welds a Show Text holding no lines at all', () =>
    {
      // Arrange- an empty Show Text contributes nothing, but still has to be stepped over.
      const commands = [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'first.\\more' ] },
        { code: 101, parameters: [] },
        terminator ];

      const interpreter = makeInterpreterAt(commands, 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');

      // Act
      interpreter.command101([]);

      // Assert
      expect(globalThis.$gameMessage.texts()).toEqual([ 'first.\\more' ]);
      expect(interpreter.index()).toBe(2);
    });

    it('hands the welded message off to a "Show Choices" written after it', () =>
    {
      // Arrange- the original dispatched against the Show Text this message has since swallowed,
      // where it matched nothing at all.
      const choices = [ [ 'yes', 'no' ], 0 ];
      const commands = [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'first.\\more' ] },
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'second.' ] },
        { code: 102, parameters: choices },
        terminator ];

      const interpreter = makeInterpreterAt(commands, 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');

      const choicesSpy = vi.spyOn(Game_Interpreter.prototype, 'setupChoices')
        .mockImplementation(() => {});

      // Act
      interpreter.command101([]);

      // Assert
      expect(choicesSpy).toHaveBeenCalledWith(choices);
      expect(interpreter.index()).toBe(4);

      choicesSpy.mockRestore();
    });

    it('hands the welded message off to an "Input Number" written after it', () =>
    {
      // Arrange
      const numberInput = [ 1, 4 ];
      const commands = [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'first.\\more' ] },
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'second.' ] },
        { code: 103, parameters: numberInput },
        terminator ];

      const interpreter = makeInterpreterAt(commands, 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');

      // Act
      interpreter.command101([]);

      // Assert
      expect(Game_Interpreter.prototype.setupNumInput).toHaveBeenCalledWith(numberInput);
      expect(interpreter.index()).toBe(4);
    });

    it('hands the welded message off to a "Select Item" written after it', () =>
    {
      // Arrange
      const itemChoice = [ 2, 1 ];
      const commands = [
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'first.\\more' ] },
        { code: 101, parameters: [] },
        { code: 401, parameters: [ 'second.' ] },
        { code: 104, parameters: itemChoice },
        terminator ];

      const interpreter = makeInterpreterAt(commands, 1);
      globalThis.$gameMessage = stubGameMessage();
      globalThis.$gameMessage.add('first.\\more');

      // Act
      interpreter.command101([]);

      // Assert
      expect(Game_Interpreter.prototype.setupItemChoice).toHaveBeenCalledWith(itemChoice);
      expect(interpreter.index()).toBe(4);
    });
  });

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
