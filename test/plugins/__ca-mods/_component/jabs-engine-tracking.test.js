//region plugins/__ca-mods/_component/jabs-engine-tracking.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installCamodsHostGlobals, setPluginContextToJBase, setPluginContextToJCamods } from './fixtures/install-camods-host-globals.js';

describe('J-CA-Mods JABS_Engine tracking hooks (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCamodsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJCamods();
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../../src/plugins/__ca-mods/core/managers/JABS_Engine.js');
  });

  it('handleDefeatedEnemy tracks inanimate vs animate as different variables', () =>
  {
    // Arrange
    const calls = [];
    globalThis.J.BASE.Helpers.modVariable = function(variableId, amount)
    {
      calls.push({ variableId, amount });
    };
    const engine = new globalThis.JABS_Engine();

    // Act
    engine.handleDefeatedEnemy({ isInanimate: () => true }, null);
    engine.handleDefeatedEnemy({ isInanimate: () => false }, null);

    // Assert
    expect(calls).toEqual([
      { variableId: globalThis.J.CAMods.Tracking.DestructiblesDestroyed, amount: 1 },
      { variableId: globalThis.J.CAMods.Tracking.EnemiesDefeated, amount: 1 },
    ]);
  });

  it('handleDefeatedPlayer increments deaths variable', () =>
  {
    // Arrange
    const calls = [];
    globalThis.J.BASE.Helpers.modVariable = function(variableId, amount)
    {
      calls.push({ variableId, amount });
    };
    const engine = new globalThis.JABS_Engine();

    // Act
    engine.handleDefeatedPlayer();

    // Assert
    expect(calls).toEqual([
      { variableId: globalThis.J.CAMods.Tracking.NumberOfDeaths, amount: 1 },
    ]);
  });
});
//endregion plugins/__ca-mods/_component/jabs-engine-tracking.test.js
