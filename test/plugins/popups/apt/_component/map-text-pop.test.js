//region plugins/popups/apt/_component/map-text-pop.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('Map_TextPop (direct src import)', () =>
{
  let Map_TextPop;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the ext/apt augment only reads/writes the Types dictionary, so a bare stub is sufficient.
    globalThis.Map_TextPop = { Types: {} };

    // apply the apt augment onto the bare-global stub (no import statement; patches globalThis directly).
    await import('../../../../../src/plugins/popups/ext/apt/_models/Map_TextPop.js');
    ({ Map_TextPop } = globalThis);
  });

  describe('Types', () =>
  {
    it('registers the Ap popup type', () =>
    {
      // Arrange/Act done in beforeAll.

      // Assert
      expect(Map_TextPop.Types.Ap).toEqual('ap');
    });
  });
});
//endregion plugins/popups/apt/_component/map-text-pop.test.js
