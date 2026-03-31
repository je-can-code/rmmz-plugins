//region plugins/diff/diff-vm.js
import vm from 'node:vm';

import { installDiffEngineStubs } from './fixtures/engine-stubs.js';
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const DIFF_OUT_FILENAME = 'J-Difficulty.js';

/**
 * Loads {@link out/J-Difficulty.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadDiffPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: DIFF_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installDiffEngineStubs(s);
    },
  });

  sandbox.DifficultyManager = vm.runInContext('DifficultyManager', sandbox);
}
//endregion plugins/diff/diff-vm.js
