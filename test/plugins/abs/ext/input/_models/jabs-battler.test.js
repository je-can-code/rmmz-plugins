//region plugins/abs/ext/input/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalCreatePlayer;
  let originalCanActionConnect;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { JABS_Battler: new Map() }, Symbols: { Debug: 'cheat' } } } } };
    globalThis.Input = { isPressed: vi.fn() };

    function JABS_Battler()
    {
    }

    originalCreatePlayer = vi.fn();
    originalCanActionConnect = vi.fn();
    JABS_Battler.createPlayer = originalCreatePlayer;
    JABS_Battler.prototype.canActionConnect = originalCanActionConnect;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/input/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalCreatePlayer.mockReset();
    originalCanActionConnect.mockReset();
    globalThis.Input.isPressed.mockReset();
    globalThis.$jabsController1 = { setBattler: vi.fn() };
  });

  describe('createPlayer', () =>
  {
    it('assigns the newly-created player to controller 1 and returns the original result', () =>
    {
      const player = { id: 'player' };
      originalCreatePlayer.mockReturnValue(player);

      const result = globalThis.JABS_Battler.createPlayer();

      expect(globalThis.$jabsController1.setBattler).toHaveBeenCalledWith(player);
      expect(result).toBe(player);
    });
  });

  describe('canActionConnect', () =>
  {
    it('is false for the player while the debug button is held', () =>
    {
      globalThis.Input.isPressed.mockReturnValue(true);
      const battler = Object.create(globalThis.JABS_Battler.prototype);
      battler.isPlayer = () => true;

      expect(battler.canActionConnect()).toBe(false);
      expect(originalCanActionConnect).not.toHaveBeenCalled();
    });

    it('defers to the original logic for the player when the debug button is not held', () =>
    {
      globalThis.Input.isPressed.mockReturnValue(false);
      originalCanActionConnect.mockReturnValue(true);
      const battler = Object.create(globalThis.JABS_Battler.prototype);
      battler.isPlayer = () => true;

      expect(battler.canActionConnect()).toBe(true);
      expect(originalCanActionConnect).toHaveBeenCalledTimes(1);
    });

    it('defers to the original logic for non-player battlers regardless of the debug button', () =>
    {
      globalThis.Input.isPressed.mockReturnValue(true);
      originalCanActionConnect.mockReturnValue(true);
      const battler = Object.create(globalThis.JABS_Battler.prototype);
      battler.isPlayer = () => false;

      expect(battler.canActionConnect()).toBe(true);
      expect(originalCanActionConnect).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/input/_models/jabs-battler.test.js
