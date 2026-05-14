//region plugins/extend/extend-vm.js
import { installJabsOnChanceEffectGlobalStub } from '../_base/fixtures/install-jabs-onchance-stub.js';
import { installExtendEngineStubs } from './fixtures/engine-stubs.js';
import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

export const SKILL_EXTEND_OUT_FILENAME = 'J-SkillExtend.js';

/**
 * Loads {@link out/J-SkillExtend.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadSkillExtendPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: SKILL_EXTEND_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installJabsOnChanceEffectGlobalStub(s);
      installExtendEngineStubs(s);
    },
  });
}
//endregion plugins/extend/extend-vm.js
