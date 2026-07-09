//region plugins/abs/ext/tools/tools-vm.js
import { appendShippedPluginToVm } from '../../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../../abs-vm.js';

export const JABS_TOOLS_OUT_FILENAME = 'abs/ext/J-ABS-Tools.js';

/**
 * Loads {@link out/abs/J-ABS.js} then {@link out/abs/ext/J-ABS-Tools.js} into the same sandbox.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} [jAbsPluginParameterStrings]
 */
export function loadAbsToolsPluginVm(sandbox, jAbsPluginParameterStrings = null)
{
  loadAbsPluginVm(sandbox, jAbsPluginParameterStrings);

  appendShippedPluginToVm({
    sandbox,
    outFilename: JABS_TOOLS_OUT_FILENAME,
  });
}
//endregion plugins/abs/ext/tools/tools-vm.js
