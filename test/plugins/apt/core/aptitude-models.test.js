//region plugins/apt/core/aptitude-models.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';

import { loadAptPluginVm } from './apt-vm.js';

describe('J-Aptitude models and RPG_Base notes (out/apt/J-Aptitude.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAptPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('AptitudeLearning isLearned reflects required AP', () =>
  {
    const { AptitudeLearning } = sandbox;
    const low = new AptitudeLearning(3, 10, 4);
    expect(low.isLearned()).toBe(false);
    low.setAp(10);
    expect(low.isLearned()).toBe(true);
  });

  it('AptitudeSkill learn and forget toggle state', () =>
  {
    const { AptitudeSkill, AptitudeProgress } = sandbox;
    const skill = new AptitudeSkill(8, false);
    const progress = new AptitudeProgress('class:1', {});
    skill.learnSkill(progress);
    expect(skill.learned).toBe(true);
    expect(skill.learnedFrom()).toBe('class:1');
    skill.forgetSkill();
    expect(skill.learned).toBe(false);
  });

  it('buildAptitudeTeachings parses aptitude tags from notes', () =>
  {
    clearRpgManagerCacheInVm(sandbox);
    const weapon = Object.assign(Object.create(sandbox.RPG_Weapon.prototype), {
      id: 5,
      note: '<aptitude:[12, 40]>',
    });
    const list = weapon.buildAptitudeTeachings();
    expect(list.length).toBe(1);
    expect(list[0].skillId).toBe(12);
    expect(list[0].requiredAp).toBe(40);
  });
});
//endregion plugins/apt/core/aptitude-models.test.js
