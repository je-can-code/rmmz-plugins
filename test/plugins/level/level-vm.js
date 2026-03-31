//region plugins/level/level-vm.js
import vm from 'node:vm';

import { installLevelEngineStubs } from './fixtures/engine-stubs.js';
import { clearRpgManagerCacheInVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const LEVEL_OUT_FILENAME = 'J-LevelMaster.js';

/**
 * Loads {@link out/J-LevelMaster.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadLevelPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: LEVEL_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installLevelEngineStubs(s);
    },
  });

  sandbox.LevelScaling = vm.runInContext('LevelScaling', sandbox);
}

/**
 * Clears RPGManager caches and variable data between level harness examples.
 *
 * @param {object} sandbox
 */
export function resetLevelPluginSandbox(sandbox)
{
  sandbox.$gameVariables._data = [];
  clearRpgManagerCacheInVm(sandbox);
}
//endregion plugins/level/level-vm.js
