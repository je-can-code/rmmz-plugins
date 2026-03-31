//region plugins/apt/apt-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installAptEngineStubs } from './fixtures/engine-stubs.js';

export const APT_OUT_FILENAME = 'apt/J-Aptitude.js';

const EXPOSE_APT_GLOBALS = `
globalThis.ApManager = ApManager;
globalThis.AptitudeTeachable = AptitudeTeachable;
globalThis.AptitudeLearning = AptitudeLearning;
globalThis.AptitudeSkill = AptitudeSkill;
globalThis.RPG_Base = RPG_Base;
globalThis.RPG_Weapon = RPG_Weapon;
globalThis.RPG_Skill = RPG_Skill;
`;

/**
 * @param {object} sandbox
 */
export function loadAptPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: APT_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installAptEngineStubs(s);
    },
  });

  vm.runInContext(EXPOSE_APT_GLOBALS, sandbox);
}
//endregion plugins/apt/apt-vm.js
