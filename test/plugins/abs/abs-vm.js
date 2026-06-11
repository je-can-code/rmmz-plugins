//region plugins/abs/abs-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installAbsEngineStubs } from './fixtures/engine-stubs.js';

export const JABS_OUT_FILENAME = 'abs/J-ABS.js';

/**
 * Loads {@link out/abs/J-ABS.js} with J-Base and harness.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} [jAbsPluginParameterStrings]
 */
export function loadAbsPluginVm(sandbox, jAbsPluginParameterStrings = null)
{
  evaluateShippedPlugin({
    outFilename: JABS_OUT_FILENAME,
    sandbox,
    preludeRepoRelativePaths: [
      'test/plugins/abs/fixtures/abs-pre-jabs-prelude.js',
    ],
    afterHostGlobalsInstall(s)
    {
      installAbsEngineStubs(s, jAbsPluginParameterStrings);
    },
  });
}
//endregion plugins/abs/abs-vm.js
