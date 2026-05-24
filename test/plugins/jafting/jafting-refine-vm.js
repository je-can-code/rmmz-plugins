//region plugins/jafting/jafting-refine-vm.js
import { appendShippedPluginToVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installJaftingRefineEngineStubs } from './fixtures/engine-stubs.js';
import { JAFTING_CORE_OUT_FILENAME, JAFTING_CORE_TEST_CLASS_EXPORT_IIFE } from './jafting-core-vm.js';

export const JAFTING_REFINE_OUT_FILENAME = 'jafting/ext/J-JAFTING-Refinement.js';

const JAFTING_REFINE_TEST_CLASS_EXPORT_IIFE = `
void function()
{
  globalThis.__JAFT_VM = globalThis.__JAFT_VM || {};
  globalThis.__JAFT_VM.RefinementWorkflowSession = RefinementWorkflowSession;
  globalThis.__JAFT_VM.JaftingManager = globalThis.JaftingManager;
  globalThis.__JAFT_VM.Window_RefinementDetails = Window_RefinementDetails;
  globalThis.__JAFT_VM.JAFTING_Trait = JAFTING_Trait;
}();
`;

/**
 * Loads {@link out/jafting/J-JAFTING.js} then {@link out/jafting/ext/J-JAFTING-Refinement.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadJaftingRefinePluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: JAFTING_CORE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installJaftingRefineEngineStubs(s);
    },
    appendToPluginSource: JAFTING_CORE_TEST_CLASS_EXPORT_IIFE,
  });

  appendShippedPluginToVm({
    sandbox,
    outFilename: JAFTING_REFINE_OUT_FILENAME,
    appendToPluginSource: JAFTING_REFINE_TEST_CLASS_EXPORT_IIFE,
  });
}
//endregion plugins/jafting/jafting-refine-vm.js
