//region plugins/utils/utils-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installUtilsEngineStubs } from './fixtures/engine-stubs.js';

export const UTILS_OUT_FILENAME = 'J-SystemUtilities.js';

/**
 * Loads {@link out/J-SystemUtilities.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadUtilsPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: UTILS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installUtilsEngineStubs(s);
    },
  });
}
//endregion plugins/utils/utils-vm.js
