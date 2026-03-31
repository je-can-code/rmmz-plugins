//region plugins/sdp/sdp-vm.js
import { installSdpEngineStubs } from './fixtures/engine-stubs.js';
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const SDP_OUT_FILENAME = 'J-SDP.js';

/**
 * Loads {@link out/J-SDP.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadSdpPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: SDP_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installSdpEngineStubs(s);
    },
  });
}
//endregion plugins/sdp/sdp-vm.js
