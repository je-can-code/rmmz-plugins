//region plugins/level/_component/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Event level augments (direct src import)', () =>
{
  let Game_Event;
  let originalInitMembers;
  let originalRefresh;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalInitMembers = vi.fn();
    originalRefresh = vi.fn();

    globalThis.J = {
      LEVEL: {
        Aliased: { Game_Event: new Map() },
        RegExp: {
          HideLevel: /<hideLevel>/i,
          Level: /<(?:lv|lvl|level):[ ]?(-?\+?\d+)>/i,
        },
      },
    };

    function StubGameEvent()
    {
    }

    StubGameEvent.prototype.initMembers = originalInitMembers;
    StubGameEvent.prototype.refresh = originalRefresh;
    StubGameEvent.prototype.getValidCommentCommands = vi.fn()
      .mockReturnValue([]);
    globalThis.Game_Event = StubGameEvent;

    await import('../../../../src/plugins/level/core/objects/Game_Event.js');
    ({ Game_Event } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  function makeCommentCommand(comment)
  {
    return { parameters: [ comment ] };
  }

  describe('initMembers', () =>
  {
    it('calls through to original logic and seeds the level cache namespace', () =>
    {
      // Arrange
      const event = new Game_Event();

      // Act
      event.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalled();
      expect(event._j._level._cachedLevelOverride).toBeNull();
      expect(event._j._level._cachedHideLevel).toBeNull();
    });

    it('does not clobber an existing _j namespace already initialized by another plugin', () =>
    {
      // Arrange
      const event = new Game_Event();
      event._j = { someOtherPlugin: true };

      // Act
      event.initMembers();

      // Assert
      expect(event._j.someOtherPlugin).toBe(true);
      expect(event._j._level._cachedLevelOverride).toBeNull();
    });
  });

  describe('getCachedLevelOverride / setCachedLevelOverride', () =>
  {
    it('round-trips a cached level override value', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();

      // Act
      event.setCachedLevelOverride(5);

      // Assert
      expect(event.getCachedLevelOverride()).toEqual(5);
    });
  });

  describe('getCachedHideLevel / setCachedHideLevel', () =>
  {
    it('round-trips a cached hide-level flag', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();

      // Act
      event.setCachedHideLevel(true);

      // Assert
      expect(event.getCachedHideLevel()).toEqual(true);
    });
  });

  describe('refresh', () =>
  {
    it('calls through to original logic and clears the level cache', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.setCachedLevelOverride(5);
      event.setCachedHideLevel(true);

      // Act
      event.refresh();

      // Assert
      expect(originalRefresh).toHaveBeenCalled();
      expect(event.getCachedLevelOverride()).toBeNull();
      expect(event.getCachedHideLevel()).toBeNull();
    });
  });

  describe('getLevelOverrides', () =>
  {
    it('returns the cached value without re-parsing comments when already cached', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.setCachedLevelOverride(7);

      // Act
      const result = event.getLevelOverrides();

      // Assert
      expect(result).toEqual(7);
      expect(event.getValidCommentCommands).not.toHaveBeenCalled();
    });

    it('parses and caches the level from a matching comment tag', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.getValidCommentCommands.mockReturnValue([ makeCommentCommand('<level: 12>') ]);

      // Act
      const result = event.getLevelOverrides();

      // Assert
      expect(result).toEqual(12);
      expect(event.getCachedLevelOverride()).toEqual(12);
    });

    it('ignores comments that do not match the level regex', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.getValidCommentCommands.mockReturnValue([ makeCommentCommand('<unrelatedTag>') ]);

      // Act
      const result = event.getLevelOverrides();

      // Assert
      expect(result).toBeNull();
    });

    it('keeps the last match when multiple comments match the level regex', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.getValidCommentCommands.mockReturnValue([
        makeCommentCommand('<level: 3>'),
        makeCommentCommand('<level: 9>'),
      ]);

      // Act
      const result = event.getLevelOverrides();

      // Assert
      expect(result).toEqual(9);
    });
  });

  describe('shouldHideLevel', () =>
  {
    it('returns the cached value without re-parsing comments when already cached', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.setCachedHideLevel(true);

      // Act
      const result = event.shouldHideLevel();

      // Assert
      expect(result).toBe(true);
      expect(event.getValidCommentCommands).not.toHaveBeenCalled();
    });

    it('parses and caches true when a hideLevel comment tag is present', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.getValidCommentCommands.mockReturnValue([ makeCommentCommand('<hideLevel>') ]);

      // Act
      const result = event.shouldHideLevel();

      // Assert
      expect(result).toBe(true);
      expect(event.getCachedHideLevel()).toBe(true);
    });

    it('parses and caches false when no hideLevel comment tag is present', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.initMembers();
      event.getValidCommentCommands.mockReturnValue([ makeCommentCommand('<level: 3>') ]);

      // Act
      const result = event.shouldHideLevel();

      // Assert
      expect(result).toBe(false);
      expect(event.getCachedHideLevel()).toBe(false);
    });
  });
});
//endregion plugins/level/_component/game-event.test.js
