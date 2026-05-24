//region plugins/crit/crit-vm.js
import { installCritCompanionStubs } from './fixtures/crit-companion-stubs.js';
import {
  DEFAULT_NATURAL_PLUGIN_PARAMS,
  NATURAL_OUT_FILENAME,
} from '../natural/natural-vm.js';
import { installNaturalEngineStubs } from '../natural/fixtures/engine-stubs.js';
import { appendShippedPluginToVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const CRITICAL_FACTORS_OUT_FILENAME = 'crit/J-CriticalFactors.js';

/**
 * Loads {@link out/natural/J-NaturalGrowth.js} then {@link out/crit/J-CriticalFactors.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadCriticalFactorsPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: NATURAL_OUT_FILENAME,
    sandbox,
    jBasePluginParameterStrings: DEFAULT_NATURAL_PLUGIN_PARAMS,
    afterHostGlobalsInstall(s)
    {
      installNaturalEngineStubs(s, DEFAULT_NATURAL_PLUGIN_PARAMS);
      installCritCompanionStubs(s);
    },
  });

  appendShippedPluginToVm({
    sandbox,
    outFilename: CRITICAL_FACTORS_OUT_FILENAME,
  });
}
//endregion plugins/crit/crit-vm.js