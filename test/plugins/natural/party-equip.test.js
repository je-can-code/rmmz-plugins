//region plugins/natural/party-equip.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadNaturalGrowthPluginVm, resetNaturalGrowthPluginSandbox } from './natural-vm.js';
import { wrapActorRefreshCounter } from './test-helpers.js';

describe('J-NaturalGrowth Game_Party / Scene_Equip / Window_EquipItem (out/J-NaturalGrowth.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadNaturalGrowthPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetNaturalGrowthPluginSandbox(sandbox);
  });

  it('gainItem refreshes all party members', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    const getCount = wrapActorRefreshCounter(sandbox, actor);

    const party = new sandbox.Game_Party();

    party.members = () => [ actor ];
    party.__testItemContainer = {};
    party.gainItem(
      {
        name: 'stub',
        _key()
        {
          return 1;
        },
      },
      1,
      false,
    );

    expect(getCount()).toBe(1);
  });

  it('executeEquipChange refreshes the scene actor', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    const getCount = wrapActorRefreshCounter(sandbox, actor);

    const scene = new sandbox.Scene_Equip();
    scene.actor = () => actor;
    scene.executeEquipChange();

    expect(getCount()).toBe(1);
  });

  it('postEquipSetupActorClone refreshes the actor clone', () =>
  {
    const clone = new sandbox.Game_Actor();
    clone.initMembers();
    const getCount = wrapActorRefreshCounter(sandbox, clone);

    sandbox.Window_EquipItem.prototype.postEquipSetupActorClone(clone);

    expect(getCount()).toBe(1);
  });
});
//endregion plugins/natural/party-equip.test.js
