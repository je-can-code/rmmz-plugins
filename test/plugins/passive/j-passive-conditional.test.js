//region plugins/passive/j-passive-conditional.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { loadPassiveConditionalPluginVm } from './passive-conditional-vm.js';

/**
 * Builds a test actor with explicit HP accessors and a skill note carrying conditional tags.
 *
 * @param {object} sandbox
 * @param {string[]} conditionalNotes
 * @returns {object}
 */
function buildConditionalTestActor(sandbox, conditionalNotes)
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

  const skillRows = conditionalNotes.map(note =>
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
  });

  it('evaluates hpBelow and hpAbove rules against current HP rate', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<conditionalPassive:[42, hpBelow, 25]>',
      '<conditionalPassive:[43, hpAbove, 50]>',
    ]);

    actor._hp = 20;

    const manager = sandbox.ConditionalPassiveManager;

    expect(manager.resolveActiveStateIds(actor)).toEqual([ 42 ]);

    actor._hp = 60;

    expect(manager.resolveActiveStateIds(actor)).toEqual([ 43 ]);
  });

  it('appends satisfied conditional passives after refreshPassiveStates', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<conditionalPassive:[99, hpAbove, 1]>',
    ]);

    actor._hp = 100;

    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).toContain(99);
  });
});
//endregion plugins/passive/j-passive-conditional.test.js