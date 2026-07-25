//region plugins/abs/ext/input/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input Game_Player (unit, all downstream dependencies mocked)', () =>
{
  let originalIsDebugThrough;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { Game_Player: new Map() }, Symbols: { Debug: 'cheat' } } } } };
    globalThis.Input = { isPressed: vi.fn() };

    function Game_Player()
    {
    }

    originalIsDebugThrough = vi.fn();
    Game_Player.prototype.isDebugThrough = originalIsDebugThrough;
    globalThis.Game_Player = Game_Player;

    await import('../../../../../../src/plugins/abs/ext/input/objects/Game_Player.js');
  });

  beforeEach(() =>
  {
    originalIsDebugThrough.mockReset();
    globalThis.Input.isPressed.mockReset();
    globalThis.$gameTemp = { isPlaytest: () => true };
  });

  function buildPlayer()
  {
    return Object.create(globalThis.Game_Player.prototype);
  }

  describe('isDebugThrough', () =>
  {
    it('defers to the original logic when JABS is not enabled', () =>
    {
      globalThis.$jabsEngine = { absEnabled: false };
      originalIsDebugThrough.mockReturnValue(true);
      const player = buildPlayer();

      expect(player.isDebugThrough()).toBe(true);
      expect(originalIsDebugThrough).toHaveBeenCalledTimes(1);
    });

    it('checks the custom debug button and playtest flag when JABS is enabled', () =>
    {
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.Input.isPressed.mockReturnValue(true);
      const player = buildPlayer();

      expect(player.isDebugThrough()).toBe(true);
      expect(globalThis.Input.isPressed).toHaveBeenCalledWith('cheat');
      expect(originalIsDebugThrough).not.toHaveBeenCalled();
    });

    it('is false when JABS is enabled but not in playtest, even if the button is pressed', () =>
    {
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.Input.isPressed.mockReturnValue(true);
      globalThis.$gameTemp.isPlaytest = () => false;
      const player = buildPlayer();

      expect(player.isDebugThrough()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/input/objects/game-player.test.js
