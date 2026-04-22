//region plugins/passive/passive-abs-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installPassiveEngineStubs } from './fixtures/engine-stubs.js';

export const PASSIVE_ABS_OUT_REL = 'passive/ext/J-Passive-ABS.js';

const PASSIVE_ABS_PRELUDE_REL_PATHS = [
  'test/plugins/passive/fixtures/passive-abs-engine-prelude.js',
  'out/passive/J-Passive.js',
];

/**
 * Wires {@link PluginManager.parameters} so {@link JPassiveAbs_PluginMetadata} reads test defaults.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} passiveAbsPluginParameterStrings
 */
export function installPassiveAbsPluginManagerBridge(sandbox, passiveAbsPluginParameterStrings = null)
{
  const strings = passiveAbsPluginParameterStrings ?? {
    'default-prefix-chance': '33',
    'default-suffix-chance': '33',
  };

  const prev = sandbox.PluginManager.parameters.bind(sandbox.PluginManager);

  sandbox.PluginManager.parameters = function(name)
  {
    if (name === 'J-Passive-ABS')
    {
      return strings;
    }

    return prev(name);
  };
}

/**
 * Loads {@link out/passive/J-Passive.js} then {@link out/passive/ext/J-Passive-ABS.js} with J-Base and harness.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} [passiveAbsPluginParameterStrings]
 */
export function loadPassiveAbsPluginVm(sandbox, passiveAbsPluginParameterStrings = null)
{
  evaluateShippedPlugin({
    outFilename: PASSIVE_ABS_OUT_REL,
    sandbox,
    preludeRepoRelativePaths: PASSIVE_ABS_PRELUDE_REL_PATHS,
    afterHostGlobalsInstall(s)
    {
      installPassiveEngineStubs(s);
      installPassiveAbsPluginManagerBridge(s, passiveAbsPluginParameterStrings);
    },
  });
}
//endregion plugins/passive/passive-abs-vm.js