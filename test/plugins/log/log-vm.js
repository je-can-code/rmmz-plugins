//region plugins/log/log-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installLogEngineStubs } from './fixtures/engine-stubs.js';

export const LOG_OUT_FILENAME = 'log/J-Log.js';

const EXPOSE_LOG_GLOBALS = `
globalThis.MapLogManager = MapLogManager;
globalThis.Window_MapLog = Window_MapLog;
`;

/**
 * Loads {@link out/J-Log.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadLogPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: LOG_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installLogEngineStubs(s);
    },
  });

  vm.runInContext(EXPOSE_LOG_GLOBALS, sandbox);
}
//endregion plugins/log/log-vm.js
