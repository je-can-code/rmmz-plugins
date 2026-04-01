//region plugins/popups/popups-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installPopupsEngineStubs } from './fixtures/engine-stubs.js';

export const POPUPS_OUT_FILENAME = 'J-TextPops.js';

const EXPOSE_POPUPS_GLOBALS = `
globalThis.TextPopBuilder = TextPopBuilder;
globalThis.TextPopSpriteManager = TextPopSpriteManager;
globalThis.Map_TextPop = Map_TextPop;
`;

/**
 * Loads {@link out/J-TextPops.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadPopupsPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: POPUPS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installPopupsEngineStubs(s);
    },
  });

  vm.runInContext(`
globalThis.J = globalThis.J || {};
globalThis.J.ABS = globalThis.J.ABS || {};
globalThis.J.ABS.Metadata = globalThis.J.ABS.Metadata || {};
if (globalThis.J.ABS.Metadata.DisableTextPops === undefined)
{
  globalThis.J.ABS.Metadata.DisableTextPops = false;
}
`, sandbox);

  vm.runInContext(EXPOSE_POPUPS_GLOBALS, sandbox);
}
//endregion plugins/popups/popups-vm.js
