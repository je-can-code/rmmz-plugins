//region plugins/natural/_component/party-equip.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installNaturalHostGlobals, setPluginContextToJBase, setPluginContextToJNatural } from './fixtures/install-natural-host-globals.js';
import { wrapActorRefreshCounter } from './test-helpers.js';

describe('J-NaturalGrowth Game_Party / Scene_Equip / Window_EquipItem (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJNatural();
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    await import('../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Party.js');
    await import('../../../../src/plugins/natural/core/scenes/Scene_Equip.js');
    await import('../../../../src/plugins/natural/core/windows/Window_EquipItem.js');
  });

  it('gainItem refreshes all party members', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const getCount = wrapActorRefreshCounter(globalThis, actor);
    const party = new globalThis.Game_Party();
    party.members = () => [ actor ];
    party.__testItemContainer = {};

    // Act
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

    // Assert
    expect(getCount()).toBe(1);
  });

  it('executeEquipChange refreshes the scene actor', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const getCount = wrapActorRefreshCounter(globalThis, actor);
    const scene = new globalThis.Scene_Equip();
    scene.actor = () => actor;

    // Act
    scene.executeEquipChange();

    // Assert
    expect(getCount()).toBe(1);
  });

  it('postEquipSetupActorClone refreshes the actor clone', () =>
  {
    // Arrange
    const clone = new globalThis.Game_Actor();
    clone.initMembers();
    const getCount = wrapActorRefreshCounter(globalThis, clone);

    // Act
    globalThis.Window_EquipItem.prototype.postEquipSetupActorClone(clone);

    // Assert
    expect(getCount()).toBe(1);
  });
});
//endregion plugins/natural/_component/party-equip.test.js
