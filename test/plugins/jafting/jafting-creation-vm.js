//region plugins/jafting/jafting-creation-vm.js
import { appendShippedPluginToVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installJaftingCreationEngineStubs } from './fixtures/engine-stubs.js';
import { JAFTING_CORE_OUT_FILENAME, JAFTING_CORE_TEST_CLASS_EXPORT_IIFE } from './jafting-core-vm.js';

export { JAFTING_CORE_OUT_FILENAME };

export const JAFTING_CREATION_OUT_FILENAME = 'jafting/ext/J-JAFTING-Creation.js';

const JAFTING_CREATION_TEST_CLASS_EXPORT_IIFE = `
void function()
{
  globalThis.__JAFT_VM = globalThis.__JAFT_VM || {};
  globalThis.__JAFT_VM.CraftingCreationSession = CraftingCreationSession;
  globalThis.__JAFT_VM.Window_RecipeDetails = Window_RecipeDetails;
}();
`;

/**
 * Loads {@link out/jafting/J-JAFTING.js} then {@link out/jafting/ext/J-JAFTING-Creation.js} with J-Base and harness.
 *
 * @param {object} sandbox
 * @param {object} [stubOptions] Passed to {@link installJaftingCreationEngineStubs}.
 */
export function loadJaftingCreationPluginVm(sandbox, stubOptions = {})
{
  evaluateShippedPlugin({
    outFilename: JAFTING_CORE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installJaftingCreationEngineStubs(s, stubOptions);
    },
    appendToPluginSource: JAFTING_CORE_TEST_CLASS_EXPORT_IIFE,
  });

  appendShippedPluginToVm({
    sandbox,
    outFilename: JAFTING_CREATION_OUT_FILENAME,
    appendToPluginSource: JAFTING_CREATION_TEST_CLASS_EXPORT_IIFE,
  });
}
//endregion plugins/jafting/jafting-creation-vm.js
