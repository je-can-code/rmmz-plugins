//region plugins/passive/passive-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin, clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

import { installPassiveEngineStubs } from './fixtures/engine-stubs.js';

export const PASSIVE_OUT_FILENAME = 'J-Passive.js';

/**
 * Loads {@link out/J-Passive.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadPassivePluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: PASSIVE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installPassiveEngineStubs(s);
    },
  });

  vm.runInContext(`
    if (typeof Array.prototype.has !== 'function')
    {
      Array.prototype.has = function(entry)
      {
        return this.includes(entry);
      };
    }
`, sandbox);

  vm.runInContext(`
    globalThis.__passiveTestFixtures = {
      actorData(props)
      {
        return Object.assign(Object.create(RPG_Actor.prototype), props);
      },
      classData(props)
      {
        return Object.assign(Object.create(RPG_Class.prototype), props);
      },
      skillData(props)
      {
        return Object.assign(Object.create(RPG_Skill.prototype), props);
      },
      stateData(props)
      {
        return Object.assign(Object.create(RPG_State.prototype), props);
      },
      weaponData(props)
      {
        return Object.assign(Object.create(RPG_Weapon.prototype), props);
      },
      enemyData(props)
      {
        return Object.assign(Object.create(RPG_Enemy.prototype), props);
      },
    };
  `, sandbox);
}

/**
 * @param {object} sandbox
 */
export function resetPassivePluginSandbox(sandbox)
{
  clearRpgManagerCacheInVm(sandbox);
}
//endregion plugins/passive/passive-vm.js
