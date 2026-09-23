//region plugins/drops/core/objects/game-battler.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * Only actors carry a reward model, but natural growth refreshes buffs on every battler, enemies
 * included, and asks each of them for the base its gold and drop tags read. These defaults are that
 * answer for a battler with no reward model: nothing, rather than a missing method.
 */
describe('J-DropsControl Game_Battler reward bases (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Battler.js');
  });

  describe('baseGoldMultiplier', () =>
  {
    it('answers zero for a battler with no reward model, however it is tagged', () =>
    {
      // Arrange: a gold tag the battler carries is still not a reward model of its own.
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [ { note: '<goldMultiplier:30>' } ];

      // Act
      const result = battler.baseGoldMultiplier();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('baseDropMultiplier', () =>
  {
    it('answers zero for a battler with no reward model, however it is tagged', () =>
    {
      // Arrange: a drop tag the battler carries is still not a reward model of its own.
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [ { note: '<dropMultiplier:30>' } ];

      // Act
      const result = battler.baseDropMultiplier();

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/drops/core/objects/game-battler.test.js
