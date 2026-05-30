//region plugins/passive/j-passive-conditional.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { loadPassiveConditionalPluginVm } from './passive-conditional-vm.js';

/**
 * Builds a test actor whose skill notes carry passive grants and rule tags.
 *
 * @param {object} sandbox
 * @param {string[]} skillNotes
 * @returns {object}
 */
function buildConditionalTestActor(sandbox, skillNotes)
{
  const actor = new sandbox.Game_Actor();

  actor.initMembers();

  const emptyRow = new sandbox.RPG_BaseItem({
    id: 1,
    meta: {},
    name: String.empty,
    note: String.empty,
    description: String.empty,
    iconIndex: 0,
  }, 1);

  actor.__actorDb = emptyRow;

  actor.class = function()
  {
    return emptyRow;
  };

  actor.currentClass = function()
  {
    return emptyRow;
  };

  actor._hp = 1;
  actor._mhp = 100;

  Object.defineProperties(actor, {
    hp: {
      get()
      {
        return this._hp;
      },
      configurable: true,
    },
    mhp: {
      get()
      {
        return this._mhp;
      },
      configurable: true,
    },
  });

  const skillRows = skillNotes.map(note =>
  {
    const payload = {
      id: -1,
      meta: {},
      name: String.empty,
      note,
      description: String.empty,
      iconIndex: 0,
    };

    return new sandbox.RPG_BaseItem(payload, -1);
  });

  actor.skills = function()
  {
    return skillRows;
  };

  actor.databaseData = function()
  {
    return emptyRow;
  };

  actor.allStates = function()
  {
    return [];
  };

  actor.equippedEquips = function()
  {
    return [];
  };

  return actor;
}

describe('J-Passive-Conditional (out/passive/ext/J-Passive-Conditional.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassiveConditionalPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  it('exposes metadata defaults from plugin parameters', () =>
  {
    expect(sandbox.J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames).toBe(15);
    expect(sandbox.J.PASSIVE.EXT.CONDITIONAL.Metadata.defaultProximityTiles).toBe(5);
  });

  it('gates passiveStateRule thresholds with inclusive Above/Below semantics', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<passive:[42]>\n<passiveStateRule:[42, hpBelow, 25]>',
      '<passive:[43]>\n<passiveStateRule:[43, hpAbove, 50]>',
    ]);

    actor._hp = 20;
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).toContain(42);
    expect(actor.getPassiveStateIds()).not.toContain(43);

    actor._hp = 60;
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).not.toContain(42);
    expect(actor.getPassiveStateIds()).toContain(43);
  });

  it('includes passive state ids at threshold boundaries (inclusive compare)', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<passive:[99]>\n<passiveStateRule:[99, hpAbove, 50]>',
    ]);

    actor._hp = 50;
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).toContain(99);
  });

  it('scales stackable passives via passiveStateCount', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<passive:[77]>\n<passiveStateCount:[77, moreIsMoreHp, 25]>',
    ]);

    actor._hp = 100;
    actor.refreshPassiveStates();

    const stacks = actor.getPassiveStateIds().filter(id => id === 77);

    expect(stacks.length).toBe(4);
  });
});
//endregion plugins/passive/j-passive-conditional.test.js
