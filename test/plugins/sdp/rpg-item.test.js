//region plugins/sdp/rpg-item.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSdpPluginVm } from './sdp-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { newVmRpgItem } from './vm-rpg-rows.js';

describe('J-SDP RPG_Item notes (out/sdp/J-SDP.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSdpPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  it('parses sdpUnlock key', () =>
  {
    const item = newVmRpgItem(sandbox, { note: '<sdpUnlock: vitest_panel>' });

    expect(item.sdpKey).toBe('vitest_panel');
  });
});
//endregion plugins/sdp/rpg-item.test.js
