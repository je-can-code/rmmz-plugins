//region plugins/passive/game-battler-passive.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPassiveTestFixtures,
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';

describe('J-Passive Game_Battler / Game_Actor (direct src import)', () =>
{
  let fixtures;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));

    // RPG_BaseItem.js/RPG_BaseBattler.js (passive) patch these bare globals' prototypes directly-
    // must be the same module instances RPG_Actor/RPG_Class/etc. (imported below) extend.
    ({ default: globalThis.RPG_BaseItem } = await import('../../../src/plugins/_base/database/base/RPG_BaseItem.js'));
    ({ default: globalThis.RPG_BaseBattler } = await import('../../../src/plugins/_base/database/core/RPG_BaseBattler.js'));

    ({ default: globalThis.RPG_Actor } = await import('../../../src/plugins/_base/database/implementations/RPG_Actor.js'));
    ({ default: globalThis.RPG_Class } = await import('../../../src/plugins/_base/database/implementations/RPG_Class.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.RPG_State } = await import('../../../src/plugins/_base/database/implementations/RPG_State.js'));
    ({ default: globalThis.RPG_Weapon } = await import('../../../src/plugins/_base/database/implementations/RPG_Weapon.js'));
    ({ default: globalThis.RPG_Enemy } = await import('../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    fixtures = buildPassiveTestFixtures({
      RPG_Actor: globalThis.RPG_Actor,
      RPG_Class: globalThis.RPG_Class,
      RPG_Skill: globalThis.RPG_Skill,
      RPG_State: globalThis.RPG_State,
      RPG_Weapon: globalThis.RPG_Weapon,
      RPG_Enemy: globalThis.RPG_Enemy,
    });

    // patches globalThis.Game_BattlerBase.prototype with traitObjects(), Game_Battler.prototype with
    // allStates(), and Game_Actor.prototype with databaseData() -> this.actor()- all of which
    // passive's own Game_Battler.js/Game_Actor.js rely on.
    await import('../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJPassive();
    await import('../../../src/plugins/passive/core/_metadata/initialization.js');

    // patches the real RPG_* prototype chain with passive note-tag getters, no vm involved.
    await import('../../../src/plugins/passive/core/database/RPG_BaseItem.js');
    await import('../../../src/plugins/passive/core/database/RPG_BaseBattler.js');
    await import('../../../src/plugins/passive/core/database/RPG_Class.js');
    await import('../../../src/plugins/passive/core/database/RPG_State.js');

    // patches globalThis.Game_Battler.prototype/Game_Actor.prototype directly.
    await import('../../../src/plugins/passive/core/objects/Game_Battler.js');
    await import('../../../src/plugins/passive/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    const { stateData } = fixtures;
    globalThis.$dataStates = [
      null,
      stateData({ id: 1, name: 'P1', note: '' }),
      stateData({ id: 2, name: 'P2', note: '' }),
      stateData({ id: 3, name: 'P3', note: '' }),
      stateData({ id: 4, name: 'P4', note: '' }),
      stateData({ id: 5, name: 'P5', note: '' }),
      stateData({ id: 6, name: 'P6', note: '' }),
    ];
    globalThis.$dataStates[99] = stateData({ id: 99, name: 'P99', note: '' });
  });

  describe('refreshPassiveStates / getPassiveStateIds', () =>
  {
    it('collects stackable passive ids duplicated from class and actor notes', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[1]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '<passive:[1, 2]>' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds().filter(id => id === 1).length).toBe(2);
    });

    it('includes a passive id contributed by only the class note', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[1]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '<passive:[1, 2]>' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).toContain(2);
    });

    it('adds a unique passive id only once even when tagged twice', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[5]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '<uniquePassive:[5]>\n<passive:[6, 6]>' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds().filter(id => id === 5).length).toBe(1);
    });

    it('still stacks a non-unique passive id tagged twice', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[5]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '<uniquePassive:[5]>\n<passive:[6, 6]>' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds().filter(id => id === 6).length).toBe(2);
    });

    it('collects skill passives after learnSkill commits the skill', () =>
    {
      // Arrange
      const { actorData, classData, skillData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '' });
      actor.equippedEquips = () => [];
      actor._skills = [];
      actor.initMembers();
      globalThis.$dataSkills[901] = skillData({ id: 901, note: '<passive:[1]>' });

      // Act
      actor.learnSkill(901);

      // Assert
      expect(actor.getPassiveStateIds()).toContain(1);
    });
  });

  describe('allStates', () =>
  {
    it('includes passive states resolved from $dataStates', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[1]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();
      actor.refreshPassiveStates();

      // Act
      const names = actor.allStates().map(s => s.name);

      // Assert
      expect(names).toContain('P1');
    });
  });

  describe('isPassiveState / isStateAddable', () =>
  {
    it('isPassiveState is true for a tracked passive', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[2]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();
      actor.refreshPassiveStates();

      // Act
      const result = actor.isPassiveState(2);

      // Assert
      expect(result).toBe(true);
    });

    it('isStateAddable is false for a tracked passive', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '<passive:[2]>', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();
      actor.refreshPassiveStates();

      // Act
      const result = actor.isStateAddable(2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('traitObjects', () =>
  {
    it('appends passive database states', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '<passive:[1]>' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();
      actor.refreshPassiveStates();

      // Act
      const traits = actor.traitObjects();

      // Assert
      expect(traits.some(t => t.name === 'P1')).toBe(true);
    });

    it('appends party-wide passives', () =>
    {
      // Arrange
      const { actorData, classData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '<passive:[1]>' });
      actor.equippedEquips = () => [];
      actor.skills = () => [];
      actor.initMembers();
      actor.refreshPassiveStates();
      const partySt = { id: 99, name: 'PartyPassive', note: '' };
      globalThis.$gameParty.passiveStates = () => [ partySt ];

      // Act
      const traits = actor.traitObjects();

      // Assert
      expect(traits.some(t => t.name === 'PartyPassive')).toBe(true);
    });
  });
});
//endregion plugins/passive/game-battler-passive.test.js
