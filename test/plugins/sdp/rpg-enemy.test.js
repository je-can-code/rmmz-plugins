//region plugins/sdp/rpg-enemy.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSdpPluginVm } from './sdp-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { newVmRpgEnemy } from './vm-rpg-rows.js';

describe('J-SDP RPG_Enemy notes (out/J-SDP.js)', () =>
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

  it('parses sdpPoints', () =>
  {
    const enemy = newVmRpgEnemy(sandbox, { note: '<sdpPoints: 12>' });

    expect(enemy.sdpPoints).toBe(12);
  });

  it('parses sdpDropData', () =>
  {
    const enemy = newVmRpgEnemy(sandbox, { note: '<sdpDropData:[vitest_panel, 50]>' });

    expect(enemy.sdpDropKey).toBe('vitest_panel');
    expect(enemy.sdpDropChance).toBe(50);
  });
});
//endregion plugins/sdp/rpg-enemy.test.js
