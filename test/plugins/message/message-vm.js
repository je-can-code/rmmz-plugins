//region plugins/message/message-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installMessageEngineStubs } from './fixtures/engine-stubs.js';

export const MESSAGE_OUT_FILENAME = 'message/J-MessageTextCodes.js';

const EXPOSE_MESSAGE_GLOBALS = `
globalThis.BasicChoiceConditional = BasicChoiceConditional;
`;

/**
 * Loads {@link out/J-MessageTextCodes.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadMessagePluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: MESSAGE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installMessageEngineStubs(s);
    },
  });

  vm.runInContext(EXPOSE_MESSAGE_GLOBALS, sandbox);
}
//endregion plugins/message/message-vm.js
