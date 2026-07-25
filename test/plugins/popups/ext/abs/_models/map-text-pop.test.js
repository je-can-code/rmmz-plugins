//region plugins/popups/ext/abs/_models/map-text-pop.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('Map_TextPop ext/abs augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();
    globalThis.Map_TextPop = { Types: {} };
    await import('../../../../../../src/plugins/popups/ext/abs/_models/Map_TextPop.js');
  });

  describe('Types', () =>
  {
    it('registers the Shield popup type', () =>
    {
      // Arrange/Act/Assert
      expect(globalThis.Map_TextPop.Types.Shield).toEqual('shield');
    });
  });
});
//endregion plugins/popups/ext/abs/_models/map-text-pop.test.js
