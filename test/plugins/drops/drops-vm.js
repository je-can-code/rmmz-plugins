//region plugins/drops/drops-vm.js
import { installDropsEngineStubs } from './fixtures/engine-stubs.js';
import { clearRpgManagerCacheInVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const DROPS_OUT_FILENAME = 'drops/J-DropsControl.js';

/**
 * Evaluates {@link out/J-DropsControl.js} into an existing VM sandbox (with J-Base + Drops engine stubs).
 *
 * @param {object} sandbox
 */
export function loadDropsControlPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: DROPS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installDropsEngineStubs(s);
    },
  });
}

/**
 * Per-test reset for Drops VM harnesses.
 *
 * @param {object} sandbox
 */
export function resetDropsControlPluginSandbox(sandbox)
{
  sandbox.$gameVariables._data = [];
  clearRpgManagerCacheInVm(sandbox);
  sandbox.$dataItems.length = 0;
  sandbox.$gameParty.__battleMembers = [];
  sandbox.Math.randomInt = function(max)
  {
    return Math.floor(Math.random() * max);
  };
}
//endregion plugins/drops/drops-vm.js
