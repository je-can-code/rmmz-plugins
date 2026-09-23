//region plugins/natural/_component/game-actor.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerShippedNaturalParameters,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from './fixtures/install-natural-host-globals.js';
import { wrapActorRefreshCounter } from './test-helpers.js';

describe('J-NaturalGrowth Game_Actor (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../../src/plugins/_base/core/core/JCache.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    await import('../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Actor.js');

    await registerShippedNaturalParameters();
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

    // Assert: ex- and sp-parameters are fractions, so a buff of 100 is a whole one on top.
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

    // Act & Assert: the buff is held as written, 19, and lands on hit as 0.19.
    expect(actor.naturalBuffPlus('hit')).toBe(19);
    expect(actor.xparam(0)).toBeCloseTo(0.44, 10);

    actor._level = 2;
    actor.onBattlerDataChange();
    expect(actor.naturalBuffPlus('hit')).toBe(23);
    expect(actor.xparam(0)).toBeCloseTo(0.48, 10);
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
    expect(actor.naturalGrowthPlus('atk')).toBe(0);

    for (const expectedAtkGrowth of [ 5, 10 ])
    {
      actor.levelUp();
      expect(actor.naturalGrowthPlus('atk')).toBe(expectedAtkGrowth);
    }
  });

  it('levelUp grows ex-, sp-, and max-TP parameters by the percent the tag names, once each', () =>
  {
    // Arrange: a class authored at 4% hit, 3% aggro and 12 max tech per level- the shape every class
    // growth in Chef Adventure takes.
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [
      { note: '<hitGrowthPlus:[4]>\n<tgrGrowthPlus:[3]>\n<mtpGrowthPlus:[12]>' },
    ];
    actor.initMembers();
    const maxTpBefore = actor.maxTp();

    // Act
    actor.levelUp();

    // Assert: growth is held as written, and reaches each parameter scaled exactly once- hit and
    // aggro are fractions, so 4 and 3 land as 0.04 and 0.03. Max tech is a whole number already.
    expect(actor.naturalGrowthPlus('hit')).toBe(4);
    expect(actor.xparam(0)).toBeCloseTo(0.29, 10);
    expect(actor.sparam(0)).toBeCloseTo(1.03, 10);
    expect(actor.maxTp() - maxTpBefore).toBe(12);
  });

  it('levelUp adds atk growth rate using engine paramBase as formula base', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkGrowthRate:[10]>' } ];
    actor.initMembers();

    // Act
    actor.levelUp();

    // Assert: ten percent of the engine's base of 10.
    expect(actor.naturalGrowthRate('atk')).toBe(10);
    expect(actor.paramBase(2)).toBe(11);
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
    expect(actor.naturalGrowthPlus('atk')).toBe(4);
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
    expect(actor.naturalGrowthPlus('atk')).toBe(6);
  });
});
//endregion plugins/natural/_component/game-actor.test.js
