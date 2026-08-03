//region plugins/_base/_component/rpg-implementations-residual-coverage.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

/**
 * Closes out residual branch/statement gaps left on the RPG_* implementation classes after
 * DataManager.test.js incidentally exercised their constructors- this file targets the specific
 * getters/mappers (isX() predicates, implementationType(), and non-empty array mapper bodies)
 * that construction alone doesn't reach.
 */
describe('RPG_* implementations residual coverage (direct src import)', () =>
{
  let RPG_Actor;
  let RPG_Armor;
  let RPG_Class;
  let RPG_Enemy;
  let RPG_EquipItem;
  let RPG_Item;
  let RPG_Skill;
  let RPG_State;
  let RPG_Weapon;

  beforeAll(async () =>
  {
    installJBaseHostGlobals();

    ({ default: RPG_Actor } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Actor.js'));
    ({ default: RPG_Armor } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Armor.js'));
    ({ default: RPG_Class } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Class.js'));
    ({ default: RPG_Enemy } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Enemy.js'));
    ({ default: RPG_EquipItem } = await import('../../../../../src/plugins/_base/core/database/core/RPG_EquipItem.js'));
    ({ default: RPG_Item } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Item.js'));
    ({ default: RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    ({ default: RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));
    ({ default: RPG_Weapon } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Weapon.js'));
  });

  const rawBase = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0 };

  describe('RPG_Class', () =>
  {
    it('maps a non-empty learnings array into RPG_ClassLearning instances', () =>
    {
      // Arrange
      const raw = { ...rawBase, traits: [], expParams: [ 0, 0, 0, 0 ], learnings: [ { level: 5, skillId: 3, note: '' } ], params: [ [ 1 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ] ] };

      // Act
      const klass = new RPG_Class(raw, 1);

      // Assert
      expect(klass.learnings).toHaveLength(1);
      expect(klass.learnings[0].skillId).toBe(3);
    });

    it('isClass returns true', () =>
    {
      const raw = { ...rawBase, traits: [], expParams: [ 0, 0, 0, 0 ], learnings: [], params: [ [ 1 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ] ] };
      expect(new RPG_Class(raw, 1).isClass()).toBe(true);
    });

    it('implementationType appends ":class"', () =>
    {
      const raw = { ...rawBase, traits: [], expParams: [ 0, 0, 0, 0 ], learnings: [], params: [ [ 1 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ] ] };
      expect(new RPG_Class(raw, 1).implementationType()).toBe('@base:traited:class');
    });
  });

  describe('RPG_EquipItem', () =>
  {
    function buildEquip(etypeId)
    {
      return new RPG_EquipItem({ ...rawBase, traits: [], etypeId, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ], price: 0 }, 1);
    }

    it('isWeapon returns true when etypeId is 1', () =>
    {
      expect(buildEquip(1).isWeapon()).toBe(true);
    });

    it('isWeapon returns false when etypeId is not 1', () =>
    {
      expect(buildEquip(2).isWeapon()).toBe(false);
    });

    it('isArmor returns true when etypeId is greater than 1', () =>
    {
      expect(buildEquip(2).isArmor()).toBe(true);
    });

    it('isArmor returns false when etypeId is 1 or less', () =>
    {
      expect(buildEquip(1).isArmor()).toBe(false);
    });

    it('isEquipItem returns true', () =>
    {
      expect(buildEquip(1).isEquipItem()).toBe(true);
    });

    it('implementationType appends ":equip"', () =>
    {
      expect(buildEquip(1).implementationType()).toBe('@base:traited:equip');
    });
  });

  describe('RPG_BaseBattler', () =>
  {
    it('implementationType appends ":battler" (via RPG_Actor, the concrete subclass)', () =>
    {
      // Arrange
      const raw = { ...rawBase, traits: [], battlerName: '', characterIndex: 0, characterName: '', classId: 0, equips: [ 0, 0, 0, 0, 0 ], faceIndex: 0, faceName: '', initialLevel: 1, maxLevel: 99, nickname: '', profile: '' };

      // Act
      const actor = new RPG_Actor(raw, 1);

      // Assert- RPG_Actor's own implementationType calls super, threading through RPG_BaseBattler's ":battler" segment.
      expect(actor.implementationType()).toBe('@base:traited:battler:actor');
    });
  });

  describe('RPG_Armor', () =>
  {
    function buildArmor()
    {
      return new RPG_Armor({ ...rawBase, traits: [], etypeId: 1, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ], price: 0, atypeId: 1 }, 1);
    }

    it('isEquipItem returns true', () =>
    {
      expect(buildArmor().isEquipItem()).toBe(true);
    });

    it('implementationType appends ":armor"', () =>
    {
      expect(buildArmor().implementationType()).toBe('@base:traited:equip:armor');
    });
  });

  describe('RPG_Enemy', () =>
  {
    it('maps non-empty actions and dropItems arrays into their wrapper classes', () =>
    {
      // Arrange
      const raw = {
        ...rawBase,
        traits: [],
        battlerName: '',
        actions: [ { conditionParam1: 0, conditionParam2: 0, conditionType: 0, rating: 5, skillId: 1 } ],
        battlerHue: 0,
        dropItems: [ { kind: 1, dataId: 1, denominator: 1 } ],
        exp: 0,
        gold: 0,
        params: [ 1, 0, 0, 0, 0, 0, 0, 0 ],
      };

      // Act
      const enemy = new RPG_Enemy(raw, 1);

      // Assert
      expect(enemy.actions).toHaveLength(1);
      expect(enemy.actions[0].skillId).toBe(1);
      expect(enemy.dropItems).toHaveLength(1);
      expect(enemy.dropItems[0].dataId).toBe(1);
    });

    it('implementationType appends ":enemy"', () =>
    {
      const raw = { ...rawBase, traits: [], battlerName: '', actions: [], battlerHue: 0, dropItems: [], exp: 0, gold: 0, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ] };
      expect(new RPG_Enemy(raw, 1).implementationType()).toBe('@base:traited:battler:enemy');
    });

    it('isEnemy returns true', () =>
    {
      const raw = { ...rawBase, traits: [], battlerName: '', actions: [], battlerHue: 0, dropItems: [], exp: 0, gold: 0, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ] };
      expect(new RPG_Enemy(raw, 1).isEnemy()).toBe(true);
    });
  });

  describe('RPG_Weapon', () =>
  {
    it('isEquipItem returns true', () =>
    {
      const raw = { ...rawBase, traits: [], etypeId: 1, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ], price: 0, animationId: -1, wtypeId: 1 };
      expect(new RPG_Weapon(raw, 1).isEquipItem()).toBe(true);
    });

    it('implementationType appends ":weapon"', () =>
    {
      const raw = { ...rawBase, traits: [], etypeId: 1, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ], price: 0, animationId: -1, wtypeId: 1 };
      expect(new RPG_Weapon(raw, 1).implementationType()).toBe('@base:traited:equip:weapon');
    });
  });

  describe('RPG_UsableItem', () =>
  {
    it('implementationType appends ":usable" (via RPG_Item, the concrete subclass)', () =>
    {
      const raw = { ...rawBase, animationId: -1, damage: { critical: false, elementId: -1, formula: '0', type: 0, variance: 0 }, effects: [], hitType: 0, occasion: 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0, consumable: true, itypeId: 1, price: 0 };
      expect(new RPG_Item(raw, 1).implementationType()).toBe('@base:usable:item');
    });

    it('maps a non-empty effects array into RPG_UsableEffect instances', () =>
    {
      // Arrange
      const raw = {
        ...rawBase,
        animationId: -1,
        damage: { critical: false, elementId: -1, formula: '0', type: 0, variance: 0 },
        effects: [ { code: 11, dataId: 0, value1: 0.5, value2: 0 } ],
        hitType: 0, occasion: 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0,
        consumable: true, itypeId: 1, price: 0,
      };

      // Act
      const item = new RPG_Item(raw, 1);

      // Assert
      expect(item.effects).toHaveLength(1);
      expect(item.effects[0].code).toBe(11);
    });
  });

  describe('RPG_Actor', () =>
  {
    function buildActor()
    {
      const raw = { ...rawBase, traits: [], battlerName: '', characterIndex: 0, characterName: '', classId: 0, equips: [ 0, 0, 0, 0, 0 ], faceIndex: 0, faceName: '', initialLevel: 1, maxLevel: 99, nickname: '', profile: '' };
      return new RPG_Actor(raw, 1);
    }

    it('isActor returns true', () =>
    {
      expect(buildActor().isActor()).toBe(true);
    });

    it('implementationType appends ":actor"', () =>
    {
      expect(buildActor().implementationType()).toBe('@base:traited:battler:actor');
    });
  });

  describe('RPG_Item', () =>
  {
    it('implementationType appends ":item"', () =>
    {
      const raw = { ...rawBase, animationId: -1, damage: { critical: false, elementId: -1, formula: '0', type: 0, variance: 0 }, effects: [], hitType: 0, occasion: 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0, consumable: true, itypeId: 1, price: 0 };
      expect(new RPG_Item(raw, 1).implementationType()).toBe('@base:usable:item');
    });
  });

  describe('RPG_Skill', () =>
  {
    it('implementationType appends ":skill"', () =>
    {
      const raw = { ...rawBase, animationId: -1, damage: { critical: false, elementId: -1, formula: '0', type: 0, variance: 0 }, effects: [], hitType: 0, occasion: 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0, message1: '', message2: '', mpCost: 0, requiredWtypeId1: 0, requiredWtypeId2: 0, stypeId: 0, tpCost: 0 };
      expect(new RPG_Skill(raw, 1).implementationType()).toBe('@base:usable:skill');
    });
  });

  describe('RPG_State', () =>
  {
    it('implementationType appends ":state"', () =>
    {
      const raw = { ...rawBase, traits: [], autoRemovalTiming: 0, chanceByDamage: 100, maxTurns: 1, message1: '', message2: '', message3: '', message4: '', minTurns: 1, motion: 0, overlay: 0, priority: 50, removeAtBattleEnd: false, removeByDamage: false, removeByRestriction: false, removeByWalking: false, restriction: 0, stepsToRemove: 100 };
      expect(new RPG_State(raw, 1).implementationType()).toBe('@base:traited:state');
    });
  });
});
//endregion plugins/_base/_component/rpg-implementations-residual-coverage.test.js
