//region plugins/_base/rpg-create-empty.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('RPG_* createEmpty', () =>
{
  let RPG_Weapon;
  let RPG_Armor;
  let RPG_Item;
  let RPG_Skill;
  let RPG_State;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply the String.empty/Array.empty
    // sentinel augmentations RPG_* createEmpty() relies on.
    vi.resetModules();

    installJBaseHostGlobals();

    // real production code- installs the String.empty/Array.empty sentinels onto their global prototypes.
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPG_Weapon } = await import('../../../src/plugins/_base/database/implementations/RPG_Weapon.js'));
    ({ default: RPG_Armor } = await import('../../../src/plugins/_base/database/implementations/RPG_Armor.js'));
    ({ default: RPG_Item } = await import('../../../src/plugins/_base/database/implementations/RPG_Item.js'));
    ({ default: RPG_Skill } = await import('../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: RPG_State } = await import('../../../src/plugins/_base/database/implementations/RPG_State.js'));
  });

  describe('RPG_Weapon.createEmpty', () =>
  {
    it('returns a blank hydrated weapon at the requested index', () =>
    {
      // Arrange
      const index = 2005;

      // Act
      const weapon = RPG_Weapon.createEmpty(index);

      // Assert
      expect(weapon.id).toBe(2005);
      expect(weapon.index).toBe(2005);
      expect(weapon.name).toBe('');
      expect(weapon.traits.length).toBe(0);
      expect(weapon.params.every(v => v === 0)).toBe(true);
      expect(weapon.isWeapon()).toBe(true);
    });
  });

  describe('RPG_Armor.createEmpty', () =>
  {
    it('returns a blank hydrated armor at the requested index', () =>
    {
      // Arrange
      const index = 2005;

      // Act
      const armor = RPG_Armor.createEmpty(index);

      // Assert
      expect(armor.id).toBe(2005);
      expect(armor.index).toBe(2005);
      expect(armor.name).toBe('');
      expect(armor.traits.length).toBe(0);
      expect(armor.isArmor()).toBe(true);
    });
  });

  describe('RPG_Item.createEmpty', () =>
  {
    it('returns a blank item wrapper at the requested index', () =>
    {
      // Arrange
      const index = 111;

      // Act
      const item = RPG_Item.createEmpty(index);

      // Assert
      expect(item.id).toBe(111);
      expect(item.effects.length).toBe(0);
      expect(item.isItem()).toBe(true);
    });
  });

  describe('RPG_Skill.createEmpty', () =>
  {
    it('returns a blank skill wrapper at the requested index', () =>
    {
      // Arrange
      const index = 92;

      // Act
      const skill = RPG_Skill.createEmpty(index);

      // Assert
      expect(skill.id).toBe(92);
      expect(skill.effects.length).toBe(0);
      expect(skill.isSkill()).toBe(true);
    });
  });

  describe('RPG_State.createEmpty', () =>
  {
    it('returns a blank state wrapper at the requested index', () =>
    {
      // Arrange
      const index = 89;

      // Act
      const state = RPG_State.createEmpty(index);

      // Assert
      expect(state.id).toBe(89);
      expect(state.traits.length).toBe(0);
      expect(state.isState()).toBe(true);
    });
  });
});
//endregion plugins/_base/rpg-create-empty.test.js
