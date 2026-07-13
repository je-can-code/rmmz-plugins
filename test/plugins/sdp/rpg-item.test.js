//region plugins/sdp/rpg-item.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';

describe('J-SDP RPG_Item notes (direct src import)', () =>
{
  let RPG_Item;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: RPG_Item } = await import('../../../src/plugins/_base/database/implementations/RPG_Item.js'));
    globalThis.RPG_Item = RPG_Item;

    setPluginContextToJSdp();
    await import('../../../src/plugins/sdp/core/_metadata/initialization.js');

    // patches globalThis.RPG_Item.prototype directly, no vm involved.
    await import('../../../src/plugins/sdp/core/database/RPG_Item.js');
  });

  describe('sdpKey', () =>
  {
    it('parses the sdp key from the sdpUnlock tag', () =>
    {
      // Arrange
      const item = Object.assign(Object.create(RPG_Item.prototype), { id: 1, note: '<sdpUnlock: vitest_panel>' });

      // Act & Assert
      expect(item.sdpKey).toBe('vitest_panel');
    });
  });
});
//endregion plugins/sdp/rpg-item.test.js
