//region plugins/extend/game-action-skill-layering.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-SkillExtend Game_Action skill layering (direct src import)', () =>
{
  /** @type {typeof import('../../../src/plugins/_base/database/implementations/RPG_Skill.js').default} */
  let RPG_Skill;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../src/plugins/_base/core/JCache.js'));
    ({ default: RPG_Skill } = await import('../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    globalThis.RPG_Skill = RPG_Skill;

    setPluginContextToJExtend();
    await import('../../../src/plugins/extend/core/_metadata/initialization.js');

    await import('../../../src/plugins/extend/core/database/RPG_Skill.js');

    // OverlayManager.getExtendedSkill() is what extend's own Game_Action.js#setSkill calls into.
    ({ default: globalThis.OverlayManager } = await import('../../../src/plugins/extend/core/managers/OverlayManager.js'));

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../src/plugins/extend/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.OverlayManager.clearCache();

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

    globalThis.$dataSkills[1] = dataSkill(1, '', { mpCost: 1, damage: { elementId: 0, type: 1, formula: '0' } });
    globalThis.$dataSkills[2] = dataSkill(2, '<extend:[1]>', { mpCost: 5 });
    globalThis.$dataSkills[3] = dataSkill(3, '<extend:[1]>', {
      damage: { elementId: 0, type: 1, formula: '1+1' }, effects: [ { code: 11 } ],
    });
  });

  it('setSkill uses OverlayManager.getExtendedSkill when a subject exists', () =>
  {
    // Arrange: a minimal caster for overlay resolution.
    const caster = {
      skills()
      {
        return [ globalThis.$dataSkills[2], globalThis.$dataSkills[3] ];
      },
      skillIds()
      {
        return [ 2, 3 ];
      },
    };
    const action = new globalThis.Game_Action();
    action._subject = caster;
    action.subject = function()
    {
      return caster;
    };

    // verify the overlay skills are detected as such.
    expect(globalThis.$dataSkills[2].isSkillExtension).toBe(true);
    expect(globalThis.$dataSkills[2].getSkillExtensions).toContain(1);
    expect(globalThis.$dataSkills[3].isSkillExtension).toBe(true);
    expect(globalThis.$dataSkills[3].getSkillExtensions).toContain(1);

    // Act
    action.setSkill(1);
    const item = action.item();

    // Assert: the skill stored on the action should be an extended clone, not the base db skill.
    expect(item).toBeDefined();
    expect(item.id).toBe(1);
    expect(item).not.toBe(globalThis.$dataSkills[1]);
    expect(item.damage.formula).toBe('1+1');
    expect(item.effects.length).toBe(1);

    // and the database skill should remain untouched.
    expect(globalThis.$dataSkills[1].damage.formula).toBe('0');
    expect(globalThis.$dataSkills[1].effects.length).toBe(0);
  });
});
//endregion plugins/extend/game-action-skill-layering.test.js
