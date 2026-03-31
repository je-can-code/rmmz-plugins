//region plugins/time/time-vm.js
import vm from 'node:vm';

import { installTimeEngineStubs } from './fixtures/engine-stubs.js';
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const TIME_OUT_FILENAME = 'J-TIME.js';

const EXPOSE_TIME_GLOBALS = `
globalThis.Time_Snapshot = Time_Snapshot;
globalThis.TimeMapper = TimeMapper;
`;

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

  vm.runInContext(EXPOSE_TIME_GLOBALS, sandbox);
}

/**
 * @param {object} sandbox
 */
export function makeGameTime(sandbox)
{
  sandbox.$gameTime = new sandbox.Game_Time();
  return sandbox.$gameTime;
}
//endregion plugins/time/time-vm.js
