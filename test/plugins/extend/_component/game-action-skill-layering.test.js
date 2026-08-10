//region plugins/extend/_component/game-action-skill-layering.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-SkillExtend Game_Action skill layering (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js').default} */
  let RPG_Skill;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.NoteResolver } = await import('../../../../src/plugins/_base/core/managers/NoteResolver.js'));
    ({ default: globalThis.JCache } = await import('../../../../src/plugins/_base/core/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../src/plugins/_base/core/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPG_Base } = await import('../../../../src/plugins/_base/core/database/base/RPG_Base.js'));
    ({ default: RPG_Skill } = await import('../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    globalThis.RPG_Skill = RPG_Skill;

    setPluginContextToJExtend();
    await import('../../../../src/plugins/extend/core/_metadata/initialization.js');

    // patches globalThis.RPG_Base.prototype directly (RPG_Skill inherits it), no vm involved.
    await import('../../../../src/plugins/extend/core/database/RPG_Base.js');

    // OverlayManager.getExtendedSkill() is what extend's own Game_Action.js#setSkill calls into.
    ({ default: globalThis.OverlayManager } = await import('../../../../src/plugins/extend/core/managers/OverlayManager.js'));

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    // J-Base owns the rawItem() accessor extend's Game_Action reads through.
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

    await import('../../../../src/plugins/extend/core/objects/Game_Action.js');
  });

  /**
   * Builds a minimal RPG_Skill-shaped database row for overlay-resolution tests.
   * @param {number} id
   * @param {string} note
   * @param {object} [extras]
   * @returns {object}
   */
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

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.OverlayManager.clearCache();

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
    expect(globalThis.$dataSkills[2].isExtension).toBe(true);
    expect(globalThis.$dataSkills[2].getExtensions).toContain(1);
    expect(globalThis.$dataSkills[3].isExtension).toBe(true);
    expect(globalThis.$dataSkills[3].getExtensions).toContain(1);

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

  it('setSkill applies a type-based extendType overlay from a known skill sharing a <type> classifier', () =>
  {
    // Arrange: a target skill classified "low-effort", and a known skill that extends that type.
    globalThis.$dataSkills[1] = dataSkill(1, '<type:low-effort>', { mpCost: 1, damage: { elementId: 0, type: 1, formula: '0' } });
    globalThis.$dataSkills[6] = dataSkill(6, '<extendType:low-effort>', {
      mpCost: 9, damage: { elementId: 0, type: 1, formula: '2+2' },
    });
    const caster = {
      skills()
      {
        return [ globalThis.$dataSkills[6] ];
      },
      skillIds()
      {
        return [ 6 ];
      },
    };
    const action = new globalThis.Game_Action();
    action._subject = caster;
    action.subject = function()
    {
      return caster;
    };

    // verify the overlay skill is detected as a type-based extension.
    expect(globalThis.$dataSkills[6].isExtension).toBe(true);
    expect(globalThis.$dataSkills[6].getExtensionTypes).toContain('low-effort');

    // Act
    action.setSkill(1);
    const item = action.item();

    // Assert: the type-based overlay applied even though it never listed skill 1 by id.
    expect(item.mpCost).toBe(9);
    expect(item.damage.formula).toBe('2+2');
  });

  it('setSkill has id-based extend win over a conflicting type-based extendType overlay', () =>
  {
    // Arrange: a target skill classified "low-effort" with both a type-based and an id-based overlay known.
    globalThis.$dataSkills[1] = dataSkill(1, '<type:low-effort>', { mpCost: 1, damage: { elementId: 0, type: 1, formula: '0' } });
    globalThis.$dataSkills[6] = dataSkill(6, '<extendType:low-effort>', {
      mpCost: 9, damage: { elementId: 0, type: 1, formula: '2+2' },
    });
    globalThis.$dataSkills[7] = dataSkill(7, '<extend:[1]>', {
      mpCost: 4, damage: { elementId: 0, type: 1, formula: '9+9' },
    });
    const caster = {
      skills()
      {
        return [ globalThis.$dataSkills[6], globalThis.$dataSkills[7] ];
      },
      skillIds()
      {
        return [ 6, 7 ];
      },
    };
    const action = new globalThis.Game_Action();
    action._subject = caster;
    action.subject = function()
    {
      return caster;
    };

    // Act
    action.setSkill(1);
    const item = action.item();

    // Assert: id-based overlays apply after type-based ones, so the id-based formula wins.
    expect(item.mpCost).toBe(4);
    expect(item.damage.formula).toBe('9+9');
  });
});
//endregion plugins/extend/_component/game-action-skill-layering.test.js
