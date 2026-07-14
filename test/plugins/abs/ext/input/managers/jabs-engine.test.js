//region plugins/abs/ext/input/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalPerformPartyCycling;
  let originalUpdateInput;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { JABS_Engine: new Map() } } } } };

    function JABS_Engine()
    {
    }

    originalPerformPartyCycling = vi.fn();
    originalUpdateInput = vi.fn();
    JABS_Engine.prototype.performPartyCycling = originalPerformPartyCycling;
    JABS_Engine.prototype.updateInput = originalUpdateInput;
    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../../src/plugins/abs/ext/input/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalPerformPartyCycling.mockReset();
    originalUpdateInput.mockReset();
    globalThis.$jabsController1 = { setBattler: vi.fn(), update: vi.fn() };
  });

  function buildEngine(overrides = {})
  {
    return Object.assign(Object.create(globalThis.JABS_Engine.prototype), overrides);
  }

  describe('performPartyCycling', () =>
  {
    it('performs the original logic then reassigns the controller to the new player 1', () =>
    {
      const player = { id: 'player' };
      const engine = buildEngine({ getPlayer1: () => player });

      engine.performPartyCycling();

      expect(originalPerformPartyCycling).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsController1.setBattler).toHaveBeenCalledWith(player);
    });
  });

  describe('updateInput', () =>
  {
    it('performs the original logic then updates the controller when allowed', () =>
    {
      const engine = buildEngine({ canUpdateInput: () => true });

      engine.updateInput();

      expect(originalUpdateInput).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsController1.update).toHaveBeenCalledTimes(1);
    });

    it('does not update the controller when not allowed', () =>
    {
      const engine = buildEngine({ canUpdateInput: () => false });

      engine.updateInput();

      expect(globalThis.$jabsController1.update).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/input/managers/jabs-engine.test.js
