//region plugins/sdp/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_SDP_PLUGIN_PARAMS } from './fixtures/engine-stubs.js';
import { loadSdpPluginVm } from './sdp-vm.js';

describe('J-SDP metadata (out/sdp/J-SDP.js)', () =>
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

  it('maps plugin parameters and config panels onto J.SDP.Metadata', () =>
  {
    expect(sandbox.J.SDP.Metadata.name).toBe('J-SDP');
    expect(sandbox.J.SDP.Metadata.version.major).toBe(3);
    expect(sandbox.J.SDP.Metadata.menuSwitchId).toBe(Number(DEFAULT_SDP_PLUGIN_PARAMS.menuSwitch));
    expect(sandbox.J.SDP.Metadata.sdpIconIndex).toBe(Number(DEFAULT_SDP_PLUGIN_PARAMS.sdpIcon));
    expect(sandbox.J.SDP.Metadata.victoryText).toBe(DEFAULT_SDP_PLUGIN_PARAMS.victoryText);
    expect(sandbox.J.SDP.Metadata.commandName).toBe(DEFAULT_SDP_PLUGIN_PARAMS.menuCommandName);
    expect(sandbox.J.SDP.Metadata.unitPlural).toBe(DEFAULT_SDP_PLUGIN_PARAMS.sdpUnitPlural);
    expect(sandbox.J.SDP.Metadata.sdpPointsDisplayName).toBe(DEFAULT_SDP_PLUGIN_PARAMS.sdpPointsDisplayName);

    const panel = sandbox.J.SDP.Metadata.panelsMap.get('vitest_panel');
    expect(panel).toBeDefined();
    expect(panel.key).toBe('vitest_panel');
  });
});
//endregion plugins/sdp/metadata.test.js
