//region plugins/abs/ext/shield/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield Game_Actor (unit, all downstream dependencies mocked)', () =>
{
  let originalShieldBreakSources;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { Aliased: { Game_Actor: new Map() } } } } };

    function Game_Actor()
    {
    }

    originalShieldBreakSources = vi.fn();
    Game_Actor.prototype.shieldBreakSources = originalShieldBreakSources;
    globalThis.Game_Actor = Game_Actor;

    await import('../../../../../../src/plugins/abs/ext/shield/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    originalShieldBreakSources.mockReset();
  });

  describe('shieldBreakSources', () =>
  {
    it('appends the class and all equips to the original sources', () =>
    {
      // Arrange
      const originalSource = { id: 'original' };
      const equip1 = { id: 'equip1' };
      const equip2 = { id: 'equip2' };
      const klass = { id: 'class' };
      originalShieldBreakSources.mockReturnValue([ originalSource ]);
      const actor = Object.create(globalThis.Game_Actor.prototype);
      actor.class = () => klass;
      actor.equips = () => [ equip1, equip2 ];

      // Act
      const result = actor.shieldBreakSources();

      // Assert
      expect(result).toEqual([ originalSource, klass, equip1, equip2 ]);
    });
  });
});
//endregion plugins/abs/ext/shield/objects/game-actor.test.js
