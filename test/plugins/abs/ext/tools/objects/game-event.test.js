//region plugins/abs/ext/tools/objects/game-event.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Tools Game_Event augments (direct src import)', () =>
{
  let Game_Event;

  beforeAll(async () =>
  {
    globalThis.J = { ABS: { EXT: { TOOLS: { RegExp: { GapCloseTarget: /<gapCloseTarget:(\w+)>/i } } } } };

    function StubGameEvent()
    {
    }
    globalThis.Game_Event = StubGameEvent;

    await import('../../../../../../src/plugins/abs/ext/tools/objects/Game_Event.js');
    ({ Game_Event } = globalThis);
  });

  /**
   * Builds a fake event-command list from plain comment strings.
   * @param {string[]} comments
   * @returns {Array<{parameters: string[]}>}
   */
  function buildCommentCommands(comments)
  {
    return comments.map(comment => ({ parameters: [ comment ] }));
  }

  /**
   * Builds an event instance with a controllable comment-command list.
   * @param {string[]} comments
   * @returns {object}
   */
  function buildEvent(comments)
  {
    const event = Object.create(Game_Event.prototype);
    event.getValidCommentCommands = () => buildCommentCommands(comments);
    return event;
  }

  describe('gapCloseKey', () =>
  {
    it('is null when no comment carries the tag', () =>
    {
      expect(buildEvent([ 'unrelated' ]).gapCloseKey()).toBeNull();
    });

    it('returns the key from the first matching comment', () =>
    {
      expect(buildEvent([ '<gapCloseTarget:hook>' ]).gapCloseKey()).toBe('hook');
    });

    it('returns the key from the last matching comment when multiple are present', () =>
    {
      const event = buildEvent([ '<gapCloseTarget:first>', '<gapCloseTarget:second>' ]);
      expect(event.gapCloseKey()).toBe('second');
    });
  });
});
//endregion plugins/abs/ext/tools/objects/game-event.test.js
