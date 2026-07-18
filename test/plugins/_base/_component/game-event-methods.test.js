//region plugins/_base/_component/game-event-methods.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J-Base Game_Event methods (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    // real production code- sets up J.BASE.RegExp.ParsableComment and the Array.empty sentinel.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    await import('../../../../src/plugins/_base/objects/Game_Event.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  function buildEvent()
  {
    return Object.create(globalThis.Game_Event.prototype);
  }

  function commentCommand(text, code = 108)
  {
    return { code, parameters: [ text ] };
  }

  describe('canGetValidCommentCommands', () =>
  {
    it('returns false when called with no `this` context', () =>
    {
      // Arrange
      const method = globalThis.Game_Event.prototype.canGetValidCommentCommands;

      // Act & Assert- ES modules are strict mode, so an unbound call leaves `this` undefined.
      expect(method.call(undefined)).toBe(false);
    });

    it('returns false when there is no page', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => null;

      // Act & Assert
      expect(event.canGetValidCommentCommands()).toBe(false);
    });

    it('returns false when the page has no list', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => ({ list: null });

      // Act & Assert
      expect(event.canGetValidCommentCommands()).toBe(false);
    });

    it('returns false when list() is falsy', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => ({ list: [] });
      event.list = () => null;

      // Act & Assert
      expect(event.canGetValidCommentCommands()).toBe(false);
    });

    it('returns false when list() is empty', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => ({ list: [] });
      event.list = () => [];

      // Act & Assert
      expect(event.canGetValidCommentCommands()).toBe(false);
    });

    it('returns true when a page and a non-empty list are both present', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => ({ list: [ commentCommand('<tag>') ] });
      event.list = () => [ commentCommand('<tag>') ];

      // Act & Assert
      expect(event.canGetValidCommentCommands()).toBe(true);
    });
  });

  describe('getValidCommentCommands', () =>
  {
    it('returns Array.empty when canGetValidCommentCommands is false', () =>
    {
      // Arrange
      const event = buildEvent();
      event.canGetValidCommentCommands = () => false;
      event.list = () => { throw new Error('should not be called'); };

      // Act
      const result = event.getValidCommentCommands();

      // Assert
      expect(result).toEqual([]);
    });

    it('filters the command list down to valid parsable comments', () =>
    {
      // Arrange
      const event = buildEvent();
      event.canGetValidCommentCommands = () => true;
      event.list = () => [ commentCommand('<tag>'), commentCommand('not a tag'), { code: 1, parameters: [ '' ] } ];

      // Act
      const result = event.getValidCommentCommands();

      // Assert
      expect(result).toEqual([ commentCommand('<tag>') ]);
    });
  });

  describe('getValidCommentCommandsFromPage (static)', () =>
  {
    it('returns Array.empty when the page has no commands', () =>
    {
      // Arrange
      const page = { list: [] };

      // Act
      const result = globalThis.Game_Event.getValidCommentCommandsFromPage(page);

      // Assert
      expect(result).toEqual([]);
    });

    it('filters the page\'s command list down to valid parsable comments', () =>
    {
      // Arrange
      const page = { list: [ commentCommand('<tag>'), commentCommand('not a tag') ] };

      // Act
      const result = globalThis.Game_Event.getValidCommentCommandsFromPage(page);

      // Assert
      expect(result).toEqual([ commentCommand('<tag>') ]);
    });
  });

  describe('filterInvalidEventCommand (static)', () =>
  {
    it('returns false when the command code is not a comment code', () =>
    {
      // Arrange & Act
      const result = globalThis.Game_Event.filterInvalidEventCommand({ code: 1, parameters: [ '<tag>' ] });

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when the comment matches the parsable comment pattern', () =>
    {
      // Arrange & Act
      const result = globalThis.Game_Event.filterInvalidEventCommand(commentCommand('<tag>'));

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the comment does not match the parsable comment pattern', () =>
    {
      // Arrange & Act
      const result = globalThis.Game_Event.filterInvalidEventCommand(commentCommand('just some prose'));

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('matchesControlCode (static)', () =>
  {
    it('returns true for code 108', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.Game_Event.matchesControlCode(108)).toBe(true);
    });

    it('returns true for code 408', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.Game_Event.matchesControlCode(408)).toBe(true);
    });

    it('returns false for any other code', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.Game_Event.matchesControlCode(1)).toBe(false);
    });
  });

  describe('extractValueByRegex', () =>
  {
    it('returns the default value when no comment matches the structure', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getValidCommentCommands = () => [ commentCommand('<other:5>') ];

      // Act
      const result = event.extractValueByRegex(/<target:(\d+)>/i, 'fallback');

      // Assert
      expect(result).toBe('fallback');
    });

    it('returns the parsed value from the last matching comment when multiple match', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getValidCommentCommands = () => [ commentCommand('<target:5>'), commentCommand('<target:9>') ];

      // Act
      const result = event.extractValueByRegex(/<target:(\d+)>/i);

      // Assert
      expect(result).toBe(9);
    });

    it('returns the raw string without parsing when andParse is false', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getValidCommentCommands = () => [ commentCommand('<target:5>') ];

      // Act
      const result = event.extractValueByRegex(/<target:(\d+)>/i, null, false);

      // Assert
      expect(result).toBe('5');
    });

    it('skips comments whose parameters don\'t match the structure at all', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getValidCommentCommands = () => [ commentCommand('<unrelated>') ];

      // Act
      const result = event.extractValueByRegex(/<target:(\d+)>/i, 'fallback');

      // Assert
      expect(result).toBe('fallback');
    });
  });

  describe('getDataForCommandByRegex', () =>
  {
    it('returns undefined when the comment does not match the structure', () =>
    {
      // Arrange
      const event = buildEvent();
      const command = commentCommand('<other:5>');

      // Act
      const result = event.getDataForCommandByRegex(command, /<target:(\d+)>/i);

      // Assert
      expect(result).toBeUndefined();
    });

    it('returns the parsed value when the comment matches the structure', () =>
    {
      // Arrange
      const event = buildEvent();
      const command = commentCommand('<target:5>');

      // Act
      const result = event.getDataForCommandByRegex(command, /<target:(\d+)>/i);

      // Assert
      expect(result).toBe(5);
    });

    it('returns the raw string without parsing when andParse is false', () =>
    {
      // Arrange
      const event = buildEvent();
      const command = commentCommand('<target:5>');

      // Act
      const result = event.getDataForCommandByRegex(command, /<target:(\d+)>/i, null, false);

      // Assert
      expect(result).toBe('5');
    });

    it('returns the captured value unparsed when it exactly equals the provided default', () =>
    {
      // Arrange- the raw captured string '5' is passed in as the default itself.
      const event = buildEvent();
      const command = commentCommand('<target:5>');

      // Act
      const result = event.getDataForCommandByRegex(command, /<target:(\d+)>/i, '5');

      // Assert
      expect(result).toBe('5');
    });

    it('resets a global regex\'s lastIndex before matching', () =>
    {
      // Arrange
      const event = buildEvent();
      const command = commentCommand('<target:5>');
      const structure = /<target:(\d+)>/gi;
      structure.lastIndex = 99;

      // Act
      const result = event.getDataForCommandByRegex(command, structure);

      // Assert- a stale lastIndex would otherwise make exec() start past the match and miss it.
      expect(result).toBe(5);
    });
  });

  describe('getEventCommandList', () =>
  {
    it('returns an empty array when there is no page', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => null;
      event.list = () => [ commentCommand('<tag>') ];

      // Act
      const result = event.getEventCommandList();

      // Assert
      expect(result).toEqual([]);
    });

    it('returns an empty array when list() is falsy', () =>
    {
      // Arrange
      const event = buildEvent();
      event.page = () => ({});
      event.list = () => null;

      // Act
      const result = event.getEventCommandList();

      // Assert
      expect(result).toEqual([]);
    });

    it('returns the event command list when both a page and list are present', () =>
    {
      // Arrange
      const event = buildEvent();
      const commands = [ commentCommand('<tag>') ];
      event.page = () => ({});
      event.list = () => commands;

      // Act
      const result = event.getEventCommandList();

      // Assert
      expect(result).toEqual(commands);
    });

    it('falls back to an empty array when list() passes the guard but then returns nullish', () =>
    {
      // Arrange- list() is called twice: once in the guard (truthy), once to assign (nullish).
      const event = buildEvent();
      event.page = () => ({});
      let callCount = 0;
      event.list = () => (callCount++ === 0 ? [ commentCommand('<tag>') ] : null);

      // Act
      const result = event.getEventCommandList();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('hasPluginCommand', () =>
  {
    it('returns false when no command has code 357', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getEventCommandList = () => [ { code: 1 } ];

      // Act & Assert
      expect(event.hasPluginCommand('J-QUEST', [ 'startQuest' ])).toBe(false);
    });

    it('returns false when a plugin command has no commandName', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getEventCommandList = () => [ { code: 357, parameters: [ 'J-QUEST', null ] } ];

      // Act & Assert
      expect(event.hasPluginCommand('J-QUEST', [ 'startQuest' ])).toBe(false);
    });

    it('returns false when the plugin name does not match', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getEventCommandList = () => [ { code: 357, parameters: [ 'J-OTHER', 'startQuest' ] } ];

      // Act & Assert
      expect(event.hasPluginCommand('J-QUEST', [ 'startQuest' ])).toBe(false);
    });

    it('returns false when the command name is not in the requested list', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getEventCommandList = () => [ { code: 357, parameters: [ 'J-QUEST', 'endQuest' ] } ];

      // Act & Assert
      expect(event.hasPluginCommand('J-QUEST', [ 'startQuest' ])).toBe(false);
    });

    it('returns true when a matching plugin command and name are both found', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getEventCommandList = () => [
        { code: 1 },
        { code: 357, parameters: [ 'J-QUEST', 'startQuest' ] },
      ];

      // Act & Assert
      expect(event.hasPluginCommand('J-QUEST', [ 'startQuest' ])).toBe(true);
    });

    it('skips a null/falsy entry in the command list without throwing', () =>
    {
      // Arrange
      const event = buildEvent();
      event.getEventCommandList = () => [ null, { code: 357, parameters: [ 'J-QUEST', 'startQuest' ] } ];

      // Act & Assert
      expect(event.hasPluginCommand('J-QUEST', [ 'startQuest' ])).toBe(true);
    });
  });

  describe('isEvent', () =>
  {
    it('returns true', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act & Assert
      expect(event.isEvent()).toBe(true);
    });
  });

  describe('isErased', () =>
  {
    it('reflects the underlying _erased flag', () =>
    {
      // Arrange
      const event = buildEvent();
      event._erased = true;

      // Act & Assert
      expect(event.isErased()).toBe(true);
    });
  });
});
//endregion plugins/_base/_component/game-event-methods.test.js
