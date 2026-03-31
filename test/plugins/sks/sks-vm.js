//region plugins/sks/sks-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin, clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

import { installSksEngineStubs } from './fixtures/engine-stubs.js';

export const SKS_OUT_FILENAME = 'J-SkillSlots.js';

/**
 * @param {object} sandbox
 * @param {object} [options]
 * @param {Record<string, string>} [options.skillSlotsParameters] `PluginManager.parameters('J-SkillSlots')` shape.
 */
export function loadSksPluginVm(sandbox, options = {})
{
  const { skillSlotsParameters } = options;

  evaluateShippedPlugin({
    outFilename: SKS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installSksEngineStubs(s, skillSlotsParameters);
    },
  });

  vm.runInContext(`
    globalThis.__sksTestFixtures = {
      skillData(props)
      {
        return Object.assign(Object.create(RPG_Skill.prototype), props);
      },
      weaponData(props)
      {
        return Object.assign(Object.create(RPG_Weapon.prototype), props);
      },
    };
  `, sandbox);
}

/**
 * @param {object} sandbox
 */
export function resetSksPluginSandbox(sandbox)
{
  clearRpgManagerCacheInVm(sandbox);
}
//endregion plugins/sks/sks-vm.js
