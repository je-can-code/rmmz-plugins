//region plugins/camods/camods-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installCamodsEngineStubs } from './fixtures/engine-stubs.js';

export const CAMODS_OUT_FILENAME = 'J-CA-Mods.js';

/**
 * Loads {@link out/J-CA-Mods.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadCamodsPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: CAMODS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installCamodsEngineStubs(s);
    },
  });
}
//endregion plugins/camods/camods-vm.js
