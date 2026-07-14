//region plugins/natural/game-battler.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installNaturalHostGlobals, setPluginContextToJBase, setPluginContextToJNatural } from './fixtures/install-natural-host-globals.js';

describe('J-NaturalGrowth Game_Battler (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJNatural();
    await import('../../../src/plugins/natural/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype/Game_Actor.prototype directly, no vm involved.
    await import('../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../src/plugins/natural/core/objects/Game_Actor.js');
  });

  it('runs patched initMembers and exposes zeroed natural growth via battler getters', () =>
  {
    // Arrange
    const battler = new globalThis.Game_Battler();

    // Act
    battler.initMembers();

    // Assert
    expect(battler.maxTpGrowthPlus()).toBe(0);
    expect(battler.maxTpGrowthRate()).toBe(0);
    expect(battler.maxTpBuffPlus()).toBe(0);
    expect(battler.maxTpBuffRate()).toBe(0);

    for (let paramId = 0; paramId < 8; paramId++)
    {
      expect(battler.bParamGrowthPlus(paramId)).toBe(0);
      expect(battler.bParamGrowthRate(paramId)).toBe(0);
    }

    expect(battler.xParamGrowthPlus(0)).toBe(0);
    expect(battler.sParamGrowthPlus(0)).toBe(0);
    expect(battler.expPlus()).toBe(0);
    expect(battler.goldPlus()).toBe(0);
  });

  it('refreshAllParameterBuffs fills buff getters from notes; clearAllParameterBuffs clears buffs but not growth', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkBuffPlus:[4]>' } ];
    actor.initMembers();

    // Act
    actor.refreshAllParameterBuffs();

    // Assert
    expect(actor.bParamBuffPlus(2)).toBe(4);

    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[6]>' } ];
    actor.levelUp();
    expect(actor.bParamGrowthPlus(2)).toBe(6);

    actor.clearAllParameterBuffs();
    expect(actor.bParamBuffPlus(2)).toBe(0);
    expect(actor.bParamGrowthPlus(2)).toBe(6);
  });
});
//endregion plugins/natural/game-battler.test.js
