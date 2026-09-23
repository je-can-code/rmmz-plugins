//region plugins/natural/_component/game-battler.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerShippedNaturalParameters,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from './fixtures/install-natural-host-globals.js';

describe('J-NaturalGrowth Game_Battler (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype/Game_Actor.prototype directly, no vm involved.
    await import('../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Actor.js');

    await registerShippedNaturalParameters();
  });

  it('runs patched initMembers and starts every natural table empty with the rewards at zero', () =>
  {
    // Arrange
    const battler = new globalThis.Game_Battler();

    // Act
    battler.initMembers();

    // Assert
    expect(battler.naturalBuffPlusTable()).toEqual({});
    expect(battler.naturalBuffRateTable()).toEqual({});
    expect(battler.naturalGrowthPlusTable()).toEqual({});
    expect(battler.naturalGrowthRateTable()).toEqual({});
    expect([ battler.expPlus(), battler.goldPlus(), battler.sdpsPlus() ]).toEqual([ 0, 0, 0 ]);
  });

  it('refreshAllParameterBuffs fills buffs from notes; clearAllParameterBuffs clears buffs but not growth', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkBuffPlus:[4]>' } ];
    actor.initMembers();

    // Act
    actor.refreshAllParameterBuffs();

    // Assert
    expect(actor.naturalBuffPlus('atk')).toBe(4);

    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[6]>' } ];
    actor.levelUp();
    expect(actor.naturalGrowthPlus('atk')).toBe(6);

    actor.clearAllParameterBuffs();
    expect(actor.naturalBuffPlus('atk')).toBe(0);
    expect(actor.naturalGrowthPlus('atk')).toBe(6);
  });
});
//endregion plugins/natural/_component/game-battler.test.js
