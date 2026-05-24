//region plugins/sdp/game-actor-param-party.test.js
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { loadSdpPluginVm } from './sdp-vm.js';

const ATK_PARAM_ID = 2;

/**
 * @param {object} s
 */
function hookBaseAtk100(s)
{
  const inner = s.J.SDP.Aliased.Game_Actor.get('param');
  s.J.SDP.Aliased.Game_Actor.set('param', function(paramId)
  {
    if (paramId === ATK_PARAM_ID)
    {
      return 100;
    }

    return inner.call(this, paramId);
  });
}

/**
 * @param {object} s
 * @param {number} id
 */
function makeActor(s, id)
{
  const actor = new s.Game_Actor();
  actor.initMembers();
  actor.actorId = function()
  {
    return id;
  };
  return actor;
}

describe('J-SDP Game_Actor.param (ATK) and Game_Party SDP helpers (out/sdp/J-SDP.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSdpPluginVm(sandbox);
    hookBaseAtk100(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  afterEach(() =>
  {
    sandbox.$gameActors._byId = {};
  });

  it('flat per-rank ATK adds linearly to param(2)', () =>
  {
    const actor = makeActor(sandbox, 1);
    actor.unlockSdpByKey('vitest_atk_flat');
    actor.rankUpPanel('vitest_atk_flat');
    actor.rankUpPanel('vitest_atk_flat');
    expect(actor.param(ATK_PARAM_ID)).toBe(108);
  });

  it('percent per-rank ATK scales off base param before SDP bonus', () =>
  {
    const actor = makeActor(sandbox, 1);
    actor.unlockSdpByKey('vitest_atk_pct');
    actor.rankUpPanel('vitest_atk_pct');
    actor.rankUpPanel('vitest_atk_pct');
    expect(actor.param(ATK_PARAM_ID)).toBe(120);
  });

  it('negative flat per-rank reduces ATK', () =>
  {
    const actor = makeActor(sandbox, 1);
    actor.unlockSdpByKey('vitest_atk_flat_neg');
    actor.rankUpPanel('vitest_atk_flat_neg');
    actor.rankUpPanel('vitest_atk_flat_neg');
    expect(actor.param(ATK_PARAM_ID)).toBe(94);
  });

  it('negative percent per-rank reduces ATK', () =>
  {
    const actor = makeActor(sandbox, 1);
    actor.unlockSdpByKey('vitest_atk_pct_neg');
    actor.rankUpPanel('vitest_atk_pct_neg');
    expect(actor.param(ATK_PARAM_ID)).toBe(92);
  });

  it('stacks multiple panels that target ATK', () =>
  {
    const actor = makeActor(sandbox, 1);
    actor.unlockSdpByKey('vitest_atk_flat');
    actor.unlockSdpByKey('vitest_atk_pct');
    actor.rankUpPanel('vitest_atk_flat');
    actor.rankUpPanel('vitest_atk_pct');
    expect(actor.param(ATK_PARAM_ID)).toBe(114);
  });

  it('getSdpRankByActorAndKey returns current rank and 0 for missing actor', () =>
  {
    const actor = makeActor(sandbox, 7);
    sandbox.$gameActors._byId[7] = actor;
    const party = new sandbox.Game_Party();
    party.initialize();

    actor.unlockSdpByKey('vitest_atk_flat');
    actor.rankUpPanel('vitest_atk_flat');
    actor.rankUpPanel('vitest_atk_flat');

    expect(party.getSdpRankByActorAndKey(7, 'vitest_atk_flat')).toBe(2);
    expect(party.getSdpRankByActorAndKey(999, 'vitest_atk_flat')).toBe(0);
  });

  it('isSdpUnlocked is true only when every registered actor has the panel unlocked', () =>
  {
    const a1 = makeActor(sandbox, 1);
    const a2 = makeActor(sandbox, 2);
    sandbox.$gameActors._byId[1] = a1;
    sandbox.$gameActors._byId[2] = a2;
    const party = new sandbox.Game_Party();
    party.initialize();

    party.unlockSdp('vitest_atk_flat');
    expect(party.isSdpUnlocked('vitest_atk_flat')).toBe(true);

    a2.lockSdpByKey('vitest_atk_flat');
    expect(party.isSdpUnlocked('vitest_atk_flat')).toBe(false);
  });
});
//endregion plugins/sdp/game-actor-param-party.test.js
