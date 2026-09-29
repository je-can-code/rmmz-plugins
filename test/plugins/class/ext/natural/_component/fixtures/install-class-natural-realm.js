//region plugins/class/ext/natural/_component/fixtures/install-class-natural-realm.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../../setup/repo-root.js';
import { installClassCoreRealm } from '../../../../core/_component/fixtures/install-class-core-realm.js';

/**
 * Stands up the class realm with J-NaturalGrowth and J-Classes-Natural on top of it.
 *
 * Brawler grows attack flat, agility by one for every level the actor has, and crit by a percent per level,
 * written out of order so the section has to put them back in the scene's. While worn it buffs accuracy by
 * three per level and max tech flat. Scholar grows defense by a rate and buffs max tech flat. Hermit carries
 * nothing at all, so the section has a class with something in it and a class with nothing.
 *
 * The starting class buffs accuracy by one per level and max tech by the same flat amount Brawler does, the
 * way Chef Adventure authors every class as its starting class's buffs times something. So Brawler measures
 * accuracy at ×3.00, and max tech at ×1.00, which is Brawler leaving it alone.
 * @returns {Promise<void>}
 */
export async function installClassNaturalRealm()
{
  await installClassCoreRealm({}, async () =>
  {
    // the tags each class carries, on the raw rows J-Base is about to rewrite.
    globalThis.$dataClasses[1].note = [
      '<hitBuffPlus:[1*a.level]>',
      '<mtpBuffPlus:[50]>',
    ].join('\n');
    globalThis.$dataClasses[2].note = [
      '<criGrowthPlus:[1.5]>',
      '<atkGrowthPlus:[1.2]>',
      '<agiGrowthPlus:[a.level]>',
      '<hitBuffPlus:[3*a.level]>',
      '<mtpBuffPlus:[50]>',
    ].join('\n');
    globalThis.$dataClasses[3].note = [
      '<defGrowthRate:[10]>',
      '<mtpBuffPlus:[100]>',
    ].join('\n');

    // from `out/` for the same reason the core realm reads J-Base from there.
    const bundle = path.join(repoRoot, 'out/natural/J-NaturalGrowth.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    // normally J-NaturalGrowth's Scene_Boot job, and it must land before any actor asks for its max tech.
    globalThis.NaturalParameterRegistration.registerAll();

    // J-Classes' classes are globals once its bundle loads, which is how this extension reaches them.
    ({ default: globalThis.ClassManager } = await import(
      '../../../../../../../src/plugins/class/core/managers/ClassManager.js'));
    ({ default: globalThis.Window_ClassParameters } = await import(
      '../../../../../../../src/plugins/class/core/windows/Window_ClassParameters.js'));

    // the build-time defines the extension's own bootstrap reads.
    globalThis.__PLUGIN_NAME__ = 'J-Classes-Natural';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../../src/plugins/class/ext/natural/_metadata/initialization.js');

    // the extension measures buffs for J-Classes' multipliers as soon as it loads, as it does in a game.
    await import('../../../../../../../src/plugins/class/ext/natural/managers/ClassManager.js');
  });
}
//endregion plugins/class/ext/natural/_component/fixtures/install-class-natural-realm.js