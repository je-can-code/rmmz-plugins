//region plugins/passive/core/objects/game-event.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('Game_Event ext/passive augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { RegExp: { PassiveStateIds: /<passive:(\[.*])>/i } } };

    function StubGameEvent()
    {
    }

    globalThis.Game_Event = StubGameEvent;

    await import('../../../../../src/plugins/passive/core/objects/Game_Event.js');
  });

  function makeComment(text)
  {
    return { parameters: [ text ] };
  }

  describe('getPassiveStateIds', () =>
  {
    it('returns an empty array when there are no comment commands', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.getValidCommentCommands = vi.fn().mockReturnValue([]);

      // Act
      const result = event.getPassiveStateIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('skips a comment that does not match the passive regex', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.getValidCommentCommands = vi.fn().mockReturnValue([ makeComment('unrelated') ]);

      // Act
      const result = event.getPassiveStateIds();

      // Assert
      expect(result).toEqual([]);
    });

    it('parses and flattens the ids from a matching passive tag', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.getValidCommentCommands = vi.fn().mockReturnValue([ makeComment('<passive:[1,2,3]>') ]);

      // Act
      const result = event.getPassiveStateIds();

      // Assert
      expect(result).toEqual([ 1, 2, 3 ]);
    });

    it('accumulates ids across multiple matching comments', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.getValidCommentCommands = vi.fn().mockReturnValue([
        makeComment('<passive:[1,2]>'),
        makeComment('<passive:[3]>'),
      ]);

      // Act
      const result = event.getPassiveStateIds();

      // Assert
      expect(result).toEqual([ 1, 2, 3 ]);
    });
  });
});
//endregion plugins/passive/core/objects/game-event.test.js
