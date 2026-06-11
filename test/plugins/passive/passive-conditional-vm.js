//region plugins/passive/passive-conditional-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installPassiveEngineStubs } from './fixtures/engine-stubs.js';

export const PASSIVE_CONDITIONAL_OUT_REL = 'passive/ext/J-Passive-Conditional.js';

const PASSIVE_CONDITIONAL_PRELUDE_REL_PATHS = [
  'test/plugins/passive/fixtures/passive-conditional-engine-prelude.js',
  'out/passive/J-Passive.js',
];

/**
 * Wires {@link PluginManager.parameters} so {@link JPassiveConditional_PluginMetadata} reads test defaults.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} passiveConditionalPluginParameterStrings
 */
export function installPassiveConditionalPluginManagerBridge(
  sandbox,
  passiveConditionalPluginParameterStrings = null
)
{
  const strings = passiveConditionalPluginParameterStrings ?? {
    'reconcile-delay-frames': '15',
    'default-proximity-tiles': '5',
    'auto-execute-skill-max-depth': '1',
  };

  const prev = sandbox.PluginManager.parameters.bind(sandbox.PluginManager);

  sandbox.PluginManager.parameters = function(name)
  {
    if (name === 'J-Passive-Conditional')
    {
      return strings;
    }

    return prev(name);
  };
}

/**
 * Loads {@link out/passive/J-Passive.js} then {@link out/passive/ext/J-Passive-Conditional.js}.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} [passiveConditionalPluginParameterStrings]
 */
export function loadPassiveConditionalPluginVm(sandbox, passiveConditionalPluginParameterStrings = null)
{
  evaluateShippedPlugin({
    outFilename: PASSIVE_CONDITIONAL_OUT_REL,
    sandbox,
    preludeRepoRelativePaths: PASSIVE_CONDITIONAL_PRELUDE_REL_PATHS,
    afterHostGlobalsInstall(s)
    {
      installPassiveEngineStubs(s);
      installPassiveConditionalPluginManagerBridge(s, passiveConditionalPluginParameterStrings);
    },
  });
}
//endregion plugins/passive/passive-conditional-vm.js