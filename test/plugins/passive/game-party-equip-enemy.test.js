//region plugins/passive/game-party-equip-enemy.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadPassivePluginVm, resetPassivePluginSandbox } from './passive-vm.js';

describe('J-Passive party, equipment, and enemy sources (out/J-Passive.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassivePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetPassivePluginSandbox(sandbox);
    const { stateData } = sandbox.__passiveTestFixtures;
    sandbox.$dataStates = [
      null,
      stateData({ id: 1, name: 'S1', note: '' }),
      stateData({ id: 2, name: 'S2', note: '' }),
    ];
    sandbox.$dataStates[5] = stateData({ id: 5, name: 'Eq', note: '' });
    sandbox.$dataStates[6] = stateData({ id: 6, name: 'Uq', note: '' });
    sandbox.$dataStates[8] = stateData({ id: 8, name: 'P8', note: '' });
    sandbox.$dataStates[9] = stateData({ id: 9, name: 'P9', note: '' });
  });

  it('equipped weapon equippedPassive and uniqueEquippedPassive merge into passive refresh', () =>
  {
    const { actorData, classData, weaponData } = sandbox.__passiveTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '',
      classId: 1,
      traits: [],
    });
    actor.currentClass = function()
    {
      return classData({ id: 1, note: '' });
    };
    const wStack = weaponData({
      id: 1,
      name: 'W',
      note: '<equippedPassive:[5]>',
      wtypeId: 1,
    });
    const wUnique = weaponData({
      id: 2,
      name: 'U',
      note: '<uniqueEquippedPassive:[6]>',
      wtypeId: 1,
    });
    actor.equippedEquips = function()
    {
      return [ wStack, wUnique ];
    };
    actor.skills = function()
    {
      return [];
    };
    actor.initMembers();
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).toContain(5);
    expect(actor.getPassiveStateIds().filter(id => id === 6).length).toBe(1);
  });

  it('Game_Party refreshPassiveStates aggregates passives from allItemsQuantified', () =>
  {
    const { weaponData } = sandbox.__passiveTestFixtures;
    const party = new sandbox.Game_Party();
    party.initialize();
    const w = weaponData({
      id: 9,
      name: 'PartyW',
      note: '<passive:[8, 9]>',
      wtypeId: 1,
    });
    party.allItemsQuantified = function()
    {
      return [ w ];
    };
    party.refreshPassiveStates();

    expect(party.passiveStateIds().includes(8)).toBe(true);
    expect(party.passiveStateIds().includes(9)).toBe(true);
  });

  it('Game_Enemy refreshPassiveStates pulls passives from enemy data and learned skills', () =>
  {
    const { enemyData, skillData, stateData } = sandbox.__passiveTestFixtures;
    const enemy = new sandbox.Game_Enemy();
    enemy.__enemyDb = enemyData({
      id: 1,
      name: 'E',
      note: '<passive:[1]>',
      traits: [],
      actions: [],
    });
    const sk = skillData({
      id: 1,
      name: 'Tagged',
      note: '<passive:[2]>',
      damage: { elementId: 0 },
    });
    enemy.skills = function()
    {
      return [ sk ];
    };
    enemy.initMembers();
    enemy._states = [ 1 ];
    sandbox.$dataStates[1] = stateData({ id: 1, name: 'OnBattler', note: '' });
    enemy.refreshPassiveStates();

    expect(enemy.getPassiveStateIds()).toContain(1);
    expect(enemy.getPassiveStateIds()).toContain(2);
  });
});
//endregion plugins/passive/game-party-equip-enemy.test.js
