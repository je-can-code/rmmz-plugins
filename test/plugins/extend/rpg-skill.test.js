//region plugins/extend/rpg-skill.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-SkillExtend RPG_Skill (out/extend/J-SkillExtend.js)', () =>
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
    clearRpgManagerCacheInVm(sandbox);
  });

  it('detects extend tags via isSkillExtension and getSkillExtensions', () =>
  {
    const skill = vm.runInContext(`
      (() =>
      {
        const s = Object.create(RPG_Skill.prototype);
        s.note = '<extend:[2, 3]>';
        return s;
      })()
    `, sandbox);

    expect(skill.isSkillExtension).toBe(true);
    expect(skill.getSkillExtensions).toEqual([ 2, 3 ]);
  });
});
//endregion plugins/extend/rpg-skill.test.js
