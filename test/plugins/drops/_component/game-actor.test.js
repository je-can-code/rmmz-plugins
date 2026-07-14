//region plugins/drops/_component/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl Game_Actor (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');

    await import('../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  it('computes drop multiplier factor from summed dropMultiplier tags on getAllNotes sources', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [
      { note: '<dropMultiplier:40>' },
      { note: '<dropMultiplier:10>' },
    ];

    // Act & Assert
    expect(actor.getDropMultiplierBonus()).toBe(0.5);
  });

  it('computes gold multiplier factor from summed goldMultiplier tags on getAllNotes sources', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<goldMultiplier:75>' } ];

    // Act & Assert
    expect(actor.getGoldMultiplier()).toBe(0.75);
  });

  it('computes gold multiplier factor from goldMultiplier tag', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<goldMultiplier:25>' } ];

    // Act & Assert
    expect(actor.getGoldMultiplier()).toBe(0.25);
  });

  it('computes drop multiplier factor from dropMultiplier tag', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<dropMultiplier:40>' } ];

    // Act & Assert
    expect(actor.getDropMultiplierBonus()).toBe(0.4);
  });
});
//endregion plugins/drops/_component/game-actor.test.js
