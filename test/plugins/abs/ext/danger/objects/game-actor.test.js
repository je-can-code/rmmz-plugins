//region plugins/abs/ext/danger/objects/game-actor.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger Game_Actor (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { DANGER: {} } } };

    function Game_Actor()
    {
    }

    globalThis.Game_Actor = Game_Actor;

    await import('../../../../../../src/plugins/abs/ext/danger/objects/Game_Actor.js');
  });

  describe('showDangerIndicator', () =>
  {
    it('is always false, since danger indicators are relative to the player', () =>
    {
      // Arrange
      const actor = Object.create(globalThis.Game_Actor.prototype);

      // Act / Assert
      expect(actor.showDangerIndicator()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/danger/objects/game-actor.test.js
