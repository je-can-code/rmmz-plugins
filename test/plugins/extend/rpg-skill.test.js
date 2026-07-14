//region plugins/extend/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-SkillExtend RPG_Skill (direct src import)', () =>
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
    ({ default: RPG_Skill } = await import('../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    globalThis.RPG_Skill = RPG_Skill;

    setPluginContextToJExtend();
    await import('../../../src/plugins/extend/core/_metadata/initialization.js');

    // patches globalThis.RPG_Skill.prototype directly, no vm involved.
    await import('../../../src/plugins/extend/core/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  it('detects extend tags via isSkillExtension and getSkillExtensions', () =>
  {
    // Arrange
    const skill = Object.create(RPG_Skill.prototype);
    skill.note = '<extend:[2, 3]>';

    // Act & Assert
    expect(skill.isSkillExtension).toBe(true);
    expect(skill.getSkillExtensions).toEqual([ 2, 3 ]);
  });
});
//endregion plugins/extend/rpg-skill.test.js
