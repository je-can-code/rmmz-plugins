//region plugins/passive/game-battler-passive.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadPassivePluginVm, resetPassivePluginSandbox } from './passive-vm.js';

describe('J-Passive Game_Battler / Game_Actor (out/J-Passive.js)', () =>
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
      stateData({ id: 1, name: 'P1', note: '' }),
      stateData({ id: 2, name: 'P2', note: '' }),
      stateData({ id: 3, name: 'P3', note: '' }),
      stateData({ id: 4, name: 'P4', note: '' }),
      stateData({ id: 5, name: 'P5', note: '' }),
      stateData({ id: 6, name: 'P6', note: '' }),
    ];
    sandbox.$dataStates[99] = stateData({ id: 99, name: 'P99', note: '' });
  });

  it('refreshPassiveStates collects stackable passive ids from class and actor notes', () =>
  {
    const { actorData, classData } = sandbox.__passiveTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '<passive:[1]>',
      classId: 1,
      traits: [],
    });
    actor.currentClass = function()
    {
      return classData({ id: 1, note: '<passive:[1, 2]>' });
    };
    actor.equippedEquips = function()
    {
      return [];
    };
    actor.skills = function()
    {
      return [];
    };
    actor.initMembers();
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds().filter(id => id === 1).length).toBe(2);
    expect(actor.getPassiveStateIds()).toContain(2);
  });

  it('unique passive ids are added only once while stackable ones still stack', () =>
  {
    const { actorData, classData } = sandbox.__passiveTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '<passive:[5]>',
      classId: 1,
      traits: [],
    });
    actor.currentClass = function()
    {
      return classData({ id: 1, note: '<uniquePassive:[5]>\n<passive:[6, 6]>' });
    };
    actor.equippedEquips = function()
    {
      return [];
    };
    actor.skills = function()
    {
      return [];
    };
    actor.initMembers();
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds().filter(id => id === 5).length).toBe(1);
    expect(actor.getPassiveStateIds().filter(id => id === 6).length).toBe(2);
  });

  it('allStates includes passive states resolved from $dataStates', () =>
  {
    const { actorData, classData } = sandbox.__passiveTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '<passive:[1]>',
      classId: 1,
      traits: [],
    });
    actor.currentClass = function()
    {
      return classData({ id: 1, note: '' });
    };
    actor.equippedEquips = function()
    {
      return [];
    };
    actor.skills = function()
    {
      return [];
    };
    actor.initMembers();
    actor.refreshPassiveStates();

    const names = actor.allStates()
      .map(s => s.name);

    expect(names).toContain('P1');
  });

  it('isPassiveState is true for tracked passives and isStateAddable is false for them', () =>
  {
    const { actorData, classData } = sandbox.__passiveTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '<passive:[2]>',
      classId: 1,
      traits: [],
    });
    actor.currentClass = function()
    {
      return classData({ id: 1, note: '' });
    };
    actor.equippedEquips = function()
    {
      return [];
    };
    actor.skills = function()
    {
      return [];
    };
    actor.initMembers();
    actor.refreshPassiveStates();

    expect(actor.isPassiveState(2)).toBe(true);
    expect(actor.isStateAddable(2)).toBe(false);
  });

  it('refreshPassiveStates collects skill passives after learnSkill commits the skill', () =>
  {
    const { actorData, classData, skillData } = sandbox.__passiveTestFixtures;
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
    actor.equippedEquips = function()
    {
      return [];
    };
    actor._skills = [];
    actor.initMembers();
    sandbox.$dataSkills[901] = skillData({ id: 901, note: '<passive:[1]>' });
    actor.learnSkill(901);

    expect(actor.getPassiveStateIds()).toContain(1);
  });

  it('traitObjects appends passive database states and party passives', () =>
  {
    const { actorData, classData } = sandbox.__passiveTestFixtures;
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
      return classData({ id: 1, note: '<passive:[1]>' });
    };
    actor.equippedEquips = function()
    {
      return [];
    };
    actor.skills = function()
    {
      return [];
    };
    actor.initMembers();
    actor.refreshPassiveStates();

    const partySt = { id: 99, name: 'PartyPassive', note: '' };
    sandbox.$gameParty.passiveStates = function()
    {
      return [ partySt ];
    };

    const traits = actor.traitObjects();
    expect(traits.some(t => t.name === 'P1')).toBe(true);
    expect(traits.some(t => t.name === 'PartyPassive')).toBe(true);
  });
});
//endregion plugins/passive/game-battler-passive.test.js
