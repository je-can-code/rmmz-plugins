//region plugins/diff/game-actor-param.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadDiffPluginVm } from './diff-vm.js';

describe('J-Difficulty Game_Actor.param (out/J-Difficulty.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDiffPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('scales base param by the default difficulty actor bparam rates', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();

    sandbox.$gameTemp = new sandbox.Game_Temp();
    sandbox.$gameTemp.initMembers();

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(actor.param(0)).toBe(80);
  });
});
//endregion plugins/diff/game-actor-param.test.js
