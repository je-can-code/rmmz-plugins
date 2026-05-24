//region plugins/sdp/sdp-metadata-panels.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSdpPluginVm } from './sdp-vm.js';

describe('J-SDP metadata panels (out/sdp/J-SDP.js)', () =>
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

  it('classifies vitest_panel from config with expected costs and parameters', () =>
  {
    const panel = sandbox.J.SDP.Metadata.panelsMap.get('vitest_panel');
    expect(panel).toBeDefined();
    expect(panel.maxRank).toBe(3);
    expect(panel.baseCost).toBe(0);
    expect(panel.flatGrowthCost).toBe(0);
    expect(panel.multGrowthCost).toBe(1);
    expect(panel.panelParameters.length).toBe(1);
    expect(panel.panelParameters[0].parameterId).toBe(0);
    expect(panel.panelParameters[0].perRank).toBe(1);
    expect(panel.panelParameters[0].isFlat).toBe(true);
    expect(panel.panelParameters[0].isCore).toBe(true);

    const flat = 70;
    const mult = 1.06;
    expect(panel.rankUpCost(0)).toBe(Math.floor(flat * (mult ** 1)));
    expect(panel.rankUpCost(1)).toBe(Math.floor(flat * (mult ** 2)));
    expect(panel.rankUpCost(2)).toBe(Math.floor(flat * (mult ** 3)));
    expect(panel.rankUpCost(3)).toBe(0);
  });

  it('skips organizational panel rows when building panelsMap', () =>
  {
    const keys = [ ...sandbox.J.SDP.Metadata.panelsMap.keys() ];
    expect(keys.some(k => k.startsWith('__'))).toBe(false);
    expect(keys).toContain('vitest_panel');
  });
});
//endregion plugins/sdp/sdp-metadata-panels.test.js
