//region plugins/extend/jabs-skill-slot-manager.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-SkillExtend JABS_SkillSlotManager (out/extend/J-SkillExtend.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSkillExtendPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    vm.runInContext(`
      (() =>
      {
        function dataSkill(id, note)
        {
          const row = Object.create(RPG_Skill.prototype);
          row.id = id;
          row.stypeId = 1;
          row.note = note;
          return row;
        }

        $dataSkills[1] = dataSkill(1, '<skillExtend:[2]>');
        $dataSkills[2] = dataSkill(2, '');
      })()
    `, sandbox);
    clearRpgManagerCacheInVm(sandbox);
  });

  it('filterActionSkills returns false when the action skill is a skill extension', () =>
  {
    const enemy = new sandbox.Game_Enemy();
    const mgr = new sandbox.JABS_SkillSlotManager();
    const action = { skillId: 1 };

    expect(mgr.filterActionSkills(enemy, action)).toBe(false);
  });

  it('filterActionSkills returns true when the action skill is not an extension', () =>
  {
    const enemy = new sandbox.Game_Enemy();
    const mgr = new sandbox.JABS_SkillSlotManager();
    const action = { skillId: 2 };

    expect(mgr.filterActionSkills(enemy, action)).toBe(true);
  });
});
//endregion plugins/extend/jabs-skill-slot-manager.test.js
