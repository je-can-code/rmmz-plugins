//region plugins/natural/_component/game-actor.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installNaturalHostGlobals, setPluginContextToJBase, setPluginContextToJNatural } from './fixtures/install-natural-host-globals.js';
import { wrapActorRefreshCounter } from './test-helpers.js';

describe('J-NaturalGrowth Game_Actor (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../../src/plugins/_base/core/JCache.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJNatural();
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    await import('../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Actor.js');
  });

  it('paramBase, xparam, and sparam include natural bonuses from buff tags after refresh', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [
      { note: '<atkBuffPlus:[7]>\n<hitBuffPlus:[100]>\n<tgrBuffPlus:[200]>' },
    ];
    actor.initMembers();

    // Act
    actor.refreshAllParameterBuffs();

    // Assert
    expect(actor.paramBase(2)).toBe(17);
    expect(actor.xparam(0)).toBeCloseTo(1.25);
    expect(actor.sparam(0)).toBe(3);
  });

  it('onBattlerDataChange refreshes buff plus when the formula uses a.level', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor._level = 1;
    actor.__testNoteSources = [ { note: '<hitBuffPlus:[15+(a.level * 4)]>' } ];
    actor.initMembers();
    actor.refreshAllParameterBuffs();

    // Act & Assert
    expect(actor.xParamBuffPlus(0)).toBeCloseTo(0.19);

    actor._level = 2;
    actor.onBattlerDataChange();
    expect(actor.xParamBuffPlus(0)).toBeCloseTo(0.23);
  });

  it('setup and onBattlerDataChange each trigger refreshAllParameterBuffs', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const getCount = wrapActorRefreshCounter(globalThis, actor);

    // Act
    actor.setup(1);

    // Assert
    // J-Base onSetup calls onBattlerDataChange; Natural setup also calls refreshAllParameterBuffs.
    expect(getCount()).toBe(2);

    actor.onBattlerDataChange();
    expect(getCount()).toBe(3);
  });

  it('levelUp stacks atk growth from getAllNotes note sources (equip-style)', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[5]>' } ];
    actor.initMembers();

    // Act & Assert
    expect(actor.bParamGrowthPlus(2)).toBe(0);

    for (const expectedAtkGrowth of [ 5, 10 ])
    {
      actor.levelUp();
      expect(actor.bParamGrowthPlus(2)).toBe(expectedAtkGrowth);
    }
  });

  it('levelUp applies ex-, sp-, and max-TP growth tags once each', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [
      { note: '<hitGrowthPlus:[4]>\n<tgrGrowthPlus:[3]>\n<mtpGrowthPlus:[12]>' },
    ];
    actor.initMembers();

    // Act
    actor.levelUp();

    // Assert
    expect(actor.xParamGrowthPlus(0)).toBe(4);
    expect(actor.sParamGrowthPlus(0)).toBe(3);
    expect(actor.maxTpGrowthPlus()).toBe(12);
  });

  it('levelUp adds atk growth rate using engine paramBase as formula base', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkGrowthRate:[10]>' } ];
    actor.initMembers();

    // Act
    actor.levelUp();

    // Assert
    expect(actor.bParamGrowthRate(2)).toBe(10);
  });

  it('levelUp evaluates atk growth plus using a.level property (formula context)', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor._level = 4;
    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[a.level]>' } ];
    actor.initMembers();

    // Act
    actor.levelUp();

    // Assert
    expect(actor.bParamGrowthPlus(2)).toBe(4);
  });

  it('levelUp evaluates atk growth plus using a.lvl property (formula context)', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor._level = 6;
    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[a.lvl]>' } ];
    actor.initMembers();

    // Act
    actor.levelUp();

    // Assert
    expect(actor.bParamGrowthPlus(2)).toBe(6);
  });
});
//endregion plugins/natural/_component/game-actor.test.js
