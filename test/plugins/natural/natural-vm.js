//region plugins/natural/natural-vm.js
import { installNaturalEngineStubs } from './fixtures/engine-stubs.js';
import { clearRpgManagerCacheInVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const NATURAL_OUT_FILENAME = 'natural/J-NaturalGrowth.js';

export const DEFAULT_NATURAL_PLUGIN_PARAMS = {
  actorBaseTp: '42',
  enemyBaseTp: '17',
};

/**
 * Evaluates {@link out/natural/J-NaturalGrowth.js} into an existing VM sandbox (with J-Base + Natural engine stubs).
 *
 * @param {object} sandbox
 */
export function loadNaturalGrowthPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: NATURAL_OUT_FILENAME,
    sandbox,
    jBasePluginParameterStrings: DEFAULT_NATURAL_PLUGIN_PARAMS,
    afterHostGlobalsInstall(s)
    {
      installNaturalEngineStubs(s, DEFAULT_NATURAL_PLUGIN_PARAMS);
    },
  });
}

/**
 * Per-test reset for Natural Growth VM harnesses.
 *
 * @param {object} sandbox
 */
export function resetNaturalGrowthPluginSandbox(sandbox)
{
  sandbox.$gameVariables._data = [];
  clearRpgManagerCacheInVm(sandbox);
}
//endregion plugins/natural/natural-vm.js
