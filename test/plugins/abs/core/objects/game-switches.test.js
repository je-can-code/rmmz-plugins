//region plugins/abs/core/objects/game-switches.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS Game_Switches augments (direct src import)', () =>
{
  let Game_Switches;
  let originalOnChange;

  beforeAll(async () =>
  {
    globalThis.J = { ABS: { Aliased: { Game_Switches: new Map() } } };

    function StubGameSwitches()
    {
    }
    originalOnChange = vi.fn();
    StubGameSwitches.prototype.onChange = originalOnChange;
    globalThis.Game_Switches = StubGameSwitches;

    await import('../../../../../src/plugins/abs/core/objects/Game_Switches.js');
    ({ Game_Switches } = globalThis);
  });

  beforeEach(() =>
  {
    originalOnChange.mockClear();
    globalThis.$jabsEngine = { requestJabsMenuRefresh: false };
  });

  describe('onChange', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      const switches = new Game_Switches();

      switches.onChange();

      expect(originalOnChange).toHaveBeenCalledTimes(1);
    });

    it('requests a JABS menu refresh', () =>
    {
      const switches = new Game_Switches();

      switches.onChange();

      expect(globalThis.$jabsEngine.requestJabsMenuRefresh).toBe(true);
    });
  });
});
//endregion plugins/abs/core/objects/game-switches.test.js
