//region plugins/escribe/escribe-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installEscribeEngineStubs } from './fixtures/engine-stubs.js';

export const ESCRIBE_OUT_FILENAME = 'J-Escriptions.js';

const EXPOSE_ESCRIBE_GLOBALS = `
globalThis.Escription = Escription;
`;

/**
 * Loads {@link out/J-Escriptions.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadEscribePluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: ESCRIBE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installEscribeEngineStubs(s);
    },
  });

  vm.runInContext(EXPOSE_ESCRIBE_GLOBALS, sandbox);
}
//endregion plugins/escribe/escribe-vm.js
