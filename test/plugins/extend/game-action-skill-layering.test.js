//region plugins/extend/game-action-skill-layering.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-SkillExtend Game_Action skill layering (out/extend/J-SkillExtend.js)', () =>
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
        function dataSkill(id, note, extras)
        {
          const row = Object.create(RPG_Skill.prototype);
          row.id = id;
          row.stypeId = 1;
          row.name = 'skill';
          row.note = note;
          row.meta = {};
          row.damage = { elementId: 0, type: 1, formula: '0' };
          row.effects = [];
          row.message1 = '';
          row.message2 = '';
          row.tpCost = 0;
          row.mpCost = 0;
          row.hitType = 0;
          row.speed = 0;
          row.successRate = 100;
          row.repeats = 1;
          if (extras)
          {
            Object.assign(row, extras);
          }
          return row;
        }

        $dataSkills[1] = dataSkill(1, '', { mpCost: 1, damage: { elementId: 0, type: 1, formula: '0' } });
        $dataSkills[2] = dataSkill(2, '<extend:[1]>', { mpCost: 5 });
        $dataSkills[3] = dataSkill(3, '<extend:[1]>', { damage: { elementId: 0, type: 1, formula: '1+1' }, effects: [ { code: 11 } ] });
      })()
    `, sandbox);
    clearRpgManagerCacheInVm(sandbox);
  });

  it('setSkill uses OverlayManager.getExtendedSkill when a subject exists', () =>
  {
    // a minimal caster for overlay resolution.
    const caster = {
      skills()
      {
        return [ sandbox.$dataSkills[2], sandbox.$dataSkills[3] ];
      },
      skillIds()
      {
        return [ 2, 3 ];
      },
    };

    const action = new sandbox.Game_Action();
    action._subject = caster;
    action.subject = function()
    {
      return caster;
    };

    // verify the overlay skills are detected as such.
    expect(sandbox.$dataSkills[2].isSkillExtension).toBe(true);
    expect(sandbox.$dataSkills[2].getSkillExtensions).toContain(1);
    expect(sandbox.$dataSkills[3].isSkillExtension).toBe(true);
    expect(sandbox.$dataSkills[3].getSkillExtensions).toContain(1);

    action.setSkill(1);

    // the skill stored on the action should be an extended clone, not the base db skill.
    const item = action.item();
    expect(item).toBeDefined();
    expect(item.id).toBe(1);
    expect(item).not.toBe(sandbox.$dataSkills[1]);
    expect(item.damage.formula).toBe('1+1');
    expect(item.effects.length).toBe(1);

    // and the database skill should remain untouched.
    expect(sandbox.$dataSkills[1].damage.formula).toBe('0');
    expect(sandbox.$dataSkills[1].effects.length).toBe(0);
  });
});
//endregion plugins/extend/game-action-skill-layering.test.js

