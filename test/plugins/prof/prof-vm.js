//region plugins/prof/prof-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin, clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

import { buildVitestProficiencyConfigJson } from './fixtures/prof-config-json.js';
import { installProfEngineStubs } from './fixtures/engine-stubs.js';

export const PROF_OUT_FILENAME = 'J-Proficiency.js';

/**
 * @param {object} sandbox
 */
export function loadProfPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: PROF_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installProfEngineStubs(s, buildVitestProficiencyConfigJson);
    },
  });

  vm.runInContext(`
    globalThis.__profTestFixtures = {
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
export function resetProfPluginSandbox(sandbox)
{
  clearRpgManagerCacheInVm(sandbox);
}
//endregion plugins/prof/prof-vm.js
