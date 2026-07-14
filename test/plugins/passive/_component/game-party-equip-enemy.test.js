//region plugins/passive/_component/game-party-equip-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPassiveTestFixtures,
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';

describe('J-Passive party, equipment, and enemy sources (direct src import)', () =>
{
  let fixtures;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    ({ default: globalThis.RPG_BaseItem } = await import('../../../../src/plugins/_base/database/base/RPG_BaseItem.js'));
    ({ default: globalThis.RPG_BaseBattler } = await import('../../../../src/plugins/_base/database/core/RPG_BaseBattler.js'));
    ({ default: globalThis.RPG_Actor } = await import('../../../../src/plugins/_base/database/implementations/RPG_Actor.js'));
    ({ default: globalThis.RPG_Class } = await import('../../../../src/plugins/_base/database/implementations/RPG_Class.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../src/plugins/_base/database/implementations/RPG_State.js'));
    ({ default: globalThis.RPG_Weapon } = await import('../../../../src/plugins/_base/database/implementations/RPG_Weapon.js'));
    ({ default: globalThis.RPG_Enemy } = await import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    fixtures = buildPassiveTestFixtures({
      RPG_Actor: globalThis.RPG_Actor,
      RPG_Class: globalThis.RPG_Class,
      RPG_Skill: globalThis.RPG_Skill,
      RPG_State: globalThis.RPG_State,
      RPG_Weapon: globalThis.RPG_Weapon,
      RPG_Enemy: globalThis.RPG_Enemy,
    });

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');
    await import('../../../../src/plugins/_base/objects/Game_Enemy.js');

    setPluginContextToJPassive();
    await import('../../../../src/plugins/passive/core/_metadata/initialization.js');

    await import('../../../../src/plugins/passive/core/database/RPG_BaseItem.js');
    await import('../../../../src/plugins/passive/core/database/RPG_BaseBattler.js');
    await import('../../../../src/plugins/passive/core/database/RPG_Class.js');
    await import('../../../../src/plugins/passive/core/database/RPG_State.js');

    await import('../../../../src/plugins/passive/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/passive/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/passive/core/objects/Game_Party.js');
    await import('../../../../src/plugins/passive/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    const { stateData } = fixtures;
    globalThis.$dataStates = [
      null,
      stateData({ id: 1, name: 'S1', note: '' }),
      stateData({ id: 2, name: 'S2', note: '' }),
    ];
    globalThis.$dataStates[5] = stateData({ id: 5, name: 'Eq', note: '' });
    globalThis.$dataStates[6] = stateData({ id: 6, name: 'Uq', note: '' });
    globalThis.$dataStates[8] = stateData({ id: 8, name: 'P8', note: '' });
    globalThis.$dataStates[9] = stateData({ id: 9, name: 'P9', note: '' });
  });

  describe('equipped weapon passives', () =>
  {
    function buildActorWithEquips()
    {
      const { actorData, classData, weaponData } = fixtures;
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = actorData({ id: 1, name: '', note: '', classId: 1, traits: [] });
      actor.currentClass = () => classData({ id: 1, note: '' });
      const wStack = weaponData({ id: 1, name: 'W', note: '<equippedPassive:[5]>', wtypeId: 1 });
      const wUnique = weaponData({ id: 2, name: 'U', note: '<uniqueEquippedPassive:[6]>', wtypeId: 1 });
      actor.equippedEquips = () => [ wStack, wUnique ];
      actor.skills = () => [];
      actor.initMembers();
      return actor;
    }

    it('equippedPassive contributes its tagged state id', () =>
    {
      // Arrange
      const actor = buildActorWithEquips();

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).toContain(5);
    });

    it('uniqueEquippedPassive contributes its tagged state id exactly once', () =>
    {
      // Arrange
      const actor = buildActorWithEquips();

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds().filter(id => id === 6).length).toBe(1);
    });
  });

  describe('Game_Party.refreshPassiveStates', () =>
  {
    function buildPartyWithItem()
    {
      const { weaponData } = fixtures;
      const party = new globalThis.Game_Party();
      party.initialize();
      const w = weaponData({ id: 9, name: 'PartyW', note: '<passive:[8, 9]>', wtypeId: 1 });
      party.allItemsQuantified = () => [ w ];
      return party;
    }

    it('aggregates the first tagged passive from allItemsQuantified', () =>
    {
      // Arrange
      const party = buildPartyWithItem();

      // Act
      party.refreshPassiveStates();

      // Assert
      expect(party.passiveStateIds().includes(8)).toBe(true);
    });

    it('aggregates the second tagged passive from allItemsQuantified', () =>
    {
      // Arrange
      const party = buildPartyWithItem();

      // Act
      party.refreshPassiveStates();

      // Assert
      expect(party.passiveStateIds().includes(9)).toBe(true);
    });
  });

  describe('Game_Enemy.refreshPassiveStates', () =>
  {
    function buildEnemyWithSources()
    {
      const { enemyData, skillData, stateData } = fixtures;
      const enemy = new globalThis.Game_Enemy();
      enemy.__enemyDb = enemyData({ id: 1, name: 'E', note: '<passive:[1]>', traits: [], actions: [] });
      const sk = skillData({ id: 1, name: 'Tagged', note: '<passive:[2]>', damage: { elementId: 0 } });
      enemy.skills = () => [ sk ];
      enemy.initMembers();
      enemy._states = [ 1 ];
      globalThis.$dataStates[1] = stateData({ id: 1, name: 'OnBattler', note: '' });
      return enemy;
    }

    it('pulls the passive tagged on the enemy database data', () =>
    {
      // Arrange
      const enemy = buildEnemyWithSources();

      // Act
      enemy.refreshPassiveStates();

      // Assert
      expect(enemy.getPassiveStateIds()).toContain(1);
    });

    it('pulls the passive tagged on a learned skill', () =>
    {
      // Arrange
      const enemy = buildEnemyWithSources();

      // Act
      enemy.refreshPassiveStates();

      // Assert
      expect(enemy.getPassiveStateIds()).toContain(2);
    });
  });
});
//endregion plugins/passive/_component/game-party-equip-enemy.test.js
