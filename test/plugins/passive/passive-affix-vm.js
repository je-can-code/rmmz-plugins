//region plugins/passive/passive-affix-vm.js
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installPassiveEngineStubs } from './fixtures/engine-stubs.js';

export const PASSIVE_AFFIX_OUT_REL = 'passive/ext/J-Passive-Affix.js';

const PASSIVE_AFFIX_PRELUDE_REL_PATHS = [
  'test/plugins/passive/fixtures/passive-affix-engine-prelude.js',
  'out/passive/J-Passive.js',
];

/**
 * Wires {@link PluginManager.parameters} so {@link JPassiveAffix_PluginMetadata} reads test defaults.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} passiveAffixPluginParameterStrings
 */
export function installPassiveAffixPluginManagerBridge(sandbox, passiveAffixPluginParameterStrings = null)
{
  const strings = passiveAffixPluginParameterStrings ?? {
    'default-prefix-chance': '33',
    'default-suffix-chance': '33',
  };

  const prev = sandbox.PluginManager.parameters.bind(sandbox.PluginManager);

  sandbox.PluginManager.parameters = function(name)
  {
    if (name === 'J-Passive-Affix')
    {
      return strings;
    }

    return prev(name);
  };
}

/**
 * Loads {@link out/passive/J-Passive.js} then {@link out/passive/ext/J-Passive-Affix.js} with J-Base and harness.
 *
 * @param {object} sandbox
 * @param {Record<string, string>|null} [passiveAffixPluginParameterStrings]
 */
export function loadPassiveAffixPluginVm(sandbox, passiveAffixPluginParameterStrings = null)
{
  evaluateShippedPlugin({
    outFilename: PASSIVE_AFFIX_OUT_REL,
    sandbox,
    preludeRepoRelativePaths: PASSIVE_AFFIX_PRELUDE_REL_PATHS,
    afterHostGlobalsInstall(s)
    {
      installPassiveEngineStubs(s);
      installPassiveAffixPluginManagerBridge(s, passiveAffixPluginParameterStrings);
    },
  });
}
//endregion plugins/passive/passive-affix-vm.js