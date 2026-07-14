//region plugins/extend/_component/jabs-skill-slot-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-SkillExtend JABS_SkillSlotManager (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js').default} */
  let RPG_Skill;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: RPG_Skill } = await import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    globalThis.RPG_Skill = RPG_Skill;

    setPluginContextToJExtend();
    await import('../../../../src/plugins/extend/core/_metadata/initialization.js');

    await import('../../../../src/plugins/extend/core/database/RPG_Skill.js');

    // patches globalThis.JABS_SkillSlotManager.prototype directly, no vm involved.
    await import('../../../../src/plugins/extend/core/managers/JABS_SkillSlotManager.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    function dataSkill(id, note)
    {
      const row = Object.create(RPG_Skill.prototype);
      row.id = id;
      row.stypeId = 1;
      row.note = note;
      return row;
    }

    globalThis.$dataSkills[1] = dataSkill(1, '<extend:[2]>');
    globalThis.$dataSkills[2] = dataSkill(2, '');
  });

  it('filterActionSkills returns false when the action skill is a skill extension', () =>
  {
    // Arrange
    const enemy = new globalThis.Game_Enemy();
    const mgr = new globalThis.JABS_SkillSlotManager();
    const action = { skillId: 1 };

    // Act & Assert
    expect(mgr.filterActionSkills(enemy, action)).toBe(false);
  });

  it('filterActionSkills returns true when the action skill is not an extension', () =>
  {
    // Arrange
    const enemy = new globalThis.Game_Enemy();
    const mgr = new globalThis.JABS_SkillSlotManager();
    const action = { skillId: 2 };

    // Act & Assert
    expect(mgr.filterActionSkills(enemy, action)).toBe(true);
  });
});
//endregion plugins/extend/_component/jabs-skill-slot-manager.test.js
