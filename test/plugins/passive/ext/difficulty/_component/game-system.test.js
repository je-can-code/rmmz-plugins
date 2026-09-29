//region plugins/passive/ext/difficulty/_component/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDiffHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDiff,
} from './fixtures/install-diff-host-globals.js';

/**
 * The party's difficulty budget and configuration tracking on Game_System.
 */
describe('J-Passive-Difficulty Game_System', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../../../src/plugins/passive/ext/difficulty/_metadata/initialization.js');

    // the engine hook `onAfterLoad` extends. An alias captures whatever sits here at import time, so
    // this must exist before the patches land or the chain captures undefined and detonates on the
    // first call.
    globalThis.Game_System.prototype.onAfterLoad = function()
    {
    };

    await import('../../../../../../src/plugins/passive/ext/difficulty/objects/Game_System.js');
    await import('../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Temp.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameTemp = new globalThis.Game_Temp();
    globalThis.$gameTemp.initMembers();
  });

  //region the layer point budget
  describe('Game_System layer points', () =>
  {
    it('sets and reads the ceiling on how much difficulty can be stacked', () =>
    {
      // Arrange
      // Act
      globalThis.$gameSystem.setLayerPointMax(30);

      // Assert
      expect(globalThis.$gameSystem.getLayerPointMax())
        .toBe(30);
    });

    it('raises the ceiling by a modifier rather than replacing it', () =>
    {
      // Arrange: story progress hands out budget in increments, so the modifier form is what an
      // event actually calls.
      globalThis.$gameSystem.setLayerPointMax(30);

      // Act
      globalThis.$gameSystem.modLayerPointMax(5);

      // Assert
      expect(globalThis.$gameSystem.getLayerPointMax())
        .toBe(35);
    });

    it('sets and reads how much budget is currently spent', () =>
    {
      // Arrange
      // Act
      globalThis.$gameSystem.setLayerPoints(12);

      // Assert
      expect(globalThis.$gameSystem.getLayerPoints())
        .toBe(12);
    });

    it('adjusts the spend by a modifier rather than replacing it', () =>
    {
      // Arrange
      globalThis.$gameSystem.setLayerPoints(12);

      // Act
      globalThis.$gameSystem.modLayerPoints(-4);

      // Assert
      expect(globalThis.$gameSystem.getLayerPoints())
        .toBe(8);
    });

    it('reports what is left as the ceiling minus the spend', () =>
    {
      // Arrange: this is what every layer's `canPayCost` is measured against, so a sign error here
      // would let the player stack difficulties they never paid for.
      globalThis.$gameSystem.setLayerPointMax(30);
      globalThis.$gameSystem.setLayerPoints(12);

      // Act
      const remaining = globalThis.$gameSystem.getRemainingLayerPoints();

      // Assert
      expect(remaining)
        .toBe(18);
    });
  });

  describe('Game_System.registerDifficultyConfig()', () =>
  {
    it('registers a configuration the system has not seen before', () =>
    {
      // Arrange
      const config = {
        key: 'brutal',
        unlocked: false,
        hidden: false,
        enabled: false,
      };

      // Act
      globalThis.$gameSystem.registerDifficultyConfig(config);

      // Assert
      expect(globalThis.$gameSystem.getDifficultyConfigByKey('brutal'))
        .toBe(config);
    });

    it('leaves an already-registered configuration alone', () =>
    {
      // Arrange: this runs on every boot against a savefile that already carries the player's
      // choices, and overwriting would silently reset every difficulty they had unlocked.
      // A second, unrelated config sits in the list so the count below is not merely "one thing
      // exists"; lookups answer with the first match, so the stale copy of a config appended
      // behind the real one would never be seen by reading the key alone.
      globalThis.$gameSystem.registerDifficultyConfig({
        key: 'gentle',
        unlocked: true,
        hidden: false,
        enabled: true,
      });
      const original = {
        key: 'brutal',
        unlocked: true,
        hidden: false,
        enabled: true,
      };
      globalThis.$gameSystem.registerDifficultyConfig(original);

      // Act
      globalThis.$gameSystem.registerDifficultyConfig({
        key: 'brutal',
        unlocked: false,
        hidden: false,
        enabled: false,
      });

      // Assert
      expect(globalThis.$gameSystem.getAllDifficultyConfigs()).toHaveLength(2);
      expect(globalThis.$gameSystem.getDifficultyConfigByKey('brutal'))
        .toBe(original);
    });
  });

  describe('Game_System.onAfterLoad()', () =>
  {
    it('rebuilds the difficulty layers from the latest plugin metadata', () =>
    {
      // Arrange: the layers themselves are metadata rather than save data, so a savefile written
      // before a rebalance has to pick up the new numbers rather than its own frozen copy.
      const setupDifficultySystem = vi.spyOn(globalThis.$gameTemp, 'setupDifficultySystem');

      // Act
      globalThis.$gameSystem.onAfterLoad();

      // Assert
      expect(setupDifficultySystem)
        .toHaveBeenCalled();

      setupDifficultySystem.mockRestore();
    });
  });
  //endregion the layer point budget
});
//endregion plugins/passive/ext/difficulty/_component/game-system.test.js
