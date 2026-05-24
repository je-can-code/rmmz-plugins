//region plugins/time/time-vm.js
import vm from 'node:vm';

import { installTimeEngineStubs } from './fixtures/engine-stubs.js';
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const TIME_OUT_FILENAME = 'time/J-TIME.js';

/**
 * @param {object} sandbox
 */
export function loadTimePluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: TIME_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installTimeEngineStubs(s);
    },
  });
}

/**
 * @param {object} sandbox
 */
export function makeGameTime(sandbox)
{
  vm.runInContext('$gameTime = new Game_Time();', sandbox);
  return vm.runInContext('$gameTime;', sandbox);
}
//endregion plugins/time/time-vm.js
