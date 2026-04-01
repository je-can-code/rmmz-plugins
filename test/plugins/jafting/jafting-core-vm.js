//region plugins/jafting/jafting-core-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installJaftingCoreEngineStubs } from './fixtures/engine-stubs.js';

export const JAFTING_CORE_OUT_FILENAME = 'jafting/J-JAFTING.js';

/**
 * Appended to the core bundle in the VM so top-level classes close over the same script scope and land on `globalThis`.
 * Node's `vm.runInContext` does not surface `class` declarations as properties of the context object.
 */
export const JAFTING_CORE_TEST_CLASS_EXPORT_IIFE = `
void function()
{
  globalThis.__JAFT_VM = globalThis.__JAFT_VM || {};
  globalThis.__JAFT_VM.Window_JaftingList = Window_JaftingList;
  globalThis.__JAFT_VM.Scene_Jafting = Scene_Jafting;
}();
`;

/**
 * Loads {@link out/jafting/J-JAFTING.js} with J-Base and harness (no Creation / Refinement extensions).
 *
 * @param {object} sandbox
 */
export function loadJaftingCorePluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: JAFTING_CORE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installJaftingCoreEngineStubs(s);
    },
    appendToPluginSource: JAFTING_CORE_TEST_CLASS_EXPORT_IIFE,
  });
}
//endregion plugins/jafting/jafting-core-vm.js
