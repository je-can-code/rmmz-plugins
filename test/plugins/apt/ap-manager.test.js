//region plugins/apt/ap-manager.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

import { loadAptPluginVm } from './apt-vm.js';

describe('J-Aptitude ApManager (out/apt/J-Aptitude.js)', () =>
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

  it('parseKey splits type chain and numeric id', () =>
  {
    const { ApManager } = sandbox;
    const parsed = ApManager.parseKey('@base:usable:skill:17');
    expect(parsed.types.join(':')).toBe('@base:usable:skill');
    expect(parsed.id).toBe(17);
  });

  it('resolveStaticSourceByKey returns database rows', () =>
  {
    const { ApManager } = sandbox;
    sandbox.$dataSkills = [ null ];
    sandbox.$dataSkills[9] = {
      id: 9,
      name: 'Test',
    };
    expect(ApManager.resolveStaticSourceByKey('@base:usable:skill:9').id).toBe(9);
    expect(ApManager.resolveStaticSourceByKey('bad')).toBe(null);
  });

  it('gainAp distributes AP and learns at threshold', () =>
  {
    clearRpgManagerCacheInVm(sandbox);
    const { ApManager, Game_Actor, AptitudeTeachable } = sandbox;
    sandbox.$dataSkills = [ null ];
    sandbox.$dataSkills[10] = Object.assign(Object.create(sandbox.RPG_Skill.prototype), {
      id: 10,
      name: 'Teach',
      note: '',
      meta: {},
    });

    const actor = new Game_Actor();
    actor.initMembers();

    const teach = new AptitudeTeachable(10, 5);
    const source = {
      id: 1,
      implementationType()
      {
        return '@vitest:class';
      },
      isSkill()
      {
        return false;
      },
      aptitudeTeachings: [ teach ],
    };

    actor.getAptitudeSources = function()
    {
      return [ source ];
    };

    ApManager.gainAp(actor, 3, 'test');
    ApManager.gainAp(actor, 2, 'test');

    expect(actor.isLearnedSkill(10)).toBe(true);
    expect(actor.hasLearnedAptitudeSkill(10)).toBe(true);
  });

  it('canGainAp rejects dead actors and zero amount', () =>
  {
    const { ApManager, Game_Actor } = sandbox;
    const actor = new Game_Actor();
    actor.initMembers();
    actor.isDead = function()
    {
      return true;
    };
    expect(ApManager.canGainAp(actor, 5)).toBe(false);
    actor.isDead = function()
    {
      return false;
    };
    expect(ApManager.canGainAp(actor, 0)).toBe(false);
    expect(ApManager.canGainAp(actor, 1)).toBe(true);
  });
});
//endregion plugins/apt/ap-manager.test.js
