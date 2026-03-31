//region plugins/elem/elem-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin, clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

import { installElemEngineStubs } from './fixtures/engine-stubs.js';

export const ELEM_OUT_FILENAME = 'J-Elementalistics.js';

/**
 * @param {object} sandbox
 */
export function loadElemPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: ELEM_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installElemEngineStubs(s);
    },
  });

  vm.runInContext(`
    globalThis.__elemTestFixtures = {
      skillData(props)
      {
        return Object.assign(Object.create(RPG_Skill.prototype), props);
      },
      enemyData(props)
      {
        return Object.assign(Object.create(RPG_Enemy.prototype), props);
      },
      actorData(props)
      {
        return Object.assign(Object.create(RPG_Actor.prototype), props);
      },
    };
  `, sandbox);
}

/**
 * @param {object} sandbox
 */
export function resetElemPluginSandbox(sandbox)
{
  clearRpgManagerCacheInVm(sandbox);
}
//endregion plugins/elem/elem-vm.js
