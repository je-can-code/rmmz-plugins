//region plugins/class/ext/apt/_component/fixtures/install-class-apt-realm.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../../setup/repo-root.js';
import { installClassCoreRealm } from '../../../../core/_component/fixtures/install-class-core-realm.js';

/**
 * Builds a raw skill row, in the shape RPG Maker writes it.
 * @param {number} id The skill id.
 * @param {string} name The skill name.
 * @returns {object} A raw database row.
 */
const skillRow = (id, name) => ({
  id,
  name,
  iconIndex: 64 + id,
  description: '',
  stypeId: 1,
  scope: 1,
  mpCost: 0,
  tpCost: 0,
  occasion: 0,
  speed: 0,
  successRate: 100,
  repeats: 1,
  tpGain: 0,
  hitType: 0,
  animationId: 0,
  message1: '',
  message2: '',
  requiredWtypeId1: 0,
  requiredWtypeId2: 0,
  damage: {
    type: 0,
    elementId: 0,
    formula: '0',
    variance: 0,
    critical: false,
  },
  effects: [],
  note: '',
});

/**
 * Loads J-SkillSlots' bootstrap and hands back its namespace, without leaving it installed.
 *
 * J-Classes-Aptitude reads J-SkillSlots' `<unslottedSkills>` tag, through J-SkillSlots' own expression, only
 * when J-SkillSlots is installed. The realm runs without it, so a test that needs it puts the namespace in
 * place itself and takes it away again afterwards.
 * @returns {Promise<object>} J-SkillSlots' namespace.
 */
export async function loadSkillSlotsNamespace()
{
  // J-SkillSlots' bootstrap names itself from the build-time defines, which belong to this realm's extension.
  const extensionName = globalThis.__PLUGIN_NAME__;
  const extensionVersion = globalThis.__PLUGIN_VERSION__;
  globalThis.__PLUGIN_NAME__ = 'J-SkillSlots';
  globalThis.__PLUGIN_VERSION__ = '1.0.0';
  await import('../../../../../../../src/plugins/sks/core/_metadata/initialization.js');
  globalThis.__PLUGIN_NAME__ = extensionName;
  globalThis.__PLUGIN_VERSION__ = extensionVersion;

  // hand the namespace over, leaving the realm as it was.
  const { SKS } = globalThis.J;
  delete globalThis.J.SKS;

  return SKS;
}

/**
 * Stands up the class realm with J-Aptitude and J-Classes-Aptitude on top of it.
 *
 * Brawler teaches two skills and Scholar one, while Hermit teaches nothing at all- so every question about
 * progress has a class with some, a class with more, and a class with none to be asked about. Brawler and
 * Scholar each keep skills known through `<unslottedSkills>` too, Brawler across two tags that share a skill.
 *
 * The class actor 1 starts in lends Wide Swing through an Add Skill trait, the way Chef Adventure's classes
 * lend their equip skills. So actor 1 can use Wide Swing without ever having learned it, which is exactly
 * the case a teachable must not mistake for knowing it.
 * @returns {Promise<void>}
 */
export async function installClassAptRealm()
{
  await installClassCoreRealm({}, async () =>
  {
    // the skills the classes teach, as raw rows J-Base rewrites alongside everything else.
    globalThis.$dataSkills = [ null, skillRow(1, 'Wide Swing'), skillRow(2, 'Stomp'), skillRow(3, 'Ponder') ];

    // the starting class lends Wide Swing, which Brawler also teaches.
    globalThis.$dataClasses[1].traits = [ { code: 43, dataId: 1, value: 0 } ];
    globalThis.$dataClasses[2].note = [
      '<aptitude:[1, 50]>',
      '<aptitude:[2, 750]>',
      '<unslottedSkills:[3, 1]>',
      '<unslottedSkills:[1]>',
    ].join('\n');
    globalThis.$dataClasses[3].note = [
      '<aptitude:[3, 100]>',
      '<unslottedSkills:[2]>',
    ].join('\n');

    // J-Aptitude refuses to boot without J-ABS, then extends its engine; this realm has neither, so a
    // satisfying version and a bare engine stand in.
    globalThis.J.ABS = {
      Metadata: {
        version: {
          version: () => '4.13.0',
        },
      },
    };
    globalThis.JABS_Engine = function JABS_Engine()
    {
    };
    globalThis.JABS_Engine.prototype.gainBasicRewards = () => {};

    // from `out/` for the same reason the core realm reads J-Base from there.
    const bundle = path.join(repoRoot, 'out/apt/J-Aptitude.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    // J-Classes' classes are globals once its bundle loads, which is how this extension reaches them.
    ({ default: globalThis.ClassManager } = await import(
      '../../../../../../../src/plugins/class/core/managers/ClassManager.js'));
    ({ default: globalThis.ClassSceneLayout } = await import(
      '../../../../../../../src/plugins/class/core/helpers/ClassSceneLayout.js'));
    ({ default: globalThis.Scene_Classes } = await import(
      '../../../../../../../src/plugins/class/core/scenes/Scene_Classes.js'));
    ({ default: globalThis.Window_ClassList } = await import(
      '../../../../../../../src/plugins/class/core/windows/Window_ClassList.js'));

    // the build-time defines the extension's own bootstrap reads.
    globalThis.__PLUGIN_NAME__ = 'J-Classes-Aptitude';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../../src/plugins/class/ext/apt/_metadata/initialization.js');
  });
}
//endregion plugins/class/ext/apt/_component/fixtures/install-class-apt-realm.js