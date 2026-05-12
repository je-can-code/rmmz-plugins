//region plugins/_base/rpg-create-empty.test.js
import vm from 'node:vm';

import { beforeAll, describe, expect, it } from 'vitest';

import { evaluateJBaseOnlyForTests } from '../../setup/shipped-plugin-vm.js';

describe('J-Base RPG_* createEmpty (out/J-Base.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };

    evaluateJBaseOnlyForTests({
      sandbox,
    });
  });

  it('RPG_Weapon.createEmpty returns a blank hydrated weapon at the requested index', () =>
  {
    const w = vm.runInContext('RPG_Weapon.createEmpty(2005)', sandbox);

    expect(w.id).toBe(2005);
    expect(w.index).toBe(2005);
    expect(w.name).toBe('');
    expect(w.traits.length).toBe(0);
    expect(w.params.every(v => v === 0)).toBe(true);
    expect(w.isWeapon()).toBe(true);
  });

  it('RPG_Armor.createEmpty returns a blank hydrated armor at the requested index', () =>
  {
    const a = vm.runInContext('RPG_Armor.createEmpty(2005)', sandbox);

    expect(a.id).toBe(2005);
    expect(a.index).toBe(2005);
    expect(a.name).toBe('');
    expect(a.traits.length).toBe(0);
    expect(a.isArmor()).toBe(true);
  });

  it('RPG_Item.createEmpty returns a blank item wrapper', () =>
  {
    const item = vm.runInContext('RPG_Item.createEmpty(111)', sandbox);

    expect(item.id).toBe(111);
    expect(item.effects.length).toBe(0);
    expect(item.isItem()).toBe(true);
  });

  it('RPG_Skill.createEmpty returns a blank skill wrapper', () =>
  {
    const skill = vm.runInContext('RPG_Skill.createEmpty(92)', sandbox);

    expect(skill.id).toBe(92);
    expect(skill.effects.length).toBe(0);
    expect(skill.isSkill()).toBe(true);
  });

  it('RPG_State.createEmpty returns a blank state wrapper', () =>
  {
    const state = vm.runInContext('RPG_State.createEmpty(89)', sandbox);

    expect(state.id).toBe(89);
    expect(state.traits.length).toBe(0);
    expect(state.isState()).toBe(true);
  });
});
//endregion plugins/_base/rpg-create-empty.test.js
